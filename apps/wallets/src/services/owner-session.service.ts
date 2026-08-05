import { Injectable } from '@nestjs/common';
import { OWNER_SESSION_TTL_HOURS } from '../config.js';
import {
  generateOwnerSessionToken,
  hashSecret,
} from '../crypto.js';
import { WalletsError } from '../errors.js';
import { DatabaseService } from '../db/database.service.js';

@Injectable()
export class OwnerSessionService {
  constructor(private readonly database: DatabaseService) {}

  createSession(email: string): { token: string; expires_at: string } {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes('@')) {
      throw new WalletsError('invalid_email', 'Valid email required', 400);
    }
    const token = generateOwnerSessionToken();
    const tokenHash = hashSecret(token);
    const expiresAt = new Date(
      Date.now() + OWNER_SESSION_TTL_HOURS * 60 * 60 * 1000,
    ).toISOString();
    const db = this.database.getDb();
    db.prepare(
      `INSERT INTO owner_sessions (token_hash, email, expires_at) VALUES (?, ?, ?)`,
    ).run(tokenHash, normalized, expiresAt);
    return { token, expires_at: expiresAt };
  }

  resolveEmailFromToken(token: string): string {
    const tokenHash = hashSecret(token);
    const db = this.database.getDb();
    const row = db
      .prepare(
        `SELECT email, expires_at FROM owner_sessions WHERE token_hash = ?`,
      )
      .get(tokenHash) as { email: string; expires_at: string } | undefined;
    if (!row) {
      throw new WalletsError('invalid_owner_session', 'Invalid owner session', 401);
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
      throw new WalletsError('owner_session_expired', 'Owner session expired', 401);
    }
    return row.email;
  }
}
