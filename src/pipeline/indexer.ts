import { getAddress } from "viem";
import { SCAN_START_BLOCK, TOPICS } from "../config.ts";
import { decodeB20Logs, getBlock, rpc, type RpcLog } from "../adapters/chain.ts";
import { actionUuidFromUri } from "../adapters/coinbase.ts";
import { pairBrackets, type Announcement } from "./discover.ts";

// Log indexer (needs a log-capable RPC, e.g. Alchemy). Scans every B20 announcement / multiplier log
// since launch so notice-only and announced-but-not-yet-applied actions are covered, not just
// multiplier changes found by bisection. Logs from addresses outside the issuer registry are ignored.

const MULT_TOPICS = [
  "0x4dbe4840d7465bd162f67814cea0b519567a2e0e578bcde61e7f4ced361e5a3d", // MultiplierUpdated(uint256)
  "0x2205df4534432b2f60654a3fdb48737ffdaf3e9edb1a498bd985bc026b15b055", // UIMultiplierUpdated(uint256,uint256,uint256)
];

export type IndexResult = { from: string; to: string; requests: number; logs: number; announcements: Announcement[]; byUuid: Record<string, Announcement[]>; noUuid: Announcement[]; unbracketedMultiplierLogs: number };

/** eth_getLogs over [from, to] in adaptive chunks: halve on a range/size error, grow again after successes. */
export async function scanLogs(registry: Set<string>, from = SCAN_START_BLOCK, to?: bigint, log = console.log): Promise<IndexResult> {
  const head = to ?? (await getBlock("latest")).number;
  let span = 50_000n;
  let requests = 0;
  const raw: RpcLog[] = [];
  for (let b = from; b <= head; ) {
    const e = b + span - 1n > head ? head : b + span - 1n;
    try {
      const logs = await rpc<RpcLog[]>("eth_getLogs", [{ fromBlock: `0x${b.toString(16)}`, toBlock: `0x${e.toString(16)}`, topics: [[TOPICS.Announcement, TOPICS.EndAnnouncement, ...MULT_TOPICS]] }]);
      requests++;
      raw.push(...logs.filter((l) => registry.has(getAddress(l.address))));
      b = e + 1n;
      if (span < 200_000n) span *= 2n;
    } catch (err) {
      requests++;
      if (span <= 100n) throw err;
      span /= 2n;
    }
    if (requests % 50 === 0) log(`index: block ${b} / ${head}, span ${span}, ${raw.length} logs`);
  }
  const decoded = [...new Set(raw.map((l) => getAddress(l.address)))].flatMap((a) => decodeB20Logs(raw, a));
  const { announcements, unbracketed } = pairBrackets(decoded);
  const byUuid: Record<string, Announcement[]> = {};
  const noUuid: Announcement[] = [];
  for (const a of announcements) {
    const u = actionUuidFromUri(a.uri);
    if (u) (byUuid[u] ??= []).push(a);
    else noUuid.push(a);
  }
  return { from: from.toString(), to: head.toString(), requests, logs: raw.length, announcements, byUuid, noUuid, unbracketedMultiplierLogs: unbracketed.length };
}
