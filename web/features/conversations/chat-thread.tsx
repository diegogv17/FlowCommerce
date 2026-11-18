'use client';

import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, Lock, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/api';
import { useProject } from '@/hooks/use-project';
import { EmptyState, ErrorState, Skeleton, Spinner } from '@/components/ui';
import { registerOpenThread } from './active-thread';
import { ChatComposer } from './chat-composer';
import { useLeadMessages, useMarkConversationRead } from './hooks';
import { MessageBubble } from './message-bubble';
import type { Message } from './types';
import { dayKey, dayLabel, isWindowOpen } from './utils';

/** Distancia al fondo (px) bajo la cual se considera que el usuario "está abajo". */
const NEAR_BOTTOM = 120;
/** Distancia al tope (px) que dispara la carga de mensajes anteriores. */
const NEAR_TOP = 80;

function ThreadSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-14 w-2/3" />
      <Skeleton className="ml-auto h-12 w-1/2" />
      <Skeleton className="h-20 w-3/5" />
      <Skeleton className="ml-auto h-10 w-2/5" />
    </div>
  );
}

/**
 * Chat de WhatsApp con un lead: historial (paginado hacia arriba), burbujas
 * con estado y adjuntos, y compositor. Lo usan la pantalla Conversaciones y
 * la ficha del lead. El tamaño lo decide el padre con `className` (necesita
 * una altura para que el historial haga scroll por dentro).
 */
