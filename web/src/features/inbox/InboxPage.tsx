import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Bot, Camera, Check, Globe, Mail, MessageCircle, MessageSquareText, MessagesSquare, RefreshCw, Send, Sparkles } from 'lucide-react'
import { Avatar, Badge, Button, Card, EmptyState, ErrorState, Spinner, Toggle } from '@/components/ui'
import { useToast } from '@/app/toast'
import { useAiSuggestions, useConversations, useLead, useMarkRead, useMessages, useSendMessage, useToggleConversationAi } from '@/hooks/queries'
import { SearchInput } from '@/components/ui'
import { cn } from '@/lib/cn'
import { formatFollowUp, formatTime, moneyExact, relativeTime } from '@/lib/format'
import { channelLabel, leadStatusMeta } from '@/lib/labels'
import type { AiSuggestion, Channel, Conversation, Message } from '@/types/domain'

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
              <p className="truncate text-xs text-navy-400">{c.company}</p>
              <div className="mt-1 flex items-center gap-2">
                <p className={cn('flex-1 truncate text-xs', c.unread ? 'text-navy-700' : 'text-navy-400')}>{c.lastMessage}</p>
                {c.aiEnabled && <Bot className="size-3.5 shrink-0 text-flow-500" aria-label="IA activa" />}
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
  const mine = m.author !== 'lead'
  const ai = m.author === 'ai'
  return (
    <div className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
      <div className={cn('max-w-[78%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed', mine ? (ai ? 'rounded-br-md bg-violet-50 text-navy-900' : 'rounded-br-md bg-flow-500 text-white') : 'rounded-bl-md bg-white text-navy-900 shadow-card')}>
        {m.text}
      </div>
      <p className="mt-1 flex items-center gap-1.5 px-1 text-[11px] text-navy-300">
        {ai && <Sparkles className="size-3 text-violet-500" />}
        {m.authorName} · <span className="num">{formatTime(m.createdAt)}</span>
      </p>
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
        <p className="truncate">{lead.email}</p>
        <p className="num text-navy-500">{lead.phone}</p>
      </div>
      <Link to={`/leads/${lead.id}`} className="mt-auto pt-6"><Button className="w-full">Abrir lead</Button></Link>
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
  const [text, setText] = useState('')
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>([])
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setText('')
    setSuggestions([])
    if (conversation.unread > 0) markRead.mutate(conversation.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation.id])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages?.length])

  const generate = () =>
    suggest.mutate(conversation.id, {
      onSuccess: setSuggestions,
      onError: () => toast.error('No se pudieron generar sugerencias'),
    })

  const submit = (value = text, author: 'agent' | 'ai' = 'agent') => {
    const body = value.trim()
    if (!body) return
    send.mutate({ text: body, author }, {
      onSuccess: () => {
        setText('')
        setSuggestions([])
      },
      onError: (e) => toast.error(e.message),
    })
  }

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-navy-100/70 px-5 py-3.5">
        <Avatar name={conversation.contactName} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[15px] font-semibold">{conversation.contactName}</p>
          <p className="flex items-center gap-1.5 truncate text-xs text-navy-400"><span className="size-1.5 rounded-full bg-teal-500" />En línea · {conversation.company} · {channelLabel[conversation.channel]}</p>
        </div>
        <label className="flex items-center gap-2.5 text-xs font-medium text-navy-500">
          <Bot className="size-4 text-flow-500" />
          <span className="hidden sm:inline">Respuestas con IA</span>
          <Toggle checked={conversation.aiEnabled} label="Respuestas con IA" onChange={(v) => toggleAi.mutate({ id: conversation.id, aiEnabled: v })} />
        </label>
      </div>

      <div className="scroll-thin flex-1 space-y-4 overflow-y-auto bg-neutral-light/70 px-5 py-5">
        {isLoading ? <div className="grid h-full place-items-center"><Spinner /></div> : isError ? <ErrorState onRetry={() => refetch()} /> : messages?.map((m) => <Bubble key={m.id} m={m} />)}
        <div ref={endRef} />
      </div>

      <div className="border-t border-navy-100/70 p-4">
        {suggestions.length > 0 && (
          <div className="scroll-thin mb-3 max-h-56 space-y-2 overflow-y-auto pr-1">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-violet-600"><Sparkles className="size-3.5" /> Sugerencias de respuesta</p>
            {suggestions.map((s) => (
              <div key={s.id} className="rounded-xl border border-violet-100 bg-violet-50/50 p-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <Badge tone="violet">{s.intent}</Badge>
                  <span className="num text-[11px] text-navy-300">{Math.round(s.confidence * 100)}% de confianza</span>
                </div>
                <p className="text-[13px] text-navy-700">{s.text}</p>
                <div className="mt-2.5 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setText(s.text)}>Editar</Button>
                  <Button size="sm" icon={<Check className="size-3.5" />} onClick={() => submit(s.text, 'ai')}>Enviar</Button>
                </div>
              </div>
            ))}
          </div>
        )}

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
            placeholder="Escribe un mensaje…"
            className="min-h-12 flex-1 resize-none rounded-2xl border border-navy-100 bg-white px-4 py-3 text-sm placeholder:text-navy-300 focus:border-flow-500 focus:ring-4 focus:ring-flow-500/10 focus:outline-none"
          />
          <div className="flex flex-col gap-2">
            <Button variant="secondary" size="sm" className="border-teal-500/40 text-teal-700 hover:bg-teal-50" onClick={generate} loading={suggest.isPending} icon={suggestions.length ? <RefreshCw className="size-3.5" /> : <Sparkles className="size-3.5 text-teal-600" />}>
              Sugerir respuesta
            </Button>
            <Button size="sm" onClick={() => submit()} loading={send.isPending} icon={<Send className="size-3.5" />}>Enviar</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function InboxPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [channel, setChannel] = useState<Channel | ''>('')
  const { data, isLoading, isError, refetch } = useConversations({ search, channel })
  const active = data?.find((c) => c.id === id)

  useEffect(() => {
    if (!id && data && data.length > 0 && window.matchMedia('(min-width: 1024px)').matches) navigate(`/conversaciones/${data[0].id}`, { replace: true })
  }, [id, data, navigate])

  const unreadTotal = (data ?? []).reduce((a, c) => a + c.unread, 0)

  return (
    <Card className="flex h-[calc(100vh-112px)] min-h-[560px] overflow-hidden">
      <div className={cn('flex w-full flex-col border-r border-navy-100/70 lg:w-[330px] lg:shrink-0', id && 'hidden lg:flex')}>
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-lg font-semibold">Conversaciones</h1>
            {unreadTotal > 0 && <Badge tone="green">{unreadTotal} nuevas</Badge>}
          </div>
          <SearchInput placeholder="Buscar conversación…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="flex flex-wrap gap-1.5">
            {([['', 'Todos'], ...Object.entries(channelLabel)] as Array<[Channel | '', string]>).map(([v, l]) => (
              <button key={v} onClick={() => setChannel(v)} className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors', channel === v ? 'bg-navy-900 text-white' : 'bg-navy-100/70 text-navy-500 hover:bg-navy-100')}>{l}</button>
            ))}
          </div>
        </div>
        {isError ? <ErrorState onRetry={() => refetch()} /> : isLoading ? <div className="grid flex-1 place-items-center"><Spinner /></div> : data && data.length > 0 ? <ConversationList items={data} activeId={id} onSelect={(cid) => navigate(`/conversaciones/${cid}`)} /> : <EmptyState title="Sin conversaciones" text="Cuando un lead te escriba aparecerá aquí." />}
      </div>

      <div className={cn('min-w-0 flex-1', !id && 'hidden lg:block')}>
        {active ? (
          <Thread conversation={active} />
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
