import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { Tone } from '@/lib/labels'

const tones: Record<Tone, string> = {
  blue: 'bg-flow-50 text-flow-700',
  green: 'bg-teal-50 text-teal-700',
  amber: 'bg-amber-50 text-amber-700',
  orange: 'bg-orange-50 text-orange-700',
  violet: 'bg-violet-50 text-violet-700',
  cyan: 'bg-cyan-50 text-cyan-700',
  red: 'bg-red-50 text-red-600',
  slate: 'bg-navy-100 text-navy-600',
}

const dots: Record<Tone, string> = {
  blue: 'bg-flow-500',
  green: 'bg-teal-500',
  amber: 'bg-amber-500',
  orange: 'bg-orange-500',
  violet: 'bg-violet-500',
  cyan: 'bg-cyan-500',
  red: 'bg-red-500',
  slate: 'bg-navy-400',
}

export function Badge({ tone = 'slate', dot, children, className }: { tone?: Tone; dot?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', tones[tone], className)}>
      {dot && <span className={cn('size-1.5 rounded-full', dots[tone])} />}
      {children}
    </span>
  )
}

export const toneDot = dots
export const toneSoft = tones
