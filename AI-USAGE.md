# AI usage

AI tools are explicitly permitted by the assignment. This file records where they were used and, importantly, where their first output was wrong or too shallow.

## Tools

- ChatGPT — architecture review, implementation assistance, dataset profiling, edge-case review and documentation.
- Additional AI tools used during local implementation should be appended here before submission.

## Where AI helped

- Converting the written brief into a scope/commit plan.
- Designing the React/API boundary for a data-heavy table.
- Reviewing reward consistency and optimistic-update failure behaviour.
- Profiling the supplied 10,000-row JSON and turning anomalies into explicit ingestion/product decisions.
- Drafting first-pass implementation and reviewer-facing documentation.

## AI output rejected or corrected

### 1. Rejected: load all 10k rows into React and filter in the browser

The first simple approach would have technically satisfied the brief, but it weakened the backend demonstration and made browser work/DOM behaviour less predictable. I replaced it with PostgreSQL-backed server pagination, combinable filtering, merchant search and sorting. TanStack Query keeps page transitions responsive without pretending the whole dataset is local.

### 2. Corrected: use the supplied transaction `id` as the PostgreSQL primary key

That looked natural before inspecting the actual file. Profiling showed **40 source IDs are reused for conflicting records**, so that schema would fail seeding or force silent deduplication. I changed the model to a generated internal primary key plus a non-unique indexed `source_id`, preserving all 10,000 rows.

### 3. Corrected: generic datetime parsing

A first parser covered ISO timestamps but the real file also contains `DD/MM/YYYY HH:mm:ss`, date-only strings and Unix timestamps in milliseconds. The seed parser was rewritten and then exercised against all 10,000 source rows with zero parse failures.

### 4. Rejected: mutable `coin_balance` column

A single balance integer is easy to implement but weak for auditability and makes failed/duplicated writes harder to reason about. The implementation instead derives balance from an append-only ledger and performs redemption atomically. The frontend may optimistically display the debit, but rolls back and revalidates after failures.

## Ownership

AI accelerated implementation, but the architecture, trade-offs, data-handling policy and final code are expected to be explainable line-by-line in the technical interview. Any additional AI-generated code that cannot be defended should be removed before submission.
