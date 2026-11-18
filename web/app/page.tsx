import type { Metadata } from 'next';
import {
  ArrowRight,
  Bell,
  Building2,
  Check,
  FileText,
  Lightbulb,
  MessageCircle,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Workflow,
  X,
} from 'lucide-react';
import { Faq, LANDING_FAQ } from '@/features/marketing/faq';
import { PLANS } from '@/features/marketing/plans';
import { Pricing } from '@/features/marketing/pricing';
import { ProductMockup } from '@/features/marketing/product-mockup';
import { SiteFooter, SiteHeader } from '@/features/marketing/site-chrome';
import { TrackedLink } from '@/features/marketing/tracked-link';
import { SITE_URL } from '@/lib/site';

// Landing pública (Server Component). El único JS del cliente son los enlaces
// con evento de GA4 (TrackedLink) y el conmutador de precios.

const TITLE = 'FlowCommerce — CRM de ventas con IA para Guatemala';
const DESCRIPTION =
  'Leads, conversaciones de WhatsApp y cotizaciones con PDF en un solo lugar. Un asistente con IA (Gemini) prepara el trabajo; tú apruebas. Planes desde Q0.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  keywords: ['CRM', 'CRM Guatemala', 'CRM con IA', 'WhatsApp Business', 'cotizaciones', 'pipeline de ventas'],
  openGraph: {
    title: TITLE,
    description: 'Del primer contacto a la venta, sin perder el hilo.',
    url: '/',
    siteName: 'FlowCommerce',
    type: 'website',
    locale: 'es_GT',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: 'Del primer contacto a la venta, sin perder el hilo.',
  },
};

const FEATURES = [
  {
    icon: Workflow,
    title: 'Pipeline de leads',
    text: 'Cada oportunidad en su etapa: nuevo, contactado, cotización, negociación, ganado. Filtra, asigna y no dejes ninguna enfriarse.',
    tone: 'bg-brand-50 text-brand-600',
  },
  {
    icon: MessageCircle,
    title: 'Conversaciones de WhatsApp',
    text: 'Los mensajes de WhatsApp Business llegan al CRM ligados al lead. Respondes desde ahí, con respuestas rápidas y todo el historial.',
    tone: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: FileText,
    title: 'Cotizaciones con PDF y envío',
    text: 'Arma cotizaciones con tu catálogo, descuentos e impuestos; genera el PDF y envíalo por correo o WhatsApp con un clic.',
    tone: 'bg-violet-50 text-violet-600',
  },
  {
    icon: Bell,
    title: 'Seguimientos y notificaciones',
    text: 'Agenda llamadas, visitas y recordatorios. FlowCommerce te avisa lo que vence hoy y lo que se quedó sin respuesta.',
    tone: 'bg-amber-50 text-amber-600',
  },
  {
    icon: TrendingUp,
    title: 'Dashboard comercial',
    text: 'Leads activos, conversión, cotizaciones por estado y pipeline estimado en quetzales, actualizados en tiempo real.',
    tone: 'bg-cyan-50 text-cyan-600',
  },
  {
    icon: Building2,
    title: 'Multi-empresa y roles',
    text: 'Administra varias empresas o marcas con datos aislados. Propietario, administrador, asesor o solo lectura: cada quien ve lo suyo.',
    tone: 'bg-rose-50 text-rose-600',
  },
] as const;

const AI_FEATURES = [
  {
    icon: MessagesSquare,
    title: 'Asistente que consulta tu CRM',
    text: 'Pregúntale “¿qué cotizaciones vencen esta semana?” o “¿qué leads no he contactado?” y responde con tus datos reales.',
  },
  {
    icon: FileText,
    title: 'Cotizaciones preparadas por IA',
    text: 'Describe lo que pidió el cliente y la IA arma el borrador con productos y precios de tu catálogo. Nada de montos inventados.',
  },
  {
    icon: MessageCircle,
    title: 'Sugerencias de respuesta',
    text: 'En cada conversación de WhatsApp te propone una respuesta con el contexto del lead. La editas y la envías.',
  },
  {
    icon: Lightbulb,
    title: 'Insights del lead',
    text: 'Un resumen de quién es, qué ha pedido, en qué etapa está y cuál es la siguiente mejor acción.',
  },
] as const;

