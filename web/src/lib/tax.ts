/** IVA de Guatemala. Los precios del catálogo ya incluyen IVA. */
export const IVA_RATE = 0.12

/** Desglosa un total con IVA incluido en base imponible e impuesto. */
export function ivaBreakdown(grossSubtotal: number, discount = 0) {
  const total = Math.max(0, grossSubtotal - discount)
  const base = total / (1 + IVA_RATE)
  return { base, iva: total - base, total }
}
