# Product assumptions

The brief intentionally leaves a few product details open. These are the decisions used by this implementation.

1. **Single demo user** — The assignment has no authentication requirement, so the seeded data belongs to one deterministic demo user. The schema still includes `user_id` so the model is not single-user by construction.
2. **Reward earning** — A successful payment earns `floor(amount / 100)` coins, capped at **100 coins per transaction**. The brief states that earning is capped per transaction but does not define the cap.
3. **Successful statuses** — During seed, case-insensitive values `success`, `successful`, `completed`, and `paid` count as successful for reward earning. The original status text is still preserved for display/filtering.
4. **Redemption has no external fulfilment provider** — A successful redemption records an immutable reward-ledger debit and returns a confirmation. Voucher fulfilment is outside assignment scope.
5. **Currency** — Amounts are treated as INR unless a transaction explicitly provides a currency field.
6. **Search semantics** — Merchant search is case-insensitive substring matching and is debounced in the UI.
7. **Pagination** — The transaction table is server-paginated at 50 rows per page. This keeps DOM size bounded and moves filtering/sorting work to PostgreSQL while still supporting the complete dataset.
8. **Analytics scope** — Spend analytics include successful payments only; failed/pending transactions remain visible in the transaction table but do not count as spend.
