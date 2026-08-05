import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { WalletsError } from '../errors.js';
import {
  centsToDecimal,
  decimalToCents,
} from '../db/database.js';
import { DatabaseService } from '../db/database.service.js';

@Injectable()
export class AccountWalletsService {
  constructor(private readonly database: DatabaseService) {}

  create(ownerEmail: string) {
    const db = this.database.getDb();
    const existing = db
      .prepare(`SELECT id FROM account_wallets WHERE owner_email = ? LIMIT 1`)
      .get(ownerEmail) as { id: string } | undefined;
    if (existing) {
      return this.getById(existing.id, ownerEmail);
    }
    const id = uuidv4();
    db.prepare(
      `INSERT INTO account_wallets (id, owner_email) VALUES (?, ?)`,
    ).run(id, ownerEmail);
    return this.getById(id, ownerEmail);
  }

  getById(id: string, ownerEmail: string) {
    const db = this.database.getDb();
    const row = db
      .prepare(
        `SELECT aw.id, aw.owner_email, aw.balance_cents, aw.currency_code, aw.created_at,
                h.handle
         FROM account_wallets aw
         LEFT JOIN handles h ON h.account_wallet_id = aw.id
         WHERE aw.id = ? AND aw.owner_email = ?`,
      )
      .get(id, ownerEmail) as
      | {
          id: string;
          owner_email: string;
          balance_cents: number;
          currency_code: string;
          created_at: string;
          handle: string | null;
        }
      | undefined;
    if (!row) {
      throw new WalletsError('account_wallet_not_found', 'Account wallet not found', 404);
    }
    return this.mapRow(row);
  }

  fund(
    accountWalletId: string,
    ownerEmail: string,
    amount: number,
    idempotencyKey?: string,
  ) {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new WalletsError('invalid_amount', 'Amount must be positive', 400);
    }
    const amountCents = decimalToCents(amount);
    const db = this.database.getDb();
    const wallet = db
      .prepare(
        `SELECT id, balance_cents, currency_code FROM account_wallets
         WHERE id = ? AND owner_email = ?`,
      )
      .get(accountWalletId, ownerEmail) as
      | { id: string; balance_cents: number; currency_code: string }
      | undefined;
    if (!wallet) {
      throw new WalletsError('account_wallet_not_found', 'Account wallet not found', 404);
    }
    if (idempotencyKey) {
      const prior = db
        .prepare(
          `SELECT id, amount_cents FROM ledger_entries
           WHERE account_wallet_id = ? AND idempotency_key = ? AND entry_type = 'fund'`,
        )
        .get(accountWalletId, idempotencyKey) as
        | { id: string; amount_cents: number }
        | undefined;
      if (prior) {
        const refreshed = db
          .prepare(`SELECT balance_cents FROM account_wallets WHERE id = ?`)
          .get(accountWalletId) as { balance_cents: number };
        return {
          account_wallet_id: accountWalletId,
          funded: centsToDecimal(prior.amount_cents),
          balance: centsToDecimal(refreshed.balance_cents),
          currency_code: wallet.currency_code,
          ledger_entry_id: prior.id,
          idempotent_replay: true,
        };
      }
    }
    const ledgerId = uuidv4();
    const fund = db.transaction(() => {
      db.prepare(
        `UPDATE account_wallets SET balance_cents = balance_cents + ? WHERE id = ?`,
      ).run(amountCents, accountWalletId);
      db.prepare(
        `INSERT INTO ledger_entries
         (id, account_wallet_id, entry_type, amount_cents, idempotency_key, metadata_json)
         VALUES (?, ?, 'fund', ?, ?, ?)`,
      ).run(
        ledgerId,
        accountWalletId,
        amountCents,
        idempotencyKey ?? null,
        JSON.stringify({ source: 'mock_top_up' }),
      );
    });
    fund();
    const balance = db
      .prepare(`SELECT balance_cents FROM account_wallets WHERE id = ?`)
      .get(accountWalletId) as { balance_cents: number };
    return {
      account_wallet_id: accountWalletId,
      funded: centsToDecimal(amountCents),
      balance: centsToDecimal(balance.balance_cents),
      currency_code: wallet.currency_code,
      ledger_entry_id: ledgerId,
      idempotent_replay: false,
    };
  }

  private mapRow(row: {
    id: string;
    owner_email: string;
    balance_cents: number;
    currency_code: string;
    created_at: string;
    handle: string | null;
  }) {
    return {
      id: row.id,
      owner_email: row.owner_email,
      balance: centsToDecimal(row.balance_cents),
      balance_cents: row.balance_cents,
      currency_code: row.currency_code,
      created_at: row.created_at,
      handle: row.handle,
    };
  }
}
