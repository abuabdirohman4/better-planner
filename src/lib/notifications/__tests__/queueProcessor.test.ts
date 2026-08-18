// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const sendEmail = vi.fn();
vi.mock('../services/emailService', () => ({ sendEmail: (...a: unknown[]) => sendEmail(...a) }));
vi.mock('../templates', () => ({ renderEmailTemplate: vi.fn().mockResolvedValue('<html/>') }));

// Minimal in-memory supabase: records inserts/updates per table
const calls: { table: string; op: string; args: unknown }[] = [];
let pending: any[] = [];
function table(name: string) {
  const b: any = {
    select: () => b, eq: () => b, or: () => b, limit: () => Promise.resolve({ data: pending, error: null }),
    update: (args: unknown) => { calls.push({ table: name, op: 'update', args }); return b; },
    insert: (args: unknown) => { calls.push({ table: name, op: 'insert', args }); return Promise.resolve({ error: null }); },
  };
  return b;
}
vi.mock('@/lib/supabase/service', () => ({ createServiceClient: () => ({ from: (n: string) => table(n) }) }));

import { processEmailQueue, buildSubject } from '../services/queueProcessor';

const payload = {
  userId: 'u1', email: 'a@b.c', userName: 'Abu', periodType: 'daily', periodLabel: '17 Agustus 2026',
  metrics: { periodStart: '2026-08-17', periodEnd: '2026-08-17' }, insight: {}, character: 'BALANCED_MENTOR', language: 'id',
};

describe('processEmailQueue', () => {
  beforeEach(() => { calls.length = 0; sendEmail.mockReset(); });

  it('sends, marks SENT, writes full history row', async () => {
    pending = [{ id: 'q1', payload, retry_count: 0 }];
    sendEmail.mockResolvedValue({ success: true, messageId: 're_1' });
    const r = await processEmailQueue();
    expect(r).toMatchObject({ processed: 1, succeeded: 1, failed: 0 });
    const hist = calls.find(c => c.table === 'notification_history' && c.op === 'insert')!.args as any;
    expect(hist).toMatchObject({
      user_id: 'u1', notification_type: 'daily', period_type: 'daily', period_start: '2026-08-17', period_end: '2026-08-17',
      email_address: 'a@b.c', email_provider_id: 're_1', queue_id: 'q1', ai_character: 'BALANCED_MENTOR',
    });
    expect(hist.subject).toBe(buildSubject(payload as any));
  });

  it('retries with backoff on failure, FAILED at 3rd', async () => {
    pending = [{ id: 'q2', payload, retry_count: 2 }];
    sendEmail.mockResolvedValue({ success: false, error: 'boom' });
    const r = await processEmailQueue();
    expect(r.failed).toBe(1);
    const upd = calls.filter(c => c.table === 'notification_queue' && c.op === 'update').map(c => c.args as any);
    expect(upd.at(-1)).toMatchObject({ status: 'FAILED', retry_count: 3, resend_error: 'boom' });
    expect(calls.some(c => c.table === 'notification_history')).toBe(false);
  });
});
