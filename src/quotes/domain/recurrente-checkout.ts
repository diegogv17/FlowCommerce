export const RECURRENTE_CURRENCY = 'GTQ';
export const RECURRENTE_MINIMUM_AMOUNT_IN_CENTS = 500;

export const RECURRENTE_CHECKOUT_STATUSES = [
  'PENDING',
  'PAID',
  'EXPIRED',
] as const;
export type RecurrenteCheckoutStatus =
  (typeof RECURRENTE_CHECKOUT_STATUSES)[number];

export const RECURRENTE_REMOTE_STATUSES = [
  'unpaid',
  'paid',
  'payment_in_progress',
  'expired',
] as const;
export type RecurrenteRemoteStatus =
  (typeof RECURRENTE_REMOTE_STATUSES)[number];

export type RecurrenteUnavailableReason =
  'MISSING_KEY' | 'INVALID_KEY' | 'NOT_SANDBOX' | 'UNREACHABLE';

export interface RecurrenteAvailability {
  available: boolean;
  reason: RecurrenteUnavailableReason | null;
}

export interface RecurrenteRemoteCheckout {
  id: string;
  status: RecurrenteRemoteStatus | null;
  totalInCents: number | null;
  currency: string | null;
  liveMode: boolean | null;
}

export interface RecurrenteCheckoutRecord {
  id: string;
  projectId: string;
  quoteId: string;
  attempt: number;
  checkoutId: string;
  checkoutUrl: string;
  amountInCents: number;
  currency: string;
  status: RecurrenteCheckoutStatus;
  paidAt: Date | null;
  createdAt: Date;
}

export interface CreateRecurrenteCheckoutRecordInput {
  projectId: string;
  quoteId: string;
  attempt: number;
  checkoutId: string;
  checkoutUrl: string;
  amountInCents: number;
  currency: string;
}

export interface RecurrenteCheckoutRepository {
  findLatestByQuote(
    quoteId: string,
    projectId: string,
  ): Promise<RecurrenteCheckoutRecord | null>;
  createIfNoActive(
    input: CreateRecurrenteCheckoutRecordInput,
  ): Promise<RecurrenteCheckoutRecord | null>;
  markExpired(id: string, projectId: string): Promise<void>;
  markPaid(id: string, projectId: string, paidAt: Date): Promise<void>;
}

export const RECURRENTE_CHECKOUT_REPOSITORY = Symbol(
  'RECURRENTE_CHECKOUT_REPOSITORY',
);

export const UNAVAILABLE_MESSAGES: Record<RecurrenteUnavailableReason, string> =
  {
    MISSING_KEY:
      'Recurrente no está configurado: falta RECURRENTE_SECRET_KEY en el backend',
    INVALID_KEY:
      'Recurrente rechazó la llave configurada en RECURRENTE_SECRET_KEY',
    NOT_SANDBOX:
      'La llave de Recurrente no es de Sandbox: este flujo solo admite llaves TEST',
    UNREACHABLE: 'No se pudo comunicar con Recurrente para validar la llave',
  };

export function describeUnavailability(
  reason: RecurrenteUnavailableReason | null,
): string | null {
  return reason ? UNAVAILABLE_MESSAGES[reason] : null;
}

export function buildRecurrenteIdempotencyKey(
  quoteId: string,
  attempt: number,
): string {
  return `flowcommerce-quote-${quoteId}-${attempt}`;
}

export function buildRecurrentePaymentReference(checkoutId: string): string {
  return `RECURRENTE-${checkoutId}`;
}

export function isActiveCheckout(record: RecurrenteCheckoutRecord): boolean {
  return record.status !== 'EXPIRED';
}

export type RecurrenteVerificationOutcome =
  'PAID' | 'PENDING' | 'IN_PROGRESS' | 'EXPIRED' | 'MISMATCH';

export interface RecurrenteVerification {
  outcome: RecurrenteVerificationOutcome;
  detail: string | null;
}

export function evaluateRemoteCheckout(
  record: RecurrenteCheckoutRecord,
  remote: RecurrenteRemoteCheckout,
): RecurrenteVerification {
  if (remote.id !== record.checkoutId) {
    return {
      outcome: 'MISMATCH',
      detail: 'El checkout devuelto por Recurrente no corresponde al guardado',
    };
  }
  if (remote.liveMode === true) {
    return {
      outcome: 'MISMATCH',
      detail: 'El checkout pertenece al ambiente de producción',
    };
  }
  if (remote.status === 'paid') {
    if (remote.totalInCents !== record.amountInCents) {
      return {
        outcome: 'MISMATCH',
        detail: 'El monto cobrado no coincide con el monto registrado',
      };
    }
    if (remote.currency !== record.currency) {
      return {
        outcome: 'MISMATCH',
        detail: 'La moneda cobrada no coincide con la registrada',
      };
    }
    return { outcome: 'PAID', detail: null };
  }
  if (remote.status === 'expired') {
    return { outcome: 'EXPIRED', detail: null };
  }
  if (remote.status === 'payment_in_progress') {
    return { outcome: 'IN_PROGRESS', detail: null };
  }
  return { outcome: 'PENDING', detail: null };
}
