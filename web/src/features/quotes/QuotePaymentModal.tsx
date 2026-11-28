import { useState, type FormEvent } from 'react'
import { CheckCircle2, CreditCard } from 'lucide-react'
import { Button, Field, Input, Modal, Select } from '@/components/ui'
import { useToast } from '@/app/toast'
import { useSimulateQuotePayment } from '@/hooks/queries'
import {
  INSTALLMENT_OPTIONS,
  SECURITY_CODE_LENGTH,
  brandLabel,
  detectBrand,
  digitsOf,
  formatCardNumber,
  formatExpiry,
  formatSecurityCode,
  installmentLabel,
  validateCardNumber,
  validateEmail,
  validateExpiry,
  validateSecurityCode,
  type Installments,
} from '@/lib/card-payment'
import { moneyExact } from '@/lib/format'

interface PayableQuote {
  id: string
  folio: string
  total: number
}

type FieldName = 'number' | 'expiry' | 'code' | 'email'
type Errors = Partial<Record<FieldName, string>>

interface Receipt {
  total: string
  card: string
  mode: string
  email: string
}

const FORM_ID = 'quote-payment-form'

export function QuotePaymentModal({ quote, onClose }: { quote: PayableQuote; onClose: () => void }) {
  const toast = useToast()
  const pay = useSimulateQuotePayment()
  const [number, setNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [code, setCode] = useState('')
  const [email, setEmail] = useState('')
  const [installments, setInstallments] = useState<Installments>(1)
  const [errors, setErrors] = useState<Errors>({})
  const [receipt, setReceipt] = useState<Receipt | null>(null)

  const digits = digitsOf(number)
  const brand = detectBrand(digits)
  const isVisa = brand === 'visa'
  const chosenInstallments: Installments = isVisa ? installments : 1

  const clearError = (field: FieldName) => setErrors((current) => ({ ...current, [field]: undefined }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const found: Errors = {
      number: validateCardNumber(digits),
      expiry: validateExpiry(expiry),
      code: validateSecurityCode(code),
      email: validateEmail(email),
    }
    const hasErrors = Object.values(found).some(Boolean)
    setErrors(found)
    if (hasErrors) return

    const lastFourDigits = digits.slice(-4)
    pay.mutate(
      { id: quote.id, brand: isVisa ? 'VISA' : 'MASTERCARD', lastFourDigits, installments: chosenInstallments },
      {
        onSuccess: () => {
          setReceipt({
            total: moneyExact(quote.total),
            card: `${brandLabel(brand)} terminada en ${lastFourDigits}`,
            mode: installmentLabel(quote.total, chosenInstallments),
            email: email.trim(),
          })
          setNumber('')
          setExpiry('')
          setCode('')
          toast.success('Pago simulado aprobado')
        },
        onError: (error) => toast.error(error.message),
      },
    )
  }

  const footer = receipt ? (
    <Button onClick={onClose}>Cerrar</Button>
  ) : (
    <>
      <Button variant="ghost" onClick={onClose} disabled={pay.isPending}>Cancelar</Button>
      <Button type="submit" form={FORM_ID} loading={pay.isPending} icon={<CreditCard className="size-4" />}>Pagar {moneyExact(quote.total)}</Button>
    </>
  )

  return (
    <Modal open onClose={onClose} title={receipt ? 'Pago simulado aprobado' : `Cobrar cotización ${quote.folio}`} footer={footer}>
      {receipt ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-teal-50 px-4 py-3 text-[13px] text-teal-700">
            <CheckCircle2 className="size-5 shrink-0" />
            <span>La cotización {quote.folio} quedó marcada como pagada.</span>
          </div>
          <dl className="divide-y divide-navy-100/60 text-[13px]">
            {[
              ['Total', receipt.total],
              ['Tarjeta', receipt.card],
              ['Modalidad', receipt.mode],
              ['Notificación a', receipt.email],
            ].map(([term, value]) => (
              <div key={term} className="flex justify-between gap-4 py-2.5">
                <dt className="text-navy-400">{term}</dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <form id={FORM_ID} onSubmit={submit} noValidate className="space-y-4">
          <div className="flex items-baseline justify-between rounded-xl bg-flow-50 px-4 py-3">
            <span className="text-[13px] font-semibold">Total a pagar</span>
            <span className="num text-lg font-semibold text-flow-700">{moneyExact(quote.total)}</span>
          </div>

          <Field label="Número de tarjeta" error={errors.number}>
            <div className="relative">
              <Input
                inputMode="numeric"
                autoComplete="off"
                placeholder="0000 0000 0000 0000"
                maxLength={19}
                value={number}
                aria-invalid={Boolean(errors.number)}
                className="num pr-32"
                onChange={(event) => {
                  setNumber(formatCardNumber(event.target.value))
                  clearError('number')
                }}
              />
              {brand && <span className="absolute top-1/2 right-3 -translate-y-1/2 rounded bg-navy-50 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-navy-500 uppercase">{brandLabel(brand)}</span>}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fecha de vencimiento" error={errors.expiry}>
              <Input
                inputMode="numeric"
                autoComplete="off"
                placeholder="MM/AA"
                maxLength={5}
                value={expiry}
                aria-invalid={Boolean(errors.expiry)}
                className="num"
                onChange={(event) => {
                  setExpiry(formatExpiry(event.target.value))
                  clearError('expiry')
                }}
              />
            </Field>
            <Field label="Código de seguridad" error={errors.code}>
              <Input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                placeholder="CVV"
                maxLength={SECURITY_CODE_LENGTH}
                value={code}
                aria-invalid={Boolean(errors.code)}
                className="num"
                onChange={(event) => {
                  setCode(formatSecurityCode(event.target.value))
                  clearError('code')
                }}
              />
            </Field>
          </div>

          <Field label="Correo de notificación" error={errors.email}>
            <Input
              type="email"
              autoComplete="off"
              placeholder="correo@ejemplo.com"
              value={email}
              aria-invalid={Boolean(errors.email)}
              onChange={(event) => {
                setEmail(event.target.value)
                clearError('email')
              }}
            />
          </Field>

          {isVisa && (
            <Field label="Visa cuotas">
              <Select value={chosenInstallments} onChange={(event) => setInstallments(Number(event.target.value) as Installments)}>
                {INSTALLMENT_OPTIONS.map((count) => (
                  <option key={count} value={count}>{installmentLabel(quote.total, count)}</option>
                ))}
              </Select>
            </Field>
          )}

          <div className="space-y-1 text-xs text-navy-400">
            <p>Demostración: no se procesa ningún pago ni se envía el correo. Solo se registra la marca, los últimos 4 dígitos y las cuotas; el número completo y el código nunca salen del navegador.</p>
            <p>Tarjeta de prueba: 4242 4242 4242 4242, vencimiento 12/34, código 123.</p>
          </div>
        </form>
      )}
    </Modal>
  )
}
