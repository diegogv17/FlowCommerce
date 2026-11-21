import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Sparkles } from 'lucide-react'
import { Badge, Button, Card, EmptyState, ErrorState, PageLoader, Pagination, SearchInput, Select } from '@/components/ui'
import { useQuotes, useQuoteSummary } from '@/hooks/queries'
import { cn } from '@/lib/cn'
import { formatDate, money, moneyExact } from '@/lib/format'
import { quoteStatusMeta } from '@/lib/labels'
import { AiQuoteModal } from './AiQuoteModal'

const th = 'px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-navy-300 uppercase'

function Stat({ label, value, tone, mono }: { label: string; value: string | number; tone: string; mono?: boolean }) {
  return (
    <Card className="flex items-center gap-3 px-4 py-3.5">
      <span className={cn('size-2.5 rounded-full', tone)} />
      <div>
        <p className="text-xs text-navy-400">{label}</p>
        <p className={cn('font-display text-xl leading-tight font-semibold', mono && 'num')}>{value}</p>
      </div>
    </Card>
  )
}

export function QuotesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [ai, setAi] = useState(false)
  const summary = useQuoteSummary()

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading, isError, refetch } = useQuotes({ search: debounced, status, page, pageSize: 8 })
  const s = summary.data

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] leading-tight font-semibold">Cotizaciones</h1>
          <p className="mt-1 text-sm text-navy-400">{s ? `${s.totalCount} cotizaciones este trimestre · ${money(s.totalValue)} en valor total` : ' '}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="border-teal-500/40 text-teal-700 hover:bg-teal-50" icon={<Sparkles className="size-4" />} onClick={() => setAi(true)}>Generar con IA</Button>
          <Button icon={<Plus className="size-4" />} onClick={() => navigate('/cotizaciones/nueva')}>Nueva Cotización</Button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Borradores" value={s?.drafts ?? '–'} tone="bg-violet-500" />
        <Stat label="Pendientes" value={s?.pending ?? '–'} tone="bg-amber-500" />
        <Stat label="Enviadas" value={s?.sent ?? '–'} tone="bg-flow-500" />
        <Stat label="Aprobadas" value={s?.approved ?? '–'} tone="bg-teal-500" />
        <Stat label="Valor total" value={s ? money(s.totalValue) : '–'} tone="bg-navy-700" mono />
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2.5 border-b border-navy-100/70 p-4">
          <SearchInput className="w-full sm:w-72" placeholder="Buscar por folio o cliente…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          <Select className="w-auto min-w-40 rounded-full" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            <option value="">Estado</option>
            {Object.entries(quoteStatusMeta).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
          </Select>
        </div>

        {isError ? <ErrorState onRetry={() => refetch()} /> : isLoading || !data ? <PageLoader /> : data.data.length === 0 ? <EmptyState title="Sin cotizaciones" text="Crea tu primera cotización para empezar." /> : (
          <>
            <div className="scroll-thin overflow-x-auto">
              <table className="w-full min-w-[880px] text-[13px]">
                <thead>
                  <tr className="border-b border-navy-100/70">
                    <th className={th}>Número</th><th className={th}>Cliente</th><th className={th}>Fecha</th><th className={`${th} text-right`}>Total</th><th className={th}>Responsable</th><th className={th}>Estado</th><th className={th} />
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-100/60">
                  {data.data.map((q) => (
                    <tr key={q.id} onClick={() => navigate(`/cotizaciones/${q.id}`)} className="cursor-pointer transition-colors hover:bg-navy-50/60">
                      <td className="px-4 py-3.5"><span className="num flex items-center gap-1.5 font-medium text-flow-600">{q.folio}{q.aiGenerated && <Sparkles className="size-3.5 text-teal-500" aria-label="Preparada por IA" />}</span></td>
                      <td className="px-4 py-3.5"><p className="font-semibold">{q.customerName}</p><p className="text-xs text-navy-400">{q.contactName}</p></td>
                      <td className="num px-4 py-3.5 text-navy-500">{formatDate(q.issuedAt)}</td>
                      <td className="num px-4 py-3.5 text-right font-medium">{moneyExact(q.total)}</td>
                      <td className="px-4 py-3.5 text-navy-600">{q.advisorName}</td>
                      <td className="px-4 py-3.5"><Badge tone={q.reviewRequired ? 'amber' : quoteStatusMeta[q.status].tone}>{q.reviewRequired ? 'Pendiente de aprobación' : quoteStatusMeta[q.status].label}</Badge></td>
                      <td className="px-4 py-3.5 text-right"><span className="rounded-full bg-flow-50 px-3.5 py-1.5 text-xs font-medium text-flow-700">Ver PDF</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.meta.page} pageSize={data.meta.pageSize} total={data.meta.total} onPage={setPage} noun="cotizaciones" />
          </>
        )}
      </Card>

      <AiQuoteModal open={ai} onClose={() => setAi(false)} />
    </>
  )
}
