import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Avatar, Button, Card, EmptyState, ErrorState, Field, Input, Modal, PageHeader, PageLoader, Pagination, SearchInput } from '@/components/ui'
import { useToast } from '@/app/toast'
import { useCreateCustomer, useCustomers, useCustomersSummary } from '@/hooks/queries'
import { money, relativeTime } from '@/lib/format'

const th = 'px-4 py-3 text-left text-[11px] font-semibold tracking-wider text-navy-300 uppercase'
const emptyForm = { name: '', nit: '', contactName: '', contactRole: '', email: '', phone: '', address: '' }

export function CustomersPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(params.get('nuevo') === '1')
  const [form, setForm] = useState(emptyForm)
  const create = useCreateCustomer()
  const summary = useCustomersSummary()
  const { data, isLoading, isError, refetch } = useCustomers({ search: debounced, page, pageSize: 8 })

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (params.get('nuevo') === '1') {
      setModal(true)
      params.delete('nuevo')
      setParams(params, { replace: true })
    }
  }, [params, setParams])

  const set = (k: keyof typeof emptyForm) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const submit = (e: FormEvent) => {
    e.preventDefault()
    create.mutate(form, {
      onSuccess: () => { toast.success('Cliente creado'); setForm(emptyForm); setModal(false) },
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <>
      <PageHeader title="Clientes" subtitle={summary.data ? `${summary.data.active} clientes activos · ${money(summary.data.billedThisYear)} facturados este año` : ' '} actions={<Button icon={<Plus className="size-4" />} onClick={() => setModal(true)}>Nuevo Cliente</Button>} />
      <Card>
        <div className="border-b border-navy-100/70 p-4"><SearchInput className="w-full sm:w-80" placeholder="Buscar por nombre, contacto o NIT…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} /></div>
        {isError ? <ErrorState onRetry={() => refetch()} /> : isLoading || !data ? <PageLoader /> : data.data.length === 0 ? <EmptyState title="Sin clientes" text="Agrega tu primer cliente para generar cotizaciones." /> : (
          <>
            <div className="scroll-thin overflow-x-auto">
              <table className="w-full min-w-[920px] text-[13px]">
                <thead><tr className="border-b border-navy-100/70"><th className={th}>Cliente</th><th className={th}>Contacto</th><th className={`${th} text-center`}>Operaciones</th><th className={`${th} text-right`}>Ventas</th><th className={th}>Última actividad</th><th className={th}>Responsable</th><th className={th} /></tr></thead>
                <tbody className="divide-y divide-navy-100/60">
                  {data.data.map((c) => (
                    <tr key={c.id} onClick={() => navigate(`/clientes/${c.id}`)} className="cursor-pointer hover:bg-navy-50/60">
                      <td className="px-4 py-3.5"><div className="flex items-center gap-3"><Avatar name={c.contactName} size={34} className="bg-teal-500! text-white!" /><div><p className="font-semibold">{c.contactName}</p><p className="text-xs text-navy-400">{c.name}</p></div></div></td>
                      <td className="px-4 py-3.5"><p>{c.email}</p><p className="num text-xs text-navy-400">{c.phone}</p></td>
                      <td className="num px-4 py-3.5 text-center font-medium">{c.quotesCount}</td>
                      <td className="num px-4 py-3.5 text-right font-semibold text-teal-600">{money(c.totalSold)}</td>
                      <td className="px-4 py-3.5 text-navy-500">{relativeTime(c.lastActivityAt)}</td>
                      <td className="px-4 py-3.5 text-navy-600">{c.ownerName}</td>
                      <td className="px-4 py-3.5 text-right"><span className="rounded-full bg-flow-50 px-3.5 py-1.5 text-xs font-medium text-flow-700">Ver ficha</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.meta.page} pageSize={data.meta.pageSize} total={data.meta.total} onPage={setPage} noun="clientes" />
          </>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo cliente" footer={<><Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button><Button type="submit" form="new-customer" loading={create.isPending}>Guardar cliente</Button></>}>
        <form id="new-customer" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Razón social" className="sm:col-span-2"><Input required value={form.name} onChange={set('name')} placeholder="Distribuidora Altamira, S.A." /></Field>
          <Field label="NIT"><Input required value={form.nit} onChange={set('nit')} placeholder="1234567-8" className="num" /></Field>
          <Field label="Teléfono"><Input value={form.phone} onChange={set('phone')} placeholder="+502 2200 0000" /></Field>
          <Field label="Contacto"><Input required value={form.contactName} onChange={set('contactName')} /></Field>
          <Field label="Cargo"><Input value={form.contactRole} onChange={set('contactRole')} /></Field>
          <Field label="Correo" className="sm:col-span-2"><Input type="email" value={form.email} onChange={set('email')} /></Field>
          <Field label="Dirección" className="sm:col-span-2"><Input value={form.address} onChange={set('address')} /></Field>
        </form>
      </Modal>
    </>
  )
}
