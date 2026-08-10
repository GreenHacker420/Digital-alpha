# AI usage

AI tools are permitted by the assignment. This file records where they were used and what was rejected or corrected.

## Tools

- ChatGPT — architecture review, implementation assistance, edge-case review, documentation.
- Additional tools used during local implementation will be added here before submission.

## Where AI helped

- Turning the written brief into a scoped implementation plan and commit sequence.
- Reviewing the table/API boundary and reward consistency model.
- Drafting initial documentation and implementation scaffolding.

## AI output rejected or corrected

1. **Rejected: loading all 10k rows into React and using client-only filters.** It would satisfy the smallest interpretation of the brief, but it weakens the backend demonstration and creates unnecessary browser/DOM work. The implementation uses server-side pagination/filtering/sorting instead.
2. **Corrected: storing `coin_balance` as a mutable integer on the user.** That is easy to implement but makes earning/redemption history hard to audit and creates more consistency failure modes. The implementation instead derives balance from an append-only reward ledger and performs redemption atomically.

This file will be updated with concrete implementation-level AI corrections as development continues.
