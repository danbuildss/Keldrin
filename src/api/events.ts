import type { PGlite } from "@electric-sql/pglite";

// Consumer-facing event view (fields requested by an integrator, docs/BUILDER_INTERVIEWS.md).
// Built only from independently CONFIRMED data:
//   applied actions   ← confirmed issuer_action records (+ confirmed reconciliation for the latest revision)
//   upcoming/pending  ← CONFIRMED entries of the latest calendar snapshot
// status and confidence are derived from evidence; nothing is guessed.

export type EventType = "dividend" | "split" | "reverse_split" | "other";
export type EventStatus = "predicted" | "confirmed_onchain" | "verified_matched" | "late" | "unknown";
export type Confidence = "high" | "medium" | "unknown";

export type ConsumerEvent = {
  event_id: string;
  chain_id: 8453;
  ticker: string;
  contract_address: string;
  event_type: EventType;
  status: EventStatus;
  confidence: Confidence;
  expected_adjustment_date: string | null;
  adjusted_at: string | null;
  multiplier_before_wad: string | null;
  multiplier_after_wad: string | null;
  multiplier_delta: string | null; // after / before, exact decimal
  per_share: string | null;
  record_date: string | null;
  payable_date: string | null;
  sec_filing_url: string | null;
  quoted_text: string | null;
  onchain_tx: string | null;
  issuer_corporate_action_uuid: string | null;
  record_id: string | null;
  basis: string;
  warnings: string[];
  updated_at: string;
};

export function eventType(description: string | null | undefined): EventType {
  const d = (description ?? "").toLowerCase();
  if (/reverse/.test(d) && /split/.test(d)) return "reverse_split";
  if (/split/.test(d)) return "split";
  if (/dividend/.test(d)) return "dividend";
  return "other";
}

const dayDiff = (a: string, b: string) => Math.round((Date.parse(a.slice(0, 10)) - Date.parse(b.slice(0, 10))) / 86_400_000);

/** Above this, a "cash dividend" multiplier change is far outside normal dividend yields; flag it. */
export const LARGE_DIVIDEND_CHANGE = 0.1;

/**
 * Status/confidence for an applied action given its (optional) confirmed SEC declaration.
 * Status describes TIMING; warnings describe anything else that does not add up (e.g. magnitude),
 * and any warning lowers confidence so "high" is never shown on data that looks wrong.
 */
export function classifyApplied(adjustedAt: string, decl: { payable_date: string | null } | null, opts: { type?: EventType; ratio?: string | null } = {}): { status: EventStatus; confidence: Confidence; basis: string; warnings: string[] } {
  const warnings: string[] = [];
  if (opts.type === "dividend" && opts.ratio && Number(opts.ratio) - 1 > LARGE_DIVIDEND_CHANGE)
    warnings.push("multiplier_change_unusually_large_for_cash_dividend");
  const cap = (c: Confidence): Confidence => (warnings.length && c === "high" ? "medium" : c);
  if (!decl?.payable_date) return { status: "confirmed_onchain", confidence: cap("medium"), basis: "Applied onchain and independently verified; no dated company declaration matched.", warnings };
  const late = dayDiff(adjustedAt, decl.payable_date);
  if (late > 1) return { status: "late", confidence: cap("high"), basis: `Token adjusted ${late} days after the declared payable date ${decl.payable_date}.`, warnings };
  return { status: "verified_matched", confidence: cap("high"), basis: `Token adjusted on ${adjustedAt.slice(0, 10)}, matching the declared payable date ${decl.payable_date}.` + (warnings.length ? " The size of the multiplier change is not explained by the declaration." : ""), warnings };
}

