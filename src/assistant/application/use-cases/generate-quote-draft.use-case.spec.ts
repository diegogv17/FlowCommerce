/* eslint-disable @typescript-eslint/unbound-method -- los mocks de jest se inspeccionan como propiedades */
import { HttpStatus, type HttpException } from '@nestjs/common';
import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '../../../common/exceptions/domain.exceptions';
import {
  GetLeadContextForAiUseCase,
  ListCatalogForAiUseCase,
} from '../../../integrations/application/ai-context.use-case';
import { LeadEntity } from '../../../leads/domain/entities/lead.entity';
import { MessageEntity } from '../../../messages/domain/entities/message.entity';
import { ProductEntity } from '../../../products/domain/entities/product.entity';
import type { AiModelProvider } from '../ports/ai-model.provider';
import { GenerateQuoteDraftUseCase } from './generate-quote-draft.use-case';

describe('GenerateQuoteDraftUseCase', () => {
  const actorUserId = '11111111-1111-4111-8111-111111111111';
  const projectId = '22222222-2222-4222-8222-222222222222';
  const leadId = '33333333-3333-4333-8333-333333333333';
  const licenseId = '44444444-4444-4444-8444-444444444444';
  const trainingId = '55555555-5555-4555-8555-555555555555';
  const now = new Date('2026-11-17T12:00:00Z');

  const lead = new LeadEntity({
    id: leadId,
    projectId,
    name: 'Andrea López',
    email: 'andrea@nova.gt',
    phone: '+50255412288',
    stage: 'NEGOTIATION',
    score: 80,
    company: 'Constructora Nova',
    source: 'REFERRAL',
    estimatedValue: 28900,
    notes: null,
    assignedUserId: actorUserId,
    clientId: null,
    interestProductId: null,
    lastContactAt: now,
    creadoEn: now,
    actualizadoEn: now,
  });
  const product = (id: string, name: string, price: number, max: number) =>
    new ProductEntity(
      id,
      projectId,
      name,
      null,
      null,
      null,
      price,
      max,
      true,
      now,
      now,
    );
  const catalog = [
    product(licenseId, 'Licencia Pro', 1450, 10),
    product(trainingId, 'Capacitación', 2170, 0),
  ];
  const message = new MessageEntity(
    'm1',
    projectId,
    leadId,
    'wamid.1',
    'INBOUND',
    '¿Podrían enviarnos la cotización actualizada?',
    'READ',
    now,
  );

  let authorization: { assertCan: jest.Mock };
  let ai: jest.Mocked<AiModelProvider>;
  let leadRepository: { findByIdInProject: jest.Mock };
  let createQuote: { execute: jest.Mock };
  let getClient: { execute: jest.Mock };
  let listLeads: { execute: jest.Mock };
  let useCase: GenerateQuoteDraftUseCase;

  beforeEach(() => {
    authorization = { assertCan: jest.fn().mockResolvedValue(undefined) };
    ai = {
      isConfigured: jest.fn().mockReturnValue(true),
      generateStructured: jest.fn(),
      streamChat: jest.fn(),
    };
    leadRepository = { findByIdInProject: jest.fn().mockResolvedValue(lead) };
    const messagesRepository = {
      listByLeadInProject: jest
        .fn()
        .mockResolvedValue({ messages: [message], hasMore: false }),
    };
    const quoteRepository = {
      listByProject: jest
        .fn()
        .mockResolvedValue({ quotes: [], total: 0, sumTotal: 0 }),
    };
    const productRepository = {
      listByProject: jest
        .fn()
        .mockResolvedValue({ products: catalog, total: catalog.length }),
    };
    createQuote = {
      execute: jest
        .fn()
        .mockResolvedValue({ id: 'quote-1', folio: 'COT-0028' }),
    };
    getClient = { execute: jest.fn() };
    listLeads = { execute: jest.fn() };

    // Los casos de uso de contexto son los REALES con repositorios mock: así
    // se prueba también que un lead de otro proyecto responde 404.
    useCase = new GenerateQuoteDraftUseCase(
      authorization as never,
      ai,
      new GetLeadContextForAiUseCase(
        authorization as never,
        leadRepository as never,
        messagesRepository as never,
        quoteRepository as never,
      ),
      new ListCatalogForAiUseCase(
        authorization as never,
        productRepository as never,
      ),
      getClient as never,
      listLeads as never,
      createQuote as never,
    );
  });

  const run = (overrides: Partial<{ leadId: string; clientId: string }> = {}) =>
    useCase.execute({
      actorUserId,
      projectId,
      instructions: 'Licencia para 12 usuarios con descuento',
      leadId,
      ...overrides,
    });

  it('responde 503 con mensaje claro si falta la clave de Gemini', async () => {
    ai.isConfigured.mockReturnValue(false);

    const error = (await run().catch((e: unknown) => e)) as HttpException;

    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect(error.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(error.message).toContain('GEMINI_API_KEY');
    expect(ai.generateStructured).not.toHaveBeenCalled();
    expect(createQuote.execute).not.toHaveBeenCalled();
  });

  it('descarta productos inventados, recorta descuentos y crea el borrador con origin AI', async () => {
    ai.generateStructured.mockResolvedValue({
      items: [
        {
          productId: licenseId,
          quantity: 12,
          discountPercent: 25,
          reason: 'Pidió 12 usuarios',
        },
        {
          productId: 'producto-inventado',
          quantity: 1,
          discountPercent: 0,
          reason: 'x',
        },
        {
          productId: trainingId,
          quantity: 2,
          discountPercent: 5,
          reason: 'Capacitación',
        },
      ],
      notes: 'Gracias por su preferencia.',
      summary: 'Licencias + capacitación',
    });

    const result = await run();

    expect(createQuote.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId,
        projectId,
        leadId,
        origin: 'AI',
        notes: 'Gracias por su preferencia.',
        terms: undefined,
        adjustment: 0,
        items: [
          { productId: licenseId, quantity: 12, discountPercent: 10 },
          { productId: trainingId, quantity: 2, discountPercent: 0 },
        ],
      }),
    );
    expect(result).toEqual({
      quoteId: 'quote-1',
      folio: 'COT-0028',
      summary: 'Licencias + capacitación',
      warnings: expect.arrayContaining([
        expect.stringContaining('no está en el catálogo'),
        expect.stringContaining('Licencia Pro'),
        expect.stringContaining('Capacitación'),
      ]) as string[],
    });
    expect(result.warnings).toHaveLength(3);
  });

  it('solo envía al modelo el catálogo activo y sin datos de contacto del lead', async () => {
    ai.generateStructured.mockResolvedValue({
      items: [
        { productId: licenseId, quantity: 1, discountPercent: 0, reason: '' },
      ],
      notes: '',
      summary: '',
    });

    await run();

    const prompt = ai.generateStructured.mock.calls[0][0].prompt;
    expect(prompt).toContain(licenseId);
    expect(prompt).not.toContain('andrea@nova.gt');
    expect(prompt).not.toContain('+50255412288');
  });

  it('responde 404 si el lead es de otro proyecto y no llama a la IA', async () => {
    leadRepository.findByIdInProject.mockResolvedValue(null);

    await expect(run()).rejects.toBeInstanceOf(NotFoundException);
    expect(leadRepository.findByIdInProject).toHaveBeenCalledWith(
      leadId,
      projectId,
    );
    expect(ai.generateStructured).not.toHaveBeenCalled();
    expect(createQuote.execute).not.toHaveBeenCalled();
  });

  it('responde 400 si ninguna partida propuesta existe en el catálogo', async () => {
    ai.generateStructured.mockResolvedValue({
      items: [
        {
          productId: 'otro-tenant',
          quantity: 1,
          discountPercent: 0,
          reason: '',
        },
      ],
      notes: '',
      summary: '',
    });

    await expect(run()).rejects.toBeInstanceOf(BadRequestException);
    expect(createQuote.execute).not.toHaveBeenCalled();
  });

  it('exige un lead o un cliente', async () => {
    await expect(
      useCase.execute({ actorUserId, projectId, instructions: 'x' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('con solo el cliente usa su lead más reciente y 400 si no tiene leads', async () => {
    const clientId = '66666666-6666-4666-8666-666666666666';
    getClient.execute.mockResolvedValue({ id: clientId, name: 'Nova' });
    listLeads.execute.mockResolvedValue({ leads: [], total: 0 });

    await expect(
      useCase.execute({ actorUserId, projectId, instructions: '', clientId }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(listLeads.execute).toHaveBeenCalledWith(
      expect.objectContaining({ projectId, clientId, limit: 1 }),
    );
  });
});
