import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  generateVirtualWalletKey,
  hashSecret,
  keyPrefix,
} from '../crypto.js';
import { WalletsError } from '../errors.js';
import {
  centsToDecimal,
  decimalToCents,
  isValidAgentSlug,
} from '../db/database.js';
import { DatabaseService } from '../db/database.service.js';
import { HandlesService } from './handles.service.js';

export type CreateVirtualWalletInput = {
  account_wallet_id: string;
  owner_email: string;
  agent_slug: string;
  period_allowance: number;
  max_transaction: number;
  allowlist?: string[];
};

@Injectable()
export class VirtualWalletsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly handlesService: HandlesService,
  ) {}

  create(input: CreateVirtualWalletInput) {
    const agentSlug = input.agent_slug.trim().toLowerCase();
    if (!isValidAgentSlug(agentSlug)) {
      throw new WalletsError(
        'invalid_agent_slug',
        'Agent slug must be 3-30 chars, lowercase alphanumeric and hyphens',
        400,
      );
    }
    if (
      !Number.isFinite(input.period_allowance) ||
      input.period_allowance <= 0
    ) {
      throw new WalletsError(
        'invalid_period_allowance',
        'period_allowance must be positive',
        400,
      );
    }
    if (
      !Number.isFinite(input.max_transaction) ||
      input.max_transaction <= 0
    ) {
      throw new WalletsError(
        'invalid_max_transaction',
        'max_transaction must be positive',
        400,
      );
    }
    const maxCents = decimalToCents(input.max_transaction);
    const allowanceCents = decimalToCents(input.period_allowance);
    if (maxCents > allowanceCents) {
      throw new WalletsError(
        'max_transaction_exceeds_allowance',
        'max_transaction cannot exceed period_allowance',
        400,
      );
    }
    const db = this.database.getDb();
    const account = db
      .prepare(
        `SELECT aw.id, h.handle FROM account_wallets aw
         LEFT JOIN handles h ON h.account_wallet_id = aw.id
         WHERE aw.id = ? AND aw.owner_email = ?`,
      )
      .get(input.account_wallet_id, input.owner_email) as
      | { id: string; handle: string | null }
      | undefined;
    if (!account) {
      throw new WalletsError('account_wallet_not_found', 'Account wallet not found', 404);
    }
    if (!account.handle) {
      throw new WalletsError(
        'handle_required',
        'Claim a handle before creating virtual wallets',
        400,
      );
    }
    const apiKey = generateVirtualWalletKey();
    const apiKeyHash = hashSecret(apiKey);
    const id = uuidv4();
    const periodStart = new Date().toISOString();
    const allowlistJson =
      input.allowlist && input.allowlist.length > 0
        ? JSON.stringify(input.allowlist)
        : null;
    try {
      db.prepare(
        `INSERT INTO virtual_wallets
         (id, account_wallet_id, api_key_hash, api_key_prefix, agent_slug, status,
          period_allowance_cents, max_transaction_cents, allowlist_json, period_start, period_spent_cents)
         VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, 0)`,
      ).run(
        id,
        account.id,
        apiKeyHash,
        keyPrefix(apiKey),
        agentSlug,
        allowanceCents,
        maxCents,
        allowlistJson,
        periodStart,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('UNIQUE')) {
        throw new WalletsError(
          'agent_slug_taken',
          'Agent slug already exists for this account wallet',
          409,
        );
      }
      throw err;
    }
    const fqdn = this.handlesService.registerAgentIdentity(
      account.handle,
      agentSlug,
      id,
    );
    return {
      id,
      account_wallet_id: account.id,
      agent_slug: agentSlug,
      fqdn,
      api_key: apiKey,
      status: 'active',
      period_allowance: centsToDecimal(allowanceCents),
      max_transaction: centsToDecimal(maxCents),
      period_spent: '0.00',
      remaining_allowance: centsToDecimal(allowanceCents),
      allowlist: input.allowlist ?? [],
    };
  }

  getByIdForOwner(virtualWalletId: string, ownerEmail: string) {
    const row = this.getVirtualWalletRow(virtualWalletId);
    this.assertOwner(row.account_wallet_id, ownerEmail);
    return this.mapVirtualWallet(row);
  }

  resolveByApiKey(apiKey: string) {
    if (!apiKey.startsWith('lomi_vw_')) {
      throw new WalletsError(
        'invalid_virtual_wallet_key',
        'Invalid virtual wallet API key',
        401,
      );
    }
    const apiKeyHash = hashSecret(apiKey);
    const db = this.database.getDb();
    const row = db
      .prepare(
        `SELECT vw.*, h.handle FROM virtual_wallets vw
         JOIN account_wallets aw ON aw.id = vw.account_wallet_id
         LEFT JOIN handles h ON h.account_wallet_id = aw.id
         WHERE vw.api_key_hash = ?`,
      )
      .get(apiKeyHash) as VirtualWalletRow | undefined;
    if (!row) {
      throw new WalletsError(
        'invalid_virtual_wallet_key',
        'Invalid virtual wallet API key',
        401,
      );
    }
    return row;
  }

  getVirtualWalletRow(id: string): VirtualWalletRow {
    const db = this.database.getDb();
    const row = db
      .prepare(
        `SELECT vw.*, h.handle FROM virtual_wallets vw
         JOIN account_wallets aw ON aw.id = vw.account_wallet_id
         LEFT JOIN handles h ON h.account_wallet_id = aw.id
         WHERE vw.id = ?`,
      )
      .get(id) as VirtualWalletRow | undefined;
    if (!row) {
      throw new WalletsError('virtual_wallet_not_found', 'Virtual wallet not found', 404);
    }
    return row;
  }

  assertOwner(accountWalletId: string, ownerEmail: string) {
    const db = this.database.getDb();
    const row = db
      .prepare(
        `SELECT id FROM account_wallets WHERE id = ? AND owner_email = ?`,
      )
      .get(accountWalletId, ownerEmail) as { id: string } | undefined;
    if (!row) {
      throw new WalletsError('forbidden', 'Not allowed for this account wallet', 403);
    }
  }

  mapVirtualWallet(row: VirtualWalletRow) {
    const remaining = row.period_allowance_cents - row.period_spent_cents;
    const allowlist = row.allowlist_json
      ? (JSON.parse(row.allowlist_json) as string[])
      : [];
    return {
      id: row.id,
      account_wallet_id: row.account_wallet_id,
      agent_slug: row.agent_slug,
      handle: row.handle,
      fqdn: row.handle
        ? `${row.agent_slug}.${row.handle}.lomi.pay`
        : null,
      status: row.status,
      period_allowance: centsToDecimal(row.period_allowance_cents),
      max_transaction: centsToDecimal(row.max_transaction_cents),
      period_spent: centsToDecimal(row.period_spent_cents),
      remaining_allowance: centsToDecimal(Math.max(0, remaining)),
      allowlist,
      api_key_prefix: row.api_key_prefix,
    };
  }
}

export type VirtualWalletRow = {
  id: string;
  account_wallet_id: string;
  api_key_hash: string;
  api_key_prefix: string;
  agent_slug: string;
  status: string;
  period_allowance_cents: number;
  max_transaction_cents: number;
  allowlist_json: string | null;
  period_start: string;
  period_spent_cents: number;
  created_at: string;
  handle: string | null;
};
