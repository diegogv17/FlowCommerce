import { sendGAEvent } from '@next/third-parties/google';
import type { PlanId } from './plans';

// Eventos de Google Analytics 4. Solo se envían si existe NEXT_PUBLIC_GA_ID
// (el layout raíz monta <GoogleAnalytics> con ese mismo ID). Sin ID, en
// desarrollo o en las pruebas, estas funciones no hacen nada.
// Usar SOLO desde Client Components (sendGAEvent usa window.dataLayer).

/** Lugar de la página donde está el botón; aparece como parámetro en GA4. */
export type CtaLocation =
  | 'navbar'
  | 'navbar_movil'
  | 'hero'
  | 'ia'
  | 'como_funciona'
  | 'precios'
  | 'cta_final'
  | 'footer';

type EventParams = Record<string, string | number | boolean>;

function gaEnabled(): boolean {
  return typeof window !== 'undefined' && Boolean(process.env.NEXT_PUBLIC_GA_ID);
}

function send(name: string, params: EventParams = {}): void {
  if (!gaEnabled()) return;
  try {
    sendGAEvent('event', name, params);
  } catch {
    // La analítica nunca debe romper la navegación.
  }
}

/** Clic en un botón de llamada a la acción ("Empieza gratis", "Ver precios"...). */
export function trackCtaClick(ubicacion: CtaLocation, etiqueta?: string): void {
  send('cta_click', { ubicacion, ...(etiqueta ? { etiqueta } : {}) });
}

/** El visitante eligió un plan en la tabla de precios. */
export function trackPlanSelected(plan: PlanId, ciclo?: 'mensual' | 'anual'): void {
  send('select_plan', { plan, ...(ciclo ? { ciclo } : {}) });
}

/**
 * Conversión principal: cuenta creada. Nombre recomendado de GA4 ('sign_up');
 * márcalo como "evento clave" en GA4. Llamarlo cuando el registro termine OK.
 */
export function trackSignUp(method = 'email', plan?: PlanId): void {
  send('sign_up', { method, ...(plan ? { plan } : {}) });
}

/** Interés comercial (p. ej. "Hablar con ventas"). Evento recomendado de GA4. */
export function trackGenerateLead(origen = 'landing'): void {
  send('generate_lead', { origen, currency: 'GTQ', value: 0 });
}
