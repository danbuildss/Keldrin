import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { PGlite } from "@electric-sql/pglite";
import { CHAIN_ID, SCHEMA_VERSION } from "../config.ts";
import OPENAPI_DOC from "../../openapi/keldrin.v1.json" with { type: "json" };
import { listEvents } from "./events.ts";

// Read-only API. Serves ONLY records whose latest review CONFIRMED the exact payload hash
// (view `confirmed_records`). Phase 1: localhost only; deployment needs founder approval.

type Json = Record<string, unknown>;
const ADDR = /^0x[0-9a-fA-F]{40}$/;

// Successful reads may be cached at the CDN briefly (data changes at most once per research run);
// errors are never cached.
function send(res: ServerResponse, status: number, body: Json | string, type = "application/json") {
  const cache = status === 200 ? "public, max-age=30, s-maxage=60, stale-while-revalidate=300" : "no-store";
  res.writeHead(status, { "content-type": type, "cache-control": cache, "x-content-type-options": "nosniff", "access-control-allow-origin": "*", "access-control-allow-methods": "GET, OPTIONS" });
  res.end(typeof body === "string" ? body : JSON.stringify(body, null, 1));
}

/** Per-client fixed-window rate limit (per instance; the CDN cache absorbs most repeat reads). */
const RATE = { limit: Number(process.env.RATE_LIMIT_PER_MIN ?? 120), windowMs: 60_000 };
const hits = new Map<string, { n: number; reset: number }>();
export function rateLimited(client: string, now = Date.now()): number | null {
  const h = hits.get(client);
  if (!h || now >= h.reset) {
    hits.set(client, { n: 1, reset: now + RATE.windowMs });
    if (hits.size > 10_000) for (const [k, v] of hits) if (now >= v.reset) hits.delete(k);
    return null;
  }
  h.n++;
  return h.n > RATE.limit ? Math.ceil((h.reset - now) / 1000) : null;
}
const ok = (data: unknown, extra: Json = {}) => ({ data, meta: { as_of: new Date().toISOString(), schema_version: SCHEMA_VERSION, served: "independently_confirmed_records_only", ...extra } });
const err = (code: string, message: string, hint?: string) => ({ error: { code, message, ...(hint ? { hint } : {}) } });

const OPENAPI = OPENAPI_DOC as unknown as Json;

export const LLMS_TXT = `# Keldrin
> Verified corporate-action records for Coinbase tokenized stocks (B20) on Base (chain 8453).
Every record is derived from chain state and independently re-verified; values are exact integers (WAD = 1e18).
Records state what is unknown instead of guessing. Informational only: not an oracle, not advice.

- GET /v1/events?status=predicted|verified_matched|late|confirmed_onchain&contract=0x... — one list of applied and upcoming corporate actions (ticker, event_type, status, confidence, expected_adjustment_date, multiplier_delta, sec_filing_url, quoted_text, onchain_tx)
- GET /v1/changes?since=2026-11-27T00:00:00Z — events added or changed since a timestamp (poll this)
- GET /v1/assets — tokens, identity checks, current multiplier (WAD)
- GET /v1/actions?contract=0x...&limit=50&cursor=... — confirmed corporate actions, newest first
- GET /v1/actions?symbol=GOOGLc — same, by exact token symbol (store the address, not the symbol)
- GET /v1/actions/{record_id} — full record, evidence, review claims, revisions, and company_context (SEC reconciliation, when confirmed)
- GET /openapi.json — OpenAPI 3.1 contract
- GET /v1/calendar?state=upcoming — declared dividends and the date each token is expected to adjust (observed pattern, stated with its rate)
- GET /health — coverage, last run, limitations
Errors: {"error":{"code","message","hint"}}. 404 unknown, 400 bad input, 409 ambiguous symbol.
`;

