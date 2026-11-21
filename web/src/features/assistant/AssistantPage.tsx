import { useMemo, useRef, useEffect, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useChat } from '@ai-sdk/react'
import {
  getToolName,
  isStaticToolUIPart,
  lastAssistantMessageIsCompleteWithApprovalResponses,
  type ToolUIPart,
  type UIMessage,
} from 'ai'
import { CalendarClock, Check, Loader2, Send, Sparkles, Square, X } from 'lucide-react'
import { Button, Card, PageHeader, Textarea } from '@/components/ui'
import { cn } from '@/lib/cn'
import { createAssistantTransport } from './chat-transport'
import { AssistantText } from './message-format'
import { FOLLOW_UP_TYPE_LABELS, TOOL_LABELS } from './tool-labels'

const STARTERS = [
  '¿Qué seguimientos tengo vencidos?',
  '¿Qué cotizaciones vencen esta semana?',
  'Resume cómo van las ventas de este mes',
]

interface FollowUpInput {
  tipo?: string
  titulo?: string
  fecha?: string
  hora?: string | null
  notas?: string | null
}

/** Solicitud de aprobación de crear_seguimiento: nada se guarda sin este clic. */
function ApprovalCard({
  part,
  onRespond,
}: {
  part: ToolUIPart
  onRespond: (approved: boolean) => void
}) {
  const input = (part.input ?? {}) as FollowUpInput
  const when = [input.fecha, input.hora].filter(Boolean).join(' a las ')
  return (
    <div role="group" aria-label="Aprobar seguimiento" className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-[13px] text-navy-700">
      <p className="flex items-center gap-2 font-medium text-navy-900">
        <CalendarClock className="size-4 text-amber-600" aria-hidden />
        El asistente quiere programar un seguimiento
      </p>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        <dt className="text-navy-400">Tipo</dt>
        <dd>{FOLLOW_UP_TYPE_LABELS[input.tipo ?? ''] ?? input.tipo}</dd>
        <dt className="text-navy-400">Título</dt>
        <dd>{input.titulo}</dd>
        <dt className="text-navy-400">Cuándo</dt>
        <dd>{when || 'Sin fecha'} (hora de Guatemala)</dd>
        {input.notas ? (
          <>
            <dt className="text-navy-400">Notas</dt>
            <dd>{input.notas}</dd>
          </>
        ) : null}
      </dl>
      <div className="mt-4 flex gap-2">
        <Button size="sm" variant="success" icon={<Check className="size-3.5" />} onClick={() => onRespond(true)}>
          Programar seguimiento
        </Button>
        <Button size="sm" variant="secondary" icon={<X className="size-3.5" />} onClick={() => onRespond(false)}>
          Descartar
        </Button>
      </div>
    </div>
  )
}

/** Estado de una herramienta dentro de la respuesta (consulta o escritura). */
function ToolStatus({ part, onRespond }: { part: ToolUIPart; onRespond: (id: string, approved: boolean) => void }) {
  const name = getToolName(part)
  const label = TOOL_LABELS[name] ?? { running: 'Consultando el CRM', done: 'Consultó el CRM' }

  if (part.state === 'approval-requested') {
    return <ApprovalCard part={part} onRespond={(approved) => onRespond(part.approval.id, approved)} />
  }
  if (part.state === 'output-denied') {
    return <p className="text-xs text-navy-400">Seguimiento descartado: no se guardó nada.</p>
  }
  const running = part.state === 'input-streaming' || part.state === 'input-available' || part.state === 'approval-responded'
  const failed = part.state === 'output-error' || (part.state === 'output-available' && isToolError(part.output))
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium',
        failed ? 'bg-red-50 text-red-600' : running ? 'bg-navy-50 text-navy-500' : 'bg-teal-50 text-teal-700',
      )}
    >
      {running ? <Loader2 className="size-3 animate-spin" aria-hidden /> : failed ? <X className="size-3" aria-hidden /> : <Check className="size-3" aria-hidden />}
      {failed ? `${label.running}: no se pudo` : running ? `${label.running}…` : label.done}
    </span>
  )
}

