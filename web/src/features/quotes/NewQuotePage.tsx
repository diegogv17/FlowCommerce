import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus, Sparkles, Trash2 } from 'lucide-react'
import { Button, Card, CardHeader, Field, IconButton, Input, Segmented, Select, Textarea } from '@/components/ui'
import { useToast } from '@/app/toast'
import { useCreateAiQuote, useCreateQuote, useProducts, useQuoteLeads, useQuoteSettings } from '@/hooks/queries'
import { moneyExact } from '@/lib/format'
import { DEFAULT_TAX_PERCENT, lineAmounts, quoteTotals } from '@/lib/tax'
import type { QuoteStatus } from '@/types/domain'

interface Line { key: number; productId: string; quantity: number; discountPercent: number }

const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10)
const th = 'px-2 py-2 text-left text-[11px] font-semibold tracking-wider text-navy-300 uppercase'
const newLine = (): Line => ({ key: Date.now() + Math.random(), productId: '', quantity: 1, discountPercent: 0 })

/**
 * Nueva cotización. La API exige un lead (el cliente sale del lead si lo tiene)
 * y partidas del catálogo: el precio no se envía, solo producto, cantidad y descuento %.
 * Los precios son antes de IVA; el IVA (% de la empresa) se suma al final.
 * Query params opcionales: ?lead=<id> preselecciona el lead; ?cliente=<id> filtra los leads de ese cliente.
 */
