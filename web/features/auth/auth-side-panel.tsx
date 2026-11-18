import { Sparkles } from 'lucide-react';

/**
 * Panel oscuro decorativo de las pantallas de acceso (mockup de Login). Solo
 * se ve en escritorio; la tarjeta del asistente es ilustrativa.
 */
export function AuthSidePanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-night text-white lg:flex lg:flex-col lg:justify-end">
      <div aria-hidden className="absolute -right-24 -top-24 h-[22rem] w-[22rem] rounded-full bg-white/5" />
      <div aria-hidden className="absolute -bottom-40 left-0 h-[20rem] w-[20rem] rounded-full bg-white/[0.04]" />

      <div className="relative z-10 mx-auto w-full max-w-md px-10 pb-12 xl:px-0">
        <div className="mb-12 rounded-2xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-200">
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> Asistente IA
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-100">
            «Detecté que <b className="text-white">Constructora Nova</b> respondió tu cotización.
            Preparé un borrador de respuesta y una propuesta actualizada por Q28,900.»
          </p>
          <div className="mt-4 flex gap-2" aria-hidden>
            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-ink">Revisar</span>
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-slate-100">
              Descartar
            </span>
          </div>
        </div>

        <h2 className="font-display text-4xl font-semibold leading-tight">
          Del primer contacto a la venta, sin perder el hilo.
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-slate-400">
          Pipeline, conversaciones y cotizaciones en un solo lugar. La IA propone; tú apruebas.
        </p>
      </div>
    </aside>
  );
}
