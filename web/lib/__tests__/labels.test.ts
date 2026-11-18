import { describe, expect, it } from 'vitest';
import { LEAD_STAGES, QUOTE_STATUSES, quoteStatusInfo, sourceLabel, stageInfo } from '@/lib/labels';

describe('stageInfo', () => {
  it('traduce las etapas conocidas', () => {
    expect(stageInfo('NEW').label).toBe('Nuevo');
    expect(stageInfo('WON').label).toBe('Ganado');
    expect(stageInfo('LOST').color).toContain('rose');
  });

  it('con una etapa desconocida devuelve el valor tal cual y colores neutros', () => {
    const info = stageInfo('ETAPA_NUEVA');
    expect(info.label).toBe('ETAPA_NUEVA');
    expect(info.value).toBe('ETAPA_NUEVA');
    expect(info.color).toContain('slate');
    expect(info.bar).toContain('slate');
  });

  it('cada etapa tiene etiqueta y colores', () => {
    for (const stage of LEAD_STAGES) {
      expect(stage.label.length).toBeGreaterThan(0);
      expect(stage.color).toMatch(/bg-/);
      expect(stage.bar).toMatch(/bg-/);
    }
  });
});

describe('quoteStatusInfo', () => {
  it('traduce los estados conocidos', () => {
    expect(quoteStatusInfo('DRAFT').label).toBe('Borrador');
    expect(quoteStatusInfo('SENT').label).toBe('Enviada');
    expect(quoteStatusInfo('PAID').chart).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('con un estado desconocido devuelve el valor y un color gris', () => {
    const info = quoteStatusInfo('ARCHIVADA');
    expect(info.label).toBe('ARCHIVADA');
    expect(info.color).toContain('slate');
    expect(info.chart).toBe('#94a3b8');
  });

  it('los valores de estado no se repiten', () => {
    const values = QUOTE_STATUSES.map((status) => status.value);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('sourceLabel', () => {
  it('traduce la fuente y cae al valor original o a un guion', () => {
    expect(sourceLabel('WHATSAPP')).toBe('WhatsApp');
    expect(sourceLabel('TIKTOK')).toBe('TIKTOK');
    expect(sourceLabel(null)).toBe('—');
  });
});
