// Planes comerciales de FlowCommerce (precios en quetzales).
// Fuente única de verdad: la usan la landing, /precios y, más adelante,
// el flujo de suscripción. Si cambia un precio, se cambia solo aquí.

export type PlanId = 'gratis' | 'pro' | 'empresa';
export type BillingCycle = 'mensual' | 'anual';

/** Descuento del pago anual (20 %). */
export const ANNUAL_DISCOUNT = 0.2;

export interface PlanLimits {
  /** Usuarios incluidos; null = sin límite (se cobra por usuario). */
  users: number | null;
  /** Leads activos; null = ilimitados. */
  leads: number | null;
  quotesPdf: boolean;
  whatsapp: boolean;
  ai: boolean;
  followUps: boolean;
  multiProject: boolean;
  apiAccess: boolean;
  webhooks: boolean;
  prioritySupport: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  /** Precio de un mes en GTQ (por usuario si perUser). */
  priceMonthly: number;
  /** Precio de un año en GTQ con el descuento aplicado (por usuario si perUser). */
  priceAnnual: number;
  /** true: el precio es por usuario; false: precio fijo por empresa. */
  perUser: boolean;
  limits: PlanLimits;
  /** Viñetas que se muestran en la tarjeta de precios. */
  features: string[];
  cta: string;
  highlighted?: boolean;
}

/** Precio anual = mensual × 12 × (1 − 20 %), redondeado a centavos. */
export function annualPrice(monthly: number): number {
  return Math.round(monthly * 12 * (1 - ANNUAL_DISCOUNT) * 100) / 100;
}

/** Lo que se paga "por mes" según el ciclo (en anual, el equivalente mensual). */
export function monthlyEquivalent(plan: Plan, cycle: BillingCycle): number {
  if (cycle === 'mensual') return plan.priceMonthly;
  return Math.round((plan.priceAnnual / 12) * 100) / 100;
}

/** Ruta de registro con el plan preseleccionado. */
export function signUpHref(id: PlanId, cycle?: BillingCycle): string {
  const params = new URLSearchParams({ plan: id });
  if (cycle === 'anual' && id !== 'gratis') params.set('ciclo', cycle);
  return `/registro?${params.toString()}`;
}

export const PLANS: readonly Plan[] = [
  {
    id: 'gratis',
    name: 'Gratis',
    tagline: 'Para empezar a ordenar tus ventas.',
    priceMonthly: 0,
    priceAnnual: 0,
    perUser: false,
    limits: {
      users: 1,
      leads: 100,
      quotesPdf: true,
      whatsapp: false,
      ai: false,
      followUps: false,
      multiProject: false,
      apiAccess: false,
      webhooks: false,
      prioritySupport: false,
    },
    features: [
      '1 usuario',
      'Hasta 100 leads',
      'Pipeline de ventas',
      'Cotizaciones con PDF',
      'Catálogo de productos y servicios',
    ],
    cta: 'Empieza gratis',
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Para asesores y equipos que venden todos los días.',
    priceMonthly: 249,
    priceAnnual: annualPrice(249),
    perUser: true,
    limits: {
      users: null,
      leads: null,
      quotesPdf: true,
      whatsapp: true,
      ai: true,
      followUps: true,
      multiProject: false,
      apiAccess: false,
      webhooks: false,
      prioritySupport: false,
    },
    features: [
      'Todo lo de Gratis',
      'Leads ilimitados',
      'Conversaciones de WhatsApp',
      'Asistente IA y cotizaciones preparadas por IA',
      'Seguimientos y notificaciones',
      'Envío de cotizaciones por correo y WhatsApp',
    ],
    cta: 'Probar Pro',
    highlighted: true,
  },
  {
    id: 'empresa',
    name: 'Empresa',
    tagline: 'Para empresas con varios equipos o marcas.',
    priceMonthly: 599,
    priceAnnual: annualPrice(599),
    perUser: false,
    limits: {
      users: 10,
      leads: null,
      quotesPdf: true,
      whatsapp: true,
      ai: true,
      followUps: true,
      multiProject: true,
      apiAccess: true,
      webhooks: true,
      prioritySupport: true,
    },
    features: [
      'Todo lo de Pro',
      'Hasta 10 usuarios incluidos',
      'Multi-empresa y roles por proyecto',
      'API e integraciones',
      'Webhooks',
      'Soporte prioritario',
    ],
    cta: 'Elegir Empresa',
  },
];

export function getPlan(id: string | null | undefined): Plan | undefined {
  return PLANS.find((plan) => plan.id === id);
}
