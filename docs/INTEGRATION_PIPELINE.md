# Integration pipeline

Stages, in order: **identified → contacted → conversation → requirements known → testing the API → integrated (in production) → paying**. An entry moves only on evidence, such as a message, a test call in the logs, a commit or a payment.

| Builder | Use case (stated or assumed) | Stage | Evidence | Blocker / next step | Owner |
|---|---|---|---|---|---|
| Bankr (CD-002) | Index vaults holding B20 equities; swap routing; agent alerts | requirements known | Detailed field list and pricing view (docs/BUILDER_INTERVIEWS.md) | Founder sends the live API (`/v1/events`, `/llms.txt`) and asks them to test against GOOGLc Dec 14 / NVDAc Dec 23. x402 hosting offer to evaluate in Phase 5 | Founder |
| Hector (CD-001) | Unknown; Stocks Maxxing Telegram admin | conversation | Telegram reply; DM agreed | Ask what he builds and what he would integrate (CUSTOMER_DISCOVERY.md questions) | Founder |

Not yet contacted, all as hypotheses: the Stocks Maxxing partners (o1 Exchange, Stonks Exchange, BaseStonk, Hydrex, Sento, Clanker, Feel.cash) and BStocks (no event data in its API). The founder decides on and sends every outreach message; Claude only drafts.
