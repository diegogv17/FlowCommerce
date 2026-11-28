import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BadGatewayException,
  ConflictException,
  ServiceUnavailableException,
} from '../../../common/exceptions/domain.exceptions';
import type {
  CreatedRemoteCheckout,
  CreateRemoteCheckoutInput,
  RecurrenteGateway,
} from '../../application/ports/recurrente.gateway';
import {
  RECURRENTE_REMOTE_STATUSES,
  UNAVAILABLE_MESSAGES,
  type RecurrenteAvailability,
  type RecurrenteRemoteCheckout,
  type RecurrenteRemoteStatus,
} from '../../domain/recurrente-checkout';

export const RECURRENTE_API_URL = 'https://app.recurrente.com/api';
const REQUEST_TIMEOUT_MS = 10_000;

interface RecurrenteCheckoutPayload {
  id?: unknown;
  checkout_url?: unknown;
  status?: unknown;
  total_in_cents?: unknown;
  currency?: unknown;
  live_mode?: unknown;
  error?: unknown;
}

@Injectable()
export class RecurrenteHttpGateway implements RecurrenteGateway {
  private readonly logger = new Logger(RecurrenteHttpGateway.name);

  constructor(private readonly configService: ConfigService) {}

  async checkAvailability(): Promise<RecurrenteAvailability> {
    const secretKey = this.readSecretKey();
    if (!secretKey) {
      return { available: false, reason: 'MISSING_KEY' };
    }
    let response: Response;
    try {
      response = await this.request('GET', '/test', secretKey);
    } catch {
      return { available: false, reason: 'UNREACHABLE' };
    }
    if (response.status === 401 || response.status === 403) {
      return { available: false, reason: 'INVALID_KEY' };
    }
    if (!response.ok) {
      this.logger.warn(`Recurrente /test answered ${response.status}`);
      return { available: false, reason: 'UNREACHABLE' };
    }
    const payload = (await response.json().catch(() => ({}))) as {
      environment?: unknown;
    };
    if (payload.environment !== 'sandbox') {
      return { available: false, reason: 'NOT_SANDBOX' };
    }
    return { available: true, reason: null };
  }

  async createCheckout(
    input: CreateRemoteCheckoutInput,
  ): Promise<CreatedRemoteCheckout> {
    const secretKey = this.requireSecretKey();
    const body: Record<string, unknown> = {
      items: [
        {
          name: input.name,
          amount_in_cents: input.amountInCents,
          currency: input.currency,
          quantity: 1,
        },
      ],
    };
    if (input.successUrl) body.success_url = input.successUrl;
    if (input.cancelUrl) body.cancel_url = input.cancelUrl;

    const response = await this.send(() =>
      this.request('POST', '/checkouts', secretKey, {
        body: JSON.stringify(body),
        idempotencyKey: input.idempotencyKey,
      }),
    );
    const payload = await this.readPayload(response);

    if (response.status === 409) {
      this.logger.warn(
        `Recurrente checkout creation conflict (${String(payload.error)})`,
      );
      throw new ConflictException(
        'Ya hay una solicitud de checkout en curso para esta cotización; intente de nuevo en unos segundos',
      );
    }
    if (
      !response.ok ||
      typeof payload.id !== 'string' ||
      typeof payload.checkout_url !== 'string' ||
      !/^https:\/\//i.test(payload.checkout_url)
    ) {
      this.logger.error(
        `Recurrente checkout creation answered ${response.status}`,
      );
      throw new BadGatewayException(
        'Recurrente no pudo crear el checkout de prueba',
      );
    }
    return { id: payload.id, checkoutUrl: payload.checkout_url };
  }

  async getCheckout(checkoutId: string): Promise<RecurrenteRemoteCheckout> {
    const secretKey = this.requireSecretKey();
    const response = await this.send(() =>
      this.request(
        'GET',
        `/checkouts/${encodeURIComponent(checkoutId)}`,
        secretKey,
      ),
    );
    const payload = await this.readPayload(response);
    if (!response.ok || typeof payload.id !== 'string') {
      this.logger.error(
        `Recurrente checkout lookup answered ${response.status}`,
      );
      throw new BadGatewayException(
        'Recurrente no pudo consultar el checkout de prueba',
      );
    }
    return {
      id: payload.id,
      status: this.parseStatus(payload.status),
      totalInCents:
        typeof payload.total_in_cents === 'number'
          ? payload.total_in_cents
          : null,
      currency: typeof payload.currency === 'string' ? payload.currency : null,
      liveMode:
        typeof payload.live_mode === 'boolean' ? payload.live_mode : null,
    };
  }

  private readSecretKey(): string | null {
    const value = this.configService.get<string>('RECURRENTE_SECRET_KEY');
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  private requireSecretKey(): string {
    const secretKey = this.readSecretKey();
    if (!secretKey) {
      throw new ServiceUnavailableException(UNAVAILABLE_MESSAGES.MISSING_KEY);
    }
    return secretKey;
  }

  private request(
    method: 'GET' | 'POST',
    path: string,
    secretKey: string,
    options: { body?: string; idempotencyKey?: string } = {},
  ): Promise<Response> {
    const headers: Record<string, string> = { 'X-SECRET-KEY': secretKey };
    if (options.body !== undefined)
      headers['Content-Type'] = 'application/json';
    if (options.idempotencyKey)
      headers['Idempotency-Key'] = options.idempotencyKey;
    return fetch(`${RECURRENTE_API_URL}${path}`, {
      method,
      headers,
      body: options.body,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  }

  private async send(call: () => Promise<Response>): Promise<Response> {
    try {
      return await call();
    } catch {
      this.logger.error('Recurrente is unreachable');
      throw new BadGatewayException('No se pudo comunicar con Recurrente');
    }
  }

  private async readPayload(
    response: Response,
  ): Promise<RecurrenteCheckoutPayload> {
    return (await response
      .json()
      .catch(() => ({}))) as RecurrenteCheckoutPayload;
  }

  private parseStatus(value: unknown): RecurrenteRemoteStatus | null {
    return (
      RECURRENTE_REMOTE_STATUSES.find((status) => status === value) ?? null
    );
  }
}
