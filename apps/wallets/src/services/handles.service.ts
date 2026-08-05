import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  agentHandleFqdn,
  handleFqdn,
  HANDLE_DOMAIN,
} from '../config.js';
import { WalletsError } from '../errors.js';
import {
  isValidHandle,
} from '../db/database.js';
import { DatabaseService } from '../db/database.service.js';

@Injectable()
export class HandlesService {
  constructor(private readonly database: DatabaseService) {}

  claim(handle: string, ownerEmail: string) {
    const normalized = handle.trim().toLowerCase();
    if (!isValidHandle(normalized)) {
      throw new WalletsError(
        'invalid_handle',
        'Handle must be 3-32 chars, lowercase alphanumeric and hyphens',
        400,
      );
    }
    const db = this.database.getDb();
    const existingHandle = db
      .prepare(`SELECT handle FROM handles WHERE handle = ?`)
      .get(normalized);
    if (existingHandle) {
      throw new WalletsError('handle_taken', 'Handle already claimed', 409);
    }
    const existingWallet = db
      .prepare(
        `SELECT id FROM account_wallets WHERE owner_email = ? LIMIT 1`,
      )
      .get(ownerEmail) as { id: string } | undefined;
    let accountWalletId: string;
    if (existingWallet) {
      const linked = db
        .prepare(`SELECT handle FROM handles WHERE account_wallet_id = ?`)
        .get(existingWallet.id) as { handle: string } | undefined;
      if (linked) {
        throw new WalletsError(
          'account_wallet_has_handle',
          'This owner already has a claimed handle',
          409,
        );
      }
      accountWalletId = existingWallet.id;
    } else {
      accountWalletId = uuidv4();
      db.prepare(
        `INSERT INTO account_wallets (id, owner_email) VALUES (?, ?)`,
      ).run(accountWalletId, ownerEmail);
    }
    db.prepare(
      `INSERT INTO handles (handle, account_wallet_id, status) VALUES (?, ?, 'claimed')`,
    ).run(normalized, accountWalletId);
    return {
      handle: normalized,
      fqdn: handleFqdn(normalized),
      domain: HANDLE_DOMAIN,
      account_wallet_id: accountWalletId,
    };
  }

  resolve(handle: string) {
    const normalized = handle.trim().toLowerCase();
    const db = this.database.getDb();
    const row = db
      .prepare(
        `SELECT h.handle, h.account_wallet_id, h.claimed_at, aw.owner_email
         FROM handles h
         JOIN account_wallets aw ON aw.id = h.account_wallet_id
         WHERE h.handle = ?`,
      )
      .get(normalized) as
      | {
          handle: string;
          account_wallet_id: string;
          claimed_at: string;
          owner_email: string;
        }
      | undefined;
    if (!row) {
      throw new WalletsError('handle_not_found', 'Handle not found', 404);
    }
    const agents = db
      .prepare(
        `SELECT agent_slug, fqdn FROM agent_identities WHERE handle = ? ORDER BY agent_slug`,
      )
      .all(normalized) as { agent_slug: string; fqdn: string }[];
    return {
      handle: row.handle,
      fqdn: handleFqdn(row.handle),
      account_wallet_id: row.account_wallet_id,
      claimed_at: row.claimed_at,
      owner_email: row.owner_email,
      agents,
    };
  }

  registerAgentIdentity(
    handle: string,
    agentSlug: string,
    virtualWalletId: string,
  ) {
    const fqdn = agentHandleFqdn(handle, agentSlug);
    const db = this.database.getDb();
    db.prepare(
      `INSERT INTO agent_identities (virtual_wallet_id, handle, agent_slug, fqdn)
       VALUES (?, ?, ?, ?)`,
    ).run(virtualWalletId, handle, agentSlug, fqdn);
    return fqdn;
  }
}
