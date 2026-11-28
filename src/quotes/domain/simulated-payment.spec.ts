import {
  allowsInstallments,
  buildSimulatedPaymentReference,
} from './simulated-payment';

describe('simulated payment rules', () => {
  it('allows a single payment with any brand', () => {
    expect(allowsInstallments('VISA', 1)).toBe(true);
    expect(allowsInstallments('MASTERCARD', 1)).toBe(true);
  });

  it('allows installments only with Visa', () => {
    expect(allowsInstallments('VISA', 3)).toBe(true);
    expect(allowsInstallments('VISA', 12)).toBe(true);
    expect(allowsInstallments('MASTERCARD', 3)).toBe(false);
    expect(allowsInstallments('MASTERCARD', 12)).toBe(false);
  });

  it('builds a reference that never contains more than the last four digits', () => {
    expect(buildSimulatedPaymentReference('VISA', '4242', 6)).toBe(
      'SIMULADO-VISA-4242-6C',
    );
  });
});
