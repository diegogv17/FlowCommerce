import { isPaymentSimulationEnabled } from './payment-simulation';

describe('isPaymentSimulationEnabled', () => {
  it('is enabled outside production by default', () => {
    expect(isPaymentSimulationEnabled({})).toBe(true);
    expect(isPaymentSimulationEnabled({ NODE_ENV: 'development' })).toBe(true);
  });

  it('is disabled in production by default', () => {
    expect(isPaymentSimulationEnabled({ NODE_ENV: 'production' })).toBe(false);
  });

  it('honors an explicit PAYMENT_SIMULATION_ENABLED value', () => {
    expect(
      isPaymentSimulationEnabled({
        NODE_ENV: 'production',
        PAYMENT_SIMULATION_ENABLED: 'true',
      }),
    ).toBe(true);
    expect(
      isPaymentSimulationEnabled({
        NODE_ENV: 'development',
        PAYMENT_SIMULATION_ENABLED: 'false',
      }),
    ).toBe(false);
  });
});
