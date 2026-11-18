'use client';

import { useEffect, useRef, useState } from 'react';
import type { MessageDirection, QuoteStatus } from '@flowcommerce/types';
import { API_URL } from '@/lib/api';
import { getAccessToken } from '@/lib/supabase/client';

// Eventos del canal en vivo (GET /projects/:id/events). Copiados de
// src/realtime/domain/realtime-event.ts. Solo traen ids: quien los recibe
// refresca sus consultas.
export type RealtimeEvent =
  | {
      type: 'message.created';
      data: { leadId: string; messageId: string; direction: MessageDirection };
    }
  | { type: 'message.status'; data: { leadId: string; messageId: string; status: string } }
  | { type: 'notification.created'; data: { notificationId: string | null; userIds?: string[] } }
  | { type: 'quote.status'; data: { quoteId: string; status: QuoteStatus; leadId?: string | null } }
  | { type: 'lead.updated'; data: { leadId: string } };

export type RealtimeStatus = 'idle' | 'connecting' | 'open' | 'reconnecting';

const KNOWN_EVENTS = new Set<RealtimeEvent['type']>([
  'message.created',
  'message.status',
  'notification.created',
  'quote.status',
  'lead.updated',
]);

/** Espera de reconexión: 1 s, 2 s, 4 s… hasta 30 s, con algo de azar. */
function backoffDelay(attempt: number): number {
  const base = Math.min(30_000, 1_000 * 2 ** attempt);
  return base / 2 + Math.random() * (base / 2);
}

/**
 * Parte el texto SSE en bloques (separados por línea en blanco) y devuelve
 * los eventos completos más lo que sobra para la siguiente lectura.
 * Las líneas que empiezan con ":" son comentarios (latido) y se ignoran.
 */
export function parseSseChunk(buffer: string): {
  events: { event: string; data: string }[];
  rest: string;
} {
  const normalized = buffer.replace(/\r\n?/g, '\n');
  const blocks = normalized.split('\n\n');
  const rest = blocks.pop() ?? '';
  const events: { event: string; data: string }[] = [];
  for (const block of blocks) {
    let event = 'message';
    const data: string[] = [];
    for (const line of block.split('\n')) {
      if (!line || line.startsWith(':')) continue;
      const colon = line.indexOf(':');
      const field = colon === -1 ? line : line.slice(0, colon);
      let value = colon === -1 ? '' : line.slice(colon + 1);
      if (value.startsWith(' ')) value = value.slice(1);
      if (field === 'event') event = value;
      else if (field === 'data') data.push(value);
    }
    if (data.length > 0) events.push({ event, data: data.join('\n') });
  }
  return { events, rest };
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

interface UseRealtimeOptions {
  enabled?: boolean;
  /** Se llama al RE-conectar (no en la primera conexión): pudieron perderse eventos. */
  onReconnect?: () => void;
}

/**
 * Abre el canal de eventos en vivo del proyecto y llama a `onEvent` con cada
 * evento. Usa fetch + ReadableStream en vez de EventSource porque EventSource
 * no permite mandar la cabecera Authorization con el token de Supabase.
 * Reconecta sola con espera exponencial; cada intento pide un token fresco.
 */
export function useRealtime(
  projectId: string | null | undefined,
  onEvent: (event: RealtimeEvent) => void,
  { enabled = true, onReconnect }: UseRealtimeOptions = {},
): RealtimeStatus {
  const [status, setStatus] = useState<RealtimeStatus>('idle');
  // Refs: cambiar el callback no debe cerrar y reabrir la conexión.
  const onEventRef = useRef(onEvent);
  const onReconnectRef = useRef(onReconnect);
  useEffect(() => {
    onEventRef.current = onEvent;
    onReconnectRef.current = onReconnect;
  });

  useEffect(() => {
    if (!projectId || !enabled) {
      setStatus('idle');
      return;
    }
    const controller = new AbortController();
    const { signal } = controller;

    async function run() {
      let attempt = 0;
      let connectedBefore = false;
      while (!signal.aborted) {
        setStatus(connectedBefore ? 'reconnecting' : 'connecting');
        try {
          const token = await getAccessToken();
          if (!token) throw new Error('Sin sesión');
          const response = await fetch(`${API_URL}/projects/${projectId}/events`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
            cache: 'no-store',
            signal,
          });
          // 403 = sin permiso LEAD_READ en este proyecto: no tiene caso insistir.
          if (response.status === 403 || response.status === 404) {
            setStatus('idle');
            return;
          }
          if (!response.ok || !response.body) {
            throw new Error(`HTTP ${response.status}`);
          }

          setStatus('open');
          attempt = 0;
          if (connectedBefore) onReconnectRef.current?.();
          connectedBefore = true;

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (!signal.aborted) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parsed = parseSseChunk(buffer);
            buffer = parsed.rest;
            for (const item of parsed.events) {
              if (!KNOWN_EVENTS.has(item.event as RealtimeEvent['type'])) continue;
              try {
                const data = JSON.parse(item.data) as RealtimeEvent['data'];
                onEventRef.current({ type: item.event, data } as RealtimeEvent);
              } catch {
                // evento mal formado: se ignora
              }
            }
          }
        } catch {
          // red caída, servidor reiniciado o abort: se reintenta abajo
        }
        if (signal.aborted) return;
        setStatus('reconnecting');
        await sleep(backoffDelay(attempt), signal);
        attempt += 1;
      }
    }

    void run();
    return () => controller.abort();
  }, [projectId, enabled]);

  return status;
}
