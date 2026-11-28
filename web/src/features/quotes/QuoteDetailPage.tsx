import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, CreditCard, Download, Mail, Printer, Send, Sparkles, Trash2, Undo2, X } from 'lucide-react'
import { Badge, Button, Card, ErrorState, Field, Input, Modal, PageLoader, Textarea } from '@/components/ui'
import { Logo } from '@/components/layout/Logo'
import { useAuth } from '@/app/auth'
import { useToast } from '@/app/toast'
import { useDeleteQuote, useQuote, useSendQuote, useUpdateQuoteStatus } from '@/hooks/queries'
import { quotesService } from '@/services/quotes.service'
import { errorMessage } from '@/services/http'
import { describePaymentReference } from '@/lib/card-payment'
import { decimal, formatDate, moneyExact } from '@/lib/format'
import type { ApiQuoteStatus } from '@/types/domain'
import { QuotePaymentModal } from './QuotePaymentModal'
import { quoteBadge } from './status'

const label = 'text-[10px] font-semibold tracking-[0.12em] text-navy-300 uppercase'
const APPROVER_HINT = 'Solo un Propietario o Administrador puede hacerlo'

export function QuoteDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { user } = useAuth()
  const { data: q, isLoading, isError, refetch } = useQuote(id)
  const update = useUpdateQuoteStatus()
  const send = useSendQuote()
  const remove = useDeleteQuote()
  const [sendOpen, setSendOpen] = useState(false)
  const [to, setTo] = useState('')
  const [message, setMessage] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [payOpen, setPayOpen] = useState(false)

  if (isError) return <Card><ErrorState onRetry={() => refetch()} /></Card>
  if (isLoading || !q) return <PageLoader />

  const role = user?.apiRole
  const canWrite = role !== 'VIEWER'
  const canApprove = role === 'OWNER' || role === 'ADMIN'
  const api: ApiQuoteStatus = q.apiStatus ?? 'DRAFT'

  const change = (status: ApiQuoteStatus, msg: string) =>
    update.mutate({ id: q.id, status }, { onSuccess: () => toast.success(msg), onError: (e) => toast.error(e.message) })

  const downloadPdf = async () => {
    setDownloading(true)
    try {
      await quotesService.pdf(q.id, q.folio)
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setDownloading(false)
    }
  }

  const submitSend = (e: FormEvent) => {
    e.preventDefault()
    send.mutate({ id: q.id, to, message }, {
      onSuccess: () => { toast.success(api === 'SENT' ? 'Cotización reenviada por correo' : 'Cotización enviada al cliente'); setSendOpen(false) },
      onError: (err) => toast.error(err.message),
    })
  }

  const destroy = () => {
    if (!window.confirm(`¿Eliminar el borrador ${q.folio}? Esta acción no se puede deshacer.`)) return
    remove.mutate(q.id, {
      onSuccess: () => { toast.success('Borrador eliminado'); navigate('/cotizaciones') },
      onError: (e) => toast.error(e.message),
    })
  }

  const meta = quoteBadge(q)
  const busy = update.isPending
  const adjustment = q.adjustment ?? 0
  const hasLineDiscount = q.items.some((it) => (it.discountPercent ?? 0) > 0)
  const side: Array<[string, string, boolean?]> = [
    ['Cliente', q.customerName],
    ['Lead', q.leadName || '—'],
    ['Fecha', formatDate(q.issuedAt), true],
    ['Vence', formatDate(q.validUntil), true],
    ['Total', moneyExact(q.total), true],
    ['Responsable', q.advisorName],
    ...(api === 'PAID' && q.paymentReference ? [['Pago', describePaymentReference(q.paymentReference)] as [string, string]] : []),
  ]

  /* Acciones según el estado real de la API (ver quote-transitions.ts del backend). */
  const actions: ReactNode[] = []
  if (canWrite) {
    if (api === 'DRAFT') {
      actions.push(<Button key="submit" variant="success" className="w-full" icon={<Send className="size-4" />} loading={busy} onClick={() => change('PENDING_APPROVAL', 'Cotización enviada a aprobación')}>Enviar a aprobación</Button>)
    }
    if (api === 'PENDING_APPROVAL') {
      actions.push(
        <span key="approve" title={canApprove ? undefined : APPROVER_HINT} className="block">
          <Button variant="success" className="w-full" icon={<Check className="size-4" />} loading={busy} disabled={!canApprove} onClick={() => change('APPROVED', 'Cotización aprobada')}>Aprobar cotización</Button>
        </span>,
        <Button key="return" variant="secondary" className="w-full" icon={<Undo2 className="size-4" />} disabled={busy} onClick={() => change('DRAFT', 'Cotización devuelta a borrador')}>Devolver a borrador</Button>,
      )
    }
    if (api === 'APPROVED' || api === 'SENT') {
      actions.push(<Button key="send" variant={api === 'APPROVED' ? 'success' : 'secondary'} className="w-full" icon={<Mail className="size-4" />} onClick={() => setSendOpen(true)}>{api === 'APPROVED' ? 'Enviar por correo' : 'Reenviar por correo'}</Button>)
    }
    if (api === 'SENT') {
      actions.push(<Button key="accept" variant="success" className="w-full" icon={<Check className="size-4" />} loading={busy} onClick={() => change('ACCEPTED', 'Cotización aceptada por el cliente')}>Marcar como aceptada</Button>)
    }
    if (api === 'ACCEPTED') {
      actions.push(
        <span key="card" title={canApprove ? undefined : APPROVER_HINT} className="block">
          <Button className="w-full" icon={<CreditCard className="size-4" />} disabled={!canApprove} onClick={() => setPayOpen(true)}>Cobrar con tarjeta</Button>
        </span>,
        <span key="paid" title={canApprove ? undefined : APPROVER_HINT} className="block">
          <Button variant="success" className="w-full" icon={<CreditCard className="size-4" />} loading={busy} disabled={!canApprove} onClick={() => change('PAID', 'Cotización marcada como pagada')}>Marcar como pagada</Button>
        </span>,
      )
    }
  }

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
            {q.reviewRequired ? <Badge tone="amber">Pendiente de aprobación</Badge> : <Badge tone="green">Aprobada</Badge>}
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
            <div><p className={label}>Contacto</p><p className="mt-1 text-[13px] font-semibold">{q.leadName || q.contactName || '—'}</p></div>
          </div>

          <table className="mt-8 w-full text-[13px]">
            <thead>
              <tr className="border-b border-navy-100 text-left">
                <th className={`${label} py-3`}>Descripción</th>
                <th className={`${label} py-3 text-right`}>Cant.</th>
                <th className={`${label} py-3 text-right`}>Precio unit.</th>
                {hasLineDiscount && <th className={`${label} py-3 text-right`}>Desc.</th>}
                <th className={`${label} py-3 text-right`}>Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100/60">
              {q.items.map((it) => (
                <tr key={it.id}>
                  <td className="py-3.5 pr-4">{it.description}</td>
                  <td className="num py-3.5 text-right">{it.quantity}</td>
                  <td className="num py-3.5 text-right">{decimal(it.unitPrice)}</td>
                  {hasLineDiscount && <td className="num py-3.5 text-right">{it.discountPercent ? `${it.discountPercent}%` : '—'}</td>}
                  <td className="num py-3.5 text-right font-medium">{decimal(it.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-8 grid gap-8 sm:grid-cols-[1fr_280px]">
            <div className="space-y-5">
              {q.notes && <div><p className={label}>Notas</p><p className="mt-2 text-[13px] leading-relaxed whitespace-pre-line text-navy-500">{q.notes}</p></div>}
              {q.conditions && <div><p className={label}>Condiciones</p><p className="mt-2 text-[13px] leading-relaxed whitespace-pre-line text-navy-500">{q.conditions}</p></div>}
            </div>
            <dl className="space-y-2.5 text-[13px]">
              <div className="flex justify-between"><dt className="text-navy-400">Subtotal</dt><dd className="num">{moneyExact(q.subtotal)}</dd></div>
              {q.discount > 0 && <div className="flex justify-between"><dt className="text-navy-400">Descuentos</dt><dd className="num">− {moneyExact(q.discount)}</dd></div>}
              {adjustment > 0 && <div className="flex justify-between"><dt className="text-navy-400">Ajuste comercial</dt><dd className="num">− {moneyExact(adjustment)}</dd></div>}
              <div className="flex justify-between"><dt className="text-navy-400">IVA ({q.taxPercent ?? 0}%)</dt><dd className="num">{moneyExact(q.tax ?? 0)}</dd></div>
              <div className="flex items-baseline justify-between rounded-xl bg-flow-50 px-4 py-3"><dt className="font-semibold">Total</dt><dd className="num text-lg font-semibold text-flow-700">{moneyExact(q.total)}</dd></div>
            </dl>
          </div>

          <div className="mt-12 flex items-end justify-between border-t border-navy-100 pt-5 text-xs text-navy-400">
            <div><p className="font-semibold text-navy-700">{q.advisorName}</p><p>Asesor comercial</p></div>
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
            {actions}
            <Button variant="secondary" className="w-full" icon={<Download className="size-4" />} loading={downloading} onClick={downloadPdf}>Descargar PDF</Button>
            <Button variant="ghost" className="w-full" icon={<Printer className="size-4" />} onClick={() => window.print()}>Imprimir</Button>
            {canWrite && api === 'SENT' && <Button variant="danger" className="w-full" icon={<X className="size-4" />} disabled={busy} onClick={() => change('REJECTED', 'Cotización rechazada')}>Marcar como rechazada</Button>}
            {canWrite && api === 'DRAFT' && <Button variant="danger" className="w-full" icon={<Trash2 className="size-4" />} loading={remove.isPending} onClick={destroy}>Eliminar borrador</Button>}
          </Card>
        </aside>
      </div>

      {payOpen && <QuotePaymentModal quote={{ id: q.id, folio: q.folio, total: q.total }} onClose={() => setPayOpen(false)} />}

      <Modal open={sendOpen} onClose={() => setSendOpen(false)} title={api === 'SENT' ? 'Reenviar cotización' : 'Enviar cotización por correo'} footer={<><Button variant="ghost" onClick={() => setSendOpen(false)}>Cancelar</Button><Button type="submit" form="send-quote" loading={send.isPending} icon={<Send className="size-4" />}>Enviar</Button></>}>
        <form id="send-quote" onSubmit={submitSend} className="space-y-4">
          <p className="rounded-xl bg-flow-50 px-4 py-3 text-[13px] text-flow-700">Se enviará el PDF de la cotización como adjunto.{api === 'APPROVED' ? ' La cotización pasará a «Enviada».' : ''}</p>
          <Field label="Destinatario (opcional)" hint="Si lo dejas vacío se usa el correo del cliente o del lead."><Input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="cliente@empresa.com" /></Field>
          <Field label="Mensaje (opcional)"><Textarea rows={3} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Mensaje personalizado del correo." /></Field>
        </form>
      </Modal>
    </>
  )
}
