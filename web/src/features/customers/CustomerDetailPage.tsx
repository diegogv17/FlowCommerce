import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FilePlus2 } from 'lucide-react'
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, ErrorState, PageLoader } from '@/components/ui'
import { useCustomer, useCustomerQuotes } from '@/hooks/queries'
import { cn } from '@/lib/cn'
import { formatDate, money, moneyExact, relativeTime } from '@/lib/format'
import { quoteBadge } from '@/features/quotes/status'

const tabs = ['Resumen', 'Cotizaciones', 'Actividad'] as const
type Tab = (typeof tabs)[number]

const label = 'text-[10px] font-semibold tracking-[0.12em] text-navy-300 uppercase'

export function CustomerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('Resumen')
  const { data: c, isLoading, isError, refetch } = useCustomer(id)
  const quotes = useCustomerQuotes(id)

  if (isError) return <Card><ErrorState onRetry={() => refetch()} /></Card>
  if (isLoading || !c) return <PageLoader />

  const since = new Intl.DateTimeFormat('es-GT', { month: 'long', year: 'numeric' }).format(new Date(c.createdAt))
  const info: Array<[string, string, boolean?]> = [
    ['Empresa', c.name],
    ['NIT', c.nit || '—', true],
    ['Contacto', c.contactRole ? `${c.contactName} · ${c.contactRole}` : c.contactName],
    ['Correo', c.email || '—'],
    ['Teléfono', c.phone || '—', true],
    ['Dirección', c.address || '—'],
    ['Responsable', c.ownerName],
    ['Cliente desde', formatDate(c.createdAt), true],
  ]
  const history = [...(quotes.data ?? [])].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))

  return (
    <>
      <button onClick={() => navigate('/clientes')} className="mb-3 flex items-center gap-1.5 text-xs font-medium text-navy-400 hover:text-navy-900"><ArrowLeft className="size-3.5" /> Volver a Clientes</button>

      <Card className="mb-4 p-5">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar name={c.contactName} size={56} className="rounded-2xl! bg-flow-500! text-white!" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-[24px] font-semibold">{c.contactName}</h1>
              <Badge tone={c.status === 'activo' ? 'green' : 'slate'}>{c.status === 'activo' ? 'Cliente activo' : 'Inactivo'}</Badge>
            </div>
            <p className="mt-0.5 text-sm text-navy-400">{c.name} · Cliente desde {since}</p>
          </div>
          <div className="flex gap-8 pr-2">
            <div><p className={label} title="Suma de cotizaciones pagadas">Ventas totales</p><p className="num mt-1 font-display text-xl font-semibold text-teal-600">{money(c.totalSold)}</p></div>
            <div><p className={label}>Cotizaciones</p><p className="mt-1 font-display text-xl font-semibold">{c.quotesCount}</p></div>
            <div><p className={label} title="Ventas ÷ cotizaciones pagadas">Ticket promedio</p><p className="num mt-1 font-display text-xl font-semibold">{money(c.averageTicket)}</p></div>
          </div>
          <Button icon={<FilePlus2 className="size-4" />} onClick={() => navigate(`/cotizaciones/nueva?cliente=${c.id}`)}>Nueva Cotización</Button>
        </div>
      </Card>

      <div className="mb-4 flex gap-1 border-b border-navy-100/70">
        {tabs.map((t) => <button key={t} onClick={() => setTab(t)} className={cn('-mb-px border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors', tab === t ? 'border-flow-500 text-flow-700' : 'border-transparent text-navy-400 hover:text-navy-900')}>{t}</button>)}
      </div>

      {tab === 'Resumen' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="pb-3">
            <CardHeader title="Datos del cliente" />
            <dl className="mt-3 divide-y divide-navy-100/60 px-5">
              {info.map(([k, v, mono]) => <div key={k} className="flex justify-between gap-4 py-2.5 text-[13px]"><dt className="text-navy-400">{k}</dt><dd className={cn('text-right font-medium break-words', mono && 'num')}>{v}</dd></div>)}
            </dl>
          </Card>
          <Card className="pb-3">
            <CardHeader title="Historial comercial" />
            {history.length === 0 ? <EmptyState title="Sin movimientos" /> : (
              <ul className="mt-3 px-5">
                {history.slice(0, 5).map((q) => (
                  <li key={q.id} className="flex gap-3 py-3">
                    <span className={cn('mt-1.5 size-2.5 shrink-0 rounded-full', q.apiStatus === 'ACCEPTED' || q.apiStatus === 'PAID' ? 'bg-teal-500' : q.status === 'rechazada' ? 'bg-red-500' : 'bg-flow-500')} />
                    <div><p className="text-[13px] font-semibold">Cotización {q.folio} · {quoteBadge(q).label.toLowerCase()}</p><p className="num text-xs text-navy-500">{moneyExact(q.total)}</p><p className="mt-0.5 text-[11px] text-navy-300">{relativeTime(q.issuedAt)}</p></div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {tab === 'Cotizaciones' && (
        <Card className="pb-2">
          {quotes.isLoading ? <PageLoader /> : !quotes.data?.length ? <EmptyState title="Sin cotizaciones" text="Aún no hay cotizaciones para este cliente." /> : (
            <ul className="divide-y divide-navy-100/60 px-2 pt-2">
              {quotes.data.map((q) => (
                <li key={q.id}><button onClick={() => navigate(`/cotizaciones/${q.id}`)} className="flex w-full items-center gap-4 rounded-xl px-3 py-3.5 text-left hover:bg-navy-50/60"><span className="num w-20 text-[13px] font-medium text-flow-600">{q.folio}</span><span className="num flex-1 text-xs text-navy-400">{formatDate(q.issuedAt)}</span><Badge tone={quoteBadge(q).tone} dot>{quoteBadge(q).label}</Badge><span className="num w-32 text-right text-[13px] font-medium">{moneyExact(q.total)}</span></button></li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === 'Actividad' && (
        <Card className="pb-3">
          <ul className="px-5 pt-4">
            <li className="flex gap-3 py-3"><span className="mt-1.5 size-2.5 rounded-full bg-flow-500" /><div><p className="text-[13px] font-semibold">Última actividad registrada</p><p className="text-xs text-navy-500">Con {c.ownerName}</p><p className="mt-0.5 text-[11px] text-navy-300">{relativeTime(c.lastActivityAt)}</p></div></li>
            <li className="flex gap-3 py-3"><span className="mt-1.5 size-2.5 rounded-full bg-teal-500" /><div><p className="text-[13px] font-semibold">Cliente creado</p><p className="mt-0.5 text-[11px] text-navy-300">{formatDate(c.createdAt)}</p></div></li>
          </ul>
        </Card>
      )}
    </>
  )
}
