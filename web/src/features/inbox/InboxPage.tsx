import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, Bot, Camera, Check, Clock, FileText, Globe, Mail, MessageCircle, MessageSquareText, MessagesSquare, Paperclip, RefreshCw, Send, Sparkles } from 'lucide-react'
import { Avatar, Badge, Button, Card, EmptyState, ErrorState, Field, Input, Select, Spinner, Toggle } from '@/components/ui'
import { useToast } from '@/app/toast'
import {
  useAiSettings,
  useAiSuggestions,
  useConversations,
  useLead,
  useLeadInsight,
  useMarkRead,
  useMessages,
  useSendMessage,
  useSendTemplate,
  useToggleConversationAi,
  useWhatsAppTemplates,
} from '@/hooks/queries'
import { SearchInput } from '@/components/ui'
import { conversationsService } from '@/services'
import { errorMessage } from '@/services/http'
import { cn } from '@/lib/cn'
import { formatFollowUp, formatTime, moneyExact, relativeTime } from '@/lib/format'
import { channelLabel, leadStatusMeta } from '@/lib/labels'
import type { AiSuggestion, Channel, Conversation, Message, MessageDelivery } from '@/types/domain'

const channelIcon: Record<Channel, typeof MessageCircle> = {
  whatsapp: MessageCircle,
  instagram: Camera,
  facebook: MessageSquareText,
  email: Mail,
  web: Globe,
}

const channelColor: Record<Channel, string> = {
  whatsapp: 'bg-teal-50 text-teal-600',
  instagram: 'bg-violet-50 text-violet-600',
  facebook: 'bg-flow-50 text-flow-600',
  email: 'bg-amber-50 text-amber-600',
  web: 'bg-cyan-50 text-cyan-600',
}

const deliveryLabel: Record<MessageDelivery, string> = {
  enviando: 'Enviando',
  enviado: 'Enviado',
  entregado: 'Entregado',
  leido: 'Leído',
  fallido: 'No entregado',
}

/** ¿Se puede escribir texto libre? WhatsApp solo lo permite 24 h después del último mensaje del cliente. */
function windowState(c: Conversation): 'abierta' | 'cerrada' | 'desconocida' {
  if (c.windowOpenUntil === undefined) return 'desconocida'
  if (!c.windowOpenUntil) return 'cerrada'
  return new Date(c.windowOpenUntil).getTime() > Date.now() ? 'abierta' : 'cerrada'
}

function ChannelDot({ channel }: { channel: Channel }) {
  const Icon = channelIcon[channel]
  return (
    <span className={cn('grid size-5 place-items-center rounded-full ring-2 ring-white', channelColor[channel])} title={channelLabel[channel]}>
      <Icon className="size-3" />
    </span>
  )
}

