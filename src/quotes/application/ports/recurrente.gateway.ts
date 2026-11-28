import type {
  RecurrenteAvailability,
  RecurrenteRemoteCheckout,
} from '../../domain/recurrente-checkout';

export interface CreateRemoteCheckoutInput {
  name: string;
  amountInCents: number;
  currency: string;
  idempotencyKey: string;
  successUrl: string | null;
  cancelUrl: string | null;
}

export interface CreatedRemoteCheckout {
  id: string;
  checkoutUrl: string;
}

export interface RecurrenteGateway {
  checkAvailability(): Promise<RecurrenteAvailability>;
  createCheckout(
    input: CreateRemoteCheckoutInput,
  ): Promise<CreatedRemoteCheckout>;
  getCheckout(checkoutId: string): Promise<RecurrenteRemoteCheckout>;
}

export const RECURRENTE_GATEWAY = Symbol('RECURRENTE_GATEWAY');
