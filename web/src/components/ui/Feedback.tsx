import type { ReactNode } from 'react'
import { AlertCircle, Inbox, Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-5 animate-spin text-flow-500', className)} />
}

export function PageLoader() {
  return (
    <div className="grid h-64 place-items-center">
      <Spinner className="size-7" />
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-navy-100/70', className)} />
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center px-6 py-14 text-center">
      <span className="mb-3 grid size-12 place-items-center rounded-full bg-flow-50 text-flow-500">
        <Inbox className="size-6" />
      </span>
      <p className="font-display font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-navy-400">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="grid place-items-center px-6 py-14 text-center">
      <span className="mb-3 grid size-12 place-items-center rounded-full bg-red-50 text-red-500">
        <AlertCircle className="size-6" />
      </span>
      <p className="font-display font-semibold">No pudimos cargar la información</p>
      <p className="mt-1 text-sm text-navy-400">{message ?? 'Intenta de nuevo en unos segundos.'}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  )
}
