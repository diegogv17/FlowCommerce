import { Bell, FileText, LayoutDashboard, MessageCircle, Sparkles, Users } from 'lucide-react';

// Maqueta del producto hecha con HTML/Tailwind (sin imágenes): pesa casi nada
// y no afecta el LCP. Reproduce el dashboard y la burbuja del Asistente IA.

const STATS = [
  { label: 'Leads activos', value: '24', delta: '+12%', icon: Users, tone: 'bg-brand-500' },
  { label: 'Cotizaciones', value: '18', delta: '+8%', icon: FileText, tone: 'bg-violet-500' },
  { label: 'Conversión', value: '31.4%', delta: '+4.2 pts', icon: LayoutDashboard, tone: 'bg-cyan-500' },
  { label: 'Pipeline', value: 'Q144,850', delta: '+18%', icon: Sparkles, tone: 'bg-orange-500' },
] as const;

const STAGES = [
  { label: 'Nuevo', width: 'w-[60%]', bar: 'bg-cyan-500' },
  { label: 'Contactado', width: 'w-[48%]', bar: 'bg-blue-500' },
  { label: 'Cotización', width: 'w-[50%]', bar: 'bg-amber-500' },
  { label: 'Ganado', width: 'w-[70%]', bar: 'bg-emerald-500' },
] as const;

const BARS = ['h-[40%]', 'h-[50%]', 'h-[45%]', 'h-[62%]', 'h-[56%]', 'h-[75%]', 'h-[70%]', 'h-[92%]'] as const;

export function ProductMockup() {
  return (
    <div
      role="img"
      aria-label="Vista previa del panel de FlowCommerce con indicadores de ventas y una sugerencia del Asistente IA"
      className="relative"
    >
      {/* Brillo de fondo */}
      <div aria-hidden className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand-500/20 via-cyan-400/10 to-emerald-400/20 blur-2xl" />

      <div aria-hidden className="overflow-hidden rounded-2xl border border-line bg-canvas shadow-2xl shadow-slate-900/10">
        {/* Barra del navegador */}
        <div className="flex items-center gap-2 border-b border-line bg-white px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 truncate rounded-full bg-canvas px-3 py-0.5 text-[11px] text-muted">
            app.flowcommerce.gt/dashboard
          </span>
        </div>

        <div className="flex">
          {/* Menú lateral */}
          <div className="hidden w-36 shrink-0 flex-col gap-1 border-r border-line bg-white p-3 sm:flex">
            {[
              { label: 'Dashboard', icon: LayoutDashboard, active: true },
              { label: 'Leads', icon: Users, badge: '24' },
              { label: 'Conversaciones', icon: MessageCircle, badge: '3' },
              { label: 'Cotizaciones', icon: FileText },
              { label: 'Alertas', icon: Bell },
            ].map((item) => (
              <span
                key={item.label}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-medium ${
                  item.active ? 'bg-brand-500 text-white' : 'text-slate-600'
                }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge ? (
                  <span className="rounded-full bg-emerald-500 px-1.5 text-[9px] font-bold text-white">{item.badge}</span>
                ) : null}
              </span>
            ))}
          </div>

          {/* Contenido */}
          <div className="min-w-0 flex-1 p-4">
            <p className="font-display text-base font-semibold text-ink">Buenos días, Mariana</p>
            <p className="text-[11px] text-muted">Aquí tienes el resumen de tu actividad comercial.</p>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {STATS.map((stat) => (
                <div key={stat.label} className="rounded-xl bg-white p-2.5 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-md text-white ${stat.tone}`}>
                      <stat.icon className="h-3 w-3" />
                    </span>
                    <span className="truncate text-[10px] font-medium text-slate-600">{stat.label}</span>
                  </div>
                  <p className="mt-1.5 font-display text-lg font-bold leading-none text-ink">{stat.value}</p>
                  <p className="mt-1 text-[9px] text-muted">
                    <span className="font-semibold text-emerald-600">{stat.delta}</span> vs mes anterior
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              <div className="rounded-xl bg-white p-2.5 shadow-sm">
                <p className="text-[10px] font-semibold text-ink">Leads por estado</p>
                <div className="mt-2 space-y-1.5">
                  {STAGES.map((stage) => (
                    <div key={stage.label} className="flex items-center gap-2">
                      <span className="w-14 truncate text-[9px] text-slate-500">{stage.label}</span>
                      <span className="h-1.5 flex-1 rounded-full bg-slate-100">
                        <span className={`block h-full rounded-full ${stage.width} ${stage.bar}`} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col rounded-xl bg-white p-2.5 shadow-sm">
                <p className="text-[10px] font-semibold text-ink">Conversión mensual</p>
                <div className="mt-2 flex h-14 flex-1 items-end gap-1">
                  {BARS.map((height, index) => (
                    <span
                      key={index}
                      className={`flex-1 rounded-t ${height} ${index === BARS.length - 1 ? 'bg-emerald-500' : 'bg-brand-500'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Burbuja del Asistente IA (como en el login) */}
      <div
        aria-hidden
        className="absolute -bottom-10 left-4 right-4 rounded-2xl border border-white/10 bg-night/95 p-4 text-sm text-slate-200 shadow-2xl sm:-left-8 sm:right-auto sm:w-80"
      >
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300">
          <Sparkles className="h-3.5 w-3.5 text-violet-300" /> Asistente IA
        </p>
        <p className="mt-2 text-[13px] leading-relaxed">
          «Detecté que <strong className="text-white">Constructora Nova</strong> respondió tu cotización. Preparé un
          borrador de respuesta y una propuesta actualizada por Q28,900.»
        </p>
        <div className="mt-3 flex gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink">Revisar</span>
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">Descartar</span>
        </div>
      </div>

      {/* Chip de WhatsApp */}
      <div
        aria-hidden
        className="absolute -right-3 -top-4 hidden items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-lg sm:flex"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
          <MessageCircle className="h-3 w-3" />
        </span>
        Nuevo mensaje de WhatsApp
      </div>
    </div>
  );
}
