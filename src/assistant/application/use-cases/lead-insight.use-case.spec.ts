/* eslint-disable @typescript-eslint/unbound-method -- los mocks de jest se inspeccionan como propiedades */
import {
  NotFoundException,
  ServiceUnavailableException,
} from '../../../common/exceptions/domain.exceptions';
import { GetLeadContextForAiUseCase } from '../../../integrations/application/ai-context.use-case';
import { LeadEntity } from '../../../leads/domain/entities/lead.entity';
import type { AiModelProvider } from '../ports/ai-model.provider';
import { GetLeadInsightUseCase } from './lead-insight.use-case';

describe('GetLeadInsightUseCase', () => {
  const actorUserId = '11111111-1111-4111-8111-111111111111';
  const projectId = '22222222-2222-4222-8222-222222222222';
  const otherProjectId = '99999999-9999-4999-8999-999999999999';
  const leadId = '33333333-3333-4333-8333-333333333333';
  const now = new Date('2026-11-17T12:00:00Z');
  const lead = new LeadEntity({
    id: leadId,
    projectId,
    name: 'Andrea López',
    email: null,
    phone: null,
    stage: 'PROPOSAL',
    score: 60,
    company: null,
    source: null,
    estimatedValue: null,
    notes: null,
    assignedUserId: null,
    clientId: null,
    interestProductId: null,
    lastContactAt: null,
    creadoEn: now,
    actualizadoEn: now,
  });

  let ai: jest.Mocked<AiModelProvider>;
  let leadRepository: { findByIdInProject: jest.Mock };
  let listFollowUps: { execute: jest.Mock };
  let listActivity: { execute: jest.Mock };
  let useCase: GetLeadInsightUseCase;

  beforeEach(() => {
    const authorization = { assertCan: jest.fn().mockResolvedValue(undefined) };
    ai = {
      isConfigured: jest.fn().mockReturnValue(true),
      generateStructured: jest.fn(),
      streamChat: jest.fn(),
    };
    // Repositorio con ámbito de tenant: solo encuentra el lead en su proyecto.
    leadRepository = {
      findByIdInProject: jest.fn((id: string, project: string) =>
        Promise.resolve(id === leadId && project === projectId ? lead : null),
      ),
    };
    listFollowUps = {
      execute: jest.fn().mockResolvedValue({ followUps: [], total: 0 }),
    };
    listActivity = {
      execute: jest.fn().mockResolvedValue({ events: [], total: 0 }),
    };
    useCase = new GetLeadInsightUseCase(
      ai,
      new GetLeadContextForAiUseCase(
        authorization as never,
        leadRepository as never,
        {
          listByLeadInProject: jest
            .fn()
            .mockResolvedValue({ messages: [], hasMore: false }),
        } as never,
        {
          listByProject: jest
            .fn()
            .mockResolvedValue({ quotes: [], total: 0, sumTotal: 0 }),
        } as never,
      ),
      listFollowUps as never,
      listActivity as never,
    );
  });

  it('responde 503 si la IA no está configurada', async () => {
    ai.isConfigured.mockReturnValue(false);

    await expect(
      useCase.execute({ actorUserId, projectId, leadId }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(leadRepository.findByIdInProject).not.toHaveBeenCalled();
  });

  it('responde 404 para un lead de otro proyecto (cross-tenant) sin llamar a la IA', async () => {
    await expect(
      useCase.execute({ actorUserId, projectId: otherProjectId, leadId }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(ai.generateStructured).not.toHaveBeenCalled();
    expect(listFollowUps.execute).not.toHaveBeenCalled();
  });

  it('acota en código los valores que devuelve el modelo', async () => {
    ai.generateStructured.mockResolvedValue({
      summary: '  Lead interesado  ',
      nextBestAction: 'Enviar cotización actualizada antes del viernes',
      closeProbability: 140.6,
      risks: ['Precio', '', 'Plazo', 'A', 'B', 'C'],
      suggestedFollowUpDays: -3,
    });

    const insight = await useCase.execute({ actorUserId, projectId, leadId });

    expect(insight).toEqual(
      expect.objectContaining({
        summary: 'Lead interesado',
        closeProbability: 100,
        risks: ['Precio', 'Plazo', 'A', 'B'],
        suggestedFollowUpDays: 0,
      }),
    );
    expect(listFollowUps.execute).toHaveBeenCalledWith(
      expect.objectContaining({ projectId, leadId }),
    );
  });
});
