# keldrin developer quick start (5 minutes)

Free, keyless, server-side friendly. Base URL: `https://keldrin.vercel.app`. Tokens are addressed by contract
address (preferred) or exact symbol where noted. Full field guide: [/skill.md](https://keldrin.vercel.app/skill.md) ·
contract: [/openapi.json](https://keldrin.vercel.app/openapi.json).

## 1. Historical Chainlink NAV, with feed and round id per point

```bash
# one official close per NYSE trading day (last in-session round)
curl "https://keldrin.vercel.app/v1/assets/0xb20000000000000000000078ee7ce2fE4908108C/nav/history?interval=daily&from=2026-11-01"
# every official round (paged: meta.next_cursor)
curl "https://keldrin.vercel.app/v1/assets/0xb20000000000000000000078ee7ce2fE4908108C/nav/history?interval=round&limit=100"
```

Each point (real, NVDAc's first official round):

```json
{"feed":"0x04689a41629776563E6822F76f2e57D148d28513","round_id":"36893488147419103263","phase_id":2,
 "aggregator_round_id":"31","aggregator":"0xF72B1eB5932800F3d2a5EeC5f99e6cD586479675","answer_raw":"22378480000",
 "decimals":8,"nav":"223.7848","updated_at":"2026-08-07T19:55:27Z"}
```

- `round_id` = phaseId << 64 | aggregatorRoundId: re-read it yourself with `getRoundData(round_id)` on the feed.
- The NAV is **total-return**: it already includes dividends and splits. Don't apply the multiplier again.
- `meta.quality` tells you what is missing: `missing_trading_days` (no official round that day), `not_yet_indexed_days`,
  `before_coverage` (before the feed's first official round, not missing), `missing_round_ids`, the verification verdict
  and each phase's live window. Days are never filled in.
- Only official rounds are served: rounds published outside the window in which the proxy served them, or from an
  aggregator whose decimals differ from the proxy's (phase 1 on these feeds), are excluded from closes
  (`interval=round&include=all` shows them, flagged).

## 2. Feeds and coverage (read from production, 2026-11-28)

| Symbol | Token | Chainlink NAV feed (proxy) | Daily history from |
|---|---|---|---|
| AAPLc | `0xb200000000000000000000C2e324d24d7eEcd1fb` | `0x787f13dEa48Db0897CbCDD985de77809D837F988` | 2026-08-10 |
| AMZNc | `0xb200000000000000000000d9192b6B456483C2E8` | `0x06A8E4b3aBB3B7543d8396FB2B763d22820cB295` | 2026-08-10 |
| ANTc | `0xb20000000000000000000016e38FD364d271Ba28` | `0xeEDc7412E991a3F2BD693eb2aC7fB0F27d4660dA` | 2026-11-19 |
| CRCLc | `0xB20000000000000000000019f6E7C675b73C2e4D` | `0x0231cF2635D1E17bB5c2462cc7504Ba1fBd61f33` | 2026-08-07 |
| GOOGLc | `0xb2000000000000000000002D0BA3164cc74f58B7` | `0x5bF49E0ffA937CE2FfF033c739aD7C634c4D34F2` | 2026-08-10 |
| INTCc | `0xB2000000000000000000004AFF16039bA04bdFBc` | `0xAB657C39bac0D5886250D70849e2E3E008F2EECB` | 2026-08-07 |
| METAc | `0xb2000000000000000000008bC8786B856E61707C` | `0x6526aE6797A76123638b863AeE4dD27Ba4E4b27D` | 2026-08-10 |
| MSFTc | `0xB200000000000000000000Ab99cFa739E253872B` | `0xeB10A6c9aa7E537aEd766C08c35Dae35B321b18c` | 2026-08-07 |
| MSTRc | `0xb2000000000000000000004884b426556b92883d` | `0xB3cE282CD188b35DA0E38D8Bc7d58e33173D202a` | 2026-08-07 |
| NVDAc | `0xb20000000000000000000078ee7ce2fE4908108C` | `0x04689a41629776563E6822F76f2e57D148d28513` | 2026-08-07 |
| SNDKc | `0xb200000000000000000000397293Cb8cda9a10c5` | `0x388b0dC46C0Fb05A74BeE0994fa5b02c6Fcca2eA` | 2026-08-07 |
| SPCXc | `0xb2000000000000000000007b9fcbd005511aCBd5` | `0x6A634B235903C4ad6376892180d6fF8612e3Fa68` | 2026-08-07 |
| TSLAc | `0xb2000000000000000000001e800a7f5189430cD0` | `0xFaf869185383a24F8cb00e27BdA6b63B9905DCb4` | 2026-08-10 |

All 13 feeds have a CONFIRMED independent review. Corporate actions cover all 435 tracked tokens; NAV, market context
and DEX prices cover these 13.

## 3. Corporate actions and B20 multipliers

```bash
curl "https://keldrin.vercel.app/v1/assets/0xb20000000000000000000078ee7ce2fE4908108C/corporate-actions"
```

Per event: `status` (`verified_matched`, `confirmed_onchain`, `predicted`, `late`), `multiplier_before_wad` /
`multiplier_after_wad` (WAD, 1e18 = 1 share per token), `ui_multiplier_*` and its effective time, `per_share`,
`record_date` / `payable_date`, `sec_filing_url`, `onchain_tx`. Balances never change; the multiplier does. Act on
applied changes (`adjusted_at` set); `predicted` is announced, not applied.

## 4. Market session, freshness and NAV/DEX divergence

```bash
curl "https://keldrin.vercel.app/v1/market/session"
curl "https://keldrin.vercel.app/v1/assets/0xb20000000000000000000078ee7ce2fE4908108C/market-context"
curl "https://keldrin.vercel.app/v1/assets/0xb20000000000000000000078ee7ce2fE4908108C/dex"
```

- `market.session`: `open`, `pre`, `after`, `closed`, `weekend`, `holiday` (NYSE calendar 2026–2027, early closes
  included; beyond it `calendar_not_covered`).
- `nav`: the latest round read live onchain, with `round_id` and `age_s`.
- `staleness.state`: `fresh`, `expected_closed` (market closed; the NAV correctly holds), `unexpectedly_stale`
  (should have updated: don't rely on it), `unknown`. Judged in trading time against the feed's own verified update rhythm.
- `dex.nav_premium_pct`: main DEX price vs the last NAV; withheld (`null` + reason) when the NAV is stale or unknown.
  `/dex` lists every verified pool with price, 2% depth (capped by the stock the pool holds) and the block.

## 5. Access and limits

- Free, no key. About 120 requests per minute per client per server instance; edge rule 300/min/IP on `/v1` and
  `/mcp` once enabled. Successful reads are CDN-cached up to 60 s; live routes are not cached.
- One-call snapshot (`/v1/snapshot`) and report (`/v1/report?token=`): 3 free complete answers per client per day,
  then $0.05 USDC on Base via x402 (see /skill.md).
- MCP: `claude mcp add --transport http keldrin https://keldrin.vercel.app/mcp`. CLI: `npx -y keldrin context NVDAc`.

## 6. Known limitations

- NAV history starts at each feed's first official round (August 2026; ANTc November 2026); earlier rounds come from an
  aggregator with different decimals and are not served as official.
- Live NAV and DEX values are read from one public RPC at request time; if it fails you get `null` with a reason.
- TSLAc and INTCc have no plain DEX pool with usable depth, so no DEX price.
- The NAV is Chainlink's published reference, not a live equity price; outside market hours it holds its last value.
- Facts with provenance, not investment advice. Not affiliated with Base, Coinbase or Chainlink.
