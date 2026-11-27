import { CHAIN_ID, RPC_URL, SCHEMA_VERSION } from "../config.ts";
import { doubleMatchesWad, ratio, wadToDecimal } from "../lib/decimal.ts";
import { payloadHash } from "../lib/canonical.ts";
import type { ActionEvidence } from "./discover.ts";
import type { AssetIdentity } from "./registry.ts";

export type Check = { name: string; result: "pass" | "fail" | "unknown"; detail?: string };

export type IssuerActionRecord = {
  schema_version: string;
  record_type: "issuer_action";
  record_id: string;
  revision: number;
  synthetic: false;
  asset: { chain_id: number; contract_address: string; symbol: string; name: string; isin: string | null; identity_state: string };
  action: {
    status: "applied" | "scheduled";
    path: string;
    corporate_action_uuid: string | null;
    operator_description: string | null; // operator-supplied, unverified text
    multiplier_before_wad: string | null;
    multiplier_after_wad: string;
    multiplier_before: string | null;
    multiplier_after: string;
    ratio: string | null; // after / before, exact to 18 dp
    effective: { block: string; block_hash: string; time: string } | null;
    effective_at_scheduled: string | null; // unix seconds for a pending scheduled update
    scheduling_block: string | null;
  };
  announcements: { id: string; caller: string; uri: string; tx_hash: string; block: string; log_index: number; bracketed: boolean; inner_events: string[] }[];
  multiplier_events: { event: string; tx_hash: string; block: string; log_index: number; args: Record<string, string> }[];
  flags: string[];
  checks: Check[];
  issuer_record: { status: string; announced_at: string | null; applied_at: string | null; multiplier_before: number | null; multiplier_after: number | null; note: string } | null;
  sources: { id: string; kind: string; url: string; locator: string; retrieved_at: string; sha256: string | null; rights_state: "public" | "unknown" }[];
  observed_at: string;
  verification: { state: "draft" | "confirmed" | "unsure" | "rejected"; review_id: string | null; reviewed_at: string | null; limitations: string[] };
  supersedes: number | null;
};

