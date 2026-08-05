import type Database from 'better-sqlite3';
import { Injectable } from '@nestjs/common';
import { getDb } from '../db/database.js';

@Injectable()
export class DatabaseService {
  getDb(): Database.Database {
    return getDb();
  }
}
