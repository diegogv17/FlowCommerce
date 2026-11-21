import { useEffect, useState, type FormEvent } from 'react'
import { Button, Field, Input, Modal, Select } from '@/components/ui'
import { useAuth } from '@/app/auth'
import { useToast } from '@/app/toast'
import { useCreateLead, useUpdateLead, useUsers } from '@/hooks/queries'
import { leadSourceOptions } from '@/services/mappers/leads'
import type { Lead, LeadSource } from '@/types/domain'

const empty = { name: '', company: '', email: '', phone: '', source: 'web' as LeadSource, value: '', ownerId: '' }

/** Crea un lead nuevo o, si recibe `lead`, edita uno existente. */
export function NewLeadModal({ open, onClose, lead }: { open: boolean; onClose: () => void; lead?: Lead }) {
  const toast = useToast()
  const { user } = useAuth()
  const users = useUsers()
  const create = useCreateLead()
  const update = useUpdateLead()
  const [form, setForm] = useState(empty)
  const set = (k: keyof typeof empty) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const pending = create.isPending || update.isPending

  useEffect(() => {
    if (!open) return
    setForm(lead ? { name: lead.name, company: lead.company, email: lead.email, phone: lead.phone, source: lead.source, value: String(lead.value), ownerId: lead.ownerId } : empty)
  }, [open, lead])

  const done = (msg: string) => () => {
    toast.success(msg)
    onClose()
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const value = Number(form.value || 0)
    // Al crear, "Asignarme a mí" = el usuario de la sesión. Al editar, '' = sin responsable.
    const input = { ...form, value, ownerId: lead ? form.ownerId : form.ownerId || user?.id }
    if (lead) update.mutate({ id: lead.id, input }, { onSuccess: done('Lead actualizado'), onError: (err) => toast.error(err.message) })
    else create.mutate(input, { onSuccess: done('Lead creado correctamente'), onError: (err) => toast.error(err.message) })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lead ? 'Editar lead' : 'Nuevo lead'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="lead-form" loading={pending}>Guardar lead</Button>
        </>
      }
    >
      <form id="lead-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre completo"><Input required value={form.name} onChange={set('name')} placeholder="Andrea López" /></Field>
        <Field label="Empresa"><Input value={form.company} onChange={set('company')} placeholder="Constructora Nova" /></Field>
        <Field label="Correo"><Input type="email" value={form.email} onChange={set('email')} placeholder="correo@empresa.com" /></Field>
        <Field label="Teléfono"><Input value={form.phone} onChange={set('phone')} placeholder="+502 5555 0000" /></Field>
        <Field label="Fuente">
          <Select value={form.source} onChange={set('source')}>
            {leadSourceOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Valor estimado (Q)"><Input type="number" min={0} value={form.value} onChange={set('value')} placeholder="0" /></Field>
        <Field label="Responsable" className="sm:col-span-2">
          <Select value={form.ownerId} onChange={set('ownerId')}>
            <option value="">{lead ? 'Sin asignar' : 'Asignarme a mí'}</option>
            {users.data?.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        </Field>
      </form>
    </Modal>
  )
}
