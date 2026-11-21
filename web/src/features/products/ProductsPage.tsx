import { useState, type FormEvent } from 'react'
import { Plus, Sparkles } from 'lucide-react'
import { Badge, Button, Card, EmptyState, ErrorState, Field, Input, Modal, PageHeader, PageLoader, SearchInput, Select, Textarea } from '@/components/ui'
import { useToast } from '@/app/toast'
import { useProducts, useSaveProduct } from '@/hooks/queries'
import { cn } from '@/lib/cn'
import { moneyExact } from '@/lib/format'
import type { Product, ProductKind } from '@/types/domain'

const th = 'px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-navy-300 uppercase'
const blank = { sku: '', name: '', kind: 'servicio' as ProductKind, category: '', description: '', unitPrice: 0, active: true }

export function ProductsPage() {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState('')
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [form, setForm] = useState(blank)
  const { data, isLoading, isError, refetch } = useProducts({ search, kind })
  const save = useSaveProduct()

  const open = (p: Product | 'new') => {
    setEditing(p)
    setForm(p === 'new' ? blank : { sku: p.sku, name: p.name, kind: p.kind, category: p.category, description: p.description, unitPrice: p.unitPrice, active: p.active })
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    save.mutate({ id: editing && editing !== 'new' ? editing.id : undefined, input: form }, {
      onSuccess: () => { toast.success('Producto guardado'); setEditing(null) },
      onError: (err) => toast.error(err.message),
    })
  }

  const toggleActive = (p: Product) =>
    save.mutate({ id: p.id, input: { ...p, active: !p.active } }, {
      onSuccess: () => toast.success(p.active ? 'Producto desactivado' : 'Producto activado'),
      onError: (err) => toast.error(err.message),
    })

  const categories = [...new Set((data ?? []).map((p) => p.category))]

  return (
    <>
      <PageHeader title="Productos y Servicios" subtitle="Catálogo oficial de precios para todas las cotizaciones." actions={<Button icon={<Plus className="size-4" />} onClick={() => open('new')}>Nuevo producto</Button>} />

      <div className="mb-4 flex items-start gap-3 rounded-2xl bg-flow-50 px-5 py-3.5 text-[13px] text-flow-700">
        <Sparkles className="mt-0.5 size-4 shrink-0" />
        Los precios de este catálogo alimentan las cotizaciones automáticas. La IA solo usa precios y descripciones definidos aquí.
      </div>

      <Card>
        <div className="flex flex-wrap gap-2.5 border-b border-navy-100/70 p-4">
          <SearchInput className="w-full sm:w-72" placeholder="Buscar por nombre o SKU…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select className="w-auto min-w-36 rounded-full" value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">Todos</option><option value="producto">Productos</option><option value="servicio">Servicios</option>
          </Select>
        </div>
        {isError ? <ErrorState onRetry={() => refetch()} /> : isLoading || !data ? <PageLoader /> : data.length === 0 ? <EmptyState title="Sin resultados" /> : (
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[860px] text-[13px]">
              <thead><tr className="border-b border-navy-100/70"><th className={th}>Nombre</th><th className={th}>Categoría</th><th className={`${th} text-right`}>Precio</th><th className={th}>Estado</th><th className={th} /></tr></thead>
              <tbody className="divide-y divide-navy-100/60">
                {data.map((p) => (
                  <tr key={p.id} className="hover:bg-navy-50/50">
                    <td className="px-4 py-3.5"><p className="font-semibold">{p.name}</p><p className="text-xs text-navy-400"><span className="num">{p.sku}</span> · {p.description}</p></td>
                    <td className="px-4 py-3.5"><Badge tone="blue">{p.category}</Badge></td>
                    <td className="num px-4 py-3.5 text-right font-medium">{moneyExact(p.unitPrice)}</td>
                    <td className="px-4 py-3.5"><Badge tone={p.active ? 'green' : 'slate'}>{p.active ? 'Activo' : 'Inactivo'}</Badge></td>
                    <td className="px-4 py-3.5"><div className="flex justify-end gap-2"><Button size="sm" variant="secondary" onClick={() => open(p)}>Editar</Button><Button size="sm" variant="secondary" className={cn(!p.active && 'text-teal-700')} onClick={() => toggleActive(p)}>{p.active ? 'Desactivar' : 'Activar'}</Button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nuevo producto o servicio' : 'Editar producto'} footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button><Button type="submit" form="product-form" loading={save.isPending}>Guardar</Button></>}>
        <form id="product-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="SKU"><Input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="num" /></Field>
          <Field label="Tipo"><Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as ProductKind })}><option value="servicio">Servicio</option><option value="producto">Producto</option></Select></Field>
          <Field label="Nombre" className="sm:col-span-2"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Categoría"><Input required list="categories" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /><datalist id="categories">{categories.map((c) => <option key={c} value={c} />)}</datalist></Field>
          <Field label="Precio unitario (Q)"><Input type="number" min={0} step="0.01" required value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })} className="num" /></Field>
          <Field label="Descripción" className="sm:col-span-2"><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        </form>
      </Modal>
    </>
  )
}
