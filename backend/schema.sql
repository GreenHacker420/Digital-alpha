-- Reviewer-facing schema summary. The executable schema is declared in app/models.py
-- and created by `python -m scripts.seed ../transactions.json`.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE users (
  id uuid PRIMARY KEY,
  display_name varchar(120) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE transactions (
  id varchar(80) PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  merchant_name varchar(180) NOT NULL,
  category varchar(80) NOT NULL,
  amount numeric(14,2) NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'INR',
  status varchar(48) NOT NULL,
  occurred_at timestamptz NOT NULL,
  payment_method varchar(120),
  reference_id varchar(120),
  description text
);

CREATE TABLE rewards (
  id varchar(64) PRIMARY KEY,
  title varchar(120) NOT NULL,
  description varchar(240) NOT NULL,
  coin_cost integer NOT NULL,
  kind varchar(40) NOT NULL,
  value_label varchar(60) NOT NULL,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE reward_ledger (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  reason varchar(40) NOT NULL,
  transaction_id varchar(80) REFERENCES transactions(id) ON DELETE SET NULL,
  reward_id varchar(64) REFERENCES rewards(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_reward_earning_per_transaction UNIQUE (transaction_id, reason)
);

CREATE INDEX ix_transactions_user_occurred_at ON transactions (user_id, occurred_at);
CREATE INDEX ix_transactions_user_amount ON transactions (user_id, amount);
CREATE INDEX ix_transactions_user_category ON transactions (user_id, category);
CREATE INDEX ix_transactions_user_status ON transactions (user_id, status);
CREATE INDEX ix_transactions_merchant_trgm ON transactions USING gin (lower(merchant_name) gin_trgm_ops);
CREATE INDEX ix_reward_ledger_user_created_at ON reward_ledger (user_id, created_at);
