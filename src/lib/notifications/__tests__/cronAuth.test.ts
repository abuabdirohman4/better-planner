// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { verifyCronRequest } from '../utils/cronAuth';

const req = (headers: Record<string, string>) => new Request('http://x/api/cron/x', { headers });
const ENV = { ...process.env };

describe('verifyCronRequest', () => {
  beforeEach(() => { delete process.env.CRON_SECRET; delete process.env.CRON_SECRET_TOKEN; delete process.env.VERCEL; });
  afterEach(() => { process.env = { ...ENV }; });

  it('accepts CRON_SECRET_TOKEN bearer', () => {
    process.env.CRON_SECRET_TOKEN = 'tok';
    expect(verifyCronRequest(req({ authorization: 'Bearer tok' }))).toBe(true);
    expect(verifyCronRequest(req({ authorization: 'Bearer nope' }))).toBe(false);
  });

  it('accepts CRON_SECRET bearer (Vercel-injected)', () => {
    process.env.CRON_SECRET = 'sec';
    expect(verifyCronRequest(req({ authorization: 'Bearer sec' }))).toBe(true);
  });

  it('trusts vercel-cron user-agent ONLY when no secret configured', () => {
    process.env.VERCEL = '1';
    expect(verifyCronRequest(req({ 'user-agent': 'vercel-cron/1.0' }))).toBe(true);
    process.env.CRON_SECRET = 'sec';
    expect(verifyCronRequest(req({ 'user-agent': 'vercel-cron/1.0' }))).toBe(false);
  });

  it('rejects anonymous request', () => {
    expect(verifyCronRequest(req({}))).toBe(false);
  });
});
