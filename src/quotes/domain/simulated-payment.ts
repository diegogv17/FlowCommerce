export const SIMULATED_CARD_BRANDS = ['VISA', 'MASTERCARD'] as const;
export type SimulatedCardBrand = (typeof SIMULATED_CARD_BRANDS)[number];

export const SIMULATED_INSTALLMENT_OPTIONS = [1, 3, 6, 12] as const;
export type SimulatedInstallments =
  (typeof SIMULATED_INSTALLMENT_OPTIONS)[number];

export function allowsInstallments(
  brand: SimulatedCardBrand,
  installments: SimulatedInstallments,
): boolean {
  return installments === 1 || brand === 'VISA';
}

export function buildSimulatedPaymentReference(
  brand: SimulatedCardBrand,
  lastFourDigits: string,
  installments: SimulatedInstallments,
): string {
  return `SIMULADO-${brand}-${lastFourDigits}-${installments}C`;
}
