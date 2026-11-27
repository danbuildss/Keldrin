# keldrin

Command line for **Keldrin**, the verified record for Coinbase tokenized stocks on Base. No key, no dependencies.

```bash
npx -y keldrin session
npx -y keldrin actions GOOGLc           # dividends, splits, multipliers (with evidence)
npx -y keldrin nav NVDAc --from=2026-11-01
npx -y keldrin context NVDAc            # session, NAV freshness, DEX price and gap
npx -y keldrin dex AAPLc                # live DEX price and depth
npx -y keldrin verify-nav NVDAc         # re-read served NAV rounds onchain and compare
npx -y keldrin verify-dex NVDAc         # re-read the main pool's price at the same block
```

**Agents (MCP):** `claude mcp add --transport http keldrin https://keldrin.vercel.app/mcp` (remote), or stdio: `claude mcp add keldrin -- npx -y keldrin mcp`.

Flags: `--json`, `--api=<url>`, `--rpc=<url>` (default Base public RPC). Exit codes: 0 ok, 1 a verification found a mismatch, 2 error.

Facts with provenance, not investment advice. The Chainlink NAV is the last published total-return reference, not a live equity price.