function ConversationList({ items, activeId, onSelect }: { items: Conversation[]; activeId?: string; onSelect: (id: string) => void }) {
  return (
    <ul className="scroll-thin flex-1 divide-y divide-navy-100/60 overflow-y-auto">
      {items.map((c) => (
        <li key={c.id}>
          <button onClick={() => onSelect(c.id)} className={cn('flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-navy-50/70', activeId === c.id && 'bg-flow-50/70')}>
            <div className="relative">
              <Avatar name={c.contactName} size={40} />
              <span className="absolute -right-1 -bottom-1"><ChannelDot channel={c.channel} /></span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className={cn('truncate text-[13px]', c.unread ? 'font-semibold' : 'font-medium')}>{c.contactName}</p>
                <span className="shrink-0 text-[11px] text-navy-300">{relativeTime(c.lastMessageAt)}</span>
              </div>
              <p className="truncate text-xs text-navy-400">{c.company || c.phone}</p>
              <div className="mt-1 flex items-center gap-2">
                <p className={cn('flex-1 truncate text-xs', c.unread ? 'text-navy-700' : 'text-navy-400')}>{c.lastMessage}</p>
                {c.aiEnabled && <Bot className="size-3.5 shrink-0 text-flow-500" aria-label="Sugerencias de IA activas" />}
                {c.unread > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-teal-500 px-1.5 text-[11px] font-semibold text-white">{c.unread}</span>}
              </div>
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}

function Bubble({ m }: { m: Message }) {
  const toast = useToast()
  const mine = m.author !== 'lead'
  const ai = m.author === 'ai'
  const failed = m.delivery === 'fallido'
  const download = () =>
    conversationsService.downloadAttachment(m.attachmentId!, m.text.replace(/^\[[^\]]+\]\s*/, '') || 'archivo').catch((e) => toast.error(errorMessage(e)))
  return (
    <div className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[78%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap',
          mine ? (ai ? 'rounded-br-md bg-violet-50 text-navy-900' : 'rounded-br-md bg-flow-500 text-white') : 'rounded-bl-md bg-white text-navy-900 shadow-card',
          failed && 'opacity-70',
        )}
      >
        {m.templateName && <p className={cn('mb-1 flex items-center gap-1 text-[11px] font-semibold', mine && !ai ? 'text-white/80' : 'text-navy-400')}><FileText className="size-3" /> Plantilla · {m.templateName}</p>}
        {m.text}
        {m.attachmentId && (
          <button onClick={download} className={cn('mt-1.5 flex items-center gap-1.5 text-xs font-medium underline-offset-2 hover:underline', mine && !ai ? 'text-white' : 'text-flow-600')}>
            <Paperclip className="size-3.5" /> Ver archivo
          </button>
        )}
      </div>
      <p className="mt-1 flex items-center gap-1.5 px-1 text-[11px] text-navy-300">
        {ai && <Sparkles className="size-3 text-violet-500" />}
        {m.authorName} · <span className="num">{formatTime(m.createdAt)}</span>
        {m.delivery && <span className={cn(failed && 'font-medium text-red-500')}>· {deliveryLabel[m.delivery]}</span>}
      </p>
      {failed && m.errorMessage && <p className="max-w-[78%] px-1 text-right text-[11px] text-red-500">{m.errorMessage}</p>}
    </div>
  )
}

function InsightCard({ leadId }: { leadId: string }) {
  const [requested, setRequested] = useState(false)
  const { data, isFetching, isError, error, refetch } = useLeadInsight(leadId, requested)

  useEffect(() => setRequested(false), [leadId])

  if (!requested) {
    return (
      <Button variant="secondary" size="sm" className="w-full" icon={<Sparkles className="size-3.5 text-violet-500" />} onClick={() => setRequested(true)}>
        Analizar lead con IA
      </Button>
    )
  }
  if (isFetching && !data) return <div className="grid place-items-center rounded-xl border border-violet-100 bg-violet-50/40 py-6"><Spinner /></div>
  if (isError) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50/50 p-3 text-xs text-red-600">
        <p>{errorMessage(error)}</p>
        <button className="mt-1.5 font-medium underline" onClick={() => refetch()}>Reintentar</button>
      </div>
    )
  }
  if (!data) return null
  return (
    <div className="space-y-2.5 rounded-xl border border-violet-100 bg-violet-50/40 p-3 text-[12.5px]">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-violet-600"><Sparkles className="size-3.5" /> Insight de IA</p>
        <Badge tone={data.closeProbability >= 60 ? 'green' : data.closeProbability >= 30 ? 'amber' : 'red'}>{Math.round(data.closeProbability)}% cierre</Badge>
      </div>
      <p className="text-navy-700">{data.summary}</p>
      <div>
        <p className="text-[11px] font-semibold tracking-wide text-navy-300 uppercase">Siguiente paso</p>
        <p className="text-navy-700">{data.nextBestAction}</p>
      </div>
      {data.risks.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-navy-300 uppercase">Riesgos</p>
          <ul className="list-disc space-y-0.5 pl-4 text-navy-600">{data.risks.map((r) => <li key={r}>{r}</li>)}</ul>
        </div>
      )}
      <p className="text-[11px] text-navy-400">Seguimiento sugerido en {data.suggestedFollowUpDays} {data.suggestedFollowUpDays === 1 ? 'día' : 'días'} · {relativeTime(data.generatedAt)}</p>
    </div>
  )
}

