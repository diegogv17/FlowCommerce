import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Download, Send, Sparkles, X } from 'lucide-react'
import { Badge, Button, Card, ErrorState, PageLoader } from '@/components/ui'
import { Logo } from '@/components/layout/Logo'
import { useToast } from '@/app/toast'
import { useQuote, useUpdateQuoteStatus } from '@/hooks/queries'
import { decimal, formatDate, moneyExact } from '@/lib/format'
import { quoteStatusMeta } from '@/lib/labels'
import { IVA_RATE, ivaBreakdown } from '@/lib/tax'
import type { QuoteStatus } from '@/types/domain'

const label = 'text-[10px] font-semibold tracking-[0.12em] text-navy-300 uppercase'

export function QuoteDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { data: q, isLoading, isError, refetch } = useQuote(id)
  const update = useUpdateQuoteStatus()

  if (isError) return <Card><ErrorState onRetry={() => refetch()} /></Card>
  if (isLoading || !q) return <PageLoader />

  const change = (status: QuoteStatus, msg: string) =>
    update.mutate({ id: q.id, status }, { onSuccess: () => toast.success(msg), onError: (e) => toast.error(e.message) })

  const meta = quoteStatusMeta[q.status]
  const { base, iva, total } = ivaBreakdown(q.subtotal, q.discount)
  const side: Array<[string, string, boolean?]> = [
    ['Cliente', q.customerName],
    ['Contacto', q.contactName],
    ['Fecha', formatDate(q.issuedAt), true],
    ['Vence', formatDate(q.validUntil), true],
    ['Total', moneyExact(q.total), true],
    ['Responsable', q.advisorName],
  ]

  return (
    <>
      <div className="no-print">
        <button onClick={() => navigate('/cotizaciones')} className="mb-3 flex items-center gap-1.5 text-xs font-medium text-navy-400 hover:text-navy-900"><ArrowLeft className="size-3.5" /> Volver a Cotizaciones</button>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[26px] font-semibold">Cotización <span className="num">{q.folio}</span></h1>
          <Badge tone={meta.tone} dot>{meta.label}</Badge>
        </div>

        {q.aiGenerated && (
          <div className="mb-5 flex flex-wrap items-center gap-4 rounded-2xl border border-teal-500/25 bg-teal-50 px-5 py-4">
            <span className="grid size-10 place-items-center rounded-full bg-white text-teal-600"><Sparkles className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[14px] font-semibold text-teal-700">Cotización preparada por IA</p>
              <p className="text-[13px] text-teal-700/80">Revisa los conceptos, precios y condiciones antes de enviarla al cliente.</p>
            </div>
            {q.reviewRequired ? <Badge tone="amber">Revisión pendiente de aprobación</Badge> : <Badge tone="green">Revisada</Badge>}
          </div>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Card className="mx-auto w-full max-w-[860px] p-8 sm:p-12 print:max-w-none print:border-0 print:shadow-none">
          <div className="flex items-start justify-between">
            <Logo height={34} />
            <div className="text-right">
              <p className="font-display text-xl font-semibold tracking-wide">COTIZACIÓN</p>
              <p className="num text-sm text-navy-400">{q.folio}</p>
            </div>
          </div>
          <div className="my-8 h-px bg-gradient-to-r from-flow-500 via-flow-200 to-teal-500" />

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div><p className={label}>Fecha de emisión</p><p className="num mt-1 text-[13px]">{formatDate(q.issuedAt)}</p></div>
            <div><p className={label}>Válida hasta</p><p className="num mt-1 text-[13px]">{formatDate(q.validUntil)}</p></div>
            <div><p className={label}>Moneda</p><p className="mt-1 text-[13px]">Quetzales (GTQ)</p></div>
            <div><p className={label}>Asesor</p><p className="mt-1 text-[13px]">{q.advisorName}</p></div>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div><p className={label}>Cliente</p><p className="mt-1 text-[13px] font-semibold">{q.customerName}</p></div>
            <div><p className={label}>Contacto</p><p className="mt-1 text-[13px] font-semibold">{q.contactName}</p></div>
          </div>

          <table className="mt-8 w-full text-[13px]">
            <thead>
              <tr className="border-b border-navy-100 text-left"><th className={`${label} py-3`}>Descripción</th><th className={`${label} py-3 text-right`}>Cant.</th><th className={`${label} py-3 text-right`}>Precio unit.</th><th className={`${label} py-3 text-right`}>Importe</th></tr>
            </thead>
            <tbody className="divide-y divide-navy-100/60">
              {q.items.map((it) => (
                <tr key={it.id}><td className="py-3.5 pr-4">{it.description}</td><td className="num py-3.5 text-right">{it.quantity}</td><td className="num py-3.5 text-right">{decimal(it.unitPrice)}</td><td className="num py-3.5 text-right font-medium">{decimal(it.amount)}</td></tr>
              ))}
            </tbody>
          </table>

          <div className="mt-8 grid gap-8 sm:grid-cols-[1fr_280px]">
            <div className="space-y-5">
              {q.notes && <div><p className={label}>Notas</p><p className="mt-2 text-[13px] leading-relaxed text-navy-500">{q.notes}</p></div>}
              <div><p className={label}>Condiciones</p><p className="mt-2 text-[13px] leading-relaxed whitespace-pre-line text-navy-500">{q.conditions}</p></div>
            </div>
            <dl className="space-y-2.5 text-[13px]">
              <div className="flex justify-between"><dt className="text-navy-400">Subtotal</dt><dd className="num">{moneyExact(base)}</dd></div>
              <div className="flex justify-between"><dt className="text-navy-400">Descuento</dt><dd className="num">{moneyExact(q.discount)}</dd></div>
              <div className="flex justify-between"><dt className="text-navy-400">IVA ({IVA_RATE * 100}%)</dt><dd className="num">{moneyExact(iva)}</dd></div>
              <div className="flex items-baseline justify-between rounded-xl bg-flow-50 px-4 py-3"><dt className="font-semibold">Total</dt><dd className="num text-lg font-semibold text-flow-700">{moneyExact(total)}</dd></div>
            </dl>
          </div>

          <div className="mt-12 flex items-end justify-between border-t border-navy-100 pt-5 text-xs text-navy-400">
            <div><p className="font-semibold text-navy-700">{q.advisorName}</p><p>Asesor comercial · FlowCommerce</p></div>
            <p className="num text-right">+502 2200 0000<br />ventas@flowcommerce.com</p>
          </div>
        </Card>

        <aside className="no-print space-y-4 xl:sticky xl:top-0 xl:self-start">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between"><span className="num font-display font-semibold">{q.folio}</span><Badge tone={meta.tone} dot>{meta.label}</Badge></div>
            <dl className="divide-y divide-navy-100/60 text-[13px]">
              {side.map(([k, v, mono]) => <div key={k} className="flex justify-between gap-3 py-2.5"><dt className="text-navy-400">{k}</dt><dd className={`text-right font-medium ${mono ? 'num' : ''}`}>{v}</dd></div>)}
            </dl>
          </Card>
          <Card className="space-y-2 p-5">
            {q.reviewRequired && <Button variant="success" className="w-full" icon={<Check className="size-4" />} loading={update.isPending} onClick={() => change('pendiente', 'Cotización aprobada para envío')}>Aprobar cotización</Button>}
            {!q.reviewRequired && (q.status === 'borrador' || q.status === 'pendiente') && <Button variant="success" className="w-full" icon={<Send className="size-4" />} loading={update.isPending} onClick={() => change('enviada', 'Cotización enviada al cliente')}>Enviar cotización</Button>}
            {q.status === 'enviada' && (
              <>
                <Button variant="success" className="w-full" icon={<Check className="size-4" />} onClick={() => change('aprobada', 'Cotización aprobada por el cliente')}>Marcar como aprobada</Button>
              </>
            )}
            <Button variant="secondary" className="w-full" icon={<Download className="size-4" />} onClick={() => window.print()}>Descargar PDF</Button>
            {q.status !== 'rechazada' && q.status !== 'aprobada' && <Button variant="danger" className="w-full" icon={<X className="size-4" />} onClick={() => change('rechazada', 'Cotización rechazada')}>Rechazar</Button>}
          </Card>
        </aside>
      </div>
    </>
  )
}
