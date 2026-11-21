import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarClock, Check, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, Card, EmptyState, ErrorState, Field, IconButton, Modal, PageHeader, PageLoader, Segmented, Select, Textarea, Input } from '@/components/ui'
import { useToast } from '@/app/toast'
import { useCreateNote, useDeleteNote, useLeads, useNotes, useUpdateNote } from '@/hooks/queries'
import { cn } from '@/lib/cn'
import { formatFollowUp, relativeTime } from '@/lib/format'

export function NotesPage() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<'pendientes' | 'hechas' | 'todas'>('pendientes')
  const [modal, setModal] = useState(params.get('nueva') === '1')
  const [body, setBody] = useState('')
  const [leadId, setLeadId] = useState(params.get('lead') ?? '')
  const [followUpAt, setFollowUpAt] = useState('')
  const { data, isLoading, isError, refetch } = useNotes({ done: filter === 'todas' ? undefined : filter === 'hechas' })
  const leads = useLeads({ pageSize: 100 })
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
    create.mutate({ body, leadId: leadId || null, followUpAt: followUpAt ? new Date(followUpAt).toISOString() : null }, {
      onSuccess: () => { toast.success('Nota guardada'); setBody(''); setLeadId(''); setFollowUpAt(''); setModal(false) },
      onError: (err) => toast.error(err.message),
    })
  }

  return (
    <>
      <PageHeader title="Notas y seguimientos" subtitle="Recordatorios y acuerdos con tus leads." actions={<><Segmented value={filter} onChange={setFilter} options={[{ value: 'pendientes', label: 'Pendientes' }, { value: 'hechas', label: 'Hechas' }, { value: 'todas', label: 'Todas' }]} /><Button icon={<Plus className="size-4" />} onClick={() => setModal(true)}>Nueva Nota</Button></>} />

      {isError ? <Card><ErrorState onRetry={() => refetch()} /></Card> : isLoading || !data ? <PageLoader /> : data.length === 0 ? <Card><EmptyState title="Sin notas" text="Registra un seguimiento para no perder el hilo con tus leads." /></Card> : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.map((n) => (
            <Card key={n.id} className={cn('flex flex-col p-5', n.done && 'opacity-70')}>
              <div className="mb-3 flex items-start justify-between gap-2">
                {n.leadName ? <Badge tone="blue">{n.leadName}</Badge> : <Badge>General</Badge>}
                <IconButton aria-label="Eliminar" className="-mt-1 -mr-2 size-8 hover:bg-red-50 hover:text-red-500" onClick={() => remove.mutate(n.id)}><Trash2 className="size-4" /></IconButton>
              </div>
              <p className={cn('flex-1 text-[13.5px] leading-relaxed', n.done && 'line-through')}>{n.body}</p>
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-navy-100/70 pt-3 text-xs text-navy-400">
                <span className="min-w-0 truncate">{n.authorName} · {relativeTime(n.createdAt)}</span>
                {n.followUpAt && <span className="num flex shrink-0 items-center gap-1 font-medium text-amber-600"><CalendarClock className="size-3.5" />{formatFollowUp(n.followUpAt)}</span>}
              </div>
              <Button variant={n.done ? 'secondary' : 'success'} size="sm" className="mt-3" icon={<Check className="size-3.5" />} onClick={() => update.mutate({ id: n.id, done: !n.done })}>{n.done ? 'Reabrir' : 'Marcar como hecha'}</Button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Nueva nota" footer={<><Button variant="ghost" onClick={() => setModal(false)}>Cancelar</Button><Button type="submit" form="note-form" loading={create.isPending}>Guardar</Button></>}>
        <form id="note-form" onSubmit={submit} className="space-y-4">
          <Field label="Nota"><Textarea required rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="¿Qué acordaste o qué debes hacer?" /></Field>
          <Field label="Lead relacionado (opcional)"><Select value={leadId} onChange={(e) => setLeadId(e.target.value)}><option value="">Sin lead</option>{leads.data?.data.map((l) => <option key={l.id} value={l.id}>{l.name} · {l.company}</option>)}</Select></Field>
          <Field label="Fecha de seguimiento (opcional)"><Input type="datetime-local" value={followUpAt} onChange={(e) => setFollowUpAt(e.target.value)} /></Field>
        </form>
      </Modal>
    </>
  )
}
