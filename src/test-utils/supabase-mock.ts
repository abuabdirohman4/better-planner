import { vi } from 'vitest';

/**
 * Chainable Supabase query builder mock.
 * Supports: .select().eq().in().gte().lte().order().single()
 * The builder itself is a thenable (Promise-like) that resolves to resolvedValue.
 */
export function makeQueryBuilder(resolvedValue: { data: any; error: any } = { data: null, error: null }) {
  const b: any = {};
  const terminal = vi.fn().mockResolvedValue(resolvedValue);
  b.select = vi.fn().mockReturnValue(b);
  b.insert = vi.fn().mockReturnValue(b);
  b.update = vi.fn().mockReturnValue(b);
  b.delete = vi.fn().mockReturnValue(b);
  b.upsert = vi.fn().mockReturnValue(b);
  b.eq = vi.fn().mockReturnValue(b);
  b.in = vi.fn().mockReturnValue(b);
  b.gte = vi.fn().mockReturnValue(b);
  b.lte = vi.fn().mockReturnValue(b);
  b.order = vi.fn().mockReturnValue(b);
  b.is = vi.fn().mockReturnValue(b);
  b.single = terminal;
  b.maybeSingle = terminal;
  // Allow await-ing the builder directly (without .single())
  b.then = (resolve: any) => Promise.resolve(resolvedValue).then(resolve);
  return b;
}

/**
 * Supabase client mock with auth.getUser() support.
 * Pass user: null to simulate unauthenticated state.
 */
export function makeSupabase(opts: {
  user?: { id: string } | null;
  fromBuilder?: any;
} = {}) {
  const user = opts.user !== undefined ? opts.user : { id: 'user-1' };
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user } }),
    },
    from: vi.fn().mockReturnValue(opts.fromBuilder ?? makeQueryBuilder()),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  } as any;
}
