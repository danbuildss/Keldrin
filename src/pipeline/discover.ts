import { getAddress } from "viem";
import { LIMITS, SCAN_START_BLOCK, WAD } from "../config.ts";
import { decodeB20Logs, getBlock, getBlockReceipts, getReceipt, read, readMany, type BlockRef, type DecodedLog } from "../adapters/chain.ts";
import { actionUuidFromUri, getCorporateAction, type CorporateAction, type RegistryToken } from "../adapters/coinbase.ts";
import type { Fetched } from "../lib/http.ts";

// Discovery without eth_getLogs (the public RPC refuses it): find every block where a token's
// multiplier() changed by sampling and bisecting historical eth_call, then decode that block's
// receipts. Deterministic; the LLM is not involved.

export type ChangePoint = { contract: string; block: bigint; before: bigint; after: bigint };

type Mult = bigint | null; // null = no code / call failed at that block

/** All blocks in (a, b] where f changes, given f(a) and f(b). Misses A→B→A inside an interval (mitigated by sampling). */
export async function bisectChanges(f: (b: bigint) => Promise<Mult>, a: bigint, fa: Mult, b: bigint, fb: Mult, out: { block: bigint; before: Mult; after: Mult }[] = []) {
  if (fa === fb) return out;
  if (b - a === 1n) {
    out.push({ block: b, before: fa, after: fb });
    return out;
  }
  const m = (a + b) / 2n;
  const fm = await f(m);
  await bisectChanges(f, a, fa, m, fm, out);
  await bisectChanges(f, m, fm, b, fb, out);
  return out;
}

export async function findChangePoints(tokens: RegistryToken[], head: bigint, log = console.log): Promise<{ points: ChangePoint[]; deployed: Map<string, bigint | null> }> {
  const start = SCAN_START_BLOCK;
  const n = LIMITS.samplePoints;
  const samples = [start, ...Array.from({ length: n }, (_, i) => start + ((head - start) * BigInt(i + 1)) / BigInt(n + 1)), head];
  const addrs = tokens.map((t) => getAddress(t.contract_address));
  const grid: Mult[][] = [];
  for (const s of samples) grid.push((await readMany(addrs.map((a) => ({ address: a, fn: "multiplier" as const })), s)) as Mult[]);
  log(`discover: sampled multiplier() for ${addrs.length} tokens at ${samples.length} blocks`);

  const points: ChangePoint[] = [];
  const deployed = new Map<string, bigint | null>();
  for (let t = 0; t < addrs.length; t++) {
    const addr = addrs[t];
    const f = async (b: bigint) => (await read(addr, "multiplier", [], b)) as Mult;
    deployed.set(addr, grid[0][t] === null ? null : start);
    if (t % 50 === 0) log(`discover: token ${t}/${addrs.length}, ${points.length} change point(s) so far`);
    for (let i = 0; i + 1 < samples.length; i++) {
      let fa = grid[i][t];
      const fb = grid[i + 1][t];
      if (fa === fb) continue;
      // Deployment inside this interval with the initial multiplier (exactly 1.0): treat the token as
      // having been 1.0 from the start of the interval. Locating the deploy block is not a corporate action.
      if (fa === null && fb === WAD) continue;
      let from = samples[i];
      if (fa === null) {
        // deployed mid-interval at a non-1.0 value: find the first block with code, then bisect from there
        let lo = samples[i], hi = samples[i + 1];
        while (hi - lo > 1n) {
          const mid = (lo + hi) / 2n;
          if ((await f(mid)) === null) lo = mid; else hi = mid;
        }
        deployed.set(addr, hi);
        from = hi;
        fa = await f(hi);
        if (fa !== WAD) log(`discover: ${addr} deployed at ${hi} with multiplier ${fa} (not 1.0)`);
      }
      const found = await bisectChanges(f, from, fa, samples[i + 1], fb);
      for (const c of found) {
        if (c.before === null && c.after !== null) {
          deployed.set(addr, c.block); // first block with code: deployment, not a corporate action
          continue;
        }
        if (c.before === null || c.after === null) throw new Error(`multiplier became unreadable for ${addr} at ${c.block}`);
        points.push({ contract: addr, block: c.block, before: c.before, after: c.after });
      }
    }
  }
  log(`discover: ${points.length} multiplier change point(s)`);
  return { points, deployed };
}

