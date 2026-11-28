# keldrin external tests

Run 2026-11-28T00:12:00.067Z against https://keldrin.vercel.app. No payments made.

30/30 passed.

| Test | Request | HTTP | ms | Result | Note |
|---|---|---|---|---|---|
| website | `/` | 200 | 432 | pass | CSP set |
| agent guide | `/skill.md` | 200 | 50 | pass | text/markdown; charset=utf-8 |
| agent guide (upper case) | `/SKILL.md` | 200 | 40 | pass |  |
| developer quick start | `/start.md` | 200 | 59 | pass |  |
| llms.txt | `/llms.txt` | 200 | 77 | pass |  |
| openapi.json | `/openapi.json` | 200 | 67 | pass | v0.7.0 |
| API index | `/v1` | 200 | 65 | pass |  |
| health | `/health` | 200 | 42 | pass | assets 435, last run 2026-11-27T22:07:45.346Z |
| assets | `/v1/assets` | 200 | 376 | pass | 435 tokens |
| events | `/v1/events` | 200 | 1671 | pass | 60 events |
| calendar | `/v1/calendar` | 200 | 271 | pass |  |
| market session | `/v1/market/session` | 200 | 68 | pass | closed |
| corporate actions NVDAc | `/v1/assets/0xb20000000000000000000078ee7ce2fE4908108C/corporate-actions` | 200 | 1757 | pass | predicted,verified_matched |
| NAV history daily NVDAc | `/v1/assets/0xb20000000000000000000078ee7ce2fE4908108C/nav/history?interval=daily&from=2026-01-01` | 200 | 694 | pass | 79 closes, before_coverage 149, verdict CONFIRMED |
| NAV history rounds NVDAc | `/v1/assets/0xb20000000000000000000078ee7ce2fE4908108C/nav/history?interval=round&limit=3` | 200 | 631 | pass | round 36893488147419103263 |
| NAV history, token without feed | `/v1/assets/0xB2000000000000000000006064f8EC027f042294/nav/history` | 404 | 247 | pass | NO_NAV_FEED |
| market context NVDAc | `/v1/assets/0xb20000000000000000000078ee7ce2fE4908108C/market-context` | 200 | 780 | pass | NAV 149.61143864 expected_closed; DEX 148.71081878 |
| DEX NVDAc | `/v1/assets/0xb20000000000000000000078ee7ce2fE4908108C/dex` | 200 | 74 | pass | $148.71081878 block 63171689 |
| bad address | `/v1/assets/0x123/dex` | 400 | 72 | pass | BAD_ADDRESS |
| free report NVDAc (uses 1 free try) | `/v1/report?token=NVDAc` | 200 | 3424 | pass | tries left 2 |
| free report unknown token | `/v1/report?token=ZZZc` | 404 | 257 | pass | UNKNOWN_ASSET |
| MCP tools/list | `/mcp` | 200 | 71 | pass | 8 tools |
| MCP get_market_context | `/mcp` | 200 | 541 | pass | NVDAc: market closed; last NAV $149.61143864 (337 min old, expected_closed); DEX $148.71 ( |
| MCP get_nav_history | `/mcp` | 200 | 725 | pass | NVDAc: 5 daily NAV point(s) 2026-11-20..2026-11-28; verification CONFIRMED; missing tradin |
| feedback rejects bad input | `/v1/feedback` | 400 | 63 | pass | BAD_EMAIL |
| feedback cannot be read (GET) | `/v1/feedback` | 404 | 63 | pass | 404 NOT_FOUND |
| other writes refused | `/v1/events` | 405 | 67 | pass | METHOD_NOT_ALLOWED |
| paid snapshot (x402, unpaid) | `/api/snapshot` | 402 | 243 | pass | 402 50000 eip155:8453 payTo 0x8AEE62… timeout 60s |
| paid report (x402, unpaid) | `/api/report?token=NVDAc` | 402 | 151 | pass | 402 50000 eip155:8453 payTo 0x8AEE62… timeout 60s |
| paid snapshot on Bankr (unpaid) | `https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/keldrin-snapshot` | 402 | 570 | pass | 402 50000 eip155:8453 payTo 0x8AEE62… timeout 60s |

## CLI (published keldrin@0.6.0, clean folder, 2026-11-28T00:12:24Z)
- `npx -y keldrin@0.6.0 context NVDAc` → exit 0, 3.1 s: NAV 149.61143864 (expected_closed), DEX 148.71 on uniswap_v3, −0.602% vs NAV.
- `npx -y keldrin@0.6.0 verify-nav NVDAc --n=3` → exit 0, 2.7 s: 3/3 served rounds match getRoundData via a second provider (Alchemy).

## Not yet tested
- A paid x402 call through keldrin's own origin with a transaction hash (needs the founder's approval: $0.05). The two earlier paid calls were made by Bankr's agent for the founder (2 × $0.05, counted onchain by scripts/payers.ts).
- CLI 0.7.0 (snapshot/report): built and tested offline, not yet published.
