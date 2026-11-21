import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, FilePlus2, MessageSquare, NotebookPen, Pencil } from 'lucide-react'
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, ErrorState, PageLoader } from '@/components/ui'
import { toneDot } from '@/components/ui/Badge'
import { useConversations, useLead, useLeadActivity, useNotes, useQuotes, useUpdateLeadStatus } from '@/hooks/queries'
import { cn } from '@/lib/cn'
import { formatDate, formatFollowUp, moneyExact, relativeTime } from '@/lib/format'
import { leadStatusMeta, quoteStatusMeta, sourceLabel } from '@/lib/labels'
import type { Lead, LeadStatus } from '@/types/domain'
import { NewLeadModal } from './NewLeadModal'

const stages: LeadStatus[] = ['nuevo', 'contactado', 'seguimiento', 'cotizacion', 'negociacion', 'ganado']
const tabs = ['Resumen', 'Seguimientos', 'Conversaciones', 'Cotizaciones', 'Actividad'] as const
type Tab = (typeof tabs)[number]

function Stepper({ lead }: { lead: Lead }) {
  const update = useUpdateLeadStatus()
  const current = stages.indexOf(lead.status)
  return (
    <Card className="pb-6">
      <CardHeader title="Etapa comercial" action={lead.status === 'perdido' ? <Badge tone="red">Perdido</Badge> : undefined} />
      <ol className="mt-6 flex items-start px-6">
        {stages.map((s, i) => {
          const done = i < current
          const active = i === current
          return (
            <li key={s} className="flex flex-1 flex-col items-center last:flex-none">
              <div className="flex w-full items-center">
                <button
                  onClick={() => update.mutate({ id: lead.id, status: s })}
                  aria-label={`Mover a ${leadStatusMeta[s].label}`}
                  className={cn('grid size-8 shrink-0 place-items-center rounded-full border-2 text-xs font-semibold transition-colors', done && 'border-teal-500 bg-teal-500 text-white', active && 'border-flow-500 bg-white text-flow-600 ring-4 ring-flow-500/15', !done && !active && 'border-navy-200 bg-white text-navy-300 hover:border-flow-300')}
                >
                  {done ? <Check className="size-4" /> : i + 1}
                </button>
                {i < stages.length - 1 && <div className={cn('mx-1 h-0.5 flex-1 rounded', i < current ? 'bg-teal-500' : 'bg-navy-100')} />}
              </div>
              <span className={cn('mt-2 -ml-1 self-start text-[11px] font-medium', active ? 'text-flow-700' : 'text-navy-400')}>{leadStatusMeta[s].label}</span>
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

export function LeadDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('Resumen')
  const [editing, setEditing] = useState(false)
  const { data: lead, isLoading, isError, refetch } = useLead(id)
  const notes = useNotes({ leadId: id })
  const activity = useLeadActivity(id)
  const conversations = useConversations({ leadId: id })
  const quotes = useQuotes({ search: lead?.company, pageSize: 20 })

  if (isError) return <Card><ErrorState onRetry={() => refetch()} /></Card>
  if (isLoading || !lead) return <PageLoader />

  const meta = leadStatusMeta[lead.status]
  const info: Array<[string, string, boolean?]> = [
    ['Empresa', lead.company],
    ['Correo', lead.email],
    ['Teléfono', lead.phone, true],
    ['Fuente', sourceLabel[lead.source]],
    ['Responsable', lead.ownerName],
    ['Creado', formatDate(lead.createdAt), true],
    ['Último contacto', relativeTime(lead.lastContactAt)],
    ['Próximo seguimiento', formatFollowUp(lead.nextFollowUpAt), true],
  ]

  return (
    <>
      <button onClick={() => navigate('/leads')} className="mb-3 flex items-center gap-1.5 text-xs font-medium text-navy-400 hover:text-navy-900"><ArrowLeft className="size-3.5" /> Volver a Leads</button>

      <Card className="mb-4 p-5">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar name={lead.name} size={56} className="rounded-2xl! bg-flow-500! text-white!" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-[24px] font-semibold">{lead.name}</h1>
              <Badge tone={meta.tone}>{meta.label}</Badge>
            </div>
            <p className="mt-0.5 text-sm text-navy-400">{lead.company} · Responsable: {lead.ownerName}</p>
          </div>
          <div className="pr-2 text-right">
            <p className="text-[10px] font-semibold tracking-[0.12em] text-navy-300 uppercase">Valor estimado</p>
            <p className="num font-display text-2xl font-semibold">{moneyExact(lead.value)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" icon={<Pencil className="size-3.5" />} onClick={() => setEditing(true)}>Editar</Button>
            <Button variant="secondary" size="sm" icon={<MessageSquare className="size-3.5" />} onClick={() => navigate(conversations.data?.[0] ? `/conversaciones/${conversations.data[0].id}` : '/conversaciones')}>Enviar mensaje</Button>
            <Button variant="secondary" size="sm" icon={<NotebookPen className="size-3.5" />} onClick={() => navigate(`/notas?nueva=1&lead=${lead.id}`)}>Registrar seguimiento</Button>
            <Button size="sm" icon={<FilePlus2 className="size-3.5" />} onClick={() => navigate('/cotizaciones/nueva')}>Nueva Cotización</Button>
          </div>
        </div>
      </Card>

      <div className="mb-4 flex gap-1 border-b border-navy-100/70">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={cn('-mb-px border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors', tab === t ? 'border-flow-500 text-flow-700' : 'border-transparent text-navy-400 hover:text-navy-900')}>{t}</button>
        ))}
      </div>

      {tab === 'Resumen' && (
        <div className="space-y-4">
          <Stepper lead={lead} />
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="pb-3">
              <CardHeader title="Información del contacto" />
              <dl className="mt-3 divide-y divide-navy-100/60 px-5">
                {info.map(([k, v, mono]) => (
                  <div key={k} className="flex justify-between gap-4 py-2.5 text-[13px]"><dt className="text-navy-400">{k}</dt><dd className={cn('text-right font-medium', mono && 'num')}>{v}</dd></div>
                ))}
              </dl>
            </Card>
            <Card className="pb-3">
              <CardHeader title="Notas internas" action={<Link to={`/notas?nueva=1&lead=${lead.id}`} className="text-xs font-medium text-flow-600 hover:underline">Agregar</Link>} />
              {!notes.data?.length ? <EmptyState title="Sin notas" text="Aún no hay seguimientos para este lead." /> : (
                <ul className="mt-3 space-y-2 px-5">
                  {notes.data.slice(0, 3).map((n) => (
                    <li key={n.id} className="rounded-xl bg-neutral-light/80 p-3.5 text-[13px]">
                      <p>{n.body}</p>
                      <p className="mt-1.5 text-xs text-navy-300">{n.authorName} · {relativeTime(n.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}

      {tab === 'Seguimientos' && (
        <Card className="pb-2">
          {!notes.data?.length ? <EmptyState title="Sin seguimientos" text="Registra el primero para no perder el hilo." action={<Button size="sm" onClick={() => navigate(`/notas?nueva=1&lead=${lead.id}`)}>Registrar seguimiento</Button>} /> : (
            <ul className="divide-y divide-navy-100/60 px-2">
              {notes.data.map((n) => (
                <li key={n.id} className="flex items-start gap-3 rounded-xl px-3 py-3.5">
                  <span className={cn('mt-0.5 grid size-6 place-items-center rounded-full', n.done ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-600')}><Check className="size-3.5" /></span>
                  <div className="flex-1"><p className="text-[13px]">{n.body}</p><p className="mt-1 text-xs text-navy-300">{n.authorName} · {relativeTime(n.createdAt)}</p></div>
                  {n.followUpAt && <span className="num text-xs font-medium text-amber-600">{formatFollowUp(n.followUpAt)}</span>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === 'Conversaciones' && (
        <Card className="pb-2">
          {!conversations.data?.length ? <EmptyState title="Sin conversaciones" text="Este lead aún no ha escrito por ningún canal." /> : (
            <ul className="divide-y divide-navy-100/60 px-2">
              {conversations.data.map((c) => (
                <li key={c.id}><Link to={`/conversaciones/${c.id}`} className="flex items-center gap-3 rounded-xl px-3 py-3.5 hover:bg-navy-50/60"><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium">{c.lastMessage}</p><p className="text-xs text-navy-400">{relativeTime(c.lastMessageAt)}</p></div>{c.unread > 0 && <Badge tone="green">{c.unread} nuevos</Badge>}</Link></li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === 'Cotizaciones' && (
        <Card className="pb-2">
          {!quotes.data?.data.length ? <EmptyState title="Sin cotizaciones" text="Crea una cotización para este lead." action={<Button size="sm" onClick={() => navigate('/cotizaciones/nueva')}>Nueva Cotización</Button>} /> : (
            <ul className="divide-y divide-navy-100/60 px-2">
              {quotes.data.data.map((q) => (
                <li key={q.id}><Link to={`/cotizaciones/${q.id}`} className="flex items-center gap-4 rounded-xl px-3 py-3.5 hover:bg-navy-50/60"><span className="num w-20 text-[13px] font-medium text-flow-600">{q.folio}</span><span className="num flex-1 text-xs text-navy-400">{formatDate(q.issuedAt)}</span><Badge tone={quoteStatusMeta[q.status].tone} dot>{quoteStatusMeta[q.status].label}</Badge><span className="num w-32 text-right text-[13px] font-medium">{moneyExact(q.total)}</span></Link></li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === 'Actividad' && (
        <Card className="pb-3">
          <ul className="px-5 pt-4">
            {activity.data?.map((a) => (
              <li key={a.id} className="flex gap-3 py-3"><span className={cn('mt-1.5 size-2.5 shrink-0 rounded-full', toneDot[a.tone])} /><div><p className="text-[13px] font-semibold">{a.title}</p><p className="text-xs text-navy-500">{a.detail}</p><p className="mt-0.5 text-[11px] text-navy-300">{relativeTime(a.at)}</p></div></li>
            ))}
          </ul>
        </Card>
      )}

      <NewLeadModal open={editing} onClose={() => setEditing(false)} lead={lead} />
    </>
  )
}
