import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatMoney, formatRelative, initials } from '@/lib/format';

// Intl de Node puede separar el símbolo con espacio normal, U+00A0 o U+202F,
// así que comparamos con expresiones regulares y no con texto exacto.
const SP = '[\\s\\u00a0\\u202f]?';

describe('formatMoney', () => {
  it('formatea quetzales (GTQ) por defecto sin decimales si el monto es entero', () => {
    expect(formatMoney(1500)).toMatch(new RegExp(`^Q${SP}1,500$`));
  });

  it('muestra centavos cuando el monto tiene decimales', () => {
    expect(formatMoney(1234.5)).toMatch(new RegExp(`^Q${SP}1,234\\.50$`));
  });

  it('acepta strings numéricos (los decimales de Postgres llegan como texto)', () => {
    expect(formatMoney('28900')).toMatch(new RegExp(`^Q${SP}28,900$`));
  });

  it('trata null/undefined como cero', () => {
    expect(formatMoney(null)).toMatch(new RegExp(`^Q${SP}0$`));
    expect(formatMoney(undefined)).toMatch(new RegExp(`^Q${SP}0$`));
  });

  it('respeta otra moneda', () => {
    expect(formatMoney(1500, 'USD')).toMatch(/(US\$|USD|\$)[\s  ]?1,500/);
  });

  it('no lanza con un código de moneda inválido (usa el respaldo en Q)', () => {
    expect(formatMoney(10, 'NO-ES-MONEDA')).toMatch(/^Q10$/);
  });
});

describe('formatRelative', () => {
  const NOW = new Date('2026-11-17T15:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const ago = (ms: number) => new Date(NOW.getTime() - ms);

  it('devuelve un guion sin fecha', () => {
    expect(formatRelative(null)).toBe('—');
    expect(formatRelative(undefined)).toBe('—');
  });

  it('dice "ahora" para menos de un minuto', () => {
    expect(formatRelative(ago(20_000))).toBe('ahora');
  });

  it('usa minutos, horas y "ayer"', () => {
    expect(formatRelative(ago(5 * 60_000))).toBe('hace 5 min');
    expect(formatRelative(ago(3 * 3_600_000))).toBe('hace 3 h');
    expect(formatRelative(ago(30 * 3_600_000))).toBe('ayer');
  });

  it('acepta fechas en texto ISO', () => {
    expect(formatRelative(ago(10 * 60_000).toISOString())).toBe('hace 10 min');
  });

  it('muestra día y mes para fechas antiguas', () => {
    const result = formatRelative(ago(10 * 24 * 3_600_000));
    expect(result).toMatch(/nov/i);
    expect(result).not.toMatch(/^hace/);
  });
});

describe('initials', () => {
  it('toma la inicial de las dos primeras palabras en mayúscula', () => {
    expect(initials('mariana ruiz')).toBe('MR');
    expect(initials('Ana María López Pérez')).toBe('AM');
  });

  it('ignora espacios repetidos', () => {
    expect(initials('  Carlos   Pérez ')).toBe('CP');
  });

  it('funciona con un solo nombre', () => {
    expect(initials('Fernando')).toBe('F');
  });

  it('devuelve "?" sin nombre', () => {
    expect(initials(null)).toBe('?');
    expect(initials(undefined)).toBe('?');
    expect(initials('')).toBe('?');
  });
});
