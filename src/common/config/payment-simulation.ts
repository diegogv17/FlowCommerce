export function isPaymentSimulationEnabled(env: {
  PAYMENT_SIMULATION_ENABLED?: string;
  NODE_ENV?: string;
}): boolean {
  if (env.PAYMENT_SIMULATION_ENABLED === 'true') return true;
  if (env.PAYMENT_SIMULATION_ENABLED === 'false') return false;
  return env.NODE_ENV !== 'production';
}