export type Announcement = { id: string; caller: string; description: string; uri: string; txHash: string; block: string; logIndex: number; bracketed: boolean; innerEvents: string[] };

/** Pair Announcement/EndAnnouncement by id within one tx (not by adjacency) and list the events inside each bracket. */
export function pairBrackets(logs: DecodedLog[]): { announcements: Announcement[]; unbracketed: DecodedLog[] } {
  const announcements: Announcement[] = [];
  const inside = new Set<DecodedLog>();
  const byTx = new Map<string, DecodedLog[]>();
  for (const l of logs) byTx.set(l.txHash, [...(byTx.get(l.txHash) ?? []), l]);
  for (const txLogs of byTx.values()) {
    for (let i = 0; i < txLogs.length; i++) {
      const a = txLogs[i];
      if (a.eventName !== "Announcement") continue;
      const endIdx = txLogs.findIndex((l, j) => j > i && l.eventName === "EndAnnouncement" && l.args.id === a.args.id);
      const inner = endIdx === -1 ? [] : txLogs.slice(i + 1, endIdx);
      inner.forEach((l) => inside.add(l));
      announcements.push({
        id: a.args.id,
        caller: getAddress(a.args.caller),
        description: a.args.description,
        uri: a.args.uri,
        txHash: a.txHash,
        block: a.blockNumber.toString(),
        logIndex: a.logIndex,
        bracketed: endIdx !== -1,
        innerEvents: inner.map((l) => l.eventName),
      });
    }
  }
  const unbracketed = logs.filter((l) => /Multiplier/.test(l.eventName) && !inside.has(l));
  return { announcements, unbracketed };
}

export type ActionEvidence = {
  contract: string;
  change: { block: string; blockHash: string; blockTime: string; before: string; after: string } | null;
  pending: { newMultiplier: string; effectiveAt: string } | null;
  path: "instant" | "scheduled" | "unknown";
  schedulingBlock: string | null;
  scheduledEffectiveAt: string | null; // unix seconds, for the scheduled path (applied or pending)
  multiplierEvents: { eventName: string; args: Record<string, string>; txHash: string; block: string; logIndex: number }[];
  announcements: Announcement[];
  unbracketedMultiplierEvents: number;
  actionUuid: string | null;
  coinbase: { record: CorporateAction; source: Fetched } | null;
  coinbaseTxChecks: { txHash: string; found: boolean; idMatches: boolean; uriMatches: boolean }[];
  operatorChecks: { caller: string; block: string; hasOperatorRole: boolean | null }[];
  observedAt: string;
};

const ev_pendingEa = (p: { effectiveAt: string } | null) => p?.effectiveAt ?? null;

async function logsAtBlock(contract: string, block: bigint) {
  return decodeB20Logs((await getBlockReceipts(block)).flatMap((r) => r.logs), contract);
}