export async function listEvents(db: PGlite, f: { contract?: string | null; status?: string | null } = {}): Promise<ConsumerEvent[]> {
  const out: ConsumerEvent[] = [];

  // Applied actions
  const applied = (await db.query<{ record_id: string; revision: number; payload: any; payload_sha256: string; reviewed_at: string }>(
    "SELECT record_id, revision, payload, payload_sha256, reviewed_at FROM confirmed_records WHERE payload->'action'->>'status' = 'applied'",
  )).rows;
  for (const r of applied) {
    const recon = (await db.query<{ payload: any; created_at: string }>(
      "SELECT payload, created_at FROM reconciliations WHERE record_id=$1 AND record_payload_sha256=$2 AND review_verdict='CONFIRMED' ORDER BY created_at DESC LIMIT 1",
      [r.record_id, r.payload_sha256],
    )).rows[0];
    const a = r.payload.action;
    const decl = recon?.payload?.declaration ?? null;
    const cls = classifyApplied(a.effective.time, decl, { type: eventType(a.operator_description), ratio: a.ratio });
    const applyTx = (r.payload.announcements ?? []).find((x: any) => (x.inner_events ?? []).some((e: string) => /Multiplier/.test(e)))?.tx_hash ?? null;
    out.push({
      event_id: r.record_id,
      chain_id: 8453,
      ticker: r.payload.asset.symbol,
      contract_address: r.payload.asset.contract_address,
      event_type: eventType(a.operator_description),
      status: cls.status,
      confidence: cls.confidence,
      expected_adjustment_date: decl?.payable_date ?? null,
      adjusted_at: a.effective.time,
      multiplier_before_wad: a.multiplier_before_wad,
      multiplier_after_wad: a.multiplier_after_wad,
      multiplier_delta: a.ratio,
      per_share: decl?.per_share ?? null,
      record_date: decl?.record_date ?? null,
      payable_date: decl?.payable_date ?? null,
      sec_filing_url: decl?.document_url ?? null,
      quoted_text: decl?.quote ?? null,
      onchain_tx: applyTx,
      issuer_corporate_action_uuid: a.corporate_action_uuid,
      record_id: r.record_id,
      basis: cls.basis,
      warnings: cls.warnings,
      updated_at: new Date(Math.max(Date.parse(r.reviewed_at), recon ? Date.parse(recon.created_at) : 0)).toISOString(),
    });
  }

  // Upcoming / announced from the latest calendar snapshot; first_seen = when this entry first appeared in this state.
  const snap = (await db.query<{ snapshot_id: string }>("SELECT snapshot_id FROM calendar_entries GROUP BY snapshot_id ORDER BY max(as_of) DESC LIMIT 1")).rows[0];
  if (snap) {
    const rows = (await db.query<{ payload: any; first_seen: string }>(
      `SELECT c.payload, (SELECT min(x.as_of) FROM calendar_entries x WHERE x.entry_id = c.entry_id AND x.state = c.state AND x.review_verdict = 'CONFIRMED') AS first_seen
       FROM calendar_entries c WHERE c.snapshot_id = $1 AND c.review_verdict = 'CONFIRMED' AND c.state IN ('upcoming','announced','not_observed')`,
      [snap.snapshot_id],
    )).rows;
    for (const { payload: e, first_seen } of rows) {
      const d = e.declaration;
      const ia = e.issuer_announcement;
      const both = !!d && !!ia;
      const status: EventStatus = e.state === "not_observed" ? "late" : "predicted";
      out.push({
        event_id: e.entry_id,
        chain_id: 8453,
        ticker: e.token.symbol,
        contract_address: e.token.contract_address,
        event_type: eventType(ia?.description ?? (d ? "dividend" : null)),
        status,
        confidence: status === "late" ? "high" : both ? "high" : "medium",
        expected_adjustment_date: e.expected_adjustment_date,
        adjusted_at: null,
        multiplier_before_wad: null,
        multiplier_after_wad: null,
        multiplier_delta: null,
        per_share: d?.per_share ?? null,
        record_date: d?.record_date ?? null,
        payable_date: d?.payable_date ?? null,
        sec_filing_url: d?.document_url ?? null,
        quoted_text: d?.quote ?? null,
        onchain_tx: ia?.announcements?.at(-1)?.tx_hash ?? null,
        issuer_corporate_action_uuid: ia?.corporate_action_uuid ?? null,
        record_id: null,
        basis: e.basis,
        warnings: [],
        updated_at: new Date(first_seen).toISOString(),
      });
    }
  }
  // An announced (predicted) entry is superseded once the same corporate action is applied.
  const appliedUuids = new Set(out.filter((x) => x.adjusted_at).map((x) => x.issuer_corporate_action_uuid));
  return out
    .filter((x) => x.adjusted_at || !x.issuer_corporate_action_uuid || !appliedUuids.has(x.issuer_corporate_action_uuid))
    .filter((x) => !f.contract || x.contract_address.toLowerCase() === f.contract.toLowerCase())
    .filter((x) => !f.status || x.status === f.status)
    .sort((a, b) => (b.adjusted_at ?? b.expected_adjustment_date ?? "").localeCompare(a.adjusted_at ?? a.expected_adjustment_date ?? "") || a.ticker.localeCompare(b.ticker));
}
