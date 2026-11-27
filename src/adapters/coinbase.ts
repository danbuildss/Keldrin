import { COINBASE_API } from "../config.ts";
import { fetchJson, type Fetched } from "../lib/http.ts";

// Coinbase Tokenized Stocks API: an INDEX, not the source of record. Numbers are JSON doubles and
// redistribution rights are unknown, so only identifiers and cross-check values are kept.

export type RegistryToken = {
  contract_address: string;
  symbol: string;
  name: string;
  decimals: number;
  isin?: string;
  adgm_isin?: string;
  multiplier?: number;
  total_supply?: number;
  first_mint_date?: string;
};

export type CorporateAction = {
  id: string;
  uri: string;
  contract_address: string;
  symbol: string;
  description: string;
  status: string;
  announced_at?: string;
  applied_at?: string;
  multiplier_before?: number;
  multiplier_after?: number;
  announcements: { announcement_id: string; description: string; tx_hash: string; block_number: string; block_time: string }[];
};

export async function listTokens(maxPages = 20): Promise<{ tokens: RegistryToken[]; pages: Fetched[] }> {
  const tokens: RegistryToken[] = [];
  const pages: Fetched[] = [];
  let tok: string | undefined;
  for (let i = 0; i < maxPages; i++) {
    const url = tok ? `${COINBASE_API}?page_token=${encodeURIComponent(tok)}` : COINBASE_API;
    const { data, meta } = await fetchJson<{ tokens: RegistryToken[]; next_page_token?: string }>(url, { minIntervalMs: 400 });
    tokens.push(...data.tokens);
    pages.push(meta);
    tok = data.next_page_token || undefined;
    if (!tok) return { tokens, pages };
  }
  throw new Error(`registry pagination exceeded ${maxPages} pages`);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Extract the corporate-action UUID from an onchain Announcement uri; null if it is not the documented form. */
export function actionUuidFromUri(uri: string): string | null {
  try {
    const u = new URL(uri);
    if (u.protocol !== "https:" || u.host !== "api.coinbase.com") return null;
    const m = u.pathname.match(/^\/v1\/tokenized-stocks\/corporate-actions\/([^/]+)$/);
    return m && UUID.test(m[1]) ? m[1] : null;
  } catch {
    return null;
  }
}

export async function getCorporateAction(uuid: string): Promise<{ data: CorporateAction; meta: Fetched }> {
  if (!UUID.test(uuid)) throw new Error(`invalid corporate action uuid ${uuid}`);
  return fetchJson<CorporateAction>(`${COINBASE_API}/corporate-actions/${uuid}`, { minIntervalMs: 400 });
}

export async function navFeeds(): Promise<{ data: { nav_feeds: { contract_address: string; nav_feed_address: string }[] }; meta: Fetched }> {
  return fetchJson(`${COINBASE_API}/nav-feeds`, { minIntervalMs: 400 });
}
