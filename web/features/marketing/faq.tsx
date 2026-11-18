import { ChevronDown } from 'lucide-react';

// Preguntas frecuentes con <details>/<summary> nativo: accesible y sin JS.

export interface FaqItem {
  question: string;
  answer: string;
}

export const LANDING_FAQ: FaqItem[] = [
  {
    question: '¿Necesito tarjeta de crédito para empezar?',
    answer:
      'No. El plan Gratis no pide tarjeta: creas tu cuenta, registras tus primeros leads y generas cotizaciones en PDF desde el primer día.',
  },
  {
    question: '¿Cómo funciona la integración con WhatsApp?',
    answer:
      'FlowCommerce se conecta a la API oficial de WhatsApp Business (Cloud API). Los mensajes de tus clientes llegan a Conversaciones, quedan ligados al lead y puedes responder desde el CRM sin usar tu teléfono personal.',
  },
  {
    question: '¿La IA envía mensajes o cotizaciones por su cuenta?',
    answer:
      'Nunca. La IA (Google Gemini) prepara borradores de cotizaciones, sugiere respuestas y resume al lead, pero nada sale hacia el cliente sin que una persona lo revise y lo apruebe. La IA propone; tú apruebas.',
  },
  {
    question: '¿De dónde saca la IA los precios de una cotización?',
    answer:
      'De tu catálogo de productos y servicios. La IA solo puede usar los productos y precios que tú registraste, así evitamos montos inventados.',
  },
  {
    question: '¿Puedo manejar varias empresas o marcas?',
    answer:
      'Sí. Con el plan Empresa cada negocio es un proyecto separado, con su propio equipo, catálogo, roles (propietario, administrador, asesor, solo lectura) y datos aislados.',
  },
  {
    question: '¿Puedo cambiar de plan o cancelar?',
    answer:
      'Cuando quieras. Puedes subir o bajar de plan y el cambio se refleja en tu siguiente factura. Si pagas anual ahorras un 20 %.',
  },
  {
    question: '¿Mis datos están seguros?',
    answer:
      'Usamos autenticación de Supabase, conexiones cifradas (HTTPS) y cada consulta se filtra por proyecto y permisos, de modo que un usuario solo ve los datos de las empresas a las que pertenece.',
  },
];

export const PRICING_FAQ: FaqItem[] = [
  LANDING_FAQ[0]!,
  LANDING_FAQ[5]!,
  {
    question: '¿Cómo se cobra el plan Pro?',
    answer:
      'Por usuario activo al mes. Si tu equipo tiene 3 asesores, pagas 3 licencias. Con el pago anual cada licencia sale 20 % más barata.',
  },
  {
    question: '¿Qué pasa si necesito más de 10 usuarios en Empresa?',
    answer:
      'Escríbenos a hola@flowcommerce.gt y armamos un plan a la medida de tu equipo.',
  },
];

export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-white">
      {items.map((item) => (
        <details key={item.question} className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-ink hover:bg-slate-50 sm:px-6 [&::-webkit-details-marker]:hidden">
            {item.question}
            <ChevronDown
              className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <p className="px-5 pb-5 text-sm leading-relaxed text-muted sm:px-6">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