const isToolError = (output: unknown): boolean =>
  typeof output === 'object' && output !== null && 'error' in output

function MessageBubble({ message, onRespond }: { message: UIMessage; onRespond: (id: string, approved: boolean) => void }) {
  if (message.role === 'user') {
    const text = message.parts.map((p) => (p.type === 'text' ? p.text : '')).join('')
    return (
      <div className="flex justify-end">
        <p className="max-w-[75%] rounded-2xl rounded-br-md bg-flow-500 px-4 py-2.5 text-sm whitespace-pre-wrap text-white">{text}</p>
      </div>
    )
  }
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-teal-50 text-teal-600" aria-hidden>
        <Sparkles className="size-4" />
      </span>
      <div className="min-w-0 flex-1 space-y-2 text-sm text-navy-700" data-role="assistant-message">
        {message.parts.map((part, i) => {
          if (part.type === 'text') return <AssistantText key={i} text={part.text} />
          if (isStaticToolUIPart(part)) return <div key={i}><ToolStatus part={part} onRespond={onRespond} /></div>
          return null
        })}
      </div>
    </div>
  )
}

export function AssistantPage() {
  const transport = useMemo(() => createAssistantTransport(), [])
  const { messages, sendMessage, status, error, stop, regenerate, addToolApprovalResponse } = useChat({
    transport,
    // Tras aprobar o descartar, el chat reenvía solo la conversación para que
    // la API ejecute (o no) la herramienta y el modelo continúe.
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  })
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)
  const busy = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

  const send = (text: string) => {
    const value = text.trim()
    if (!value || busy) return
    void sendMessage({ text: value })
    setDraft('')
  }
  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    send(draft)
  }
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(draft)
    }
  }
  const onRespond = (id: string, approved: boolean) => {
    void addToolApprovalResponse({ id, approved })
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Asistente"
        subtitle="Pregunta por tus leads, cotizaciones y seguimientos. Responde con los datos de tu empresa y tus permisos."
      />
      <Card className="flex min-h-[60vh] flex-1 flex-col overflow-hidden p-0">
        <div role="log" aria-live="polite" aria-label="Conversación con el asistente" className="flex-1 space-y-5 overflow-y-auto p-5">
          {messages.length === 0 ? (
            <div className="mx-auto max-w-md py-10 text-center">
              <p className="font-display text-lg font-semibold text-navy-900">¿En qué te ayudo hoy?</p>
              <p className="mt-1 text-sm text-navy-400">Puedo consultar el CRM y programar seguimientos; antes de guardar algo te pido confirmación.</p>
              <div className="mt-5 flex flex-col gap-2">
                {STARTERS.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="rounded-xl border border-navy-100 px-4 py-2.5 text-left text-sm text-navy-700 transition-colors hover:bg-navy-50 focus-visible:outline-2 focus-visible:outline-flow-500">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} onRespond={onRespond} />)
          )}
          {status === 'submitted' ? (
            <p className="flex items-center gap-2 pl-11 text-xs text-navy-400">
              <Loader2 className="size-3 animate-spin" aria-hidden /> Pensando…
            </p>
          ) : null}
          {error ? (
            <div role="alert" className="ml-11 flex flex-wrap items-center gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              <span>{error.message}</span>
              <Button size="sm" variant="secondary" onClick={() => void regenerate()}>Reintentar</Button>
            </div>
          ) : null}
          <div ref={endRef} />
        </div>
        <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-navy-100 p-3">
          <Textarea
            aria-label="Mensaje para el asistente"
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Escribe tu pregunta…  (Enter envía, Shift+Enter cambia de línea)"
            className="max-h-40 min-h-10 flex-1 resize-none"
          />
          {busy ? (
            <Button type="button" variant="secondary" icon={<Square className="size-3.5" />} onClick={() => void stop()}>Detener</Button>
          ) : (
            <Button type="submit" icon={<Send className="size-4" />} disabled={!draft.trim()}>Enviar</Button>
          )}
        </form>
      </Card>
    </div>
  )
}
