import { nanoid } from 'nanoid';
import { getDatabase } from './db';

export function seedDemoQuote() {
  const db = getDatabase();
  
  const existing = db.prepare('SELECT COUNT(*) as count FROM quotes').get() as { count: number };
  if (existing.count > 0) {
    console.log('Database already seeded');
    return;
  }

  const id = nanoid(21);
  const quote_no = 'QT-20260913-001';
  
  const stmt = db.prepare(`
    INSERT INTO quotes (
      id, quote_no, client_name, client_contact, scope, milestones,
      total_amount, deposit_amount, deposit_percentage, exclusions,
      validity_days, status, confirmed_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    quote_no,
    '张伟（演示）',
    'demo@example.com',
    '企业官网重构与功能开发',
    JSON.stringify([
      { name: '需求调研与原型设计', amount: 3000 },
      { name: 'UI/UX 设计', amount: 4000 },
      { name: '前端开发', amount: 3500 },
      { name: '后端开发与接口对接', amount: 2300 }
    ]),
    12800,
    3840,
    30,
    '不包含第三方服务费用；不包含域名与服务器费用；后期维护需另行报价',
    15,
    'pending',
    null,
    new Date().toISOString()
  );

  console.log(`Demo quote seeded with ID: ${id}`);
  console.log(`Access at: /q/${id}`);
  
  return id;
}
