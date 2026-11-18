import { connectionOptions, usesTransactionPooler } from './connection-options';

describe('connectionOptions (Supabase)', () => {
  const direct =
    'postgresql://postgres:pw@db.abcd.supabase.co:5432/postgres?sslmode=require';
  const pooler =
    'postgresql://postgres.abcd:pw@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

  it('keeps prepared statements on a direct or local connection', () => {
    expect(connectionOptions(direct, {}).prepare).toBe(true);
    expect(
      connectionOptions('postgresql://u:p@localhost:5432/flowcommerce_dev', {})
        .prepare,
    ).toBe(true);
  });

  it('turns prepared statements off behind the transaction pooler', () => {
    expect(usesTransactionPooler(pooler)).toBe(true);
    expect(connectionOptions(pooler, {}).prepare).toBe(false);
    expect(
      connectionOptions('postgresql://u:p@host:5432/db?pgbouncer=true', {})
        .prepare,
    ).toBe(false);
  });

  it('can be forced with DATABASE_PREPARE=false', () => {
    expect(
      connectionOptions(direct, { DATABASE_PREPARE: 'false' }).prepare,
    ).toBe(false);
  });

  it('sizes the pool from DATABASE_POOL_MAX and ignores nonsense', () => {
    expect(connectionOptions(direct, { DATABASE_POOL_MAX: '4' }).max).toBe(4);
    expect(connectionOptions(direct, { DATABASE_POOL_MAX: 'x' }).max).toBe(10);
    expect(connectionOptions(direct, { DATABASE_POOL_MAX: '0' }).max).toBe(10);
  });

  it('closes idle connections and recycles them for the pooler', () => {
    const defaults = connectionOptions(direct, {});
    expect(defaults.idle_timeout).toBe(20);
    expect(defaults.max_lifetime).toBe(1800);
    expect(defaults.connect_timeout).toBe(10);

    const custom = connectionOptions(direct, {
      DATABASE_IDLE_TIMEOUT_S: '5',
      DATABASE_MAX_LIFETIME_S: '600',
      DATABASE_CONNECT_TIMEOUT_S: 'nope',
    });
    expect(custom.idle_timeout).toBe(5);
    expect(custom.max_lifetime).toBe(600);
    expect(custom.connect_timeout).toBe(10);
  });

  it('does not throw on a malformed url', () => {
    expect(usesTransactionPooler('not a url')).toBe(false);
  });
});
