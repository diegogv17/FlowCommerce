import { Logger } from '@nestjs/common';
import { Permission, QuoteStatus } from '@flowcommerce/types';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '../../../common/exceptions/domain.exceptions';
import { QuoteEntity } from '../../domain/entities/quote.entity';
import type {
  CreateRecurrenteCheckoutRecordInput,
  RecurrenteAvailability,
  RecurrenteCheckoutRecord,
  RecurrenteCheckoutRepository,
  RecurrenteRemoteCheckout,
} from '../../domain/recurrente-checkout';
import type { RecurrenteGateway } from '../ports/recurrente.gateway';
import { ConfirmRecurrentePaymentUseCase } from './confirm-recurrente-payment.use-case';
import { CreateRecurrenteCheckoutUseCase } from './create-recurrente-checkout.use-case';
import { GetRecurrenteAvailabilityUseCase } from './recurrente-availability.use-case';
import { GetRecurrenteCheckoutUseCase } from './get-recurrente-checkout.use-case';

describe('Recurrente sandbox use cases', () => {
  const actorUserId = '11111111-1111-4111-8111-111111111111';
  const projectId = '33333333-3333-4333-8333-333333333333';
  const otherProjectId = '44444444-4444-4444-8444-444444444444';
  const quoteId = '99999999-9999-4999-8999-999999999999';
  const now = new Date('2026-01-01T00:00:00.000Z');

  const buildQuote = (
    status: QuoteStatus,
    total = 1120,
    paymentReference: string | null = null,
  ): QuoteEntity =>
    new QuoteEntity({
      id: quoteId,
      projectId,
      leadId: '77777777-7777-4777-8777-777777777777',
      clientId: null,
      folio: 'COT-000001',
      subtotal: 1000,
      discount: 0,
      adjustment: 0,
      taxPercent: 12,
      tax: 120,
      total,
      status,
      validUntil: null,
      notes: null,
      terms: null,
      createdByUserId: actorUserId,
      approvedAt: now,
      sentAt: now,
      acceptedAt: now,
      rejectedAt: null,
      paidAt: status === QuoteStatus.PAID ? now : null,
      paymentReference,
      creadoEn: now,
      actualizadoEn: now,
    });

  let quoteState: QuoteEntity;
  let records: RecurrenteCheckoutRecord[];
  let remoteCheckouts: Map<string, RecurrenteRemoteCheckout>;
  let availability: RecurrenteAvailability;
  let createdRemoteIds: Map<string, string>;
  let configValues: Record<string, string | undefined>;

  const authorizationService = { assertCan: jest.fn() };
  const lifecycle = { transitioned: jest.fn() };
  const configService = { get: jest.fn((key: string) => configValues[key]) };

  const quoteRepository = {
    findByIdInProject: jest.fn((id: string, project: string) =>
      Promise.resolve(
        id === quoteState.id && project === quoteState.projectId
          ? quoteState
          : null,
      ),
    ),
    transitionStatusInProject: jest.fn(
      (
        id: string,
        project: string,
        input: {
          from: QuoteStatus;
          to: QuoteStatus;
          at: Date;
          paymentReference?: string | null;
        },
      ) => {
        if (
          id !== quoteState.id ||
          project !== quoteState.projectId ||
          quoteState.status !== input.from
        ) {
          return Promise.resolve(null);
        }
        quoteState = buildQuote(
          input.to,
          quoteState.total,
          input.paymentReference ?? null,
        );
        return Promise.resolve(quoteState);
      },
    ),
  };

  const checkoutRepository: RecurrenteCheckoutRepository = {
    findLatestByQuote: jest.fn((id: string, project: string) => {
      const found = records
        .filter(
          (record) => record.quoteId === id && record.projectId === project,
        )
        .sort((left, right) => right.attempt - left.attempt)[0];
      return Promise.resolve(found ?? null);
    }),
    createIfNoActive: jest.fn((input: CreateRecurrenteCheckoutRecordInput) => {
      const hasActive = records.some(
        (record) =>
          record.quoteId === input.quoteId && record.status !== 'EXPIRED',
      );
      const duplicate = records.some(
        (record) =>
          record.checkoutId === input.checkoutId ||
          (record.quoteId === input.quoteId &&
            record.attempt === input.attempt),
      );
      if (hasActive || duplicate) return Promise.resolve(null);
      const record: RecurrenteCheckoutRecord = {
        id: `record-${records.length + 1}`,
        ...input,
        status: 'PENDING',
        paidAt: null,
        createdAt: now,
      };
      records.push(record);
      return Promise.resolve(record);
    }),
    markExpired: jest.fn((id: string) => {
      const record = records.find((item) => item.id === id);
      if (record && record.status === 'PENDING') record.status = 'EXPIRED';
      return Promise.resolve();
    }),
    markPaid: jest.fn((id: string, _project: string, paidAt: Date) => {
      const record = records.find((item) => item.id === id);
      if (record) {
        record.status = 'PAID';
        record.paidAt = paidAt;
      }
      return Promise.resolve();
    }),
  };

  const checkAvailabilityMock = jest.fn(() => Promise.resolve(availability));
  const createCheckoutMock = jest.fn(
    (input: Parameters<RecurrenteGateway['createCheckout']>[0]) => {
      let id = createdRemoteIds.get(input.idempotencyKey);
      if (!id) {
        id = `ch_${createdRemoteIds.size + 1}`;
        createdRemoteIds.set(input.idempotencyKey, id);
        remoteCheckouts.set(id, {
          id,
          status: 'unpaid',
          totalInCents: input.amountInCents,
          currency: input.currency,
          liveMode: false,
        });
      }
      return Promise.resolve({
        id,
        checkoutUrl: `https://checkout.recurrente.com/${id}`,
      });
    },
  );
  const getCheckoutMock = jest.fn((id: string) => {
    const remote = remoteCheckouts.get(id);
    return remote
      ? Promise.resolve(remote)
      : Promise.reject(new Error('unknown checkout'));
  });
  const gateway: RecurrenteGateway = {
    checkAvailability: checkAvailabilityMock,
    createCheckout: createCheckoutMock,
    getCheckout: getCheckoutMock,
  };

  const createUseCase = new CreateRecurrenteCheckoutUseCase(
    configService as never,
    authorizationService as never,
    quoteRepository as never,
    checkoutRepository,
    gateway,
  );
  const confirmUseCase = new ConfirmRecurrentePaymentUseCase(
    authorizationService as never,
    quoteRepository as never,
    checkoutRepository,
    gateway,
    lifecycle as never,
  );
  const availabilityUseCase = new GetRecurrenteAvailabilityUseCase(
    authorizationService as never,
    gateway,
  );
  const getUseCase = new GetRecurrenteCheckoutUseCase(
    authorizationService as never,
    quoteRepository as never,
    checkoutRepository,
  );

  const input = { actorUserId, projectId, quoteId };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    quoteState = buildQuote(QuoteStatus.ACCEPTED);
    records = [];
    remoteCheckouts = new Map();
    createdRemoteIds = new Map();
    availability = { available: true, reason: null };
    configValues = { APP_URL: 'https://app.example.com/' };
    authorizationService.assertCan.mockResolvedValue(undefined);
  });

  describe('GetRecurrenteAvailabilityUseCase', () => {
    it('returns the availability with a clear message when blocked', async () => {
      availability = { available: false, reason: 'MISSING_KEY' };

      const result = await availabilityUseCase.execute({
        actorUserId,
        projectId,
      });

      expect(result.available).toBe(false);
      expect(result.message).toContain('RECURRENTE_SECRET_KEY');
      expect(authorizationService.assertCan).toHaveBeenCalledWith(
        actorUserId,
        Permission.QUOTE_READ,
        projectId,
      );
    });

    it('returns no message when available', async () => {
      const result = await availabilityUseCase.execute({
        actorUserId,
        projectId,
      });

      expect(result).toEqual({ available: true, reason: null, message: null });
    });
  });

  describe('CreateRecurrenteCheckoutUseCase', () => {
    it('creates a GTQ checkout from the stored total in integer cents', async () => {
      const record = await createUseCase.execute(input);

      expect(createCheckoutMock).toHaveBeenCalledWith({
        name: 'Cotización COT-000001',
        amountInCents: 112000,
        currency: 'GTQ',
        idempotencyKey: `flowcommerce-quote-${quoteId}-1`,
        successUrl: `https://app.example.com/cotizaciones/${quoteId}`,
        cancelUrl: `https://app.example.com/cotizaciones/${quoteId}`,
      });
      expect(record).toMatchObject({
        projectId,
        quoteId,
        checkoutId: 'ch_1',
        amountInCents: 112000,
        currency: 'GTQ',
        status: 'PENDING',
        checkoutUrl: 'https://checkout.recurrente.com/ch_1',
      });
    });

    it('rounds fractional totals to whole cents without floating point drift', async () => {
      quoteState = buildQuote(QuoteStatus.ACCEPTED, 1234.56);

      const record = await createUseCase.execute(input);

      expect(record.amountInCents).toBe(123456);
    });

    it('requires QUOTE_APPROVE', async () => {
      await createUseCase.execute(input);

      expect(authorizationService.assertCan).toHaveBeenCalledWith(
        actorUserId,
        Permission.QUOTE_APPROVE,
        projectId,
      );
    });

    it('stops when authorization fails, before any external call', async () => {
      authorizationService.assertCan.mockRejectedValue(
        new ForbiddenException('no'),
      );

      await expect(createUseCase.execute(input)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(checkAvailabilityMock).not.toHaveBeenCalled();
      expect(createCheckoutMock).not.toHaveBeenCalled();
    });

    it('rejects a quote from another project with 404', async () => {
      await expect(
        createUseCase.execute({ ...input, projectId: otherProjectId }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(createCheckoutMock).not.toHaveBeenCalled();
    });

    it.each([QuoteStatus.DRAFT, QuoteStatus.SENT, QuoteStatus.PAID])(
      'rejects a %s quote with 409',
      async (status) => {
        quoteState = buildQuote(status);

        await expect(createUseCase.execute(input)).rejects.toBeInstanceOf(
          ConflictException,
        );
        expect(createCheckoutMock).not.toHaveBeenCalled();
      },
    );

    it('rejects totals below the Recurrente minimum', async () => {
      quoteState = buildQuote(QuoteStatus.ACCEPTED, 4.99);

      await expect(createUseCase.execute(input)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(createCheckoutMock).not.toHaveBeenCalled();
    });

    it.each([
      ['MISSING_KEY', 'RECURRENTE_SECRET_KEY'],
      ['INVALID_KEY', 'rechazó la llave'],
      ['NOT_SANDBOX', 'Sandbox'],
      ['UNREACHABLE', 'comunicar'],
    ] as const)(
      'blocks the flow with a clear message when availability is %s',
      async (reason, fragment) => {
        availability = { available: false, reason };

        const error: unknown = await createUseCase
          .execute(input)
          .catch((caught: unknown) => caught);

        expect(error).toBeInstanceOf(ServiceUnavailableException);
        expect((error as Error).message).toContain(fragment);
        expect(createCheckoutMock).not.toHaveBeenCalled();
        expect(records).toHaveLength(0);
      },
    );

    it('returns the same checkout on repeated clicks', async () => {
      const first = await createUseCase.execute(input);
      const second = await createUseCase.execute(input);

      expect(second).toBe(first);
      expect(createCheckoutMock).toHaveBeenCalledTimes(1);
      expect(records).toHaveLength(1);
    });

    it('keeps a single checkout under simultaneous requests', async () => {
      const results = await Promise.all([
        createUseCase.execute(input),
        createUseCase.execute(input),
        createUseCase.execute(input),
      ]);

      expect(new Set(results.map((record) => record.checkoutId)).size).toBe(1);
      expect(records).toHaveLength(1);
      expect(new Set(createdRemoteIds.values()).size).toBe(1);
    });

    it('creates a new attempt after the previous checkout expired', async () => {
      await createUseCase.execute(input);
      records[0].status = 'EXPIRED';

      const second = await createUseCase.execute(input);

      expect(second.attempt).toBe(2);
      expect(second.checkoutId).toBe('ch_2');
      expect(createCheckoutMock).toHaveBeenLastCalledWith(
        expect.objectContaining({
          idempotencyKey: `flowcommerce-quote-${quoteId}-2`,
        }),
      );
    });
  });

  describe('GetRecurrenteCheckoutUseCase', () => {
    it('returns null when there is no checkout and never calls Recurrente', async () => {
      await expect(getUseCase.execute(input)).resolves.toBeNull();
      expect(getCheckoutMock).not.toHaveBeenCalled();
    });

    it('returns the stored checkout', async () => {
      const created = await createUseCase.execute(input);

      await expect(getUseCase.execute(input)).resolves.toBe(created);
    });

    it('rejects a quote from another project with 404', async () => {
      await expect(
        getUseCase.execute({ ...input, projectId: otherProjectId }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('ConfirmRecurrentePaymentUseCase', () => {
    const markRemote = (changes: Partial<RecurrenteRemoteCheckout>): void => {
      const current = remoteCheckouts.get('ch_1');
      if (!current) throw new Error('checkout missing');
      remoteCheckouts.set('ch_1', { ...current, ...changes });
    };

    it('requires QUOTE_APPROVE', async () => {
      await createUseCase.execute(input);

      await confirmUseCase.execute(input);

      expect(authorizationService.assertCan).toHaveBeenLastCalledWith(
        actorUserId,
        Permission.QUOTE_APPROVE,
        projectId,
      );
    });

    it('returns 404 when the quote has no checkout', async () => {
      await expect(confirmUseCase.execute(input)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(getCheckoutMock).not.toHaveBeenCalled();
    });

    it('keeps the quote ACCEPTED before the payment is confirmed', async () => {
      await createUseCase.execute(input);

      const result = await confirmUseCase.execute(input);

      expect(result.outcome).toBe('PENDING');
      expect(result.transitioned).toBe(false);
      expect(quoteState.status).toBe(QuoteStatus.ACCEPTED);
      expect(quoteRepository.transitionStatusInProject).not.toHaveBeenCalled();
      expect(lifecycle.transitioned).not.toHaveBeenCalled();
    });

    it('keeps the quote ACCEPTED when the attempt was rejected (checkout still unpaid)', async () => {
      await createUseCase.execute(input);
      markRemote({ status: 'unpaid' });

      const result = await confirmUseCase.execute(input);

      expect(result.outcome).toBe('PENDING');
      expect(quoteState.status).toBe(QuoteStatus.ACCEPTED);
      expect(records[0].status).toBe('PENDING');
    });

    it('keeps the quote ACCEPTED while the payment is in progress', async () => {
      await createUseCase.execute(input);
      markRemote({ status: 'payment_in_progress' });

      const result = await confirmUseCase.execute(input);

      expect(result.outcome).toBe('IN_PROGRESS');
      expect(quoteState.status).toBe(QuoteStatus.ACCEPTED);
    });

    it('marks the checkout as expired and keeps the quote ACCEPTED', async () => {
      await createUseCase.execute(input);
      markRemote({ status: 'expired' });

      const result = await confirmUseCase.execute(input);

      expect(result.outcome).toBe('EXPIRED');
      expect(result.checkout.status).toBe('EXPIRED');
      expect(records[0].status).toBe('EXPIRED');
      expect(quoteState.status).toBe(QuoteStatus.ACCEPTED);
    });

    it('moves the quote to PAID with the verified reference when Recurrente confirms', async () => {
      await createUseCase.execute(input);
      markRemote({ status: 'paid' });

      const result = await confirmUseCase.execute(input);

      expect(result.outcome).toBe('PAID');
      expect(result.transitioned).toBe(true);
      expect(quoteRepository.transitionStatusInProject).toHaveBeenCalledWith(
        quoteId,
        projectId,
        expect.objectContaining({
          from: QuoteStatus.ACCEPTED,
          to: QuoteStatus.PAID,
          paymentReference: 'RECURRENTE-ch_1',
        }),
      );
      expect(lifecycle.transitioned).toHaveBeenCalledTimes(1);
      expect(lifecycle.transitioned).toHaveBeenCalledWith(
        expect.objectContaining({ status: QuoteStatus.PAID }),
        QuoteStatus.ACCEPTED,
        actorUserId,
      );
      expect(records[0].status).toBe('PAID');
      expect(records[0].paidAt).not.toBeNull();
    });

    it('does not duplicate the payment when confirmed a second time', async () => {
      await createUseCase.execute(input);
      markRemote({ status: 'paid' });

      const first = await confirmUseCase.execute(input);
      const second = await confirmUseCase.execute(input);

      expect(first.transitioned).toBe(true);
      expect(second.outcome).toBe('PAID');
      expect(second.transitioned).toBe(false);
      expect(quoteRepository.transitionStatusInProject).toHaveBeenCalledTimes(
        1,
      );
      expect(lifecycle.transitioned).toHaveBeenCalledTimes(1);
      expect(records).toHaveLength(1);
    });

    it('registers a single transition under simultaneous confirmations', async () => {
      await createUseCase.execute(input);
      markRemote({ status: 'paid' });

      const results = await Promise.all([
        confirmUseCase.execute(input),
        confirmUseCase.execute(input),
      ]);

      expect(results.filter((result) => result.transitioned)).toHaveLength(1);
      expect(results.every((result) => result.outcome === 'PAID')).toBe(true);
      expect(lifecycle.transitioned).toHaveBeenCalledTimes(1);
      expect(quoteState.status).toBe(QuoteStatus.PAID);
    });

    it('does not mark as paid when the amount differs', async () => {
      await createUseCase.execute(input);
      markRemote({ status: 'paid', totalInCents: 500 });

      await expect(confirmUseCase.execute(input)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(quoteState.status).toBe(QuoteStatus.ACCEPTED);
      expect(lifecycle.transitioned).not.toHaveBeenCalled();
    });

    it('does not mark as paid when the currency differs', async () => {
      await createUseCase.execute(input);
      markRemote({ status: 'paid', currency: 'USD' });

      await expect(confirmUseCase.execute(input)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(quoteState.status).toBe(QuoteStatus.ACCEPTED);
    });

    it('does not mark as paid when the checkout id differs', async () => {
      await createUseCase.execute(input);
      remoteCheckouts.set('ch_1', {
        id: 'ch_other',
        status: 'paid',
        totalInCents: 112000,
        currency: 'GTQ',
        liveMode: false,
      });

      await expect(confirmUseCase.execute(input)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(quoteState.status).toBe(QuoteStatus.ACCEPTED);
    });

    it('does not mark as paid a live-mode checkout', async () => {
      await createUseCase.execute(input);
      markRemote({ status: 'paid', liveMode: true });

      await expect(confirmUseCase.execute(input)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(quoteState.status).toBe(QuoteStatus.ACCEPTED);
    });

    it('rejects a quote from another project with 404', async () => {
      await expect(
        confirmUseCase.execute({ ...input, projectId: otherProjectId }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects a paid checkout when the quote is no longer ACCEPTED or PAID', async () => {
      await createUseCase.execute(input);
      markRemote({ status: 'paid' });
      quoteState = buildQuote(QuoteStatus.SENT);

      await expect(confirmUseCase.execute(input)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(quoteRepository.transitionStatusInProject).not.toHaveBeenCalled();
    });

    it('heals a checkout still PENDING when the quote is already PAID', async () => {
      await createUseCase.execute(input);
      markRemote({ status: 'paid' });
      quoteState = buildQuote(QuoteStatus.PAID, 1120, 'RECURRENTE-ch_1');

      const result = await confirmUseCase.execute(input);

      expect(result.outcome).toBe('PAID');
      expect(result.transitioned).toBe(false);
      expect(records[0].status).toBe('PAID');
      expect(lifecycle.transitioned).not.toHaveBeenCalled();
    });
  });
});
