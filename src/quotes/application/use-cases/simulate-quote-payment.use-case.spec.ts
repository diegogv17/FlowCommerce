import { Permission, QuoteStatus } from '@flowcommerce/types';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '../../../common/exceptions/domain.exceptions';
import { QuoteEntity } from '../../domain/entities/quote.entity';
import { SimulateQuotePaymentUseCase } from './simulate-quote-payment.use-case';

describe('SimulateQuotePaymentUseCase', () => {
  const actorUserId = '11111111-1111-4111-8111-111111111111';
  const projectId = '33333333-3333-4333-8333-333333333333';
  const quoteId = '99999999-9999-4999-8999-999999999999';
  const now = new Date('2026-01-01T00:00:00.000Z');

  const authorizationService = { assertCan: jest.fn() };
  const quoteRepository = {
    findByIdInProject: jest.fn(),
    transitionStatusInProject: jest.fn(),
  };
  const lifecycle = { transitioned: jest.fn() };
  const env: Record<string, string | undefined> = {};
  const configService = { get: jest.fn((key: string) => env[key]) };

  const quote = (status: QuoteStatus): QuoteEntity =>
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
      total: 1120,
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
      creadoEn: now,
      actualizadoEn: now,
    });

  const useCase = new SimulateQuotePaymentUseCase(
    configService as never,
    authorizationService as never,
    quoteRepository as never,
    lifecycle as never,
  );

  const input = {
    actorUserId,
    projectId,
    quoteId,
    brand: 'VISA' as const,
    lastFourDigits: '4242',
    installments: 3 as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    delete env.PAYMENT_SIMULATION_ENABLED;
    delete env.NODE_ENV;
    authorizationService.assertCan.mockResolvedValue(undefined);
    quoteRepository.findByIdInProject.mockResolvedValue(
      quote(QuoteStatus.ACCEPTED),
    );
    quoteRepository.transitionStatusInProject.mockResolvedValue(
      quote(QuoteStatus.PAID),
    );
  });

  it('moves an ACCEPTED quote to PAID with a simulated reference', async () => {
    const result = await useCase.execute(input);

    expect(authorizationService.assertCan).toHaveBeenCalledWith(
      actorUserId,
      Permission.QUOTE_APPROVE,
      projectId,
    );
    expect(quoteRepository.transitionStatusInProject).toHaveBeenCalledWith(
      quoteId,
      projectId,
      expect.objectContaining({
        from: QuoteStatus.ACCEPTED,
        to: QuoteStatus.PAID,
        paymentReference: 'SIMULADO-VISA-4242-3C',
      }),
    );
    expect(lifecycle.transitioned).toHaveBeenCalledWith(
      result,
      QuoteStatus.ACCEPTED,
      actorUserId,
    );
    expect(result.status).toBe(QuoteStatus.PAID);
  });

  it('rejects the simulation when it is disabled', async () => {
    env.NODE_ENV = 'production';

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(quoteRepository.transitionStatusInProject).not.toHaveBeenCalled();
  });

  it('rejects installments with a Mastercard', async () => {
    await expect(
      useCase.execute({ ...input, brand: 'MASTERCARD' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(quoteRepository.transitionStatusInProject).not.toHaveBeenCalled();
  });

  it('accepts a single payment with a Mastercard', async () => {
    await useCase.execute({ ...input, brand: 'MASTERCARD', installments: 1 });

    expect(quoteRepository.transitionStatusInProject).toHaveBeenCalledWith(
      quoteId,
      projectId,
      expect.objectContaining({
        paymentReference: 'SIMULADO-MASTERCARD-4242-1C',
      }),
    );
  });

  it('answers 404 when the quote is not in the project', async () => {
    quoteRepository.findByIdInProject.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it.each([QuoteStatus.SENT, QuoteStatus.PAID, QuoteStatus.DRAFT])(
    'answers 409 when the quote is %s',
    async (status) => {
      quoteRepository.findByIdInProject.mockResolvedValue(quote(status));

      await expect(useCase.execute(input)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(quoteRepository.transitionStatusInProject).not.toHaveBeenCalled();
    },
  );

  it('answers 409 when the status changed concurrently', async () => {
    quoteRepository.transitionStatusInProject.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(lifecycle.transitioned).not.toHaveBeenCalled();
  });

  it('propagates the authorization failure without touching the quote', async () => {
    authorizationService.assertCan.mockRejectedValue(new ForbiddenException());

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(quoteRepository.findByIdInProject).not.toHaveBeenCalled();
  });
});
