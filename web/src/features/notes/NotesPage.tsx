import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CalendarClock, Check, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, Card, EmptyState, ErrorState, Field, IconButton, Modal, PageHeader, PageLoader, Segmented, Select, Textarea, Input } from '@/components/ui'
import { useToast } from '@/app/toast'
import { useCreateNote, useDeleteNote, useLead, useLeads, useNotes, useUpdateNote } from '@/hooks/queries'
import { cn } from '@/lib/cn'
import { formatFollowUp, relativeTime } from '@/lib/format'
import type { NoteType } from '@/types/domain'

const typeLabel: Record<NoteType, string> = {
  TASK: 'Tarea',
  CALL: 'Llamada',
  MEETING: 'Reunión',
  EMAIL: 'Correo',
  WHATSAPP: 'WhatsApp',
}

export function NotesPage() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<'pendientes' | 'hechas' | 'todas'>('pendientes')
  const [modal, setModal] = useState(params.get('nueva') === '1')
  const [body, setBody] = useState('')
  const [leadId, setLeadId] = useState(params.get('lead') ?? '')
  const [type, setType] = useState<NoteType>('TASK')
  const [followUpAt, setFollowUpAt] = useState('')
  const { data, isLoading, isError, refetch } = useNotes({ done: filter === 'todas' ? undefined : filter === 'hechas' })
  const leads = useLeads({ pageSize: 100 })
  const inList = !leadId || !!leads.data?.data.some((l) => l.id === leadId)
  // Si se llega desde un lead que no está entre los primeros 100, se carga aparte para el select.
  const preselected = useLead(!inList && leads.data ? leadId : undefined)
  const create = useCreateNote()
  const update = useUpdateNote()
  const remove = useDeleteNote()

  useEffect(() => {
    if (params.get('nueva') === '1') {
      setModal(true)
      params.delete('nueva')
      if (params.get('lead')) setLeadId(params.get('lead')!)
      params.delete('lead')
      setParams(params, { replace: true })
    }
  }, [params, setParams])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    create.mutate({ body, leadId, type, followUpAt: new Date(followUpAt).toISOString() }, {
      onSuccess: () => { toast.success('Seguimiento guardado'); setBody(''); setLeadId(''); setType('TASK'); setFollowUpAt(''); setModal(false) },
      onError: (err) => toast.error(err.message),
    })
  }

  const leadOptions = [...(leads.data?.data ?? [])]
  if (preselected.data && !leadOptions.some((l) => l.id === preselected.data.id)) leadOptions.unshift(preselected.data)

  return (
    <>
      <PageHeader title="Notas y seguimientos" subtitle="Recordatorios y acuerdos con tus leads." actions={<><Segmented value={filter} onChange={setFilter} options={[{ value: 'pendientes', label: 'Pendientes' }, { value: 'hechas', label: 'Hechas' }, { value: 'todas', label: 'Todas' }]} /><Button icon={<Plus className="size-4" />} onClick={() => setModal(true)}>Nuevo seguimiento</Button></>} />

      {isError ? <Card><ErrorState onRetry={() => refetch()} /></Card> : isLoading || !data ? <PageLoader /> : data.length === 0 ? <Card><EmptyState title="Sin seguimientos" text="Registra un seguimiento para no perder el hilo con tus leads." /></Card> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.map((n) => {
            const closed = n.done || n.cancelled
            return (
              <Card key={n.id} className={cn('flex flex-col p-5', closed && 'opacity-70')}>
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    {n.leadId && n.leadName ? <Link to={`/leads/${n.leadId}`}><Badge tone="blue">{n.leadName}</Badge></Link> : <Badge>General</Badge>}
                    {n.type && <Badge>{typeLabel[n.type]}</Badge>}
                    {n.cancelled && <Badge tone="red">Cancelado</Badge>}
                  </div>
                  <IconButton aria-label="Eliminar" className="-mt-1 -mr-2 size-8 hover:bg-red-50 hover:text-red-500" onClick={() => remove.mutate(n.id, { onError: (err) => toast.error(err.message) })}><Trash2 className="size-4" /></IconButton>
                </div>
                <p className={cn('flex-1 text-[13.5px] leading-relaxed whitespace-pre-line', closed && 'line-through')}>{n.body}</p>
                {n.outcome && <p className="mt-2 text-xs text-navy-500">Resultado: {n.outcome}</p>}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-navy-100/70 pt-3 text-xs text-navy-400">
                  <span className="min-w-0 truncate">{n.authorName} · {relativeTime(n.createdAt)}</span>
                  {n.followUpAt && <span className={cn('num flex shrink-0 items-center gap-1 font-medium', n.overdue ? 'text-red-500' : 'text-amber-600')} title={n.overdue ? 'Vencido' : undefined}><CalendarClock className="size-3.5" />{formatFollowUp(n.followUpAt)}</span>}
                </div>
                {closed ? (
                  <Button variant="secondary" size="sm" className="mt-3" icon={n.done ? <Check className="size-3.5" /> : undefined} disabled title="Los seguimientos completados o cancelados no se pueden reabrir. Registra uno nuevo.">
                    {n.done ? 'Completado' : 'Cancelado'}
                  </Button>
                ) : (
                  <Button variant="success" size="sm" className="mt-3" icon={<Check className="size-3.5" />} loading={update.isPending && update.variables?.id === n.id} onClick={() => update.mutate({ id: n.id, done: true }, { onSuccess: () => toast.success('Seguimiento completado'), onError: (err) => toast.error(err.message) })}>Marcar como hecha</Button>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo seguimiento" footer={<><Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button><Button type="submit" form="note-form" loading={create.isPending}>Guardar</Button></>}>
        <form id="note-form" onSubmit={submit} className="space-y-4">
          <Field label="Lead">
            <Select required value={leadId} onChange={(e) => setLeadId(e.target.value)}>
              <option value="">{leads.isLoading ? 'Cargando leads…' : leadOptions.length ? 'Selecciona un lead' : 'Primero registra un lead'}</option>
              {leadOptions.map((l) => <option key={l.id} value={l.id}>{l.company ? `${l.name} · ${l.company}` : l.name}</option>)}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo">
              <Select value={type} onChange={(e) => setType(e.target.value as NoteType)}>
                {Object.entries(typeLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
            <Field label="Fecha de seguimiento"><Input required type="datetime-local" value={followUpAt} onChange={(e) => setFollowUpAt(e.target.value)} /></Field>
          </div>
          <Field label="Nota"><Textarea required rows={4} maxLength={5000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="¿Qué acordaste o qué debes hacer?" /></Field>
        </form>
      </Modal>
    </>
  )
}
