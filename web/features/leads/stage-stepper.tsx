'use client';

import type { LeadStage } from '@flowcommerce/types';
import { cn } from '@/lib/cn';
import { stageInfo } from '@/lib/labels';
import { PIPELINE_STAGES } from './hooks';

/**
 * Stepper de las 6 etapas (Nuevo → Ganado). Cada paso es clicable para mover
 * el lead a esa etapa. Si el lead está en LOST, todos los pasos van en gris.
 */
export function StageStepper({
  stage,
  onChange,
  disabled,
  pending,
}: {
  stage: LeadStage;
  onChange: (stage: LeadStage) => void;
  disabled?: boolean;
  pending?: LeadStage | null;
}) {
  const lost = stage === 'LOST';
  const currentIndex = PIPELINE_STAGES.indexOf(stage);

  return (
    <ol className="flex items-start overflow-x-auto pb-1">
      {PIPELINE_STAGES.map((item, index) => {
        const done = !lost && index < currentIndex;
        const current = !lost && index === currentIndex;
        const label = stageInfo(item).label;
        return (
          <li key={item} className="flex flex-1 items-start last:flex-none">
            <button
              type="button"
              disabled={disabled || current}
              onClick={() => onChange(item)}
              aria-current={current ? 'step' : undefined}
              aria-label={`Mover a ${label}`}
              className="group flex min-w-20 flex-col items-center gap-1.5 disabled:cursor-default"
            >
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  done && 'bg-emerald-600 text-white',
                  current && 'border-2 border-brand-500 bg-white text-brand-600',
                  !done && !current && 'border-2 border-slate-200 bg-white text-slate-400 group-enabled:group-hover:border-brand-500/60',
                  pending === item && 'animate-pulse',
                )}
              >
                {index + 1}
              </span>
              <span
                className={cn(
                  'whitespace-nowrap text-xs',
                  current ? 'font-semibold text-ink' : done ? 'text-ink' : 'text-slate-400',
                )}
              >
                {label}
              </span>
            </button>
            {index < PIPELINE_STAGES.length - 1 ? (
              <span
                aria-hidden
                className={cn('mx-1 mt-4 h-0.5 min-w-6 flex-1 rounded', !lost && index < currentIndex ? 'bg-emerald-600' : 'bg-slate-200')}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
