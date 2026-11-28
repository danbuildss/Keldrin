# Keldrin positioning (source of truth)

Approved by the founder on 2026-11-28 ("lock it in and save this"). This is the permanent reference for how keldrin
describes itself. Other documents, the website, the agent guide, MCP descriptions and listings follow it. It is a
positioning and messaging decision. It does not change the product or the architecture, and it adds no features.
The brand identity is unchanged (BRAND.md).

## 1. Core positioning
Keldrin is the verified intelligence infrastructure for tokenized equities.

We collect, independently verify, preserve and distribute financial intelligence. Developers, applications and
autonomous agents can integrate it without rebuilding the underlying research and data infrastructure themselves.

We are starting with Coinbase's tokenized stocks on Base.

## 2. Official tagline
**Intelligence for programmable equities.**

## 3. Primary product statement
**The verified record for tokenized stocks on Base.**

## 4. Mission
Make reliable, verifiable financial intelligence accessible and programmable for humans, developers and autonomous
agents.

## 5. Vision
Become a dependable intelligence infrastructure layer for the global tokenized equity economy.

As more financial assets become programmable, the applications operating on them will need:
- reliable historical data;
- corporate-action intelligence;
- market context;
- independently verifiable financial information.

Keldrin exists to provide that infrastructure.

## 6. The problem
Developers building tokenized stock products currently collect financial information from many fragmented sources.
They have to:
- reconstruct historical NAV from Chainlink rounds;
- monitor corporate actions;
- track token multipliers;
- manage market sessions;
- calculate risk metrics;
- verify onchain market data.

This creates duplicated engineering work, unnecessary infrastructure costs and potential data inconsistencies.
Keldrin collects and verifies the information once and makes it reusable across many applications.

## 7. Value proposition
**Research once. Verify independently. Serve many.**

Developers should spend their time building financial products, not rebuilding financial data infrastructure.

Every material financial observation keldrin provides should have traceable provenance. When information is
unavailable or cannot be verified, keldrin says so explicitly instead of guessing.

## 8. Target audience
These are the people we build for. None of them is a claimed user.
- Tokenized stock application developers.
- Autonomous financial agents.
- Stock-lending protocols.
- Automated portfolio managers.
- Equity derivatives platforms.
- Index vaults.
- Financial researchers.
- Onchain financial infrastructure providers.

## 9. Product capabilities
Keldrin combines:
- historical NAV infrastructure;
- corporate-action intelligence;
- dividend and stock-split records;
- token multiplier intelligence;
- onchain market data;
- market session intelligence;
- data freshness monitoring;
- quantitative risk analytics;
- autonomous research;
- independent verification;
- traceable financial data provenance.

These capabilities are distributed through:
- REST API;
- MCP;
- CLI;
- agent skills;
- x402;
- public Explorer;
- API Playground;
- Transparency page.

**What is live today, 2026-11-28** (use these words when a claim must be exact; see §15):
- **Coverage:** 435 tokens tracked for identity, multipliers and corporate actions. 13 have complete NAV, market
  context and DEX coverage.
- **Risk analytics:** 30-day volatility and maximum drawdown from official NAV closes, on the Explorer stock page.
- **Research:** scheduled and deterministic, run by the research robot every 8 hours on GitHub Actions. Results are
  independently re-verified before they are served. It is automated, not an LLM making judgements.
- **Agent skills:** the agent guide (/skill.md) is live. The Bankr skills-catalog entry is submitted and not yet
  listed.

## 10. Competitive differentiation
Keldrin is not simply a financial data aggregator. Its differentiation is the combination of:
- independently verified financial information;
- historical data infrastructure;
- traceable source records;
- an append-only intelligence history;
- reproducible financial calculations;
- developer-accessible verification tools;
- autonomous research and monitoring;
- several human- and machine-readable ways to access it.

Do not claim exclusive capabilities or superiority over competitors without supporting evidence.

## 11. What Keldrin is not
Keldrin is not:
- a stock exchange;
- a trading agent;
- a portfolio manager;
- a lending protocol;
- an investment advisory platform;
- a generic financial chatbot;
- a replacement for execution-critical pricing oracles;
- an official representative of Coinbase, Chainlink or Base.

Keldrin provides the intelligence infrastructure that financial products can build on.

## 12. Brand messaging
| Use | Line |
|---|---|
| Primary headline | Intelligence for programmable equities. |
| Supporting headline | The verified record for tokenized stocks on Base. |
| Supporting description | Historical NAV, corporate actions, market intelligence and verifiable financial data through one integration. |
| Developer | Stop rebuilding financial data infrastructure. Integrate Keldrin. |
| Trust | Don't just trust the data. Verify it. |
| Agent | Verified financial intelligence, accessible to autonomous agents. |

## 13. Business model
Keldrin provides free developer infrastructure to reduce integration friction. Premium, complete intelligence
responses are available through x402 payments on Base.

Future commercial models may include developer subscriptions, higher API limits, institutional data access and
specialized intelligence services.

Do not introduce mandatory token ownership to access the core developer infrastructure without founder approval.

## 14. Long-term strategic direction
Keldrin should become an infrastructure provider rather than compete directly with the financial applications it
serves. Its strategic advantage should compound through:
- growing historical datasets;
- increasing financial asset coverage;
- research and verification improvements;
- developer integrations;
- reliable infrastructure;
- customer feedback;
- transparent operating methods.

Base is our starting ecosystem, not a permanent limit on the company's vision.

## 15. Communication and transparency rules
Never fabricate:
- users;
- revenue;
- partnerships;
- integrations;
- research findings;
- financial data;
- payment activity;
- operational metrics.

Distinguish internally tested functionality from external customer adoption. Distinguish tracked assets from assets
with complete verified data coverage. All public claims must reflect functionality that is actually implemented and
the evidence available.

---

**KELDRIN** · Intelligence for programmable equities. · Research once. Verify independently. Serve many.