/** Map a database error to a coarse, non-sensitive category (no host, user or message is exposed). */
export function dbFailureReason(e: unknown): string {
  const x = e as { code?: string; message?: string };
  const code = String(x?.code ?? "");
  const msg = String(x?.message ?? "").toLowerCase();
  if (code === "28P01" || code === "28000" || /password authentication|authentication failed|tenant or user not found/.test(msg)) return "auth_failed";
  if (/certificate|self[- ]signed|unable to verify|ssl|tls/.test(msg)) return "tls_verify_failed";
  if (code === "ENOTFOUND" || code === "EAI_AGAIN" || /getaddrinfo/.test(msg)) return "dns_failed";
  if (code === "ETIMEDOUT" || code === "ECONNREFUSED" || /timeout|timed out/.test(msg)) return "connect_timeout";
  if (code === "42501" || /permission denied/.test(msg)) return "permission_denied";
  if (code === "42P01" || code === "3F000" || /does not exist/.test(msg)) return "schema_missing";
  if (/database_url is not set/.test(msg)) return "not_configured";
  return "unknown";
}

export async function handle(db: PGlite, req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method === "OPTIONS") return send(res, 204, "", "text/plain");
    if (req.method !== "GET") return send(res, 405, err("METHOD_NOT_ALLOWED", "read-only API", "use GET"));
    const fwd = String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim();
    const retry = rateLimited(fwd || req.socket?.remoteAddress || "unknown");
    if (retry !== null) {
      res.setHeader("retry-after", String(retry));
      return send(res, 429, err("RATE_LIMITED", `more than ${RATE.limit} requests per minute`, `retry after ${retry} s; cached responses are served by the CDN`));
    }
    const url = new URL(req.url ?? "/", "http://localhost");
    const p = url.pathname.replace(/\/+$/, "") || "/";

    if (p === "/" ) return send(res, 200, ok({ name: "Keldrin API", docs: "/llms.txt", openapi: "/openapi.json", endpoints: ["/v1/events", "/v1/changes", "/v1/calendar", "/v1/actions", "/v1/assets", "/health"] }));

    if (p === "/v1/events" || p === "/v1/changes") {
      const contract = url.searchParams.get("contract");
      if (contract && !ADDR.test(contract)) return send(res, 400, err("BAD_ADDRESS", "contract must be a 0x-prefixed 20-byte address"));
      const status = url.searchParams.get("status");
      if (status && !["predicted", "confirmed_onchain", "verified_matched", "late", "unknown"].includes(status)) return send(res, 400, err("BAD_STATUS", "status must be predicted, confirmed_onchain, verified_matched, late or unknown"));
      let since: number | null = null;
      if (p === "/v1/changes") {
        const s = url.searchParams.get("since");
        since = s ? Date.parse(s) : NaN;
        if (!s || Number.isNaN(since)) return send(res, 400, err("BAD_SINCE", "since must be an ISO 8601 timestamp", "use meta.as_of from your previous call"));
      }
      const events = (await listEvents(db, { contract, status })).filter((e) => since === null || Date.parse(e.updated_at) > since);
      return send(res, 200, ok(events, { count: events.length, ...(since !== null ? { since: new Date(since).toISOString() } : {}) }));
    }

    if (p === "/llms.txt") return send(res, 200, LLMS_TXT, "text/plain; charset=utf-8");
    if (p === "/openapi.json") return send(res, 200, OPENAPI);

    if (p === "/health") {
      try {
        await db.query("SELECT 1");
      } catch (e) {
        console.error("keldrin health: database unavailable:", (e as Error).stack ?? e);
        return send(res, 503, { ...err("DB_UNAVAILABLE", "database unavailable", "see reason"), reason: dbFailureReason(e) });
      }
      const [a, r, c, run] = await Promise.all([
        db.query<{ n: number; verified: number }>("SELECT count(*)::int n, count(*) FILTER (WHERE identity_state='verified')::int verified FROM assets"),
        db.query<{ n: number }>("SELECT count(*)::int n FROM records"),
        db.query<{ n: number }>("SELECT count(*)::int n FROM confirmed_records"),
        db.query<Json>("SELECT run_id, kind, started_at, finished_at, head_block::text, outcome, summary FROM runs ORDER BY started_at DESC LIMIT 1"),
      ]);
      return send(res, 200, ok({
        status: run.rows[0]?.outcome === "ok" ? "ok" : "degraded",
        chain_id: CHAIN_ID,
        assets: a.rows[0].n,
        assets_identity_verified: a.rows[0].verified,
        records: r.rows[0].n,
        records_confirmed: c.rows[0].n,
        last_run: run.rows[0] ?? null,
        limitations: ["Local Phase 1 build; data is as fresh as the last run.", "Announcements without a multiplier effect are only covered when the issuer record lists them."],
      }));
    }

    if (p === "/v1/calendar") {
      const contract = url.searchParams.get("contract");
      if (contract && !ADDR.test(contract)) return send(res, 400, err("BAD_ADDRESS", "contract must be a 0x-prefixed 20-byte address"));
      const state = url.searchParams.get("state");
      if (state && !["upcoming", "applied", "not_observed", "announced"].includes(state)) return send(res, 400, err("BAD_STATE", "state must be upcoming, applied, not_observed or announced"));
      const snap = (await db.query<{ snapshot_id: string; as_of: string }>("SELECT snapshot_id, max(as_of) AS as_of FROM calendar_entries GROUP BY snapshot_id ORDER BY 2 DESC LIMIT 1")).rows[0];
      if (!snap) return send(res, 200, ok([], { count: 0, snapshot_as_of: null }));
      const rows = (await db.query<{ payload: Json; review: Json }>(
        `SELECT payload, review FROM calendar_entries WHERE snapshot_id=$1 AND review_verdict='CONFIRMED'
         AND ($2::text IS NULL OR lower(contract_address)=lower($2)) AND ($3::text IS NULL OR state=$3) ORDER BY payable_date NULLS LAST, entry_id`,
        [snap.snapshot_id, contract, state],
      )).rows;
      return send(res, 200, ok(rows.map((r) => ({ ...r.payload, review: r.review })), { count: rows.length, snapshot_as_of: snap.as_of }));
    }
    if (p === "/v1/assets") {
      const rows = await db.query("SELECT chain_id, contract_address, symbol, name, isin, identity_state, multiplier_wad::text, observed_block::text FROM assets ORDER BY symbol");
      return send(res, 200, ok(rows.rows, { count: rows.rows.length }));
    }
    const am = p.match(/^\/v1\/assets\/([^/]+)$/);
    if (am) {
      if (!ADDR.test(am[1])) return send(res, 400, err("BAD_ADDRESS", "contract must be a 0x-prefixed 20-byte address"));
      const row = (await db.query("SELECT chain_id, contract_address, symbol, name, isin, identity_state, multiplier_wad::text, observed_block::text, identity FROM assets WHERE lower(contract_address)=lower($1)", [am[1]])).rows[0];
      if (!row) return send(res, 404, err("UNKNOWN_ASSET", `no tracked asset ${am[1]}`, "GET /v1/assets lists tracked tokens"));
      return send(res, 200, ok(row));
    }

    if (p === "/v1/actions") {
      let contract = url.searchParams.get("contract");
      const symbol = url.searchParams.get("symbol");
      if (contract && !ADDR.test(contract)) return send(res, 400, err("BAD_ADDRESS", "contract must be a 0x-prefixed 20-byte address"));
      if (!contract && symbol) {
        const m = (await db.query<{ contract_address: string }>("SELECT contract_address FROM assets WHERE symbol = $1", [symbol])).rows;
        if (m.length === 0) return send(res, 404, err("UNKNOWN_SYMBOL", `no token with exact symbol ${symbol}`, "symbols are exact token symbols such as GOOGLc; prefer contract="));
        if (m.length > 1) return send(res, 409, err("AMBIGUOUS_SYMBOL", `${m.length} tokens use symbol ${symbol}`, "query by contract address"));
        contract = m[0].contract_address;
      }
      const limit = Number(url.searchParams.get("limit") ?? 50);
      if (!Number.isInteger(limit) || limit < 1 || limit > 200) return send(res, 400, err("BAD_LIMIT", "limit must be an integer 1-200"));
      // Opaque composite cursor (effective_block, record_id): no record is skipped when several share a
      // block, and pending records (effective_block NULL, sorted last) stay reachable.
      const rawCursor = url.searchParams.get("cursor");
      let cur: [string | null, string] | null = null;
      if (rawCursor) {
        try {
          const c = JSON.parse(Buffer.from(rawCursor, "base64url").toString("utf8"));
          if (!Array.isArray(c) || c.length !== 2 || !(c[0] === null || /^\d+$/.test(c[0])) || typeof c[1] !== "string") throw new Error("shape");
          cur = c as [string | null, string];
        } catch {
          return send(res, 400, err("BAD_CURSOR", "cursor is opaque; pass meta.next_cursor back unchanged"));
        }
      }
      const rows = (await db.query<{ payload: Json; effective_block: string | null; record_id: string; review_id: string }>(
        `SELECT payload, effective_block::text, record_id, review_id FROM confirmed_records
         WHERE ($1::text IS NULL OR lower(contract_address)=lower($1))
           AND ($4::boolean IS NOT TRUE OR (
             CASE WHEN $2::bigint IS NULL THEN effective_block IS NULL AND record_id > $3
                  ELSE effective_block < $2::bigint OR (effective_block = $2::bigint AND record_id > $3) OR effective_block IS NULL END))
         ORDER BY effective_block DESC NULLS LAST, record_id LIMIT $5`,
        [contract, cur?.[0] ?? null, cur?.[1] ?? "", cur !== null, limit + 1],
      )).rows;
      const page = rows.slice(0, limit);
      const last = page.at(-1);
      const next = rows.length > limit && last ? Buffer.from(JSON.stringify([last.effective_block, last.record_id])).toString("base64url") : null;
      return send(res, 200, ok(page.map((r) => ({ ...r.payload, verification: { ...(r.payload.verification as Json), state: "confirmed", review_id: r.review_id } })), { count: page.length, next_cursor: next }));
    }
    const xm = p.match(/^\/v1\/actions\/(.+)$/);
    if (xm) {
      let id: string;
      try {
        id = decodeURIComponent(xm[1]);
      } catch {
        return send(res, 400, err("BAD_RECORD_ID", "record id is not valid percent-encoding"));
      }
      const rec = (await db.query<{ payload: Json; review_id: string; reviewed_at: string; revision: number }>("SELECT payload, review_id, reviewed_at, revision FROM confirmed_records WHERE record_id=$1", [id])).rows[0];
      if (!rec) return send(res, 404, err("UNKNOWN_RECORD", `no confirmed record ${id}`, "unreviewed, unsure and rejected records are never served"));
      const review = (await db.query("SELECT review_id, verdict, reviewer, claims, checked_at, payload_sha256 FROM reviews WHERE review_id=$1", [rec.review_id])).rows[0];
      const revisions = (await db.query("SELECT revision, payload_sha256, created_at FROM records WHERE record_id=$1 ORDER BY revision", [id])).rows;
      // Company context: the latest reconciliation whose own review CONFIRMED and which links THIS revision's hash.
      const recon = (await db.query<{ payload: Json; review: Json; created_at: string }>(
        `SELECT x.payload, x.review, x.created_at FROM reconciliations x JOIN records r ON r.record_id = x.record_id AND r.revision = $2
         WHERE x.record_id = $1 AND x.review_verdict = 'CONFIRMED' AND x.record_payload_sha256 = r.payload_sha256 ORDER BY x.created_at DESC LIMIT 1`,
        [id, rec.revision],
      )).rows[0];
      return send(res, 200, ok({ company_context: recon ? { ...recon.payload, review: recon.review, reconciled_at: recon.created_at } : null, record: { ...rec.payload, verification: { ...(rec.payload.verification as Json), state: "confirmed", review_id: rec.review_id, reviewed_at: rec.reviewed_at } }, review, revisions }));
    }
    return send(res, 404, err("NOT_FOUND", `no route ${p}`, "see /llms.txt"));
  } catch (e) {
    // Never return internal details (SQL, hosts) to clients; log them server-side.
    console.error("keldrin api error:", (e as Error).stack ?? e);
    return send(res, 500, err("INTERNAL", "internal error", "retry later; if it persists the service is degraded (see /health)"));
  }
}

export function serve(db: PGlite, port = 8787, host = "127.0.0.1") {
  const srv = createServer((req, res) => void handle(db, req, res));
  return new Promise<typeof srv>((resolve) => srv.listen(port, host, () => resolve(srv)));
}
