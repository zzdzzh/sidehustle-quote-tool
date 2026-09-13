import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || './data/quotes.db';

let db: Database.Database | null = null;

export interface Quote {
  id: string;
  quote_no: string;
  client_name: string;
  client_contact: string;
  scope: string;
  milestones: string;
  total_amount: number;
  deposit_amount: number;
  deposit_percentage: number;
  exclusions: string;
  validity_days: number;
  status: 'pending' | 'confirmed';
  confirmed_at: string | null;
  created_at: string;
}

export interface QuotePublic {
  id: string;
  quote_no: string;
  client_name: string;
  client_contact_masked: string;
  scope: string;
  milestones: string;
  total_amount: number;
  deposit_amount: number;
  deposit_percentage: number;
  exclusions: string;
  validity_days: number;
  status: 'pending' | 'confirmed';
  confirmed_at: string | null;
  created_at: string;
}

function initDatabase(): Database.Database {
  if (db) return db;

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY,
      quote_no TEXT NOT NULL UNIQUE,
      client_name TEXT NOT NULL,
      client_contact TEXT NOT NULL,
      scope TEXT NOT NULL,
      milestones TEXT NOT NULL,
      total_amount INTEGER NOT NULL,
      deposit_amount INTEGER NOT NULL,
      deposit_percentage INTEGER NOT NULL,
      exclusions TEXT NOT NULL,
      validity_days INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      confirmed_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 1,
      window_start INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_rate_limits_window 
    ON rate_limits(window_start);
  `);

  return db;
}

export function getDatabase(): Database.Database {
  return initDatabase();
}

export function getQuoteById(id: string): Quote | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM quotes WHERE id = ?');
  return stmt.get(id) as Quote | null;
}

export function confirmQuote(id: string): boolean {
  const db = getDatabase();
  
  const quote = getQuoteById(id);
  if (!quote) return false;
  if (quote.status === 'confirmed') return true;
  
  const now = new Date().toISOString();
  const stmt = db.prepare(
    'UPDATE quotes SET status = ?, confirmed_at = ? WHERE id = ? AND status = ?'
  );
  const result = stmt.run('confirmed', now, id, 'pending');
  
  return result.changes > 0;
}

export function maskContact(contact: string): string {
  if (contact.includes('@')) {
    const [local, domain] = contact.split('@');
    const maskedLocal = local.length > 2 
      ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
      : local[0] + '*';
    return `${maskedLocal}@${domain}`;
  }
  
  if (contact.length <= 7) {
    return contact.slice(0, 3) + '****' + contact.slice(-2);
  }
  return contact.slice(0, 3) + '****' + contact.slice(-4);
}

export function toPublicQuote(quote: Quote): QuotePublic {
  return {
    id: quote.id,
    quote_no: quote.quote_no,
    client_name: quote.client_name,
    client_contact_masked: maskContact(quote.client_contact),
    scope: quote.scope,
    milestones: quote.milestones,
    total_amount: quote.total_amount,
    deposit_amount: quote.deposit_amount,
    deposit_percentage: quote.deposit_percentage,
    exclusions: quote.exclusions,
    validity_days: quote.validity_days,
    status: quote.status,
    confirmed_at: quote.confirmed_at,
    created_at: quote.created_at
  };
}
