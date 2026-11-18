'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Paginated } from '@/lib/api';
import { useProject } from '@/hooks/use-project';
import { isThreadOpen } from '@/features/conversations/active-thread';
import type { Conversation } from '@/features/conversations/types';
import { useRealtime, type RealtimeEvent } from './use-realtime';

/**
 * Conecta el canal de eventos en vivo con la caché de TanStack Query: cada
 * evento invalida las consultas afectadas (por convención sus keys empiezan
 * con [recurso, projectId, …]) y un mensaje entrante muestra un toast. No
 * pinta nada. Se monta una sola vez en el AppShell.
 */
export function RealtimeBridge() {
  const { projectId, can } = useProject();
  const queryClient = useQueryClient();
  const router = useRouter();

  const invalidate = useCallback(
    (...keys: unknown[][]) => {
      for (const queryKey of keys) void queryClient.invalidateQueries({ queryKey });
    },
    [queryClient],
  );

  /** Nombre del lead si ya está en la caché de la bandeja (para el toast). */
  const leadName = useCallback(
    (leadId: string): string | null => {
      const lists = queryClient.getQueriesData<Paginated<Conversation>>({
        queryKey: ['conversations', projectId, 'list'],
      });
      for (const [, list] of lists) {
        const found = list?.data?.find((item) => item.lead.id === leadId);
        if (found) return found.lead.name;
      }
      const lead = queryClient.getQueryData<{ name?: string }>(['leads', projectId, 'detail', leadId]);
      return lead?.name ?? null;
    },
    [queryClient, projectId],
  );

  const handleEvent = useCallback(
    (event: RealtimeEvent) => {
      switch (event.type) {
        case 'message.created': {
          const { leadId, direction } = event.data;
          invalidate(['messages', projectId, leadId], ['conversations', projectId]);
          if (direction === 'INBOUND' && !isThreadOpen(leadId)) {
            const name = leadName(leadId);
            toast.info(name ? `Nuevo mensaje de ${name}` : 'Nuevo mensaje de WhatsApp', {
              id: `message-${leadId}`,
              action: {
                label: 'Ver',
                onClick: () => router.push(`/conversaciones?leadId=${leadId}`),
              },
            });
          }
          break;
        }
        case 'message.status':
          invalidate(['messages', projectId, event.data.leadId]);
          break;
        case 'notification.created':
          invalidate(['notifications', projectId]);
          break;
        case 'quote.status':
          invalidate(['quotes', projectId], ['dashboard', projectId]);
          break;
        case 'lead.updated':
          invalidate(['leads', projectId], ['dashboard', projectId], ['activity', projectId]);
          break;
      }
    },
    [invalidate, leadName, projectId, router],
  );

  // Tras una caída pudieron perderse eventos: se refresca lo más vivo.
  const handleReconnect = useCallback(() => {
    invalidate(['conversations', projectId], ['messages', projectId], ['notifications', projectId]);
  }, [invalidate, projectId]);

  useRealtime(projectId, handleEvent, {
    enabled: !!projectId && can('LEAD_READ'),
    onReconnect: handleReconnect,
  });

  return null;
}
