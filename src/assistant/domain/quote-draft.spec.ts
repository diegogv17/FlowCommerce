import { clampInt, sanitizeDraftItems } from './quote-draft';

describe('sanitizeDraftItems', () => {
  const catalog = [
    { id: 'p1', name: 'Licencia', price: 1000, maxDiscountPercent: 10 },
    { id: 'p2', name: 'Soporte', price: 500, maxDiscountPercent: 0 },
  ];

  it('corrige cantidades y descuentos inválidos', () => {
    const result = sanitizeDraftItems(
      [
        { productId: 'p1', quantity: 0, discountPercent: -5, reason: '' },
        { productId: 'p2', quantity: 1.006, discountPercent: 3, reason: '' },
      ],
      catalog,
      undefined,
    );
    expect(result.items).toEqual([
      { productId: 'p1', quantity: 1, discountPercent: 0 },
      { productId: 'p2', quantity: 1.01, discountPercent: 0 },
    ]);
    expect(result.warnings).toHaveLength(2);
  });

  it('descarta un ajuste comercial desproporcionado', () => {
    const result = sanitizeDraftItems(
      [{ productId: 'p1', quantity: 1, discountPercent: 0, reason: '' }],
      catalog,
      900,
    );
    expect(result.adjustment).toBe(0);
    expect(result.warnings[0]).toContain('ajuste comercial');

    expect(
      sanitizeDraftItems(
        [{ productId: 'p1', quantity: 1, discountPercent: 0, reason: '' }],
        catalog,
        100,
      ).adjustment,
    ).toBe(100);
  });
});

describe('clampInt', () => {
  it('redondea y acota', () => {
    expect(clampInt(55.6, 0, 100)).toBe(56);
    expect(clampInt(-1, 0, 100)).toBe(0);
    expect(clampInt('x', 0, 100)).toBe(0);
  });
});
