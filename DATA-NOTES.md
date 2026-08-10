# Dataset notes

A short profiling pass over the supplied `transactions.json` found several intentional-looking data-quality cases. The implementation preserves the source rows and handles them explicitly instead of cleaning them away invisibly.

| Observation | Count / value | Handling |
|---|---:|---|
| Source rows | 10,000 | All are retained |
| Unique source transaction IDs | 9,960 | Internal DB identity key avoids dropping duplicates |
| Conflicting duplicated source IDs | 40 IDs | Preserve both rows; `source_id` is non-unique |
| Missing / null / blank categories | 200 | Normalize to `Uncategorized` |
| Numeric amounts encoded as strings | 20 | Parse to `NUMERIC(14,2)` |
| Negative amounts | 148 | Treat as credits/refunds; no reward earning |
| Lowercase `success` statuses | 25 | Normalize to `SUCCESS` |
| Timestamp representations | 5 | Parse ISO Z, ISO offset, date-only, DD/MM/YYYY time, Unix ms |
| Extreme amount outlier | ₹999,999,999 | Preserve + flag; exclude from spend/rewards |
| Currency | INR on all 10,000 | Retained as a proper column |
| Merchant names | 49 distinct | Trigram index supports substring search |
| Normalized categories | 11 | Includes `Uncategorized` |

The goal is to demonstrate that the app can cope with the full supplied data rather than only the happy-path rows.
