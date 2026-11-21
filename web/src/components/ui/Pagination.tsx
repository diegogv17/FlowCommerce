import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

export function Pagination({ page, pageSize, total, onPage, noun = 'registros' }: { page: number; pageSize: number; total: number; onPage: (p: number) => void; noun?: string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const nav = 'grid size-8 place-items-center rounded-full text-navy-500 hover:bg-navy-100 disabled:opacity-40 disabled:hover:bg-transparent'
  return (
    <div className="flex items-center justify-between px-5 py-3.5 text-xs text-navy-400">
      <span>
        Mostrando {from}–{to} de {total} {noun}
      </span>
      <div className="flex items-center gap-1">
        <button className={nav} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Anterior">
          <ChevronLeft className="size-4" />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1)
          .slice(0, 7)
          .map((p) => (
            <button key={p} onClick={() => onPage(p)} className={cn('grid size-8 place-items-center rounded-full font-medium', p === page ? 'bg-flow-500 text-white' : 'text-navy-500 hover:bg-navy-100')}>
              {p}
            </button>
          ))}
        <button className={nav} disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Siguiente">
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
