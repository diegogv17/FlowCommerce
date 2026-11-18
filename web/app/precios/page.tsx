import type { Metadata } from 'next';
import { Check, Minus } from 'lucide-react';
import { Faq, PRICING_FAQ } from '@/features/marketing/faq';
import { PLANS, type PlanLimits } from '@/features/marketing/plans';
import { Pricing } from '@/features/marketing/pricing';
import { SiteFooter, SiteHeader } from '@/features/marketing/site-chrome';
import { TrackedLink } from '@/features/marketing/tracked-link';

const DESCRIPTION =
  'Planes de FlowCommerce en quetzales: Gratis (Q0), Pro (Q249 por usuario al mes) y Empresa (Q599 al mes hasta 10 usuarios). Ahorra 20 % pagando anual.';

export const metadata: Metadata = {
  title: 'Precios',
  description: DESCRIPTION,
  alternates: { canonical: '/precios' },
  openGraph: {
    title: 'Precios · FlowCommerce',
    description: DESCRIPTION,
    url: '/precios',
    siteName: 'FlowCommerce',
    type: 'website',
    locale: 'es_GT',
    // La imagen la genera app/opengraph-image.tsx; se declara explícita porque
    // un openGraph propio reemplaza al del segmento padre.
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'FlowCommerce' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Precios · FlowCommerce',
    description: DESCRIPTION,
    images: ['/opengraph-image'],
  },
};

// Filas de la tabla comparativa, derivadas de PLANS.limits.
const ROWS: { label: string; value: (limits: PlanLimits) => string | boolean }[] = [
  { label: 'Usuarios', value: (l) => (l.users === null ? 'Por usuario' : l.users === 1 ? '1' : `Hasta ${l.users}`) },
  { label: 'Leads', value: (l) => (l.leads === null ? 'Ilimitados' : `Hasta ${l.leads}`) },
  { label: 'Cotizaciones con PDF', value: (l) => l.quotesPdf },
  { label: 'Conversaciones de WhatsApp', value: (l) => l.whatsapp },
  { label: 'Asistente IA (Gemini)', value: (l) => l.ai },
  { label: 'Seguimientos y notificaciones', value: (l) => l.followUps },
  { label: 'Multi-empresa y roles', value: (l) => l.multiProject },
  { label: 'API e integraciones', value: (l) => l.apiAccess },
  { label: 'Webhooks', value: (l) => l.webhooks },
  { label: 'Soporte prioritario', value: (l) => l.prioritySupport },
];

export default function PreciosPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-brand-500">Precios</p>
              <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
                Un plan para cada etapa de tu negocio
              </h1>
              <p className="mt-4 text-lg text-muted">
                Empieza gratis y pasa a Pro cuando tu equipo necesite WhatsApp e IA. Precios en quetzales.
              </p>
            </div>
            <div className="mt-12">
              <Pricing ubicacion="precios" />
            </div>
          </div>
        </section>

        <section aria-labelledby="comparar-titulo" className="bg-white py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <h2 id="comparar-titulo" className="text-center text-2xl font-bold text-ink sm:text-3xl">
              Compara los planes
            </h2>
            <div className="mt-10 overflow-x-auto rounded-card border border-line">
              <table className="w-full min-w-[560px] text-left text-sm">
                <caption className="sr-only">Comparación de funciones por plan</caption>
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold text-muted">
                      Función
                    </th>
                    {PLANS.map((plan) => (
                      <th key={plan.id} scope="col" className="px-4 py-3 text-center font-semibold text-ink">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {ROWS.map((row) => (
                    <tr key={row.label}>
                      <th scope="row" className="px-4 py-3 font-medium text-ink">
                        {row.label}
                      </th>
                      {PLANS.map((plan) => {
                        const value = row.value(plan.limits);
                        return (
                          <td key={plan.id} className="px-4 py-3 text-center text-ink">
                            {typeof value === 'string' ? (
                              value
                            ) : value ? (
                              <Check className="mx-auto h-4 w-4 text-emerald-500" aria-label="Incluido" />
                            ) : (
                              <Minus className="mx-auto h-4 w-4 text-slate-300" aria-label="No incluido" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section aria-labelledby="faq-precios" className="py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 id="faq-precios" className="text-center text-2xl font-bold text-ink sm:text-3xl">
              Preguntas sobre los planes
            </h2>
            <div className="mt-10">
              <Faq items={PRICING_FAQ} />
            </div>
            <p className="mt-10 text-center text-sm text-muted">
              ¿Necesitas algo a la medida?{' '}
              <TrackedLink
                href="mailto:hola@flowcommerce.gt?subject=Plan%20a%20la%20medida"
                ubicacion="precios"
                etiqueta="Hablar con ventas"
                lead
                className="font-semibold text-brand-600 hover:underline"
              >
                Habla con ventas
              </TrackedLink>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