const STEPS = [
  {
    title: 'Crea tu empresa',
    text: 'Regístrate gratis, crea tu proyecto e invita a tu equipo con el rol que le corresponde.',
  },
  {
    title: 'Conecta y carga tu catálogo',
    text: 'Vincula tu número de WhatsApp Business y registra tus productos y servicios con sus precios.',
  },
  {
    title: 'Vende con la IA a tu lado',
    text: 'Atiende leads, cotiza en minutos y deja que el asistente te recuerde a quién darle seguimiento.',
  },
] as const;

const PAINS = [
  'Chats de clientes perdidos en el WhatsApp personal de cada asesor',
  'Cotizaciones en Word que nadie sabe si se enviaron',
  'Seguimientos que dependen de la memoria',
  'Un Excel distinto por vendedor y cero visibilidad del pipeline',
] as const;

const GAINS = [
  'Todas las conversaciones ligadas al lead, en un solo lugar',
  'Cotizaciones con PDF, estado y envío registrado',
  'Recordatorios y alertas de lo que vence hoy',
  'Un dashboard con la conversión y el pipeline en quetzales',
] as const;

function jsonLd() {
  const siteUrl = SITE_URL;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'FlowCommerce',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'CRM',
    operatingSystem: 'Web',
    url: siteUrl,
    inLanguage: 'es-GT',
    description: DESCRIPTION,
    offers: PLANS.map((plan) => ({
      '@type': 'Offer',
      name: plan.name,
      price: plan.priceMonthly.toFixed(2),
      priceCurrency: 'GTQ',
      url: `${siteUrl}/precios`,
    })),
    featureList: FEATURES.map((feature) => feature.title).join(', '),
  };
  // Escapar "<" evita que el JSON cierre la etiqueta <script> por accidente.
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd() }} />
      <SiteHeader onLanding />

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-40 right-[-10%] -z-10 h-[32rem] w-[32rem] rounded-full bg-brand-100/70 blur-3xl"
          />
          <div className="mx-auto grid max-w-6xl items-center gap-16 px-4 pb-24 pt-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-20">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                <Sparkles className="h-3.5 w-3.5" aria-hidden /> Nuevo: Asistente IA con Gemini
              </p>
              <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-[3.5rem]">
                Del primer contacto a la venta, <span className="text-brand-500">sin perder el hilo.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
                Pipeline, conversaciones de WhatsApp y cotizaciones en un solo lugar, para equipos de venta de
                Guatemala. La IA propone; tú apruebas.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <TrackedLink
                  href="/registro"
                  ubicacion="hero"
                  etiqueta="Empieza gratis"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-500 px-7 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-colors hover:bg-brand-600"
                >
                  Empieza gratis <ArrowRight className="h-4 w-4" aria-hidden />
                </TrackedLink>
                <TrackedLink
                  href="#precios"
                  ubicacion="hero"
                  etiqueta="Ver precios"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-line bg-white px-7 text-sm font-semibold text-ink transition-colors hover:bg-slate-50"
                >
                  Ver precios
                </TrackedLink>
              </div>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                {['Sin tarjeta de crédito', 'Precios en quetzales', 'Hecho en Guatemala'].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-emerald-500" aria-hidden /> {item}
                  </li>
                ))}
              </ul>
            </div>
            <ProductMockup />
          </div>
        </section>

        {/* PROBLEMA / PROPUESTA DE VALOR */}
        <section aria-labelledby="problema-titulo" className="px-4 sm:px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-night px-6 py-14 text-white sm:px-12 lg:py-20">
            <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5" />
            <div aria-hidden className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-white/5" />
            <div className="relative max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-brand-500">El problema</p>
              <h2 id="problema-titulo" className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
                Tus ventas viven en cinco lugares distintos.
              </h2>
              <p className="mt-4 text-slate-400">
                WhatsApp, Excel, Word, correos y la memoria del asesor. Cuando un cliente pregunta “¿en qué quedamos?”,
                nadie tiene la respuesta completa. FlowCommerce junta todo el hilo de la venta.
              </p>
            </div>
            <div className="relative mt-10 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-sm font-semibold text-slate-300">Sin FlowCommerce</h3>
                <ul className="mt-4 space-y-3">
                  {PAINS.map((pain) => (
                    <li key={pain} className="flex gap-3 text-sm text-slate-300">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" aria-hidden /> {pain}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-brand-500/40 bg-brand-500/10 p-6">
                <h3 className="text-sm font-semibold text-white">Con FlowCommerce</h3>
                <ul className="mt-4 space-y-3">
                  {GAINS.map((gain) => (
                    <li key={gain} className="flex gap-3 text-sm text-slate-100">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden /> {gain}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FUNCIONES */}
        <section id="funciones" aria-labelledby="funciones-titulo" className="scroll-mt-20 py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Funciones"
              id="funciones-titulo"
              title="Todo lo que tu equipo comercial necesita"
              text="Pensado para negocios que venden por WhatsApp y cotizan todos los días."
            />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-card border border-line bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${feature.tone}`}>
                    <feature.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-ink">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* IA */}
        <section id="ia" aria-labelledby="ia-titulo" className="scroll-mt-20 bg-white py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-violet-600">
                <Sparkles className="h-4 w-4" aria-hidden /> Inteligencia artificial con Gemini
              </p>
              <h2 id="ia-titulo" className="mt-3 text-3xl font-bold leading-tight text-ink sm:text-4xl">
                La IA propone; tú apruebas.
              </h2>
              <p className="mt-4 text-muted">
                FlowCommerce usa Google Gemini para adelantar el trabajo repetitivo. Nada se envía a un cliente sin que
                una persona lo revise.
              </p>
              <ul className="mt-8 space-y-6">
                {AI_FEATURES.map((feature) => (
                  <li key={feature.title} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <feature.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <h3 className="font-semibold text-ink">{feature.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted">{feature.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <TrackedLink
                href="/registro?plan=pro"
                ubicacion="ia"
                etiqueta="Probar la IA"
                plan="pro"
                className="mt-10 inline-flex h-11 items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-6 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-100"
              >
                <Sparkles className="h-4 w-4" aria-hidden /> Probar la IA en el plan Pro
              </TrackedLink>
            </div>

            <AiDemo />
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section aria-labelledby="pasos-titulo" className="py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Cómo funciona"
              id="pasos-titulo"
              title="Listo en una tarde"
              text="Sin instalaciones ni consultores: todo funciona en el navegador."
            />
            <ol className="mt-14 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="relative rounded-card border border-line bg-white p-6 shadow-sm">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 font-display text-lg font-bold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* PRECIOS */}
        <section id="precios" aria-labelledby="precios-titulo" className="scroll-mt-20 bg-white py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow="Precios"
              id="precios-titulo"
              title="Empieza gratis, crece cuando quieras"
              text="Planes simples en quetzales. Ahorra 20 % pagando anual."
            />
            <div className="mt-10">
              <Pricing ubicacion="precios" />
            </div>
          </div>
        </section>

        {/* PREGUNTAS FRECUENTES */}
        <section id="preguntas" aria-labelledby="preguntas-titulo" className="scroll-mt-20 py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading eyebrow="Preguntas frecuentes" id="preguntas-titulo" title="¿Tienes dudas?" />
            <div className="mt-10">
              <Faq items={LANDING_FAQ} />
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section aria-labelledby="cta-titulo" className="px-4 pb-24 sm:px-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-night px-6 py-16 text-center text-white sm:px-12">
            <div aria-hidden className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-white/5" />
            <div aria-hidden className="absolute -bottom-36 -left-10 h-80 w-80 rounded-full bg-brand-500/20 blur-2xl" />
            <div className="relative">
              <h2 id="cta-titulo" className="mx-auto max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
                Tu próxima venta empieza con un buen seguimiento.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-400">
                Crea tu cuenta gratis en menos de un minuto. Sin tarjeta, sin compromiso.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <TrackedLink
                  href="/registro?plan=gratis"
                  ubicacion="cta_final"
                  etiqueta="Crear cuenta gratis"
                  plan="gratis"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-500 px-7 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-colors hover:bg-brand-600"
                >
                  Crear cuenta gratis <ArrowRight className="h-4 w-4" aria-hidden />
                </TrackedLink>
                <TrackedLink
                  href="mailto:hola@flowcommerce.gt?subject=Quiero%20una%20demo%20de%20FlowCommerce"
                  ubicacion="cta_final"
                  etiqueta="Hablar con ventas"
                  lead
                  className="inline-flex h-12 items-center justify-center rounded-full bg-white/10 px-7 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                >
                  Hablar con ventas
                </TrackedLink>
              </div>
              <p className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4" aria-hidden /> Tus datos aislados por empresa y protegidos con HTTPS.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  text,
  id,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  id: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-brand-500">{eyebrow}</p>
      <h2 id={id} className="mt-3 text-3xl font-bold leading-tight text-ink sm:text-4xl">
        {title}
      </h2>
      {text ? <p className="mt-4 text-muted">{text}</p> : null}
    </div>
  );
}

/** Maqueta estática del asistente y de una cotización preparada por IA. */
function AiDemo() {
  return (
    <div
      role="img"
      aria-label="Ejemplo: el Asistente IA responde una consulta y prepara una cotización con precios del catálogo para aprobar"
      className="relative"
    >
      <div aria-hidden className="space-y-4 rounded-[1.75rem] bg-canvas p-5 sm:p-7">
        <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-brand-500 px-4 py-3 text-sm text-white shadow-sm">
          Prepara una cotización para Constructora Nova: 3 licencias anuales y la instalación.
        </div>

        <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-line bg-white p-4 text-sm shadow-sm">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-violet-600">
            <Sparkles className="h-3.5 w-3.5" /> Asistente IA
          </p>
          <p className="mt-2 text-ink">Listo. Usé los precios de tu catálogo:</p>
          <div className="mt-3 overflow-hidden rounded-xl border border-line">
            {[
              { item: 'Licencia anual × 3', amount: 'Q21,600' },
              { item: 'Instalación y configuración', amount: 'Q4,500' },
              { item: 'Capacitación (2 h)', amount: 'Q2,800' },
            ].map((row) => (
              <div key={row.item} className="flex justify-between gap-3 border-b border-line px-3 py-2 text-xs last:border-0">
                <span className="text-slate-600">{row.item}</span>
                <span className="font-semibold text-ink">{row.amount}</span>
              </div>
            ))}
            <div className="flex justify-between bg-slate-50 px-3 py-2 text-xs">
              <span className="font-semibold text-ink">Total</span>
              <span className="font-display font-bold text-ink">Q28,900</span>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">Aprobar y enviar</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-ink">Editar</span>
          </div>
        </div>

        <div className="max-w-[80%] rounded-2xl border border-violet-200 bg-violet-50 p-3 text-xs text-violet-800">
          <p className="font-semibold">Insight del lead</p>
          <p className="mt-1">Abrió la última cotización 3 veces. Siguiente acción sugerida: llamar hoy.</p>
        </div>
      </div>
    </div>
  );
}
