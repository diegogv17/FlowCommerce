import { cn } from '@/lib/cn'

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string }> }) {
  return (
    <div className="inline-flex rounded-full bg-navy-100/70 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn('rounded-full px-4 py-1.5 text-xs font-medium transition-colors', value === o.value ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-400 hover:text-navy-700')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
