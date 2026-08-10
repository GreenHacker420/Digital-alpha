# Product assumptions

The brief intentionally leaves product details open. These are the calls used by this implementation.

1. **Single demo user** — Authentication is outside the brief, so all seeded transactions belong to one deterministic demo user. The schema still carries `user_id` throughout.
2. **Reward earning** — A successful, positive, non-anomalous payment earns `floor(amount / 100)` coins, capped at **100 coins per transaction**. The brief specifies a cap but not its value.
3. **Status normalization** — Statuses are normalized to uppercase on ingestion. The source contains both `SUCCESS` and lowercase `success`.
4. **Missing categories** — Missing, null, and blank categories are mapped to `Uncategorized`; rows are never dropped for this reason.
5. **Duplicate source IDs** — The source contains 40 transaction IDs reused by conflicting rows. Those IDs are preserved as non-unique `source_id` values, while PostgreSQL assigns an internal primary key so all 10,000 rows can be loaded.
6. **Negative successful amounts** — Negative values are interpreted as credits/refunds. They stay visible and filterable in the table but do not earn coins or count as positive spend analytics.
7. **Extreme outlier** — The single ₹999,999,999 source transaction is preserved and visibly flagged, but values above ₹1 crore are excluded from spend analytics and reward earning. This prevents an obvious data-quality anomaly from making the charts useless without silently deleting it.
8. **Analytics** — Spend analytics use successful, positive, non-anomalous payments. Table filters reshape the analytics, and clicking a category filters the table.
9. **Redemption fulfilment** — No external voucher provider is required. A successful redemption records an immutable ledger debit and returns confirmation.
10. **Search** — Merchant search is case-insensitive substring matching and debounced in the UI.
11. **Pagination** — The table uses 50-row server-side pages with a stable secondary internal-ID sort to keep the DOM small and pagination deterministic.
12. **Currency** — The supplied dataset is entirely INR; the schema/API still retain the currency field.
