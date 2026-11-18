// Réplica de src/quotes/domain/quote-calculator.ts para la VISTA PREVIA del
// formulario. La verdad la calcula el servidor al guardar; aquí se usa la misma
// aritmética (céntimos enteros con BigInt y redondeo half-up) para que el
// resumen coincida al céntimo con lo que se guardará.
//
//   subtotal   = Σ cantidad × precio
//   discount   = Σ descuento de cada partida
//   base       = subtotal − discount − adjustment
//   tax        = base × IVA%
//   total      = base + tax

export interface CalculatorLineInput {
  quantity: number;
  unitPrice: number;
  discountPercent: number;
}

export interface CalculatedLine {
  gross: number;
  discount: number;
  lineTotal: number;
}

export interface CalculatedQuote {
  lines: CalculatedLine[];
  subtotal: number;
  discount: number;
  adjustment: number;
  taxPercent: number;
  tax: number;
  total: number;
  /** Máximo ajuste permitido (subtotal − descuentos de línea). */
  maxAdjustment: number;
  /** true si el ajuste supera la base (el servidor respondería 400). */
  adjustmentExceeded: boolean;
}

const toHundredths = (value: number): bigint => {
  const safe = Number.isFinite(value) ? value : 0;
  return BigInt(Math.round(safe * 100));
};
const fromCents = (cents: bigint): number => Number(cents) / 100;
const divRound = (numerator: bigint, denominator: bigint): bigint =>
  (numerator * BigInt(2) + denominator) / (denominator * BigInt(2));

const HUNDRED = BigInt(100);
const TEN_THOUSAND = BigInt(10000);
const ZERO = BigInt(0);

export function calculateQuote(
  lines: readonly CalculatorLineInput[],
  taxPercent: number,
  adjustment = 0,
): CalculatedQuote {
  let subtotal = ZERO;
  let discount = ZERO;

  const calculated = lines.map((line) => {
    // Valores negativos no se aceptan en el servidor; en la vista previa se
    // tratan como 0 para no romper el redondeo (operandos no negativos).
    const quantity = Math.max(0, line.quantity);
    const unitPrice = Math.max(0, line.unitPrice);
    const percent = Math.max(0, line.discountPercent);
    const gross = divRound(toHundredths(quantity) * toHundredths(unitPrice), HUNDRED);
    const lineDiscount = divRound(gross * toHundredths(percent), TEN_THOUSAND);
    subtotal += gross;
    discount += lineDiscount;
    return {
      gross: fromCents(gross),
      discount: fromCents(lineDiscount),
      lineTotal: fromCents(gross - lineDiscount),
    };
  });

  const afterLineDiscounts = subtotal - discount;
  const requested = toHundredths(Math.max(0, adjustment));
  const exceeded = requested > afterLineDiscounts;
  // En la vista previa se recorta para mostrar algo coherente; el formulario
  // marca el error y no deja guardar.
  const adjustmentCents = exceeded ? afterLineDiscounts : requested;
  const base = afterLineDiscounts - adjustmentCents;
  const tax = divRound(base * toHundredths(taxPercent), TEN_THOUSAND);

  return {
    lines: calculated,
    subtotal: fromCents(subtotal),
    discount: fromCents(discount),
    adjustment: fromCents(adjustmentCents),
    taxPercent,
    tax: fromCents(tax),
    total: fromCents(base + tax),
    maxAdjustment: fromCents(afterLineDiscounts),
    adjustmentExceeded: exceeded,
  };
}
