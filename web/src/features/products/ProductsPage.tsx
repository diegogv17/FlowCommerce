import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { Badge, Button, Card, EmptyState, ErrorState, Field, Input, Modal, PageHeader, PageLoader, SearchInput, Select, Textarea } from '@/components/ui'
import { useAuth } from '@/app/auth'
import { useToast } from '@/app/toast'
import { useProducts, useSaveProduct } from '@/hooks/queries'
import { DEFAULT_UNIT, kindOfUnit } from '@/services/products.service'
import { cn } from '@/lib/cn'
import { moneyExact } from '@/lib/format'
import type { Product, ProductKind } from '@/types/domain'

const th = 'px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-navy-300 uppercase'
const blank = { sku: '', name: '', unit: DEFAULT_UNIT.servicio, category: '', description: '', unitPrice: 0, maxDiscountPercent: 0, active: true }
const UNIT_SUGGESTIONS: Record<ProductKind, string[]> = {
  producto: ['unidad', 'pieza', 'caja', 'paquete', 'kit', 'licencia', 'usuario'],
  servicio: ['servicio', 'hora', 'mes', 'año', 'sesión', 'proyecto', 'suscripción'],
}
const MANAGE_HINT = 'Solo un Propietario o Administrador puede editar el catálogo'

/**
 * Catálogo. La API no tiene SKU ni tipo: el tipo producto/servicio se deriva de la
 * unidad de venta (hora, mes, servicio… = servicio). Los precios son antes de IVA.
 */
