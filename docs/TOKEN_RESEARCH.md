# Token research (exploratory; NOT approved scope)

Status: research only. No token contract, treasury strategy, automated trading or token-gated access may be built without the founder's explicit approval (founder instruction, 2026-11-27). Keldrin must stay fully useful without a token.

## The proposal (CD-001, Hector)
"holders get agent access, it posts public calls around earnings, and fees build a treasury of the stocks it likes."

There are three separable parts:

| Part | Fit with Keldrin's rules (CLAUDE.md, RESEARCH_POLICY.md) | Main issues |
|---|---|---|
| A. Token-gated access | Conflicts with the developer goal: the founder's instruction is that developers should not need to buy a speculative asset to use the data | Adoption friction; agents prefer x402 pay-per-call (CD-002); a gated public good is harder to integrate |
| B. "Public calls around earnings" | **Conflicts**: CLAUDE.md forbids investment recommendations; Keldrin publishes verified facts, not calls | Advice and regulatory exposure; the neutrality of the data source is lost |
| C. Fee-funded treasury "of the stocks it likes" | **Conflicts**: active investing by the research agent; CLAUDE.md forbids trading and custody by the agent | Conflict of interest (an information source holding positions in what it reports on); custody; tokenized stocks are restricted to eligible non-US persons |

## Questions to research before any decision
1. **Utility without conflict:** could a token fund verification work (for example, paying for research runs or for public goods such as the open calendar) without A, B or C?
2. **Economics:** what pays holders, and is it sustainable without speculative inflows? Compare with x402 revenue from actual API use.
3. **Regulatory:** whether a token tied to securities-linked activity or treasury returns could be treated as a security. Jurisdictions; the eligibility restrictions on tokenized stocks. **This needs legal advice; Claude cannot provide it.**
4. **Developer adoption:** do builders want to hold a token to get data? Current evidence: CD-002 prefers pay-per-call; CD-001 suggested the token.
5. **Hackathon:** the Stocks Maxxing rules say launching a token is optional. A token does not have to be part of the submission.
6. **Reputation:** would a token change how builders perceive Keldrin's neutrality?

## Current recommendation (for discussion, not a decision)
Keep Keldrin token-free, with free reads plus x402 pay-per-call for detail. Revisit a token only if research finds a design without A, B or C and with legal clearance, and only as its own approved workstream.
