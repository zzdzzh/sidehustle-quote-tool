import { getDatabase } from './db';

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10', 10);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(key: string): RateLimitResult {
  const db = getDatabase();
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  db.prepare('DELETE FROM rate_limits WHERE window_start < ?').run(windowStart);

  const existing = db.prepare('SELECT * FROM rate_limits WHERE key = ?').get(key) as 
    { key: string; count: number; window_start: number } | undefined;

  if (!existing) {
    db.prepare('INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)').run(key, now);
    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      resetAt: now + WINDOW_MS
    };
  }

  if (existing.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.window_start + WINDOW_MS
    };
  }

  db.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').run(key);
  
  return {
    allowed: true,
    remaining: MAX_REQUESTS - existing.count - 1,
    resetAt: existing.window_start + WINDOW_MS
  };
}

export function getRateLimitKey(ip: string, quoteId?: string): string {
  if (quoteId) {
    return `${ip}:${quoteId}`;
  }
  return ip;
}

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}
