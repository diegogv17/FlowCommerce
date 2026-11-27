import { geminiProviderOptions } from './gemini-ai-model.provider';

describe('geminiProviderOptions', () => {
  it('usa razonamiento "low" por defecto en los modelos Gemini 3', () => {
    expect(geminiProviderOptions('gemini-3.8-flash', undefined)).toEqual({
      google: { thinkingConfig: { thinkingLevel: 'low' } },
    });
  });

  it('respeta GEMINI_THINKING_LEVEL válido (sin importar mayúsculas)', () => {
    expect(geminiProviderOptions('gemini-3-pro', ' Minimal ')).toEqual({
      google: { thinkingConfig: { thinkingLevel: 'minimal' } },
    });
  });

  it('cae a "low" si el nivel no es válido', () => {
    expect(geminiProviderOptions('gemini-3.8-flash', 'rapidisimo')).toEqual({
      google: { thinkingConfig: { thinkingLevel: 'low' } },
    });
  });

  it('con "default" no envía nada (decide Google)', () => {
    expect(
      geminiProviderOptions('gemini-3.8-flash', 'default'),
    ).toBeUndefined();
  });

  it('no envía thinkingLevel a modelos que no son Gemini 3', () => {
    expect(geminiProviderOptions('gemini-2.5-flash', 'low')).toBeUndefined();
  });
});
