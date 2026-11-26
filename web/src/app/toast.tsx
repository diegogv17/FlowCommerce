import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

interface ToastItem {
  id: number
  type: 'success' | 'error'
  text: string
}

interface ToastApi {
  success: (text: string) => void
  error: (text: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)
let counter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const push = useCallback((type: ToastItem['type'], text: string) => {
    const id = ++counter
    setItems((prev) => [...prev, { id, type, text }])
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3500)
  }, [])

  const api = useMemo<ToastApi>(() => ({ success: (t) => push('success', t), error: (t) => push('error', t) }), [push])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed right-5 bottom-5 z-[60] flex flex-col gap-2" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={cn('flex items-center gap-2.5 rounded-xl bg-navy-900 px-4 py-3 text-sm text-white shadow-pop')}>
            {t.type === 'success' ? <CheckCircle2 className="size-4 text-teal-500" /> : <XCircle className="size-4 text-red-400" />}
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}
