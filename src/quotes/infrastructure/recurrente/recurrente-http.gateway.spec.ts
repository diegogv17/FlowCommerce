import { Logger } from '@nestjs/common';
import {
  BadGatewayException,
  ConflictException,
  ServiceUnavailableException,
} from '../../../common/exceptions/domain.exceptions';
import {
  RECURRENTE_API_URL,
  RecurrenteHttpGateway,
} from './recurrente-http.gateway';

describe('RecurrenteHttpGateway', () => {
  const secretKey = 'sk_test_super_secret_value';
  const env: Record<string, string | undefined> = {};
  const configService = { get: jest.fn((key: string) => env[key]) };
  const gateway = new RecurrenteHttpGateway(configService as never);
  let fetchMock: jest.SpyInstance;
  let loggedText: string[];

  const reply = (status: number, body: unknown): Response =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  beforeEach(() => {
    jest.clearAllMocks();
    env.RECURRENTE_SECRET_KEY = secretKey;
    fetchMock = jest.spyOn(globalThis, 'fetch');
    loggedText = [];
    for (const method of [
      'log',
      'warn',
      'error',
      'debug',
      'verbose',
    ] as const) {
      jest
        .spyOn(Logger.prototype, method)
        .mockImplementation((...args: unknown[]) => {
          loggedText.push(args.map(String).join(' '));
        });
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('checkAvailability', () => {
    it('reports MISSING_KEY without calling Recurrente', async () => {
      env.RECURRENTE_SECRET_KEY = '   ';

      await expect(gateway.checkAvailability()).resolves.toEqual({
        available: false,
        reason: 'MISSING_KEY',
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('calls GET /test with the X-SECRET-KEY header and accepts sandbox', async () => {
      fetchMock.mockResolvedValue(reply(200, { environment: 'sandbox' }));

      await expect(gateway.checkAvailability()).resolves.toEqual({
        available: true,
        reason: null,
      });
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${RECURRENTE_API_URL}/test`);
      expect(init.method).toBe('GET');
      expect(init.headers).toMatchObject({ 'X-SECRET-KEY': secretKey });
    });

    it('rejects a production key', async () => {
      fetchMock.mockResolvedValue(reply(200, { environment: 'live' }));

      await expect(gateway.checkAvailability()).resolves.toEqual({
        available: false,
        reason: 'NOT_SANDBOX',
      });
    });

    it('rejects an invalid key', async () => {
      fetchMock.mockResolvedValue(reply(401, { error: 'unauthorized' }));

      await expect(gateway.checkAvailability()).resolves.toEqual({
        available: false,
        reason: 'INVALID_KEY',
      });
    });

    it('reports UNREACHABLE on network failure and server errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('network down'));
      await expect(gateway.checkAvailability()).resolves.toEqual({
        available: false,
        reason: 'UNREACHABLE',
      });

      fetchMock.mockResolvedValueOnce(reply(500, {}));
      await expect(gateway.checkAvailability()).resolves.toEqual({
        available: false,
        reason: 'UNREACHABLE',
      });
    });
  });

  describe('createCheckout', () => {
    const input = {
      name: 'Cotización COT-000001',
      amountInCents: 112000,
      currency: 'GTQ',
      idempotencyKey: 'flowcommerce-quote-q-1',
      successUrl: 'http://localhost:5173/cotizaciones/q',
      cancelUrl: 'http://localhost:5173/cotizaciones/q',
    };

    it('posts the inline item in GTQ cents with the idempotency key', async () => {
      fetchMock.mockResolvedValue(
        reply(201, {
          id: 'ch_1',
          checkout_url: 'https://checkout.recurrente.com/ch_1',
        }),
      );

      await expect(gateway.createCheckout(input)).resolves.toEqual({
        id: 'ch_1',
        checkoutUrl: 'https://checkout.recurrente.com/ch_1',
      });
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${RECURRENTE_API_URL}/checkouts`);
      expect(init.method).toBe('POST');
      expect(init.headers).toMatchObject({
        'X-SECRET-KEY': secretKey,
        'Content-Type': 'application/json',
        'Idempotency-Key': 'flowcommerce-quote-q-1',
      });
      expect(JSON.parse(init.body as string)).toEqual({
        items: [
          {
            name: 'Cotización COT-000001',
            amount_in_cents: 112000,
            currency: 'GTQ',
            quantity: 1,
          },
        ],
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
      });
    });

    it('omits the return urls when they are not provided', async () => {
      fetchMock.mockResolvedValue(
        reply(201, {
          id: 'ch_1',
          checkout_url: 'https://checkout.recurrente.com/ch_1',
        }),
      );

      await gateway.createCheckout({
        ...input,
        successUrl: null,
        cancelUrl: null,
      });

      const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(
        Object.keys(JSON.parse(init.body as string) as Record<string, unknown>),
      ).toEqual(['items']);
    });

    it('maps an idempotency conflict to 409', async () => {
      fetchMock.mockResolvedValue(
        reply(409, { error: 'idempotency_key_in_progress' }),
      );

      await expect(gateway.createCheckout(input)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('rejects responses without an https checkout url', async () => {
      fetchMock.mockResolvedValue(
        reply(201, { id: 'ch_1', checkout_url: 'http://insecure.example' }),
      );

      await expect(gateway.createCheckout(input)).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });

    it('maps provider errors and network failures to 502', async () => {
      fetchMock.mockResolvedValueOnce(reply(422, { error: 'invalid' }));
      await expect(gateway.createCheckout(input)).rejects.toBeInstanceOf(
        BadGatewayException,
      );

      fetchMock.mockRejectedValueOnce(new Error('network down'));
      await expect(gateway.createCheckout(input)).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });

    it('fails with 503 when the key is missing', async () => {
      delete env.RECURRENTE_SECRET_KEY;

      await expect(gateway.createCheckout(input)).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('never exposes the secret key in errors or logs', async () => {
      fetchMock.mockResolvedValue(reply(500, { error: 'boom' }));

      const error: unknown = await gateway
        .createCheckout(input)
        .catch((caught: unknown) => caught);

      expect(JSON.stringify(error)).not.toContain(secretKey);
      expect(String((error as Error).message)).not.toContain(secretKey);
      expect(loggedText.join(' ')).not.toContain(secretKey);
    });
  });

  describe('getCheckout', () => {
    it('reads status, total, currency and live mode', async () => {
      fetchMock.mockResolvedValue(
        reply(200, {
          id: 'ch_1',
          status: 'paid',
          total_in_cents: 112000,
          currency: 'GTQ',
          live_mode: false,
        }),
      );

      await expect(gateway.getCheckout('ch_1')).resolves.toEqual({
        id: 'ch_1',
        status: 'paid',
        totalInCents: 112000,
        currency: 'GTQ',
        liveMode: false,
      });
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe(`${RECURRENTE_API_URL}/checkouts/ch_1`);
      expect(init.headers).toMatchObject({ 'X-SECRET-KEY': secretKey });
    });

    it('returns null fields when Recurrente omits them or sends unknown status', async () => {
      fetchMock.mockResolvedValue(reply(200, { id: 'ch_1', status: 'weird' }));

      await expect(gateway.getCheckout('ch_1')).resolves.toEqual({
        id: 'ch_1',
        status: null,
        totalInCents: null,
        currency: null,
        liveMode: null,
      });
    });

    it('maps provider errors to 502', async () => {
      fetchMock.mockResolvedValue(reply(404, {}));

      await expect(gateway.getCheckout('ch_1')).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });
  });
});