export function ProductsPage() {
  const toast = useToast()
  const { user } = useAuth()
  const canManage = user?.apiRole === 'OWNER' || user?.apiRole === 'ADMIN'
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [kind, setKind] = useState('')
  const [status, setStatus] = useState<'' | 'activos' | 'inactivos'>('')
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [form, setForm] = useState(blank)
  const active = status === '' ? undefined : status === 'activos'
  const { data, isLoading, isError, refetch } = useProducts({ search: debounced, kind, active })
  const save = useSaveProduct()

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const formKind = kindOfUnit(form.unit)

  const open = (p: Product | 'new') => {
    setEditing(p)
    setForm(p === 'new' ? blank : { sku: p.sku, name: p.name, unit: p.unit || DEFAULT_UNIT[p.kind], category: p.category, description: p.description, unitPrice: p.unitPrice, maxDiscountPercent: p.maxDiscountPercent ?? 0, active: p.active })
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save.mutate({ id: editing && editing !== 'new' ? editing.id : undefined, input: { ...form, kind: formKind } }, {
      onSuccess: () => { toast.success('Producto guardado'); setEditing(null) },
      onError: (err) => toast.error(err.message),
    })
  }

  const toggleActive = (p: Product) =>
    save.mutate({ id: p.id, input: { ...p, active: !p.active } }, {
      onSuccess: () => toast.success(p.active ? 'Producto desactivado' : 'Producto activado'),
      onError: (err) => toast.error(err.message),
    })

  const categories = [...new Set((data ?? []).map((p) => p.category).filter(Boolean))]

  return (
    <>
      <PageHeader
        title="Productos y Servicios"
        subtitle="Catálogo oficial de precios (antes de IVA) para todas las cotizaciones."
        actions={<span title={canManage ? undefined : MANAGE_HINT}><Button icon={<Plus className="size-4" />} disabled={!canManage} onClick={() => open('new')}>Nuevo producto</Button></span>}
      />

      <div className="mb-4 flex items-start gap-3 rounded-2xl bg-flow-50 px-5 py-3.5 text-[13px] text-flow-700">
        <Sparkles className="mt-0.5 size-4 shrink-0" />
        Los precios de este catálogo alimentan las cotizaciones. La IA solo usa productos activos con los precios y descripciones definidos aquí. Un producto desactivado no se puede agregar a cotizaciones nuevas.
      </div>

      <Card>
        <div className="flex flex-wrap gap-2.5 border-b border-navy-100/70 p-4">
          <SearchInput className="w-full sm:w-72" placeholder="Buscar por nombre o descripción…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select className="w-auto min-w-36 rounded-full" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">Todos los tipos</option><option value="producto">Productos</option><option value="servicio">Servicios</option>
          </Select>
          <Select className="w-auto min-w-36 rounded-full" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="">Todos los estados</option><option value="activos">Activos</option><option value="inactivos">Inactivos</option>
          </Select>
        </div>
        {isError ? <ErrorState onRetry={() => refetch()} /> : isLoading || !data ? <PageLoader /> : data.length === 0 ? <EmptyState title="Sin resultados" /> : (
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[860px] text-[13px]">
              <thead><tr className="border-b border-navy-100/70"><th className={th}>Nombre</th><th className={th}>Tipo</th><th className={th}>Categoría</th><th className={`${th} text-right`}>Precio</th><th className={`${th} text-right`}>Desc. máx.</th><th className={th}>Estado</th><th className={th} /></tr></thead>
              <tbody className="divide-y divide-navy-100/60">
                {data.map((p) => (
                  <tr key={p.id} className="hover:bg-navy-50/50">
                    <td className="px-4 py-3.5"><p className="font-semibold">{p.name}</p>{p.description && <p className="line-clamp-1 text-xs text-navy-400">{p.description}</p>}</td>
                    <td className="px-4 py-3.5 text-navy-600">{p.kind === 'servicio' ? 'Servicio' : 'Producto'}{p.unit && <span className="text-xs text-navy-400"> · por {p.unit}</span>}</td>
                    <td className="px-4 py-3.5">{p.category ? <Badge tone="blue">{p.category}</Badge> : <span className="text-navy-300">—</span>}</td>
                    <td className="num px-4 py-3.5 text-right font-medium">{moneyExact(p.unitPrice)}</td>
                    <td className="num px-4 py-3.5 text-right text-navy-500">{p.maxDiscountPercent ? `${p.maxDiscountPercent}%` : '—'}</td>
                    <td className="px-4 py-3.5"><Badge tone={p.active ? 'green' : 'slate'}>{p.active ? 'Activo' : 'Inactivo'}</Badge></td>
                    <td className="px-4 py-3.5">
                      {canManage ? (
                        <div className="flex justify-end gap-2"><Button size="sm" variant="secondary" onClick={() => open(p)}>Editar</Button><Button size="sm" variant="secondary" className={cn(!p.active && 'text-teal-700')} disabled={save.isPending} onClick={() => toggleActive(p)}>{p.active ? 'Desactivar' : 'Activar'}</Button></div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nuevo producto o servicio' : 'Editar producto'} footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button><Button type="submit" form="product-form" loading={save.isPending}>Guardar</Button></>}>
        <form id="product-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Tipo">
            <Select value={formKind} onChange={(e) => setForm({ ...form, unit: DEFAULT_UNIT[e.target.value as ProductKind] })}>
              <option value="servicio">Servicio</option><option value="producto">Producto</option>
            </Select>
          </Field>
          <Field label="Unidad de venta" hint="Hora, mes, servicio… se consideran servicios.">
            <Input required maxLength={50} list="units" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            <datalist id="units">{UNIT_SUGGESTIONS[formKind].map((u) => <option key={u} value={u} />)}</datalist>
          </Field>
          <Field label="Nombre" className="sm:col-span-2"><Input required maxLength={255} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Categoría"><Input maxLength={100} list="categories" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /><datalist id="categories">{categories.map((c) => <option key={c} value={c} />)}</datalist></Field>
          <Field label="Precio unitario sin IVA (Q)"><Input type="number" min={0} step="0.01" required value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })} className="num" /></Field>
          <Field label="Descuento máximo (%)" hint="Tope de descuento por partida al cotizar."><Input type="number" min={0} max={100} step="0.01" value={form.maxDiscountPercent} onChange={(e) => setForm({ ...form, maxDiscountPercent: Number(e.target.value) })} className="num" /></Field>
          <Field label="Descripción" className="sm:col-span-2"><Textarea rows={3} maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        </form>
      </Modal>
    </>
  )
}