export function ChatThread({ leadId, className }: { leadId: string; className?: string }) {
  const { can } = useProject();
  const canSend = can('WHATSAPP_SEND_MESSAGE');
  const query = useLeadMessages(leadId);
  const markRead = useMarkConversationRead(leadId);
  const { data, isLoading, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = query;

  const scrollRef = useRef<HTMLDivElement>(null);
  // Para conservar la posición al insertar mensajes antiguos arriba.
  const restoreRef = useRef<{ height: number; top: number } | null>(null);
  const stickToBottomRef = useRef(true);
  const lastMessageIdRef = useRef<string | null>(null);
  const markedRef = useRef<string | null>(null);
  const [showJump, setShowJump] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Páginas: la [0] es la más reciente. Se invierten para leer de arriba abajo
  // y se quitan duplicados (un mensaje puede llegar por el envío y por el
  // evento en vivo a la vez).
  const messages = useMemo<Message[]>(() => {
    const seen = new Set<string>();
    const out: Message[] = [];
    for (const page of [...(data?.pages ?? [])].reverse()) {
      for (const message of page.data) {
        if (seen.has(message.id)) continue;
        seen.add(message.id);
        out.push(message);
      }
    }
    return out;
  }, [data]);

  const windowOpenUntil = data?.pages[0]?.windowOpenUntil ?? null;
  const windowOpen = isWindowOpen(windowOpenUntil, now);
  const lastMessageId = messages.at(-1)?.id ?? null;

  // Avisa al puente de tiempo real que este chat está a la vista (sin toast).
  useEffect(() => registerOpenThread(leadId), [leadId]);

  // Al cambiar de lead se vuelve a anclar abajo.
  useEffect(() => {
    stickToBottomRef.current = true;
    lastMessageIdRef.current = null;
    markedRef.current = null;
    setShowJump(false);
  }, [leadId]);

  // La ventana de 24 h vence sola: se reevalúa cada minuto.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // Marca como leída al abrir y cada vez que llega un mensaje del cliente sin
  // leer mientras el chat está abierto.
  const latestUnreadInbound = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const message = messages[i];
      if (message.direction === 'INBOUND' && !message.readAt) return message.id;
    }
    return null;
  }, [messages]);
  const { mutate: markAsRead } = markRead;
  useEffect(() => {
    if (!canSend || !latestUnreadInbound || markedRef.current === latestUnreadInbound) return;
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    markedRef.current = latestUnreadInbound;
    markAsRead();
  }, [canSend, latestUnreadInbound, markAsRead]);

  // Scroll: tras cargar antiguos se conserva la posición; con un mensaje nuevo
  // se baja solo si el usuario ya estaba abajo.
  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    if (restoreRef.current) {
      const { height, top } = restoreRef.current;
      element.scrollTop = element.scrollHeight - height + top;
      restoreRef.current = null;
      return;
    }
    if (lastMessageId && lastMessageId !== lastMessageIdRef.current) {
      const own = messages.at(-1)?.direction === 'OUTBOUND';
      if (stickToBottomRef.current || own || lastMessageIdRef.current === null) {
        element.scrollTop = element.scrollHeight;
        setShowJump(false);
      } else {
        setShowJump(true);
      }
      lastMessageIdRef.current = lastMessageId;
    }
  }, [messages, lastMessageId]);

  const loadOlder = () => {
    const element = scrollRef.current;
    if (!element || !hasNextPage || isFetchingNextPage) return;
    restoreRef.current = { height: element.scrollHeight, top: element.scrollTop };
    void fetchNextPage().then((result) => {
      // Si falló, no hay nada que restaurar.
      if (result.isError) restoreRef.current = null;
    });
  };

  const onScroll = () => {
    const element = scrollRef.current;
    if (!element) return;
    const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
    stickToBottomRef.current = distance < NEAR_BOTTOM;
    if (stickToBottomRef.current) setShowJump(false);
    if (element.scrollTop < NEAR_TOP) loadOlder();
  };

  const jumpToBottom = () => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
    setShowJump(false);
  };

  return (
    <div className={cn('flex min-h-0 flex-col overflow-hidden bg-white', className)}>
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="h-full overflow-y-auto bg-slate-50/70 px-3 py-4 sm:px-5"
          aria-live="polite"
          aria-label="Historial de mensajes"
        >
          {isLoading ? (
            <ThreadSkeleton />
          ) : isError && !data ? (
            <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
          ) : messages.length === 0 ? (
            <EmptyState
              icon={<MessageCircle className="h-6 w-6" />}
              title="Aún no hay mensajes"
              description="Cuando el cliente escriba por WhatsApp o le envíes una plantilla, la conversación aparecerá aquí."
            />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex justify-center py-1 text-xs text-muted">
                {isFetchingNextPage ? (
                  <Spinner className="h-4 w-4" />
                ) : hasNextPage ? (
                  <button type="button" onClick={loadOlder} className="rounded-full px-3 py-1 hover:bg-slate-200/60">
                    Cargar mensajes anteriores
                  </button>
                ) : (
                  <span>Inicio de la conversación</span>
                )}
              </div>
              {messages.map((message, index) => {
                const previous = messages[index - 1];
                const newDay = !previous || dayKey(previous.creadoEn) !== dayKey(message.creadoEn);
                return (
                  <Fragment key={message.id}>
                    {newDay ? (
                      <div className="flex justify-center py-1" role="separator">
                        <span className="rounded-full bg-slate-200/80 px-3 py-0.5 text-xs font-medium capitalize text-slate-600">
                          {dayLabel(message.creadoEn)}
                        </span>
                      </div>
                    ) : null}
                    <MessageBubble message={message} />
                  </Fragment>
                );
              })}
            </div>
          )}
        </div>

        {showJump ? (
          <button
            type="button"
            onClick={jumpToBottom}
            className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
          >
            <ArrowDown className="h-3.5 w-3.5" /> Mensajes nuevos
          </button>
        ) : null}
      </div>

      {canSend ? (
        <ChatComposer leadId={leadId} windowOpen={windowOpen} windowOpenUntil={windowOpenUntil} />
      ) : (
        <p className="flex items-center gap-2 border-t border-line px-4 py-3 text-xs text-muted">
          <Lock className="h-3.5 w-3.5" /> Tu rol puede ver la conversación, pero no enviar mensajes.
        </p>
      )}
    </div>
  );
}
