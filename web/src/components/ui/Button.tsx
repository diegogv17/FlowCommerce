import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'bg-flow-500 text-white hover:bg-flow-600 shadow-sm shadow-flow-500/20',
  secondary: 'bg-white text-navy-700 border border-navy-100 hover:bg-navy-50',
  ghost: 'text-navy-500 hover:bg-navy-100/70 hover:text-navy-900',
  danger: 'bg-red-50 text-red-600 hover:bg-red-100',
  success: 'bg-teal-500 text-white hover:bg-teal-600',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
}

export function Button({ variant = 'primary', size = 'md', loading, icon, className, children, disabled, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap transition-colors disabled:opacity-60',
        variants[variant],
        sizes[size],
        className,
      )}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  )
}

export function IconButton({ className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={cn(
        'grid size-9 place-items-center rounded-full text-navy-500 transition-colors hover:bg-navy-100/70 hover:text-navy-900',
        className,
      )}
    >
      {children}
    </button>
  )
}
