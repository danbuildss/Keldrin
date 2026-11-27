# Onchain observations — Base mainnet, retrieved 2026-11-27 via https://mainnet.base.org

All values below are copied from actual script output in this session. Chain ID returned `0x2105` (8453).

## NVDAc state at block 62864830 (2026-11-27T07:09:01Z, hash 0x564f9152302af6163584355fd31e55573cb46a5a90777a1087120f455b9657ea)

Contract `0xb20000000000000000000078ee7ce2fE4908108C`:

| Call | Result |
|---|---|
| name() | NVIDIA Corporation |
| symbol() | NVDAc |
| decimals() | 8 |
| totalSupply() | 7083199731283 |
| multiplier() | 1000537939576369481 |
| newUIMultiplier() | 1000537939576369481 |
| effectiveAt() | 0 (no pending update) |
| contractURI() | https://api.coinbase.com/v1/tokenized-stocks/metadata/NVDAc |
| extraMetadata("isin") | US67066G1040 |
| B20 factory 0xB20f…0000 isB20(contract) | true |

The registry reported `multiplier: 1.0005379395763694` (a JSON double) and `total_supply: 70831.99731283`. Supply matches exactly after the 8-decimal shift; the multiplier matches only to double precision.

## GOOGLc corporate action e82812a6-0b24-41c4-8ed1-322d1b466d33 (Cash Dividend)

Contract `0xb2000000000000000000002D0BA3164cc74f58B7`.

### Tx 0xb5aa54fb26131123a7bb931e31d63baf466e1a1075d74450d048da88ad6a1444

- status success, block 51305497, blockHash 0xf7e12141d89ad15b58e03794c6159db429d2aed680068ce4c413a28299e9a58d, time 2026-09-14T15:39:01Z
- from 0x5da41bddc73406f246d73cbe2e319f3cfc814d9a
- log 226 `Announcement` caller 0x5Da41bDDc73406F246d73CbE2e319f3cFc814D9A, id `2097`, description `Cash Dividend`, uri `https://api.coinbase.com/v1/tokenized-stocks/corporate-actions/e82812a6-0b24-41c4-8ed1-322d1b466d33`
- log 227 `EndAnnouncement` id `2097`
- No state change inside the bracket (pure notice).

### Tx 0xcd45e69e5b84d3f1808fe832d73c1ff7f332c7447bdf9c87925f196240ffeb00

- status success, block 51310619, blockHash 0xf659120132c5a9ab81356f519b728b98c1776cbac7685013adae9683fd6ece78, time 2026-09-14T18:29:45Z
- from 0xe6cb3c8fd23c66e26e091b4fc0c0b5abd8dd8c37 (a different operator from the first tx)
- log 345 `Announcement` id `e82812a6-0b24-41c4-8ed1-322d1b466d33`, same description and uri
- log 346 `MultiplierUpdated` multiplier `1000377118676784179` (legacy instant-setter event; no `UIMultiplierUpdated` log was emitted, although base-std docs at b97145b say the instant setter emits both)
- log 347 `EndAnnouncement` id `e82812a6-…`

### State around the action (historical reads succeeded on the public RPC)

| Block | GOOGLc multiplier() | Chainlink feed 0x5bF4…34F2 "Coinbase GOOGL" answer (8 dp) | feed updatedAt |
|---|---|---|---|
| 51305496 | 1000000000000000000 | 34524000000 | 2026-09-14T14:49:21Z |
| 51310618 | 1000000000000000000 | 34710000000 | 2026-09-14T18:25:03Z |
| 51310619 | 1000377118676784179 | 34710000000 | 2026-09-14T18:25:03Z |

### Derived (interpretation, not fact)

- Multiplier change = 0.000377118676784179 (0.0377%).
- × reference 347.10 USD (total-return NAV just before the change) ≈ 0.1309 USD per share-equivalent reinvested.
- Alphabet XBRL `CommonStockDividendsPerShareDeclared` for 2026-07-01..2026-09-30 = 0.22 USD (accession 0001652044-26-000084).
- Net/declared ≈ 59.5%. The issuer does not publish the tax/fee breakdown per action, so this ratio is unexplained, not an error claim. Linking this action to that specific dividend still requires record and payment dates from the filing text (blocked; see ledger).