/** Build the evidence bundle for one change point (applied) or one pending scheduled update. */
export async function gatherEvidence(contract: string, cp: ChangePoint | null, head: BlockRef): Promise<ActionEvidence> {
  let change: ActionEvidence["change"] = null;
  let pending: ActionEvidence["pending"] = null;
  let logs: DecodedLog[] = [];
  let path: ActionEvidence["path"] = "unknown";
  let schedulingBlock: bigint | null = null;
  let scheduledEffectiveAt: string | null = null;

  if (cp) {
    const blk = await getBlock(cp.block);
    change = { block: cp.block.toString(), blockHash: blk.hash, blockTime: new Date(Number(blk.timestamp) * 1000).toISOString(), before: cp.before.toString(), after: cp.after.toString() };
    logs = await logsAtBlock(contract, cp.block);
    if (logs.some((l) => l.eventName === "MultiplierUpdated" && l.args.multiplier === cp.after.toString())) path = "instant";
  } else {
    const nm = (await read(contract, "newUIMultiplier", [], head.number)) as bigint | null;
    const ea = (await read(contract, "effectiveAt", [], head.number)) as bigint | null;
    if (nm !== null && ea !== null && ea > head.timestamp) pending = { newMultiplier: nm.toString(), effectiveAt: ea.toString() };
  }

  // Scheduled path: no multiplier event in the activation block. Find the block where effectiveAt() was set.
  const target = cp ? cp.block - 1n : head.number;
  if (path !== "instant") {
    const ea = (await read(contract, "effectiveAt", [], target)) as bigint | null;
    const nm = (await read(contract, "newUIMultiplier", [], target)) as bigint | null;
    const matches = cp ? nm === cp.after && ea !== null && ea > 0n : pending !== null;
    if (matches && ea !== null) {
      const f = async (b: bigint) => (await read(contract, "effectiveAt", [], b)) as bigint | null;
      const found = await bisectChanges(f, SCAN_START_BLOCK, await f(SCAN_START_BLOCK), target, ea);
      const set = found.filter((c) => c.after === ea).at(-1);
      if (set) {
        schedulingBlock = set.block;
        scheduledEffectiveAt = ea.toString();
        logs = [...logs, ...(await logsAtBlock(contract, set.block))];
        path = "scheduled";
      }
    }
  }

  const { announcements, unbracketed } = pairBrackets(logs);
  const multiplierEvents = logs.filter((l) => /Multiplier/.test(l.eventName)).map((l) => ({ eventName: l.eventName, args: l.args, txHash: l.txHash, block: l.blockNumber.toString(), logIndex: l.logIndex }));
  const uuids = [...new Set(announcements.map((a) => actionUuidFromUri(a.uri)).filter((u): u is string => !!u))];
  const actionUuid = uuids.length === 1 ? uuids[0] : null;

  let coinbase: ActionEvidence["coinbase"] = null;
  const coinbaseTxChecks: ActionEvidence["coinbaseTxChecks"] = [];
  if (actionUuid) {
    const { data, meta } = await getCorporateAction(actionUuid);
    coinbase = { record: data, source: meta };
    // Every announcement Coinbase lists must exist onchain with the same id and uri; add notice-only ones.
    for (const a of data.announcements) {
      const known = announcements.find((x) => x.txHash.toLowerCase() === a.tx_hash.toLowerCase());
      if (known) {
        coinbaseTxChecks.push({ txHash: a.tx_hash, found: true, idMatches: known.id === a.announcement_id, uriMatches: actionUuidFromUri(known.uri) === actionUuid });
        continue;
      }
      const rc = await getReceipt(a.tx_hash);
      const decoded = rc ? decodeB20Logs(rc.logs, contract) : [];
      const extra = pairBrackets(decoded).announcements;
      const hit = extra.find((x) => x.id === a.announcement_id);
      coinbaseTxChecks.push({ txHash: a.tx_hash, found: !!hit, idMatches: !!hit, uriMatches: !!hit && actionUuidFromUri(hit.uri) === actionUuid });
      if (hit) announcements.push(hit);
    }
    announcements.sort((x, y) => Number(BigInt(x.block) - BigInt(y.block)) || x.logIndex - y.logIndex);
  }

  const operatorChecks: ActionEvidence["operatorChecks"] = [];
  const role = (await read(contract, "OPERATOR_ROLE", [], head.number)) as string | null;
  for (const a of announcements) {
    const has = role ? ((await read(contract, "hasRole", [role, a.caller], BigInt(a.block))) as boolean | null) : null;
    operatorChecks.push({ caller: a.caller, block: a.block, hasOperatorRole: has });
  }

  return {
    contract,
    change,
    pending,
    path,
    schedulingBlock: schedulingBlock?.toString() ?? null,
    scheduledEffectiveAt: scheduledEffectiveAt ?? ev_pendingEa(pending),
    multiplierEvents,
    announcements,
    unbracketedMultiplierEvents: unbracketed.length,
    actionUuid,
    coinbase,
    coinbaseTxChecks,
    operatorChecks,
    observedAt: new Date().toISOString(),
  };
}
