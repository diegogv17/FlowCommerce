'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { TrackedLink } from './tracked-link';
import { ANNUAL_DISCOUNT, PLANS, monthlyEquivalent, signUpHref, type BillingCycle, type Plan } from './plans';
import type { CtaLocation } from './track';

// Tabla de precios reutilizable (landing y /precios). Es Client Component
// solo por el conmutador mensual/anual; el resto es marcado estático.
export function Pricing({ ubicacion = 'precios' }: { ubicacion?: CtaLocation }) {
  const [cycle, setCycle] = useState<BillingCycle>('mensual');

  return (
    <div>
      <div className="flex justify-center">
        <div
          role="radiogroup"
          aria-label="Ciclo de facturación"
          className="inline-flex items-center gap-1 rounded-full border border-line bg-white p-1 shadow-sm"
        >
          <CycleOption active={cycle === 'mensual'} onClick={() => setCycle('mensual')}>
            Mensual
          </CycleOption>
          <CycleOption active={cycle === 'anual'} onClick={() => setCycle('anual')}>
            Anual
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-bold',
                cycle === 'anual' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700',
              )}
            >
              −{Math.round(ANNUAL_DISCOUNT * 100)} %
            </span>
          </CycleOption>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} cycle={cycle} ubicacion={ubicacion} />
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        Precios en quetzales (GTQ), IVA incluido. Cancela cuando quieras. El plan Gratis no requiere tarjeta.
      </p>
    </div>
  );
}

function CycleOption({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors',
        active ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30' : 'text-muted hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}

function PlanCard({ plan, cycle, ubicacion }: { plan: Plan; cycle: BillingCycle; ubicacion: CtaLocation }) {
  const free = plan.priceMonthly === 0;
  const perMonth = monthlyEquivalent(plan, cycle);
  const unit = free ? 'para siempre' : plan.perUser ? '/usuario/mes' : '/mes';

  return (
    <article
      className={cn(
        'relative flex flex-col rounded-card border bg-white p-6 sm:p-8',
        plan.highlighted
          ? 'border-brand-500 shadow-xl shadow-brand-500/15 ring-1 ring-brand-500'
          : 'border-line shadow-sm',
      )}
    >
      {plan.highlighted ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white">
          Más popular
        </span>
      ) : null}

      <h3 className="text-lg font-semibold text-ink">{plan.name}</h3>
      <p className="mt-1 min-h-10 text-sm text-muted">{plan.tagline}</p>

      <p className="mt-6 flex items-baseline gap-1">
        <span className="font-display text-4xl font-bold tracking-tight text-ink">{formatMoney(perMonth)}</span>
        <span className="text-sm text-muted">{unit}</span>
      </p>
      <p className="mt-1 min-h-5 text-xs text-muted">
        {free
          ? 'Sin tarjeta de crédito'
          : cycle === 'anual'
            ? `${formatMoney(plan.priceAnnual)}${plan.perUser ? ' por usuario' : ''} facturado al año`
            : 'Facturado mes a mes'}
      </p>

      <ul className="mt-6 flex-1 space-y-3 text-sm">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2.5 text-ink">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
            {feature}
          </li>
        ))}
      </ul>

      <TrackedLink
        href={signUpHref(plan.id, cycle)}
        ubicacion={ubicacion}
        etiqueta={plan.cta}
        plan={plan.id}
        ciclo={cycle}
        className={cn(
          'mt-8 inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-semibold transition-colors',
          plan.highlighted
            ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30 hover:bg-brand-600'
            : 'border border-line bg-white text-ink hover:bg-slate-50',
        )}
      >
        {plan.cta}
      </TrackedLink>
    </article>
  );
}
