/* eslint-disable @typescript-eslint/unbound-method -- los mocks de jest se inspeccionan como propiedades */
import {
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
} from '../../../common/exceptions/domain.exceptions';
import type { AiModelProvider } from '../ports/ai-model.provider';
import {
  SuggestRepliesUseCase,
  normalizeSuggestions,
} from './suggest-replies.use-case';

describe('SuggestRepliesUseCase', () => {
  const input = {
    actorUserId: '11111111-1111-4111-8111-111111111111',
    projectId: '22222222-2222-4222-8222-222222222222',
    leadId: '33333333-3333-4333-8333-333333333333',
  };

  let authorization: { assertCan: jest.Mock };
  let ai: jest.Mocked<AiModelProvider>;
  let getLeadContext: { execute: jest.Mock };
  let listCatalog: { execute: jest.Mock };
  let useCase: SuggestRepliesUseCase;

  beforeEach(() => {
    authorization = { assertCan: jest.fn().mockResolvedValue(undefined) };
    ai = {
      isConfigured: jest.fn().mockReturnValue(true),
      generateStructured: jest.fn(),
      streamChat: jest.fn(),
    };
    getLeadContext = {
      execute: jest.fn().mockResolvedValue({
        lead: { toLead: jest.fn() },
        messages: [],
        quotes: [],
      }),
    };
    listCatalog = { execute: jest.fn().mockResolvedValue([]) };
    useCase = new SuggestRepliesUseCase(
      authorization as never,
      ai,
      getLeadContext as never,
      listCatalog as never,
    );
  });

  it('exige WHATSAPP_SEND_MESSAGE en el proyecto', async () => {
    authorization.assertCan.mockRejectedValue(new ForbiddenException());

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(authorization.assertCan).toHaveBeenCalledWith(
      input.actorUserId,
      'WHATSAPP_SEND_MESSAGE',
      input.projectId,
    );
    expect(ai.generateStructured).not.toHaveBeenCalled();
  });

  it('responde 503 si la IA no está configurada', async () => {
    ai.isConfigured.mockReturnValue(false);
    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(getLeadContext.execute).not.toHaveBeenCalled();
  });

  it('propaga el 404 de un lead ajeno sin llamar a la IA', async () => {
    getLeadContext.execute.mockRejectedValue(new NotFoundException());
    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(ai.generateStructured).not.toHaveBeenCalled();
  });
});

describe('normalizeSuggestions', () => {
  it('limpia, quita duplicados y deja como máximo 3', () => {
    expect(
      normalizeSuggestions([' Hola ', 'hola', '', 'Dos', 'Tres', 'Cuatro', 5]),
    ).toEqual(['Hola', 'Dos', 'Tres']);
    expect(normalizeSuggestions('no es arreglo')).toEqual([]);
  });
});
