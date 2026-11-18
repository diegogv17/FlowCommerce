// Reglas puras para convertir la propuesta del modelo en partidas que el caso
// de uso de cotizaciones acepte. El modelo puede equivocarse (ids inventados,
// descuentos por encima del máximo, cantidades raras): aquí se corrige o se
// descarta cada partida y se deja una advertencia legible para el asesor.

export interface CatalogEntry {
  id: string;
  name: string;
  price: number;
  maxDiscountPercent: number;
}

export interface ProposedItem {
  productId: string;
  quantity: number;
  discountPercent: number;
  reason: string;
}

export interface SanitizedItem {
  productId: string;
  quantity: number;
  discountPercent: number;
}

export interface SanitizedDraft {
  items: SanitizedItem[];
  adjustment: number;
  warnings: string[];
}

export const MAX_DRAFT_ITEMS = 50;
const MAX_QUANTITY = 1_000_000;
// Un ajuste comercial por encima de la mitad del subtotal casi seguro es un
// error del modelo; se descarta y la persona lo pone a mano si de verdad aplica.
const MAX_ADJUSTMENT_RATIO = 0.5;

const round2 = (value: number): number => Math.round(value * 100) / 100;
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export function sanitizeDraftItems(
  proposed: readonly ProposedItem[],
  catalog: readonly CatalogEntry[],
  adjustment: number | null | undefined,
): SanitizedDraft {
  const byId = new Map(catalog.map((product) => [product.id, product]));
  const warnings: string[] = [];
  const items: SanitizedItem[] = [];
  let base = 0;

  for (const item of proposed) {
    if (items.length >= MAX_DRAFT_ITEMS) {
      warnings.push(
        `Se ignoraron partidas extra: el máximo es ${MAX_DRAFT_ITEMS}.`,
      );
      break;
    }
    const product = byId.get(item.productId);
    if (!product) {
      // El modelo solo ve el catálogo activo del proyecto; un id fuera de él es
      // inventado o de otro tenant y nunca llega al caso de uso.
      warnings.push(
        `Se descartó un producto que no está en el catálogo activo (${String(item.productId).slice(0, 40)}).`,
      );
      continue;
    }

    let quantity = isFiniteNumber(item.quantity) ? round2(item.quantity) : 1;
    if (quantity < 0.01) {
      warnings.push(`Cantidad inválida en "${product.name}": se usó 1.`);
      quantity = 1;
    } else if (quantity > MAX_QUANTITY) {
      warnings.push(
        `Cantidad excesiva en "${product.name}": se limitó a ${MAX_QUANTITY}.`,
      );
      quantity = MAX_QUANTITY;
    }

    let discountPercent = isFiniteNumber(item.discountPercent)
      ? round2(item.discountPercent)
      : 0;
    if (discountPercent < 0) {
      discountPercent = 0;
    }
    if (discountPercent > product.maxDiscountPercent) {
      warnings.push(
        `El descuento de "${product.name}" (${discountPercent}%) superaba el máximo permitido; se ajustó a ${product.maxDiscountPercent}%.`,
      );
      discountPercent = product.maxDiscountPercent;
    }

    items.push({ productId: product.id, quantity, discountPercent });
    base += product.price * quantity * (1 - discountPercent / 100);
  }

  let finalAdjustment = isFiniteNumber(adjustment)
    ? round2(Math.max(0, adjustment))
    : 0;
  if (finalAdjustment > 0 && finalAdjustment > base * MAX_ADJUSTMENT_RATIO) {
    warnings.push(
      'Se descartó el ajuste comercial propuesto por la IA porque era demasiado alto; revísalo manualmente.',
    );
    finalAdjustment = 0;
  }

  return { items, adjustment: finalAdjustment, warnings };
}

// Limita a [min, max] y redondea a entero (probabilidades, días).
export function clampInt(value: unknown, min: number, max: number): number {
  const number = isFiniteNumber(value) ? Math.round(value) : min;
  return Math.min(max, Math.max(min, number));
}
