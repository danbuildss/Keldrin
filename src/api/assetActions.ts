import type { PGlite } from "@electric-sql/pglite";
import { listEvents } from "./events.ts";

// GET /v1/assets/{contract}/corporate-actions (Phase 6). One token's corporate actions, applied and upcoming, from
// the same verified records as /v1/events, plus the onchain detail an integrator needs to account for them: the
// multiplier and uiMultiplier before/after (WAD), the uiMultiplier effective time, announcement transactions and
// evidence links. Nothing new is inferred here; every field comes from an independently CONFIRMED record.

type Json = Record<string, any>;
type Out = { status: number; body: unknown };

export async function assetCorporateActions(db: PGlite, contract: string): Promise<Out> {
  const asset = (await db.query<{ contract_address: string; symbol: string; multiplier_wad: string }>("SELECT contract_address, symbol, multiplier_wad::text AS multiplier_wad FROM assets WHERE lower(contract_address)=lower($1)", [contract])).rows[0];
  if (!asset) return { status: 404, body: { error: { code: "UNKNOWN_ASSET", message: `no tracked asset ${contract}`, hint: "GET /v1/assets lists tracked tokens" } } };
  const events = await listEvents(db, { contract });
  const ids = [...new Set(events.map((e) => e.record_id).filter((x): x is string => !!x))];
  const recs = new Map<string, { payload: Json; review_id: string }>();
  for (const id of ids) {
    const r = (await db.query<{ payload: Json; review_id: string }>("SELECT payload, review_id FROM confirmed_records WHERE record_id=$1", [id])).rows[0];
    if (r) recs.set(id, { payload: typeof r.payload === "string" ? JSON.parse(r.payload) : r.payload, review_id: r.review_id });
  }
  const data = events.map((e) => {
    const rec = e.record_id ? recs.get(e.record_id) : undefined;
    const p = rec?.payload;
    const ui = (p?.multiplier_events as Json[] | undefined)?.find((m) => m.event === "UIMultiplierUpdated");
    const uuid = e.issuer_corporate_action_uuid;
    return {
      ...e,
      operator_description: p?.action?.operator_description ?? null,
      announced_at: p?.issuer_record?.announced_at ?? null,
      effective_block: p?.action?.effective?.block ?? null,
      effective_at: p?.action?.effective?.time ?? null,
      ui_multiplier_before_wad: ui?.args?.oldMultiplier ?? null,
      ui_multiplier_after_wad: ui?.args?.newMultiplier ?? null,
      ui_multiplier_effective_at: ui?.args?.effectiveAtTimestamp ? new Date(Number(ui.args.effectiveAtTimestamp) * 1000).toISOString() : null,
      announcements: ((p?.announcements as Json[] | undefined) ?? []).map((a) => ({ id: a.id, block: a.block, tx_hash: a.tx_hash, uri: a.uri })),
      evidence: {
        onchain_tx: e.onchain_tx,
        issuer_record_url: uuid ? `https://api.coinbase.com/v1/tokenized-stocks/corporate-actions/${uuid}` : null,
        sec_filing_url: e.sec_filing_url,
        keldrin_record: e.record_id ? `/v1/actions/${encodeURIComponent(e.record_id)}` : null,
      },
      verification: rec ? { state: "confirmed", review_id: rec.review_id } : { state: e.status === "predicted" ? "predicted_from_filing" : "not_applicable" },
    };
  });
  return {
    status: 200,
    body: {
      data,
      meta: {
        token: asset.contract_address, symbol: asset.symbol, current_multiplier_wad: asset.multiplier_wad, count: data.length,
        accounting_note: "The token's balance never changes for a dividend or split: the multiplier (WAD, 1e18) does. Shares per token = multiplier / 1e18. The Chainlink NAV is already total-return (it includes the multiplier): never apply the multiplier to the NAV again.",
      },
    },
  };
}
