import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Sparkles, Trash2 } from 'lucide-react'
import { Button, Card, CardHeader, Field, IconButton, Input, Segmented, Select, Textarea } from '@/components/ui'
import { useToast } from '@/app/toast'
import { useCreateAiQuote, useCreateQuote, useCustomers, useProducts } from '@/hooks/queries'
import { moneyExact } from '@/lib/format'
import { IVA_RATE, ivaBreakdown } from '@/lib/tax'
import type { QuoteStatus } from '@/types/domain'

interface Line { key: number; productId: string; description: string; quantity: number; unitPrice: number }

const inThirtyDays = () => new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10)
const defaultConditions = '50% anticipo y 50% contra entrega.'
const th = 'px-2 py-2 text-left text-[11px] font-semibold tracking-wider text-navy-300 uppercase'

export function NewQuotePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const customers = useCustomers({ pageSize: 100 })
  const products = useProducts({ active: true })
  const create = useCreateQuote()
  const aiCreate = useCreateAiQuote()

  const [mode, setMode] = useState<'manual' | 'ia'>('manual')
  const [customerId, setCustomerId] = useState('')
  const [validUntil, setValidUntil] = useState(inThirtyDays())
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState('')
  const [conditions, setConditions] = useState(defaultConditions)
  const [prompt, setPrompt] = useState('')
  const [lines, setLines] = useState<Line[]>([{ key: 1, productId: '', description: '', quantity: 1, unitPrice: 0 }])

  const customer = customers.data?.data.find((c) => c.id === customerId)
  const gross = lines.reduce((a, l) => a + l.quantity * l.unitPrice, 0)
  const { base, iva, total } = ivaBreakdown(gross, discount)

  const patch = (key: number, p: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...p } : l)))
  const pickProduct = (key: number, productId: string) => {
    const p = products.data?.find((x) => x.id === productId)
    patch(key, p ? { productId, description: p.name, unitPrice: p.unitPrice } : { productId: '' })
  }

  const save = (status: QuoteStatus) => {
    const items = lines.filter((l) => l.description.trim() && l.quantity > 0).map(({ productId, description, quantity, unitPrice }) => ({ productId: productId || null, description, quantity, unitPrice }))
    if (!customerId) return toast.error('Selecciona un cliente')
    if (items.length === 0) return toast.error('Agrega al menos un concepto')
    create.mutate({ customerId, validUntil, discount, conditions, notes, items, status }, {
      onSuccess: (q) => { toast.success(`Cotización ${q.folio} guardada`); navigate(`/cotizaciones/${q.id}`) },
      onError: (err) => toast.error(err.message),
    })
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (mode === 'ia') {
      if (!customerId) return toast.error('Selecciona un cliente')
      aiCreate.mutate({ customerId, prompt: prompt.trim() || undefined }, {
        onSuccess: (q) => { toast.success(`Borrador ${q.folio} preparado por IA`); navigate(`/cotizaciones/${q.id}`) },
        onError: (err) => toast.error(err.message),
      })
      return
    }
    save('pendiente')
  }

  return (
    <form onSubmit={submit}>
      <button type="button" onClick={() => navigate('/cotizaciones')} className="mb-3 flex items-center gap-1.5 text-xs font-medium text-navy-400 hover:text-navy-900"><ArrowLeft className="size-3.5" /> Volver a Cotizaciones</button>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] leading-tight font-semibold">Nueva cotización</h1>
          <p className="mt-1 text-sm text-navy-400">{customer ? `${customer.name} · ${customer.contactName}` : 'Selecciona un cliente para comenzar.'}</p>
        </div>
        <Segmented value={mode} onChange={setMode} options={[{ value: 'manual', label: 'Crear manualmente' }, { value: 'ia', label: 'Generar con IA' }]} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card className="pb-5">
            <CardHeader title="Datos del cliente" />
            <div className="grid gap-4 px-5 pt-4 sm:grid-cols-2">
              <Field label="Cliente">
                <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
                  <option value="">Selecciona un cliente</option>
                  {customers.data?.data.map((c) => <option key={c.id} value={c.id}>{c.contactName}</option>)}
                </Select>
              </Field>
              <Field label="Empresa"><Input readOnly value={customer?.name ?? ''} placeholder="—" /></Field>
              <Field label="Email"><Input readOnly value={customer?.email ?? ''} placeholder="—" /></Field>
              <Field label="Teléfono"><Input readOnly value={customer?.phone ?? ''} placeholder="—" className="num" /></Field>
            </div>
          </Card>

          {mode === 'ia' ? (
            <Card className="pb-5">
              <CardHeader title={<span className="flex items-center gap-2"><Sparkles className="size-4 text-teal-500" /> Preparar con IA</span>} />
              <div className="space-y-4 px-5 pt-4">
                <p className="rounded-xl bg-teal-50 px-4 py-3 text-[13px] text-teal-700">El asistente elige conceptos y precios del catálogo. Podrás revisar y editar todo antes de aprobar y enviar.</p>
                <Field label="Indicaciones (opcional)"><Textarea rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ej.: 12 usuarios, integración con WhatsApp y capacitación para el equipo." /></Field>
              </div>
            </Card>
          ) : (
            <>
              <Card className="pb-5">
                <CardHeader title="Productos y servicios" />
                <div className="scroll-thin overflow-x-auto px-5 pt-3">
                  <table className="w-full min-w-[640px] text-[13px]">
                    <thead><tr><th className={th}>Producto / servicio</th><th className={`${th} w-20`}>Cant.</th><th className={`${th} w-32`}>P. unitario</th><th className={`${th} w-32 text-right`}>Importe</th><th className="w-10" /></tr></thead>
                    <tbody className="divide-y divide-navy-100/60">
                      {lines.map((l) => (
                        <tr key={l.key}>
                          <td className="px-2 py-2.5">
                            <Select value={l.productId} onChange={(e) => pickProduct(l.key, e.target.value)}>
                              <option value="">Concepto personalizado</option>
                              {products.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </Select>
                            {!l.productId && <Input className="mt-2" value={l.description} onChange={(e) => patch(l.key, { description: e.target.value })} placeholder="Descripción del concepto" />}
                          </td>
                          <td className="px-2 py-2.5 align-top"><Input type="number" min={1} value={l.quantity} onChange={(e) => patch(l.key, { quantity: Number(e.target.value) })} className="num" /></td>
                          <td className="px-2 py-2.5 align-top"><Input type="number" min={0} step="0.01" value={l.unitPrice} onChange={(e) => patch(l.key, { unitPrice: Number(e.target.value) })} className="num" /></td>
                          <td className="num px-2 py-2.5 text-right align-top leading-10 font-medium">{moneyExact(l.quantity * l.unitPrice)}</td>
                          <td className="py-2.5 align-top"><IconButton type="button" aria-label="Quitar concepto" onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== l.key) : ls))} className="hover:bg-red-50 hover:text-red-500"><Trash2 className="size-4" /></IconButton></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Button type="button" size="sm" variant="ghost" className="mt-2 text-flow-600" icon={<Plus className="size-3.5" />} onClick={() => setLines((ls) => [...ls, { key: Date.now(), productId: '', description: '', quantity: 1, unitPrice: 0 }])}>Agregar producto / servicio</Button>
                </div>
              </Card>

              <Card className="pb-5">
                <CardHeader title="Notas y condiciones" />
                <div className="space-y-4 px-5 pt-4">
                  <Field label="Notas para el cliente"><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Mensaje que verá el cliente en la cotización." /></Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Condiciones comerciales"><Textarea rows={2} value={conditions} onChange={(e) => setConditions(e.target.value)} /></Field>
                    <Field label="Válida hasta"><Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} required /></Field>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>

        <Card className="h-fit p-5 xl:sticky xl:top-0">
          <h3 className="font-display text-[15px] font-semibold">Resumen</h3>
          <dl className="mt-4 space-y-3 text-[13px]">
            <div className="flex justify-between"><dt className="text-navy-400">Subtotal</dt><dd className="num font-medium">{moneyExact(base)}</dd></div>
            <div className="flex items-center justify-between gap-3"><dt className="text-navy-400">Descuento</dt><dd><Input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} className="num h-9 w-28 text-right" /></dd></div>
            <div className="flex justify-between"><dt className="text-navy-400">IVA ({IVA_RATE * 100}%)</dt><dd className="num font-medium">{moneyExact(iva)}</dd></div>
            <div className="flex items-baseline justify-between border-t border-navy-100/70 pt-4"><dt className="font-semibold">TOTAL</dt><dd className="num text-2xl font-semibold text-teal-600">{moneyExact(total)}</dd></div>
          </dl>
          <div className="mt-5 space-y-2">
            {mode === 'ia' ? (
              <Button type="submit" variant="success" className="w-full" loading={aiCreate.isPending} icon={<Sparkles className="size-4" />}>Generar borrador</Button>
            ) : (
              <>
                <Button type="submit" className="w-full" loading={create.isPending}>Guardar cotización</Button>
                <Button type="button" variant="secondary" className="w-full" onClick={() => save('borrador')} disabled={create.isPending}>Guardar borrador</Button>
              </>
            )}
            <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/cotizaciones')}>Cancelar</Button>
          </div>
        </Card>
      </div>
    </form>
  )
}
