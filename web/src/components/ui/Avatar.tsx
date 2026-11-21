import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'

const palette = ['bg-flow-50 text-flow-700', 'bg-teal-50 text-teal-700', 'bg-violet-50 text-violet-700', 'bg-amber-50 text-amber-700', 'bg-cyan-50 text-cyan-700', 'bg-orange-50 text-orange-700']

function hash(s: string) {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

export function Avatar({ name, size = 36, className, dark }: { name: string; size?: number; className?: string; dark?: boolean }) {
  return (
    <span
      className={cn(
        'inline-grid shrink-0 place-items-center rounded-full font-display font-semibold',
        dark ? 'bg-navy-900 text-white' : palette[hash(name) % palette.length],
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.34) }}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}
