import { describe, expect, it } from 'vitest';
import {
  ANNUAL_DISCOUNT,
  PLANS,
  annualPrice,
  getPlan,
  monthlyEquivalent,
  signUpHref,
} from '@/features/marketing/plans';

describe('PLANS', () => {
  it('tiene los tres planes en orden: gratis, pro, empresa', () => {
    expect(PLANS.map((plan) => plan.id)).toEqual(['gratis', 'pro', 'empresa']);
  });

  it('el precio anual es mensual × 12 × 0.8 en todos los planes', () => {
    expect(ANNUAL_DISCOUNT).toBe(0.2);
    for (const plan of PLANS) {
      expect(plan.priceAnnual).toBeCloseTo(plan.priceMonthly * 12 * 0.8, 2);
    }
  });

  it('respeta los precios publicados en quetzales', () => {
    expect(getPlan('gratis')?.priceMonthly).toBe(0);
    expect(getPlan('pro')?.priceMonthly).toBe(249);
    expect(getPlan('pro')?.priceAnnual).toBeCloseTo(2390.4, 2);
    expect(getPlan('empresa')?.priceMonthly).toBe(599);
    expect(getPlan('empresa')?.priceAnnual).toBeCloseTo(5750.4, 2);
  });

  it('los límites coinciden con lo ofrecido', () => {
    expect(getPlan('gratis')?.limits).toMatchObject({ users: 1, leads: 100, quotesPdf: true, ai: false });
    expect(getPlan('pro')?.limits).toMatchObject({ leads: null, whatsapp: true, ai: true, followUps: true });
    expect(getPlan('pro')?.perUser).toBe(true);
    expect(getPlan('empresa')?.limits).toMatchObject({ users: 10, apiAccess: true, webhooks: true });
  });

  it('solo un plan está destacado', () => {
    expect(PLANS.filter((plan) => plan.highlighted)).toHaveLength(1);
  });
});

describe('helpers de precios', () => {
  it('annualPrice redondea a centavos', () => {
    expect(annualPrice(249)).toBe(2390.4);
    expect(annualPrice(0)).toBe(0);
  });

  it('monthlyEquivalent devuelve el precio mensual o el equivalente anual / 12', () => {
    const pro = getPlan('pro')!;
    expect(monthlyEquivalent(pro, 'mensual')).toBe(249);
    expect(monthlyEquivalent(pro, 'anual')).toBeCloseTo(199.2, 2);
  });

  it('signUpHref arma /registro?plan=<id>', () => {
    expect(signUpHref('gratis')).toBe('/registro?plan=gratis');
    expect(signUpHref('pro', 'mensual')).toBe('/registro?plan=pro');
    expect(signUpHref('pro', 'anual')).toBe('/registro?plan=pro&ciclo=anual');
    expect(signUpHref('gratis', 'anual')).toBe('/registro?plan=gratis');
  });

  it('getPlan devuelve undefined con un id desconocido', () => {
    expect(getPlan('platino')).toBeUndefined();
    expect(getPlan(null)).toBeUndefined();
  });
});
