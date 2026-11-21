/**
 * Cálculo de importes de una cotización, igual que la API (src/quotes/domain/quote-calculator.ts):
 * los precios del catálogo son ANTES de IVA y el IVA se aplica al final.
 *
 *   subtotal   = Σ cantidad × precio
 *   discount   = Σ descuento % de cada partida
 *   adjustment = ajuste comercial (descuento global en dinero)
 *   base       = subtotal − discount − adjustment
 *   tax        = base × IVA%
 *   total      = base + tax
 *
 * Sirve para la vista previa de Nueva cotización; las cotizaciones guardadas
 * muestran siempre los importes que devuelve la API.
 */

/** IVA de Guatemala; se usa solo si no llegan los ajustes de la empresa. */
export const DEFAULT_TAX_PERCENT = 12

export interface TaxLine {
  quantity: number
  unitPrice: number
  discountPercent?: number
}

const cents = (n: number) => Math.round((Number(n) || 0) * 100)
const money = (c: number) => c / 100

export function lineAmounts(line: TaxLine) {
  const gross = Math.round((cents(line.quantity) * cents(line.unitPrice)) / 100)
  const discount = Math.round((gross * cents(line.discountPercent ?? 0)) / 10000)
  return { gross: money(gross), discount: money(discount), lineTotal: money(gross - discount) }
}

export function quoteTotals(lines: TaxLine[], taxPercent = DEFAULT_TAX_PERCENT, adjustment = 0) {
  let subtotal = 0
  let discount = 0
  for (const l of lines) {
    const a = lineAmounts(l)
    subtotal += cents(a.gross)
    discount += cents(a.discount)
  }
  const afterLines = subtotal - discount
  const adj = Math.min(Math.max(0, cents(adjustment)), afterLines)
  const base = afterLines - adj
  const tax = Math.round((base * cents(taxPercent)) / 10000)
  return {
    subtotal: money(subtotal),
    discount: money(discount),
    adjustment: money(adj),
    /** Máximo ajuste permitido (la API responde 400 si se supera) */
    maxAdjustment: money(afterLines),
    base: money(base),
    taxPercent,
    tax: money(tax),
    total: money(base + tax),
  }
}
