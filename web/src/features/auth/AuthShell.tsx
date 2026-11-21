import type { ReactNode } from 'react'
import { LineChart, MessagesSquare, Sparkles } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import { Spinner } from '@/components/ui'
import { cn } from '@/lib/cn'

const highlights = [
  { icon: MessagesSquare, text: 'Todas tus conversaciones de ventas en un solo lugar' },
  { icon: Sparkles, text: 'Respuestas sugeridas con IA para cerrar más rápido' },
  { icon: LineChart, text: 'Seguimiento claro de cada lead hasta la venta' },
]

/**
 * Diseño común de las pantallas de cuenta: panel de marca (navy) a la izquierda
 * y el formulario a la derecha. `action` va arriba a la derecha (p. ej. "Salir").
 */
export function AuthShell({ children, action, wide }: { children: ReactNode; action?: ReactNode; wide?: boolean }) {
  return (
    <div className="grid min-h-full lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-navy-900 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -top-32 -right-32 size-[420px] rounded-full bg-flow-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 size-[380px] rounded-full bg-teal-500/15 blur-3xl" />
        <Logo tone="white" height={52} className="relative" />
        <div className="relative max-w-md">
          <h2 className="font-display text-[34px] leading-tight font-semibold">Convierte cada conversación en una venta.</h2>
          <ul className="mt-8 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-[15px] text-white/80">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-white/10">
                  <Icon className="size-4 text-flow-300" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/40">© {new Date().getFullYear()} FlowCommerce</p>
      </section>

      <section className="relative grid place-items-center p-6">
        {action && <div className="absolute top-6 right-6">{action}</div>}
        <div className={cn('w-full', wide ? 'max-w-[440px]' : 'max-w-[400px]')}>
          <Logo height={36} className="mb-10 lg:hidden" />
          {children}
        </div>
      </section>
    </div>
  )
}

export function AuthHeading({ title, subtitle, icon }: { title: ReactNode; subtitle?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="mb-8">
      {icon && <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-flow-50 text-flow-500">{icon}</span>}
      <h1 className="font-display text-[28px] leading-tight font-semibold">{title}</h1>
      {subtitle && <p className="mt-1.5 text-sm text-navy-400">{subtitle}</p>}
    </div>
  )
}

const noticeTone = {
  error: 'bg-red-50 text-red-600',
  warning: 'bg-amber-50 text-amber-700',
  success: 'bg-teal-50 text-teal-700',
  info: 'bg-flow-50 text-flow-700',
}

export function AuthNotice({ tone = 'error', children, className }: { tone?: keyof typeof noticeTone; children: ReactNode; className?: string }) {
  return <p className={cn('rounded-xl px-3.5 py-2.5 text-sm', noticeTone[tone], className)}>{children}</p>
}

/** Clases de botón para <Link> (no se anida un <button> dentro de un <a>). */
export const linkButton = {
  primary:
    'flex h-11 w-full items-center justify-center rounded-full bg-flow-500 px-5 text-sm font-medium text-white shadow-sm shadow-flow-500/20 transition-colors hover:bg-flow-600',
  secondary:
    'flex h-11 w-full items-center justify-center rounded-full border border-navy-100 bg-white px-5 text-sm font-medium text-navy-700 transition-colors hover:bg-navy-50',
}

/** Estado de espera dentro del diseño de cuenta. */
export function AuthLoading({ text }: { text: string }) {
  return (
    <AuthShell>
      <div className="flex items-center gap-3 text-sm text-navy-400">
        <Spinner /> {text}
      </div>
    </AuthShell>
  )
}