export function NewQuotePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()
  const clientFilter = params.get('cliente') ?? undefined
  const leads = useQuoteLeads({ clientId: clientFilter })
  const products = useProducts({ active: true })
  const settings = useQuoteSettings()
  const create = useCreateQuote()
  const aiCreate = useCreateAiQuote()

  const [mode, setMode] = useState<'manual' | 'ia'>('manual')
  const [leadId, setLeadId] = useState(params.get('lead') ?? '')
  const [validUntil, setValidUntil] = useState(inDays(30))
  const [adjustment, setAdjustment] = useState(0)
  const [notes, setNotes] = useState('')
  const [conditions, setConditions] = useState('')
  const [touched, setTouched] = useState({ validUntil: false, conditions: false })
  const [prompt, setPrompt] = useState('')
  const [lines, setLines] = useState<Line[]>([newLine()])

  // Defaults de la empresa (vigencia y condiciones) mientras el usuario no los toque.
  useEffect(() => {
    const s = settings.data
    if (!s) return
    if (!touched.validUntil) setValidUntil(inDays(s.validityDays || 30))
    if (!touched.conditions && s.defaultTerms) setConditions(s.defaultTerms)
  }, [settings.data])

  // Si se llegó desde un cliente con un único lead, se preselecciona.
  useEffect(() => {
    if (!leadId && clientFilter && leads.data?.length === 1) setLeadId(leads.data[0].id)
  }, [leads.data, clientFilter, leadId])

  const lead = leads.data?.find((l) => l.id === leadId)
  const productById = useMemo(() => new Map((products.data ?? []).map((p) => [p.id, p])), [products.data])
  const taxPercent = settings.data?.taxPercent ?? DEFAULT_TAX_PERCENT
  const priced = lines.map((l) => ({ ...l, unitPrice: productById.get(l.productId)?.unitPrice ?? 0 }))
  const totals = quoteTotals(priced.filter((l) => l.productId), taxPercent, adjustment)

  const patch = (key: number, p: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...p } : l)))

  const save = (status: QuoteStatus) => {
    if (!leadId) return toast.error('Selecciona un lead')
    const items = lines.filter((l) => l.productId && l.quantity > 0)
    if (items.length === 0) return toast.error('Agrega al menos un producto o servicio del catálogo')
    for (const l of items) {
      const p = productById.get(l.productId)
      const max = p?.maxDiscountPercent ?? 0
      if (l.discountPercent > max) return toast.error(`El descuento de «${p?.name ?? 'producto'}» no puede superar ${max}%`)
    }
    if (adjustment > totals.maxAdjustment) return toast.error('El ajuste comercial no puede superar el subtotal menos descuentos')
    create.mutate(
      {
        leadId,
        validUntil,
        discount: adjustment,
        conditions,
        notes,
        status,
        items: items.map(({ productId, quantity, discountPercent }) => ({ productId, quantity, discountPercent })),
      },
      {
        onSuccess: (q) => {
          if (status === 'pendiente' && q.apiStatus === 'DRAFT') toast.error(`Cotización ${q.folio} guardada como borrador: no se pudo enviar a aprobación`)
          else toast.success(status === 'pendiente' ? `Cotización ${q.folio} enviada a aprobación` : `Borrador ${q.folio} guardado`)
          navigate(`/cotizaciones/${q.id}`)
        },
        onError: (err) => toast.error(err.message),
      },
    )
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (mode === 'ia') {
      if (!leadId) return toast.error('Selecciona un lead')
      aiCreate.mutate({ leadId, prompt }, {
        onSuccess: (r) => {
          toast.success(`Borrador ${r.folio} preparado por IA`)
          r.warnings.forEach((w) => toast.error(`Ajuste de la IA: ${w}`))
          navigate(`/cotizaciones/${r.id}`)
        },
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
          <p className="mt-1 text-sm text-navy-400">{lead ? `${lead.name}${lead.company ? ` · ${lead.company}` : ''}` : 'Selecciona un lead para comenzar.'}</p>
        </div>
        <Segmented value={mode} onChange={setMode} options={[{ value: 'manual', label: 'Crear manualmente' }, { value: 'ia', label: 'Generar con IA' }]} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card className="pb-5">
            <CardHeader title="Lead y cliente" />
            <div className="grid gap-4 px-5 pt-4 sm:grid-cols-2">
              <Field label="Lead" hint="Toda cotización pertenece a un lead del embudo.">
                <Select value={leadId} onChange={(e) => setLeadId(e.target.value)} required>
                  <option value="">{leads.isLoading ? 'Cargando leads…' : 'Selecciona un lead'}</option>
                  {leads.data?.map((l) => <option key={l.id} value={l.id}>{l.name}{l.company ? ` · ${l.company}` : ''}</option>)}
                </Select>
              </Field>
              <Field label="Cliente" hint={lead && !lead.clientId ? 'El lead aún no está convertido en cliente.' : undefined}><Input readOnly value={lead?.clientName ?? ''} placeholder="—" /></Field>
              <Field label="Email"><Input readOnly value={lead?.email ?? ''} placeholder="—" /></Field>
              <Field label="Teléfono"><Input readOnly value={lead?.phone ?? ''} placeholder="—" className="num" /></Field>
            </div>
          </Card>

          {mode === 'ia' ? (
            <Card className="pb-5">
              <CardHeader title={<span className="flex items-center gap-2"><Sparkles className="size-4 text-teal-500" /> Preparar con IA</span>} />
              <div className="space-y-4 px-5 pt-4">
                <p className="rounded-xl bg-teal-50 px-4 py-3 text-[13px] text-teal-700">El asistente elige productos y precios del catálogo activo según el lead y su conversación. Queda en borrador para que la revises antes de enviarla a aprobación.</p>
                <Field label="Indicaciones (opcional)"><Textarea rows={4} maxLength={1000} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ej.: 12 usuarios, integración con WhatsApp y capacitación para el equipo." /></Field>
              </div>
            </Card>
          ) : (
            <>
              <Card className="pb-5">
                <CardHeader title="Productos y servicios" />
                <div className="scroll-thin overflow-x-auto px-5 pt-3">
                  <table className="w-full min-w-[700px] text-[13px]">
                    <thead><tr><th className={th}>Producto / servicio</th><th className={`${th} w-20`}>Cant.</th><th className={`${th} w-28 text-right`}>P. unitario</th><th className={`${th} w-24`}>Desc. %</th><th className={`${th} w-32 text-right`}>Importe</th><th className="w-10" /></tr></thead>
                    <tbody className="divide-y divide-navy-100/60">
                      {priced.map((l) => {
                        const p = productById.get(l.productId)
                        const max = p?.maxDiscountPercent ?? 0
                        return (
                          <tr key={l.key}>
                            <td className="px-2 py-2.5">
                              <Select value={l.productId} onChange={(e) => patch(l.key, { productId: e.target.value, discountPercent: 0 })}>
                                <option value="">{products.isLoading ? 'Cargando catálogo…' : 'Selecciona del catálogo'}</option>
                                {products.data?.map((x) => <option key={x.id} value={x.id}>{x.name}{x.unit ? ` (${x.unit})` : ''}</option>)}
                              </Select>
                            </td>
                            <td className="px-2 py-2.5 align-top"><Input type="number" min={0.01} step="0.01" value={l.quantity} onChange={(e) => patch(l.key, { quantity: Number(e.target.value) })} className="num" /></td>
                            <td className="num px-2 py-2.5 text-right align-top leading-10">{moneyExact(l.unitPrice)}</td>
                            <td className="px-2 py-2.5 align-top">
                              <Input type="number" min={0} max={max} step="0.01" value={l.discountPercent} disabled={!p || max === 0} title={p && max === 0 ? 'Este producto no admite descuento' : `Máximo ${max}%`} onChange={(e) => patch(l.key, { discountPercent: Number(e.target.value) })} className="num" />
                            </td>
                            <td className="num px-2 py-2.5 text-right align-top leading-10 font-medium">{moneyExact(lineAmounts(l).lineTotal)}</td>
                            <td className="py-2.5 align-top"><IconButton type="button" aria-label="Quitar concepto" onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== l.key) : ls))} className="hover:bg-red-50 hover:text-red-500"><Trash2 className="size-4" /></IconButton></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {!products.isLoading && !products.data?.length && <p className="px-2 pt-3 text-xs text-navy-400">No hay productos activos en el catálogo. Agrégalos en Productos y Servicios.</p>}
                  <Button type="button" size="sm" variant="ghost" className="mt-2 text-flow-600" icon={<Plus className="size-3.5" />} onClick={() => setLines((ls) => [...ls, newLine()])}>Agregar producto / servicio</Button>
                </div>
              </Card>

              <Card className="pb-5">
                <CardHeader title="Notas y condiciones" />
                <div className="space-y-4 px-5 pt-4">
                  <Field label="Notas para el cliente"><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Mensaje que verá el cliente en la cotización." /></Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Condiciones comerciales"><Textarea rows={2} value={conditions} onChange={(e) => { setConditions(e.target.value); setTouched((t) => ({ ...t, conditions: true })) }} /></Field>
                    <Field label="Válida hasta"><Input type="date" min={inDays(1)} value={validUntil} onChange={(e) => { setValidUntil(e.target.value); setTouched((t) => ({ ...t, validUntil: true })) }} required /></Field>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>

        <Card className="h-fit p-5 xl:sticky xl:top-0">
          <h3 className="font-display text-[15px] font-semibold">Resumen</h3>
          {mode === 'manual' && (
            <dl className="mt-4 space-y-3 text-[13px]">
              <div className="flex justify-between"><dt className="text-navy-400">Subtotal</dt><dd className="num font-medium">{moneyExact(totals.subtotal)}</dd></div>
              {totals.discount > 0 && <div className="flex justify-between"><dt className="text-navy-400">Descuentos por partida</dt><dd className="num font-medium">− {moneyExact(totals.discount)}</dd></div>}
              <div className="flex items-center justify-between gap-3"><dt className="text-navy-400">Ajuste comercial (Q)</dt><dd><Input type="number" min={0} step="0.01" value={adjustment} onChange={(e) => setAdjustment(Math.max(0, Number(e.target.value)))} className="num h-9 w-28 text-right" /></dd></div>
              <div className="flex justify-between"><dt className="text-navy-400">IVA ({taxPercent}%)</dt><dd className="num font-medium">{moneyExact(totals.tax)}</dd></div>
              <div className="flex items-baseline justify-between border-t border-navy-100/70 pt-4"><dt className="font-semibold">TOTAL</dt><dd className="num text-2xl font-semibold text-teal-600">{moneyExact(totals.total)}</dd></div>
              <p className="text-[11px] text-navy-300">Precios del catálogo antes de IVA. Los importes finales los confirma el servidor al guardar.</p>
            </dl>
          )}
          <div className="mt-5 space-y-2">
            {mode === 'ia' ? (
              <Button type="submit" variant="success" className="w-full" loading={aiCreate.isPending} icon={<Sparkles className="size-4" />}>Generar borrador</Button>
            ) : (
              <>
                <Button type="submit" className="w-full" loading={create.isPending}>Enviar a aprobación</Button>
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