function LeadPanel({ conversation }: { conversation: Conversation }) {
  const { data: lead } = useLead(conversation.leadId)
  if (!lead) return <div className="grid h-full place-items-center"><Spinner /></div>
  const st = leadStatusMeta[lead.status]
  const rows: Array<[string, string]> = [
    ['Etapa', st.label],
    ['Responsable', lead.ownerName],
    ['Valor estimado', moneyExact(lead.value)],
    ['Último contacto', relativeTime(lead.lastContactAt)],
    ['Próximo seguimiento', formatFollowUp(lead.nextFollowUpAt)],
  ]
  return (
    <div className="scroll-thin flex h-full flex-col overflow-y-auto p-5">
      <div className="flex flex-col items-center text-center">
        <Avatar name={lead.name} size={64} />
        <p className="mt-3 font-display text-base font-semibold">{lead.name}</p>
        <p className="text-xs text-navy-400">{lead.company}</p>
        <Badge tone={st.tone} className="mt-2.5">{st.label}</Badge>
      </div>
      <dl className="mt-5 divide-y divide-navy-100/60 text-[13px]">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 py-2.5"><dt className="text-navy-400">{k}</dt><dd className="num text-right font-medium">{v}</dd></div>
        ))}
      </dl>
      <div className="mt-5 space-y-1 text-[13px]">
        <p className="text-xs font-semibold tracking-wide text-navy-300 uppercase">Contacto</p>
        <p className="truncate">{lead.email || '—'}</p>
        <p className="num text-navy-500">{lead.phone || 'Sin teléfono'}</p>
      </div>
      <div className="mt-5"><InsightCard leadId={lead.id} /></div>
      <Link to={`/leads/${lead.id}`} className="mt-auto pt-6"><Button className="w-full">Abrir lead</Button></Link>
    </div>
  )
}

/** Envío de una plantilla aprobada por Meta (única opción con la ventana de 24 h cerrada). */
function TemplatePanel({ conversation, onClose }: { conversation: Conversation; onClose?: () => void }) {
  const toast = useToast()
  const { data: templates, isLoading, isError, error } = useWhatsAppTemplates(true)
  const send = useSendTemplate(conversation.id)
  const usable = useMemo(() => (templates ?? []).filter((t) => !t.headerNeedsParameters), [templates])
  const [selected, setSelected] = useState('')
  const [params, setParams] = useState<string[]>([])
  const template = usable.find((t) => `${t.name}|${t.language}` === selected)

  useEffect(() => {
    setParams(Array.from({ length: template?.bodyParameterCount ?? 0 }, (_, i) => (i === 0 ? conversation.contactName.split(' ')[0] ?? '' : '')))
  }, [template, conversation.contactName])

  const previewText = template?.bodyText?.replace(/\{\{(\d+)\}\}/g, (m, i: string) => params[Number(i) - 1]?.trim() || m) ?? ''
  const ready = !!template && params.every((p) => p.trim())

  const submit = () => {
    if (!template) return
    send.mutate(
      { name: template.name, language: template.language, parameters: params.map((p) => p.trim()) },
      {
        onSuccess: () => {
          toast.success('Plantilla enviada')
          setSelected('')
          onClose?.()
        },
        onError: (e) => toast.error(e.message),
      },
    )
  }

  if (isLoading) return <div className="grid place-items-center py-4"><Spinner /></div>
  if (isError) return <p className="rounded-xl bg-red-50/60 p-3 text-xs text-red-600">{errorMessage(error)}</p>
  if (usable.length === 0) return <p className="rounded-xl bg-navy-50 p-3 text-xs text-navy-500">No hay plantillas aprobadas que se puedan enviar desde el CRM. Créalas en el WhatsApp Manager de Meta.</p>

  return (
    <div className="space-y-2.5 rounded-xl border border-navy-100 bg-white p-3">
      <Field label="Plantilla aprobada">
        <Select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Selecciona una plantilla…</option>
          {usable.map((t) => <option key={`${t.name}|${t.language}`} value={`${t.name}|${t.language}`}>{t.name} ({t.language})</option>)}
        </Select>
      </Field>
      {template && (
        <>
          {params.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {params.map((p, i) => (
                <Input key={i} placeholder={`Valor de {{${i + 1}}}`} value={p} onChange={(e) => setParams(params.map((x, j) => (j === i ? e.target.value : x)))} />
              ))}
            </div>
          )}
          {previewText && <p className="rounded-xl bg-neutral-light px-3 py-2 text-[13px] whitespace-pre-wrap text-navy-700">{previewText}</p>}
        </>
      )}
      <div className="flex justify-end gap-2">
        {onClose && <Button size="sm" variant="secondary" onClick={onClose}>Cancelar</Button>}
        <Button size="sm" icon={<Send className="size-3.5" />} disabled={!ready} loading={send.isPending} onClick={submit}>Enviar plantilla</Button>
      </div>
    </div>
  )
}

