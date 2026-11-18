'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, getToolName, isToolUIPart, type UIMessage } from 'ai';
import { AlertTriangle, Bot, CheckCircle2, Eraser, Loader2, SendHorizontal, Sparkles, Square } from 'lucide-react';
import { Button, EmptyState, PageHeader, Spinner, Textarea } from '@/components/ui';
import { API_URL } from '@/lib/api';
import { cn } from '@/lib/cn';
import { getAccessToken } from '@/lib/supabase/client';
import { useProject } from '@/hooks/use-project';
import { ChatMarkdown } from '@/features/ai/chat-markdown';

const STARTERS = [
  '¿Qué leads debo atender hoy?',
  'Resume mis ventas del mes',
  '¿Qué cotizaciones están por vencer?',
];

/** Herramientas del backend (src/assistant/application/chat-tools.ts): [en curso, terminada]. */
const TOOL_LABELS: Record<string, [string, string]> = {
  buscar_leads: ['Consultando leads', 'Leads consultados'],
  ver_lead: ['Revisando el lead', 'Lead revisado'],
  buscar_clientes: ['Consultando clientes', 'Clientes consultados'],
  buscar_cotizaciones: ['Consultando cotizaciones', 'Cotizaciones consultadas'],
  resumen_dashboard: ['Calculando métricas', 'Métricas calculadas'],
  catalogo_productos: ['Revisando el catálogo', 'Catálogo revisado'],
  seguimientos_pendientes: ['Revisando seguimientos', 'Seguimientos revisados'],
};

/**
 * Los errores HTTP llegan como el texto del body ({"statusCode":503,"message":…})
 * y los del stream como el mensaje que manda el servidor; se muestran en español.
 */
function chatErrorMessage(error: Error): string {
  const raw = error.message ?? '';
  try {
    const body = JSON.parse(raw) as { statusCode?: number; message?: string | string[] };
    const message = Array.isArray(body.message) ? body.message.join('. ') : body.message;
    if (body.statusCode === 429) {
      return 'Hiciste muchas preguntas en poco tiempo. Espera un minuto e intenta de nuevo.';
    }
    if (body.statusCode === 401) return 'Tu sesión expiró. Vuelve a iniciar sesión.';
    if (body.statusCode === 403) return 'No tienes permiso para usar el asistente en este proyecto.';
    if (message) return message;
  } catch {
    // no era JSON: es el mensaje del stream o un error de red
  }
  if (/failed to fetch|networkerror/i.test(raw)) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión.';
  }
  return raw || 'Ocurrió un error con el asistente.';
}

