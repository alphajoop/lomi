import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { WALLETS_DB_PATH } from '../config.js';

let db: Database.Database | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS owner_sessions (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS account_wallets (
  id TEXT PRIMARY KEY,
  owner_email TEXT NOT NULL,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  currency_code TEXT NOT NULL DEFAULT 'USD',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS handles (
  handle TEXT PRIMARY KEY,
  account_wallet_id TEXT NOT NULL UNIQUE REFERENCES account_wallets(id),
  status TEXT NOT NULL CHECK (status IN ('claimed')),
  claimed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS virtual_wallets (
  id TEXT PRIMARY KEY,
  account_wallet_id TEXT NOT NULL REFERENCES account_wallets(id),
  api_key_hash TEXT NOT NULL UNIQUE,
  api_key_prefix TEXT NOT NULL,
  agent_slug TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked')) DEFAULT 'active',
  period_allowance_cents INTEGER NOT NULL,
  max_transaction_cents INTEGER NOT NULL,
  allowlist_json TEXT,
  period_start TEXT NOT NULL,
  period_spent_cents INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (account_wallet_id, agent_slug)
);

CREATE TABLE IF NOT EXISTS agent_identities (
  virtual_wallet_id TEXT PRIMARY KEY REFERENCES virtual_wallets(id),
  handle TEXT NOT NULL REFERENCES handles(handle),
  agent_slug TEXT NOT NULL,
  fqdn TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY,
  account_wallet_id TEXT NOT NULL REFERENCES account_wallets(id),
  virtual_wallet_id TEXT REFERENCES virtual_wallets(id),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('fund', 'spend', 'revoke')),
  amount_cents INTEGER NOT NULL,
  destination TEXT,
  idempotency_key TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_idempotency
  ON ledger_entries (virtual_wallet_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL AND virtual_wallet_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS pay_idempotency (
  virtual_wallet_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  ledger_entry_id TEXT NOT NULL,
  response_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (virtual_wallet_id, idempotency_key)
);
`;

export function getDb(): Database.Database {
  if (!db) {
    mkdirSync(dirname(WALLETS_DB_PATH), { recursive: true });
    db = new Database(WALLETS_DB_PATH);
    db.pragma('journal_mode = WAL');
    db.exec(SCHEMA);
  }
  return db;
}

export function centsToDecimal(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function decimalToCents(amount: number): number {
  return Math.round(amount * 100);
}

export function isValidHandle(handle: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/.test(handle);
}

export function isValidAgentSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])?$/.test(slug);
}