export function buildIssuerActionRecord(ev: ActionEvidence, asset: AssetIdentity): IssuerActionRecord {
  const after = ev.change ? ev.change.after : (ev.pending?.newMultiplier as string);
  const before = ev.change ? ev.change.before : asset.multiplier_wad;
  const status = ev.change ? "applied" : "scheduled";
  const key = ev.actionUuid ?? (ev.change ? `block-${ev.change.block}` : `pending-${ev.pending?.effectiveAt}`);
  const recordId = `kld:${CHAIN_ID}:${ev.contract.toLowerCase()}:${key}`;
  const cb = ev.coinbase?.record ?? null;

  const checks: Check[] = [];
  const c = (name: string, ok: boolean | null, detail?: string) => checks.push({ name, result: ok === null ? "unknown" : ok ? "pass" : "fail", ...(detail ? { detail } : {}) });
  c("asset_identity_verified", asset.identity_state === "verified" ? true : asset.identity_state === "mismatch" ? false : null, asset.identity_state);
  if (ev.change) c("multiplier_changed_exactly_at_block", ev.change.before !== ev.change.after, `${ev.change.before} -> ${ev.change.after} at ${ev.change.block}`);
  c("announced_onchain", ev.announcements.length > 0);
  c("all_brackets_closed", ev.announcements.length ? ev.announcements.every((a) => a.bracketed) : null);
  c("multiplier_change_inside_bracket", ev.multiplierEvents.length ? ev.unbracketedMultiplierEvents === 0 : null, `${ev.unbracketedMultiplierEvents} unbracketed`);
  c("single_corporate_action_uuid", ev.announcements.length ? ev.actionUuid !== null : null);
  c("callers_hold_operator_role", ev.operatorChecks.length ? (ev.operatorChecks.some((o) => o.hasOperatorRole === false) ? false : ev.operatorChecks.every((o) => o.hasOperatorRole) ? true : null) : null);
  if (cb) {
    c("issuer_record_contract_matches", cb.contract_address.toLowerCase() === ev.contract.toLowerCase());
    c("issuer_record_status_consistent", status === "applied" ? cb.status === "CORPORATE_ACTION_STATUS_APPLIED" : cb.status === "CORPORATE_ACTION_STATUS_ANNOUNCED");
    if (ev.change) {
      c("issuer_multiplier_after_matches_chain", typeof cb.multiplier_after === "number" ? doubleMatchesWad(cb.multiplier_after, BigInt(ev.change.after)) : null);
      c("issuer_multiplier_before_matches_chain", typeof cb.multiplier_before === "number" ? doubleMatchesWad(cb.multiplier_before, BigInt(ev.change.before)) : null);
      c("issuer_applied_at_matches_block_time", cb.applied_at ? Date.parse(cb.applied_at) === Date.parse(ev.change.blockTime) : null, `${cb.applied_at} vs ${ev.change.blockTime}`);
    }
    c("issuer_listed_txs_confirmed_onchain", ev.coinbaseTxChecks.length ? ev.coinbaseTxChecks.every((t) => t.found && t.idMatches && t.uriMatches) : null);
  } else {
    c("issuer_record_found", ev.actionUuid ? false : null, ev.actionUuid ? "uuid did not resolve" : "no uuid in announcements");
  }

  const flags: string[] = [];
  if (ev.path === "instant") flags.push("instant_path_deprecated_setter");
  if (ev.multiplierEvents.length && !ev.multiplierEvents.some((m) => m.eventName === "UIMultiplierUpdated")) flags.push("legacy_event_only");
  if (new Set(ev.announcements.map((a) => a.id)).size > 1) flags.push("multiple_announcement_ids");
  if (ev.unbracketedMultiplierEvents > 0) flags.push("undisclosed_multiplier_change");
  if (!ev.announcements.length) flags.push("no_announcement_found");
  if (ev.path === "unknown" && ev.change) flags.push("mechanism_not_identified");

  const sources: IssuerActionRecord["sources"] = [];
  if (ev.change) sources.push({ id: "chain-change", kind: "base_rpc", url: RPC_URL, locator: `eth_call multiplier() on ${ev.contract} at blocks ${BigInt(ev.change.block) - 1n} and ${ev.change.block}; block hash ${ev.change.blockHash}`, retrieved_at: ev.observedAt, sha256: null, rights_state: "public" });
  for (const a of ev.announcements) sources.push({ id: `tx-${a.txHash.slice(0, 10)}-${a.logIndex}`, kind: "base_tx_log", url: RPC_URL, locator: `receipt ${a.txHash} log ${a.logIndex} (Announcement id=${a.id})`, retrieved_at: ev.observedAt, sha256: null, rights_state: "public" });
  if (ev.coinbase) sources.push({ id: "issuer-record", kind: "coinbase_corporate_action", url: ev.coinbase.source.url, locator: "whole document", retrieved_at: ev.coinbase.source.retrievedAt, sha256: ev.coinbase.source.sha256, rights_state: "unknown" });

  const record: IssuerActionRecord = {
    schema_version: SCHEMA_VERSION,
    record_type: "issuer_action",
    record_id: recordId,
    revision: 1,
    synthetic: false,
    asset: { chain_id: CHAIN_ID, contract_address: ev.contract, symbol: asset.symbol_onchain ?? asset.symbol_registry, name: asset.name, isin: asset.isin_onchain ?? asset.isin_registry, identity_state: asset.identity_state },
    action: {
      status,
      path: ev.path,
      corporate_action_uuid: ev.actionUuid,
      operator_description: [...new Set(ev.announcements.map((a) => a.description))].join(" | ") || null,
      multiplier_before_wad: before,
      multiplier_after_wad: after,
      multiplier_before: before ? wadToDecimal(BigInt(before)) : null,
      multiplier_after: wadToDecimal(BigInt(after)),
      ratio: before ? ratio(BigInt(after), BigInt(before)) : null,
      effective: ev.change ? { block: ev.change.block, block_hash: ev.change.blockHash, time: ev.change.blockTime } : null,
      effective_at_scheduled: ev.pending?.effectiveAt ?? null,
      scheduling_block: ev.schedulingBlock,
    },
    announcements: ev.announcements.map((a) => ({ id: a.id, caller: a.caller, uri: a.uri, tx_hash: a.txHash, block: a.block, log_index: a.logIndex, bracketed: a.bracketed, inner_events: a.innerEvents })),
    multiplier_events: ev.multiplierEvents.map((m) => ({ event: m.eventName, tx_hash: m.txHash, block: m.block, log_index: m.logIndex, args: m.args })),
    flags,
    checks,
    issuer_record: cb
      ? { status: cb.status, announced_at: cb.announced_at ?? null, applied_at: cb.applied_at ?? null, multiplier_before: cb.multiplier_before ?? null, multiplier_after: cb.multiplier_after ?? null, note: "Coinbase values are JSON doubles shown for cross-check only; chain WAD values are the record of truth." }
      : null,
    sources,
    observed_at: ev.observedAt,
    verification: { state: "draft", review_id: null, reviewed_at: null, limitations: limitations(ev) },
    supersedes: null,
  };
  return record;
}

function limitations(ev: ActionEvidence): string[] {
  const l = [
    "Discovered by multiplier() change-point bisection (the public RPC refuses eth_getLogs); announcements with no multiplier effect are only included when the issuer record lists them.",
    "The operator description and uri are issuer-supplied text; the token contract does not verify them.",
    "Not linked to an underlying company disclosure in this record type.",
  ];
  if (!ev.coinbase) l.push("No issuer corporate-action record was available.");
  return l;
}

export const hashRecord = (r: IssuerActionRecord) => payloadHash(r as unknown as Record<string, unknown>);
