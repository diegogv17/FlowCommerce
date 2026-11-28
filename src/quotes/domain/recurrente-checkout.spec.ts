import {
  buildRecurrenteIdempotencyKey,
  buildRecurrentePaymentReference,
  describeUnavailability,
  evaluateRemoteCheckout,
  isActiveCheckout,
  type RecurrenteCheckoutRecord,
  type RecurrenteRemoteCheckout,
} from './recurrente-checkout';

describe('recurrente-checkout', () => {
  const record: RecurrenteCheckoutRecord = {
    id: 'record-1',
    projectId: 'project-1',
    quoteId: 'quote-1',
    attempt: 1,
    checkoutId: 'ch_abc',
    checkoutUrl: 'https://checkout.recurrente.com/ch_abc',
    amountInCents: 112000,
    currency: 'GTQ',
    status: 'PENDING',
    paidAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const remote = (
    overrides: Partial<RecurrenteRemoteCheckout> = {},
  ): RecurrenteRemoteCheckout => ({
    id: 'ch_abc',
    status: 'paid',
    totalInCents: 112000,
    currency: 'GTQ',
    liveMode: false,
    ...overrides,
  });

  it('builds a stable idempotency key per quote and attempt', () => {
    expect(buildRecurrenteIdempotencyKey('quote-1', 2)).toBe(
      'flowcommerce-quote-quote-1-2',
    );
  });

  it('builds the payment reference from the checkout id', () => {
    expect(buildRecurrentePaymentReference('ch_abc')).toBe('RECURRENTE-ch_abc');
  });

  it('treats only expired records as inactive', () => {
    expect(isActiveCheckout(record)).toBe(true);
    expect(isActiveCheckout({ ...record, status: 'PAID' })).toBe(true);
    expect(isActiveCheckout({ ...record, status: 'EXPIRED' })).toBe(false);
  });

  it('describes each unavailability reason and null', () => {
    expect(describeUnavailability(null)).toBeNull();
    expect(describeUnavailability('MISSING_KEY')).toContain(
      'RECURRENTE_SECRET_KEY',
    );
    expect(describeUnavailability('NOT_SANDBOX')).toContain('Sandbox');
  });

  it('confirms a paid checkout with matching id, amount and currency', () => {
    expect(evaluateRemoteCheckout(record, remote())).toEqual({
      outcome: 'PAID',
      detail: null,
    });
  });

  it('maps unpaid, in progress and expired without confirming', () => {
    expect(
      evaluateRemoteCheckout(record, remote({ status: 'unpaid' })).outcome,
    ).toBe('PENDING');
    expect(
      evaluateRemoteCheckout(record, remote({ status: 'payment_in_progress' }))
        .outcome,
    ).toBe('IN_PROGRESS');
    expect(
      evaluateRemoteCheckout(record, remote({ status: 'expired' })).outcome,
    ).toBe('EXPIRED');
    expect(
      evaluateRemoteCheckout(record, remote({ status: null })).outcome,
    ).toBe('PENDING');
  });

  it('flags a mismatch when the checkout id differs', () => {
    expect(
      evaluateRemoteCheckout(record, remote({ id: 'ch_other' })).outcome,
    ).toBe('MISMATCH');
  });

  it('flags a mismatch when a paid checkout has another amount', () => {
    expect(
      evaluateRemoteCheckout(record, remote({ totalInCents: 100 })).outcome,
    ).toBe('MISMATCH');
    expect(
      evaluateRemoteCheckout(record, remote({ totalInCents: null })).outcome,
    ).toBe('MISMATCH');
  });

  it('flags a mismatch when a paid checkout has another currency', () => {
    expect(
      evaluateRemoteCheckout(record, remote({ currency: 'USD' })).outcome,
    ).toBe('MISMATCH');
  });

  it('flags a mismatch for live-mode checkouts', () => {
    expect(
      evaluateRemoteCheckout(record, remote({ liveMode: true })).outcome,
    ).toBe('MISMATCH');
  });
});
