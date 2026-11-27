// Keldrin Phase 1 constants. Values here are protocol facts verified in Phase 0
// (research/phase0/evidence) or policy limits; change them only with evidence.

export const CHAIN_ID = 8453;
export const RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
/** Optional RPC bearer token (e.g. an Alchemy key in CI). Sent only as a header to RPC_URL; never logged or stored. */
export const RPC_AUTH_HEADERS: Record<string, string> = process.env.BASE_RPC_BEARER ? { authorization: `Bearer ${process.env.BASE_RPC_BEARER}` } : {};
/** What records and logs may show for the RPC: origin only, never a path or query (keys can live there). */
export const RPC_PUBLIC_LABEL = new URL(RPC_URL).origin;
export const COINBASE_API = "https://api.coinbase.com/v1/tokenized-stocks";
export const SEC_DATA = "https://data.sec.gov";

// Policy: only these hosts may be fetched (SECURITY.md host allowlist).
export const ALLOWED_HOSTS = new Set([
  "mainnet.base.org",
  "api.coinbase.com",
  "data.sec.gov",
  "efts.sec.gov",
  "www.sec.gov",
  "api.supabase.com",
  ...(process.env.BASE_RPC_URL ? [new URL(process.env.BASE_RPC_URL).host] : []),
]);

// SEC fair access asks for a declared contact User-Agent. Founder decision D2 is pending, so the
// default makes the gap explicit; set SEC_USER_AGENT once approved.
export const SEC_USER_AGENT = process.env.SEC_USER_AGENT || "Keldrin-Phase1-Research/0.1 (contact pending)";
export const HTTP_USER_AGENT = "Keldrin-Phase1-Research/0.1";

// Base B20 (base-std @ b97145b22f7152505c2bdc448fff69d710528d9a)
export const B20_FACTORY = "0xB20f000000000000000000000000000000000000";
export const WAD = 10n ** 18n;
export const TOPICS = {
  Announcement: "0xccebf8218a62875909564adef86a6f4df81503cb617221e793357d62f8e813f7",
  EndAnnouncement: "0x96d64dafe2c790596430196b982ad1da3221cb3b0f4e6e2df77f2e4f71a90037",
} as const;

// First Coinbase tokenized stock mint observed in the registry: 2026-08-12T12:40:59Z.
// Block 49851727 is the first block at or after 2026-08-12T00:00:00Z (binary search, Phase 1).
export const SCAN_START_BLOCK = 49_851_727n;

export const LIMITS = {
  maxResponseBytes: 32 * 1024 * 1024,
  httpTimeoutMs: 30_000,
  maxAttempts: 4,
  rpcMinIntervalMs: 120, // throttle against the public RPC's request limit
  secMinIntervalMs: 250, // SEC fair access: well under 10 req/s
  samplePoints: 8, // extra multiplier samples per token to catch A→B→A changes
};

export const SCHEMA_VERSION = "0.2";
