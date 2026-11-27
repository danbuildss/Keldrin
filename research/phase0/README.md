# Phase 0 research artifacts (2026-11-27)

Read-only research probes, not production code. Nothing here is a released Keldrin record.

## Reproduce

These scripts were run from a scratch directory with `viem@2.21.54` installed, Node 22.23, through the session's HTTPS proxy:

```bash
mkdir -p /tmp/keldrin-probe && cd /tmp/keldrin-probe && npm init -y && npm i viem@2.21.54
```

```bash
cp research/phase0/scripts/*.mjs /tmp/keldrin-probe/
```

```bash
cd /tmp/keldrin-probe && NODE_USE_ENV_PROXY=1 node onchain.mjs 0xb2000000000000000000002D0BA3164cc74f58B7
```

```bash
cd /tmp/keldrin-probe && NODE_USE_ENV_PROXY=1 node receipt.mjs 0xb5aa54fb26131123a7bb931e31d63baf466e1a1075d74450d048da88ad6a1444 0xcd45e69e5b84d3f1808fe832d73c1ff7f332c7447bdf9c87925f196240ffeb00
```

```bash
cd /tmp/keldrin-probe && NODE_USE_ENV_PROXY=1 node nav.mjs 0x5bF49E0ffA937CE2FfF033c739aD7C634c4D34F2 0xb2000000000000000000002D0BA3164cc74f58B7 51305496 51310618 51310619
```

`NODE_USE_ENV_PROXY=1` is only needed behind a proxy. `logs.mjs` (full-history log scan) failed against the public RPC with `-32011 request limit reached` and needs a provider endpoint or a slower chunked scan.

## Files

- `evidence/onchain-observations-2026-11-27.md`: actual outputs of the scripts above.
- `evidence/coinbase-corporate-action-e82812a6.json`: the GOOGLc cash-dividend corporate action, as returned (907 bytes, sha256 `0350427720760788e793301b0b148309faa62824a35bfe062a5c552e16108e74`).
- `evidence/coinbase-registry-targets-2026-11-27.json`: 7 of 435 registry records (5 targets and 2 anomalies), descriptions removed.
- `evidence/ledger.md`: every source fetched, with HTTP status, retrieval time and hash.

Provider rights for Coinbase API payloads are unknown, so full payloads are not committed; only hashes and minimal extracts.