function ToolIndicator({ name, state }: { name: string; state: string }) {
  const [running, finished] = TOOL_LABELS[name] ?? ['Consultando el CRM', 'CRM consultado'];
  const done = state === 'output-available';
  const failed = state === 'output-error';
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs',
        failed
          ? 'border-rose-200 bg-rose-50 text-rose-700'
          : done
            ? 'border-line bg-slate-50 text-muted'
            : 'border-violet-200 bg-violet-50 text-violet-700',
      )}
    >
      {failed ? (
        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
      ) : done ? (
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      )}
      {failed ? `${running}: error` : done ? finished : `${running}…`}
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser ? (
        <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
      ) : null}
      <div
        className={cn(
          'max-w-[85%] space-y-2 rounded-2xl px-4 py-3 shadow-sm sm:max-w-[75%]',
          isUser ? 'bg-brand-500 text-white' : 'border border-line/60 bg-white text-ink',
        )}
      >
        {message.parts.map((part, index) => {
          const key = `${message.id}-${index}`;
          if (part.type === 'text') {
            return isUser ? (
              <p key={key} className="whitespace-pre-wrap text-sm">
                {part.text}
              </p>
            ) : (
              <ChatMarkdown key={key} text={part.text} />
            );
          }
          if (isToolUIPart(part)) {
            return (
              <div key={key}>
                <ToolIndicator name={getToolName(part)} state={part.state} />
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

export default function AssistantPage() {
  const { projectId, project, can } = useProject();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Un transporte por proyecto: la URL lleva el projectId y el token se pide
  // en cada envío (headers async), así nunca se usa uno vencido.
  const transport = useMemo(
    () =>
      new DefaultChatTransport<UIMessage>({
        api: `${API_URL}/projects/${projectId}/assistant/chat`,
        headers: async (): Promise<Record<string, string>> => {
          const token = await getAccessToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    [projectId],
  );

  const { messages, sendMessage, status, stop, setMessages, error, clearError, regenerate } = useChat({
    // Cambiar de proyecto crea otra conversación (el id es distinto).
    id: `asistente-${projectId || 'sin-proyecto'}`,
    transport,
  });

  const busy = status === 'submitted' || status === 'streaming';
  const lastMessage = messages[messages.length - 1];
  const waitingFirstToken = status === 'submitted' && lastMessage?.role === 'user';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, status]);

  const send = (text: string) => {
    const value = text.trim();
    if (!value || busy || !projectId) return;
    clearError();
    void sendMessage({ text: value });
    setInput('');
  };

  const clear = () => {
    if (busy) void stop();
    setMessages([]);
    clearError();
  };

  if (projectId && !can('LEAD_READ')) {
    return (
      <EmptyState
        title="Sin acceso al asistente"
        description="Tu rol en este proyecto no permite consultar leads, así que el asistente no está disponible."
        icon={<Bot className="h-6 w-6" />}
      />
    );
  }

  return (
    <div className="flex h-[calc(100dvh-10rem)] min-h-[28rem] flex-col md:h-[calc(100dvh-7rem)]">
      <PageHeader
        title="Asistente IA"
        subtitle={`Pregunta sobre leads, cotizaciones, clientes y ventas${project ? ` de ${project.name}` : ''}. Solo consulta: no envía ni modifica nada.`}
        actions={
          messages.length > 0 ? (
            <Button variant="outline" size="sm" onClick={clear}>
              <Eraser className="h-4 w-4" aria-hidden />
              Limpiar
            </Button>
          ) : null
        }
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[var(--radius-card)] border border-line/60 bg-white shadow-sm">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-canvas/50 p-4 sm:p-6" aria-live="polite">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <Sparkles className="h-7 w-7" aria-hidden />
              </span>
              <div>
                <p className="font-display text-lg font-semibold text-ink">¿En qué te ayudo hoy?</p>
                <p className="mt-1 max-w-md text-sm text-muted">
                  Consulto el CRM con tus permisos: leads, seguimientos, cotizaciones, clientes, catálogo y métricas.
                </p>
              </div>
              <div className="flex max-w-xl flex-wrap justify-center gap-2">
                {STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => send(starter)}
                    disabled={!projectId}
                    className="rounded-full border border-violet-200 bg-white px-3.5 py-2 text-sm text-violet-700 shadow-sm transition-colors hover:bg-violet-50 disabled:opacity-50"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => <MessageBubble key={message.id} message={message} />)
          )}

          {waitingFirstToken ? (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Spinner className="h-4 w-4 text-violet-600" />
              Pensando…
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">
              <p>{chatErrorMessage(error)}</p>
              {lastMessage?.role === 'user' || lastMessage?.role === 'assistant' ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    clearError();
                    void regenerate();
                  }}
                >
                  Reintentar
                </Button>
              ) : null}
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <form
          className="flex items-end gap-2 border-t border-line bg-white p-3"
          onSubmit={(event) => {
            event.preventDefault();
            send(input);
          }}
        >
          <label htmlFor="assistant-input" className="sr-only">
            Mensaje para el asistente
          </label>
          <Textarea
            id="assistant-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              // Enter envía; Shift+Enter hace salto de línea.
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                send(input);
              }
            }}
            placeholder="Escribe tu pregunta… (Enter para enviar)"
            rows={1}
            maxLength={4000}
            className="max-h-40 min-h-10 resize-none"
          />
          {busy ? (
            <Button type="button" variant="outline" size="icon" onClick={() => void stop()} aria-label="Detener respuesta">
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" size="icon" disabled={!input.trim() || !projectId} aria-label="Enviar mensaje">
              <SendHorizontal className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted">
        Las respuestas de la IA pueden contener errores. Verifica los datos importantes en su pantalla.
      </p>
    </div>
  );
}