function Thread({ conversation }: { conversation: Conversation }) {
  const toast = useToast()
  const { data: messages, isLoading, isError, refetch } = useMessages(conversation.id)
  const send = useSendMessage(conversation.id)
  const suggest = useAiSuggestions()
  const toggleAi = useToggleConversationAi()
  const markRead = useMarkRead()
  const aiSettings = useAiSettings()
  const [text, setText] = useState('')
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const window24 = windowState(conversation)
  const closed = window24 === 'cerrada'
  const assistantOn = aiSettings.data?.enabled !== false
  const canSuggest = assistantOn && conversation.aiEnabled

  useEffect(() => {
    setText('')
    setSuggestions([])
    setShowTemplates(false)
    // Los permisos de solo lectura no pueden marcar como leído: se ignora el error.
    if (conversation.unread > 0) markRead.mutate(conversation.id, { onError: () => undefined })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages?.length])

  const generate = () =>
    suggest.mutate(conversation.id, {
      onSuccess: (list) => {
        setSuggestions(list)
        if (list.length === 0) toast.error('La IA no devolvió sugerencias. Intenta de nuevo.')
      },
      onError: (e) => toast.error(errorMessage(e) || 'No se pudieron generar sugerencias'),
    })

  const submit = (value = text, author: 'agent' | 'ai' = 'agent') => {
    const body = value.trim()
    if (!body || closed) return
    send.mutate({ text: body, author }, {
      onSuccess: () => {
        setText('')
        setSuggestions([])
      },
      onError: (e) => toast.error(e.message),
    })
  }

  const suggestTitle = !assistantOn
    ? 'El asistente está desactivado en Configuración → IA'
    : !conversation.aiEnabled
      ? 'Activa las sugerencias de IA para este chat'
      : undefined

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-navy-100/70 px-5 py-3.5">
        <Avatar name={conversation.contactName} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[15px] font-semibold">{conversation.contactName}</p>
          <p className="flex items-center gap-1.5 truncate text-xs text-navy-400">
            <span className={cn('size-1.5 rounded-full', closed ? 'bg-navy-300' : 'bg-teal-500')} />
            {[conversation.phone, conversation.company, channelLabel[conversation.channel]].filter(Boolean).join(' · ')}
          </p>
        </div>
        <label className="flex items-center gap-2.5 text-xs font-medium text-navy-500" title="Preferencia guardada en este navegador">
          <Bot className="size-4 text-flow-500" />
          <span className="hidden sm:inline">Sugerencias con IA</span>
          <Toggle checked={conversation.aiEnabled} label="Sugerencias con IA" onChange={(v) => toggleAi.mutate({ id: conversation.id, aiEnabled: v })} />
        </label>
      </div>

      <div className="scroll-thin flex-1 space-y-4 overflow-y-auto bg-neutral-light/70 px-5 py-5">
        {isLoading ? (
          <div className="grid h-full place-items-center"><Spinner /></div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : messages && messages.length === 0 ? (
          <EmptyState title="Sin mensajes" text="Todavía no hay mensajes con este lead. Para iniciar la conversación usa una plantilla aprobada." />
        ) : (
          messages?.map((m) => <Bubble key={m.id} m={m} />)
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-navy-100/70 p-4">
        {closed && (
          <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800">
            <Clock className="mt-0.5 size-4 shrink-0" />
            <p>
              {conversation.windowOpenUntil
                ? `La ventana de 24 h de WhatsApp se cerró ${relativeTime(conversation.windowOpenUntil)}.`
                : 'Este cliente aún no ha escrito por WhatsApp.'}{' '}
              Solo se pueden enviar plantillas aprobadas hasta que vuelva a responder.
            </p>
          </div>
        )}

        {(closed || showTemplates) && (
          <div className="mb-3">
            <TemplatePanel conversation={conversation} onClose={closed ? undefined : () => setShowTemplates(false)} />
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="scroll-thin mb-3 max-h-56 space-y-2 overflow-y-auto pr-1">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-violet-600"><Sparkles className="size-3.5" /> Sugerencias de respuesta</p>
            {suggestions.map((s) => (
              <div key={s.id} className="rounded-xl border border-violet-100 bg-violet-50/50 p-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <Badge tone="violet">{s.intent}</Badge>
                  {s.confidence !== undefined && <span className="num text-[11px] text-navy-300">{Math.round(s.confidence * 100)}% de confianza</span>}
                </div>
                <p className="text-[13px] text-navy-700">{s.text}</p>
                <div className="mt-2.5 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setText(s.text)}>Editar</Button>
                  <Button size="sm" icon={<Check className="size-3.5" />} disabled={closed} title={closed ? 'Ventana de 24 h cerrada' : undefined} onClick={() => submit(s.text, 'ai')}>Enviar</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!closed && (
          <div className="flex items-end gap-2.5">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  submit()
                }
              }}
              rows={2}
              maxLength={4096}
              placeholder="Escribe un mensaje…"
              className="min-h-12 flex-1 resize-none rounded-2xl border border-navy-100 bg-white px-4 py-3 text-sm placeholder:text-navy-300 focus:border-flow-500 focus:ring-4 focus:ring-flow-500/10 focus:outline-none"
            />
            <div className="flex flex-col gap-2">
              <Button variant="secondary" size="sm" className="border-teal-500/40 text-teal-700 hover:bg-teal-50" onClick={generate} loading={suggest.isPending} disabled={!canSuggest} title={suggestTitle} icon={suggestions.length ? <RefreshCw className="size-3.5" /> : <Sparkles className="size-3.5 text-teal-600" />}>
                Sugerir respuesta
              </Button>
              <Button size="sm" onClick={() => submit()} loading={send.isPending} icon={<Send className="size-3.5" />}>Enviar</Button>
            </div>
          </div>
        )}

        {!closed && !showTemplates && (
          <button className="mt-2 flex items-center gap-1.5 text-xs font-medium text-navy-400 hover:text-navy-700" onClick={() => setShowTemplates(true)}>
            <FileText className="size-3.5" /> Usar una plantilla de WhatsApp
          </button>
        )}
        {window24 === 'desconocida' && (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-navy-300"><AlertTriangle className="size-3" /> Si el cliente no escribió en las últimas 24 h, WhatsApp solo aceptará una plantilla.</p>
        )}
      </div>
    </div>
  )
}

/** Conversación de un lead que no aparece en la bandeja (filtrada o sin mensajes aún). */
function useFallbackConversation(id: string | undefined, list: Conversation[] | undefined, enabled: boolean) {
  const { data: lead, isError } = useLead(enabled ? id : undefined)
  const conversation = useMemo<Conversation | undefined>(() => {
    if (!enabled || !lead || !id || list?.some((c) => c.id === id)) return undefined
    return {
      id: lead.id,
      leadId: lead.id,
      contactName: lead.name,
      company: lead.company,
      channel: 'whatsapp',
      lastMessage: '',
      lastMessageAt: lead.lastContactAt ?? lead.createdAt,
      unread: 0,
      aiEnabled: true,
      phone: lead.phone || undefined,
      status: lead.status,
      windowOpenUntil: undefined,
    }
  }, [enabled, lead, id, list])
  return { conversation, loading: enabled && !lead && !isError }
}

export function InboxPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [onlyUnread, setOnlyUnread] = useState(false)
  const { data, isLoading, isError, refetch } = useConversations({ search, unread: onlyUnread || undefined })
  const listed = data?.find((c) => c.id === id)
  const fallback = useFallbackConversation(id, data, !!id && !!data && !listed)
  const active = listed ?? fallback.conversation

  useEffect(() => {
    if (!id && data && data.length > 0 && window.matchMedia('(min-width: 1024px)').matches) navigate(`/conversaciones/${data[0].id}`, { replace: true })
  }, [id, data, navigate])

  const unreadTotal = (data ?? []).filter((c) => c.unread > 0).length

  return (
    <Card className="flex h-[calc(100vh-112px)] min-h-[560px] overflow-hidden">
      <div className={cn('flex w-full flex-col border-r border-navy-100/70 lg:w-[330px] lg:shrink-0', id && 'hidden lg:flex')}>
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-lg font-semibold">Conversaciones</h1>
            {unreadTotal > 0 && <Badge tone="green">{unreadTotal} sin leer</Badge>}
          </div>
          <SearchInput placeholder="Buscar por nombre, teléfono o empresa…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="flex flex-wrap items-center gap-1.5">
            {([[false, 'Todas'], [true, 'Sin leer']] as Array<[boolean, string]>).map(([v, l]) => (
              <button key={l} onClick={() => setOnlyUnread(v)} className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors', onlyUnread === v ? 'bg-navy-900 text-white' : 'bg-navy-100/70 text-navy-500 hover:bg-navy-100')}>{l}</button>
            ))}
            <span className="ml-auto flex items-center gap-1 text-[11px] text-navy-300" title="Por ahora el único canal conectado es WhatsApp"><MessageCircle className="size-3" /> WhatsApp</span>
          </div>
        </div>
        {isError ? <ErrorState onRetry={() => refetch()} /> : isLoading ? <div className="grid flex-1 place-items-center"><Spinner /></div> : data && data.length > 0 ? <ConversationList items={data} activeId={id} onSelect={(cid) => navigate(`/conversaciones/${cid}`)} /> : <EmptyState title={search || onlyUnread ? 'Sin resultados' : 'Sin conversaciones'} text={search || onlyUnread ? 'Prueba con otro filtro.' : 'Cuando un lead te escriba por WhatsApp aparecerá aquí.'} />}
      </div>

      <div className={cn('min-w-0 flex-1', !id && 'hidden lg:block')}>
        {active ? (
          <Thread conversation={active} />
        ) : id && (isLoading || fallback.loading) ? (
          <div className="grid h-full place-items-center"><Spinner /></div>
        ) : (
          <div className="grid h-full place-items-center">
            <EmptyState title="Selecciona una conversación" text="Elige un chat de la lista para ver el historial y responder." action={<MessagesSquare className="size-5 text-navy-200" />} />
          </div>
        )}
      </div>

      {active && (
        <aside className="hidden w-[300px] shrink-0 border-l border-navy-100/70 xl:block">
          <LeadPanel conversation={active} />
        </aside>
      )}
    </Card>
  )
}
