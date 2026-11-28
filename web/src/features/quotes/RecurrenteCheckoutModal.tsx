import { CheckCircle2, Copy, ExternalLink, Link2, RefreshCw, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { Button, Modal, PageLoader } from '@/components/ui'
import { useToast } from '@/app/toast'
import {
  useCreateRecurrenteCheckout,
  useRecurrenteAvailability,
  useRecurrenteCheckout,
  useVerifyRecurrentePayment,
} from '@/hooks/queries'
import { moneyExact } from '@/lib/format'
import type { RecurrenteVerification } from '@/services/quotes.service'

interface PayableQuote {
  id: string
  folio: string
  total: number
}

const OUTCOME_TONES: Record<RecurrenteVerification['outcome'], string> = {
  PAID: 'bg-teal-50 text-teal-700',
  PENDING: 'bg-amber-50 text-amber-700',
  IN_PROGRESS: 'bg-flow-50 text-flow-700',
  EXPIRED: 'bg-red-50 text-red-600',
}

export function RecurrenteCheckoutModal({ quote, onClose }: { quote: PayableQuote; onClose: () => void }) {
  const toast = useToast()
  const availability = useRecurrenteAvailability()
  const stored = useRecurrenteCheckout(quote.id)
  const create = useCreateRecurrenteCheckout(quote.id)
  const verify = useVerifyRecurrentePayment(quote.id)
  const [result, setResult] = useState<RecurrenteVerification | null>(null)

  const checkout = stored.data ?? null
  const isPaid = checkout?.status === 'PAID'
  const needsNewLink = checkout === null || checkout.status === 'EXPIRED'
  const busy = create.isPending || verify.isPending

  const generate = () => {
    setResult(null)
    create.mutate(undefined, {
      onSuccess: () => toast.success('Enlace de pago de prueba generado'),
      onError: (error) => toast.error(error.message),
    })
  }

  const check = () =>
    verify.mutate(undefined, {
      onSuccess: (outcome) => {
        setResult(outcome)
        if (outcome.outcome === 'PAID') toast.success('Pago confirmado por Recurrente')
      },
      onError: (error) => toast.error(error.message),
    })

  const copy = async () => {
    if (!checkout) return
    try {
      await navigator.clipboard.writeText(checkout.checkoutUrl)
      toast.success('Enlace copiado')
    } catch {
      toast.error('No se pudo copiar el enlace')
    }
  }

  const footer = isPaid ? (
    <Button onClick={onClose}>Cerrar</Button>
  ) : (
    <>
      <Button variant="ghost" onClick={onClose} disabled={busy}>Cerrar</Button>
      {availability.data?.available && needsNewLink && (
        <Button onClick={generate} loading={create.isPending} icon={<Link2 className="size-4" />}>
          {checkout ? 'Generar enlace nuevo' : 'Generar enlace de pago'}
        </Button>
      )}
      {checkout && !needsNewLink && (
        <Button onClick={check} loading={verify.isPending} icon={<RefreshCw className="size-4" />}>Consultar estado</Button>
      )}
    </>
  )

  return (
    <Modal open onClose={onClose} title={`Cobrar con Recurrente (prueba) · ${quote.folio}`} footer={footer}>
      {availability.isLoading || stored.isLoading ? (
        <PageLoader />
      ) : (
        <div className="space-y-4">
          <div className="flex items-baseline justify-between rounded-xl bg-flow-50 px-4 py-3">
            <span className="text-[13px] font-semibold">Total a cobrar</span>
            <span className="num text-lg font-semibold text-flow-700">{moneyExact(quote.total)}</span>
          </div>

          {!availability.data?.available && (
            <div className="flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">
              <ShieldAlert className="mt-0.5 size-5 shrink-0" />
              <span>{availability.data?.message ?? 'No se pudo verificar Recurrente Sandbox. Intente de nuevo más tarde.'}</span>
            </div>
          )}

          {isPaid && (
            <div className="flex items-center gap-3 rounded-xl bg-teal-50 px-4 py-3 text-[13px] text-teal-700">
              <CheckCircle2 className="size-5 shrink-0" />
              <span>Recurrente confirmó el pago de {moneyExact(checkout.amountInCents / 100)}. La cotización {quote.folio} quedó pagada.</span>
            </div>
          )}

          {checkout && !isPaid && checkout.status === 'PENDING' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-navy-100/60 px-4 py-3">
                <p className="text-[11px] font-semibold tracking-wide text-navy-300 uppercase">Enlace del checkout</p>
                <p className="mt-1 break-all text-[13px]">{checkout.checkoutUrl}</p>
              </div>
              <div className="flex gap-2">
                <a
                  href={checkout.checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-navy-50 px-4 py-2 text-[13px] font-semibold text-navy-600 hover:bg-navy-100"
                >
                  <ExternalLink className="size-4" />Abrir enlace
                </a>
                <Button variant="secondary" className="flex-1" icon={<Copy className="size-4" />} onClick={copy}>Copiar enlace</Button>
              </div>
            </div>
          )}

          {result && !isPaid && (
            <div className={`rounded-xl px-4 py-3 text-[13px] ${OUTCOME_TONES[result.outcome]}`}>{result.message}</div>
          )}

          <div className="space-y-1 text-xs text-navy-400">
            <p>Solo Sandbox: el cliente escribe los datos de prueba en la página de Recurrente. Abrir el enlace o volver a FlowCommerce no confirma el pago; la cotización cambia a pagada solo cuando Recurrente lo confirma al consultar el estado.</p>
            <p>Tarjeta de éxito: 4242 4242 4242 4242. Tarjeta de rechazo: 4000 0000 0000 0002. Vencimiento futuro y código de 3 dígitos.</p>
          </div>
        </div>
      )}
    </Modal>
  )
}
