# keldrin in Bankr (Phase 13 kit)

Goal: prove an agent on Bankr can learn keldrin from its public guide and pay for one answer, end to end.

Send this to Bankr's chat (the founder, from the account that should pay; cost: $0.05):

> Read the skill at https://keldrin.vercel.app/skill.md and follow its rules. Then call keldrin-report for token NVDAc via x402 (pay at most 0.05 USDC, sign once) and show me the endpoint URL, the payment terms you checked, and the first part of the JSON.

Pass if: Bankr checks the terms (amount 50000, payTo 0x8AEE…01a0, eip155:8453), pays once, and the report's `symbol` is
`NVDAc` with the same corporate actions as `GET https://keldrin.vercel.app/v1/assets/0xb20000000000000000000078ee7ce2fE4908108C/corporate-actions`.
Record the result and date in FINDINGS.md here (not yet run).
