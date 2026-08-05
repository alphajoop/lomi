import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { payReject } from '../errors.js';
import {
  centsToDecimal,
  decimalToCents,
} from '../db/database.js';
import { DatabaseService } from '../db/database.service.js';
import {
  VirtualWalletsService,
  type VirtualWalletRow,
} from './virtual-wallets.service.js';

export type PayInput = {
  api_key: string;
  amount: number;
  destination: string;
  idempotency_key?: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class PayService {
  constructor(
    private readonly database: DatabaseService,
    private readonly virtualWallets: VirtualWalletsService,
  ) {}

  pay(input: PayInput) {
    if (!input.api_key?.startsWith('lomi_vw_')) {
      throw payReject(
        'invalid_virtual_wallet_key',
        'Virtual wallet API key required (lomi_vw_*)',
        401,
      );
    }
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw payReject('invalid_amount', 'Amount must be positive');
    }
    const destination = input.destination?.trim();
    if (!destination || destination.length > 512) {
      throw payReject('invalid_destination', 'destination is required');
    }
    const virtualWallet = this.virtualWallets.resolveByApiKey(input.api_key);
    if (virtualWallet.status !== 'active') {
      throw payReject(
        'virtual_wallet_inactive',
        'Virtual wallet is not active',
        403,
      );
    }
    const amountCents = decimalToCents(input.amount);
    if (amountCents > virtualWallet.max_transaction_cents) {
      throw payReject(
        'amount_exceeds_max_transaction',
        `Amount exceeds max_transaction of ${centsToDecimal(
          virtualWallet.max_transaction_cents,
        )}`,
      );
    }
    this.assertAllowlist(virtualWallet, destination);
    if (
      virtualWallet.period_spent_cents + amountCents >
      virtualWallet.period_allowance_cents
    ) {
      throw payReject(
        'period_allowance_exceeded',
        'Period allowance would be exceeded',
      );
    }
    const db = this.database.getDb();
    if (input.idempotency_key) {
      const cached = db
        .prepare(
          `SELECT response_json FROM pay_idempotency
           WHERE virtual_wallet_id = ? AND idempotency_key = ?`,
        )
        .get(virtualWallet.id, input.idempotency_key) as
        | { response_json: string }
        | undefined;
      if (cached) {
        const parsed = JSON.parse(cached.response_json) as Record<
          string,
          unknown
        >;
        return { ...parsed, idempotent_replay: true };
      }
    }
    const account = db
      .prepare(
        `SELECT balance_cents, currency_code FROM account_wallets WHERE id = ?`,
      )
      .get(virtualWallet.account_wallet_id) as
      | { balance_cents: number; currency_code: string }
      | undefined;
    if (!account || account.balance_cents < amountCents) {
      throw payReject(
        'insufficient_account_balance',
        'Account wallet balance insufficient',
      );
    }
    const ledgerId = uuidv4();
    const response = db.transaction(() => {
      db.prepare(
        `UPDATE account_wallets SET balance_cents = balance_cents - ? WHERE id = ?`,
      ).run(amountCents, virtualWallet.account_wallet_id);
      db.prepare(
        `UPDATE virtual_wallets SET period_spent_cents = period_spent_cents + ? WHERE id = ?`,
      ).run(amountCents, virtualWallet.id);
      db.prepare(
        `INSERT INTO ledger_entries
         (id, account_wallet_id, virtual_wallet_id, entry_type, amount_cents, destination, idempotency_key, metadata_json)
         VALUES (?, ?, ?, 'spend', ?, ?, ?, ?)`,
      ).run(
        ledgerId,
        virtualWallet.account_wallet_id,
        virtualWallet.id,
        amountCents,
        destination,
        input.idempotency_key ?? null,
        input.metadata ? JSON.stringify(input.metadata) : null,
      );
      const refreshedVw = db
        .prepare(
          `SELECT period_spent_cents, period_allowance_cents FROM virtual_wallets WHERE id = ?`,
        )
        .get(virtualWallet.id) as {
        period_spent_cents: number;
        period_allowance_cents: number;
      };
      const refreshedAccount = db
        .prepare(`SELECT balance_cents FROM account_wallets WHERE id = ?`)
        .get(virtualWallet.account_wallet_id) as { balance_cents: number };
      const remaining =
        refreshedVw.period_allowance_cents - refreshedVw.period_spent_cents;
      return {
        ok: true,
        ledger_entry_id: ledgerId,
        virtual_wallet_id: virtualWallet.id,
        amount: centsToDecimal(amountCents),
        destination,
        currency_code: account.currency_code,
        account_balance: centsToDecimal(refreshedAccount.balance_cents),
        period_spent: centsToDecimal(refreshedVw.period_spent_cents),
        remaining_allowance: centsToDecimal(Math.max(0, remaining)),
        idempotent_replay: false,
      };
    })();
    if (input.idempotency_key) {
      db.prepare(
        `INSERT INTO pay_idempotency (virtual_wallet_id, idempotency_key, ledger_entry_id, response_json)
         VALUES (?, ?, ?, ?)`,
      ).run(
        virtualWallet.id,
        input.idempotency_key,
        ledgerId,
        JSON.stringify(response),
      );
    }
    return response;
  }

  private assertAllowlist(row: VirtualWalletRow, destination: string) {
    if (!row.allowlist_json) {
      return;
    }
    const allowlist = JSON.parse(row.allowlist_json) as string[];
    if (allowlist.length === 0) {
      return;
    }
    const normalizedDest = destination.toLowerCase();
    const allowed = allowlist.some((entry) => {
      const pattern = entry.trim().toLowerCase();
      if (!pattern) return false;
      if (pattern.startsWith('*.')) {
        const suffix = pattern.slice(1);
        return (
          normalizedDest.endsWith(suffix) || normalizedDest === pattern.slice(2)
        );
      }
      return normalizedDest === pattern || normalizedDest.includes(pattern);
    });
    if (!allowed) {
      throw payReject(
        'destination_not_allowed',
        'Destination is not on the virtual wallet allowlist',
      );
    }
  }
}
