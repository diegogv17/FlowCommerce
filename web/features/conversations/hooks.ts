'use client';

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { api, apiFetch, type Paginated } from '@/lib/api';
import { useProject } from '@/hooks/use-project';
import type {
  Conversation,
  ConversationFilters,
  LeadMessagesPage,
  LeadPanelData,
  LeadQuoteSummary,
  Message,
  QuickReply,
  SendTemplateInput,
  UnreadCount,
  UploadedAttachment,
  WhatsAppTemplate,
} from './types';

/** Mensajes por página del chat (el backend admite hasta 100). */
export const MESSAGES_PAGE_SIZE = 30;
/** Límite del backend para POST /attachments. */
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;

/* --------------------------- Bandeja --------------------------- */

export function useConversations(filters: ConversationFilters, page: number, limit = 20) {
  const { projectId, path } = useProject();
  const search = filters.search?.trim() || undefined;
  const unread = filters.unread || undefined;
  return useQuery({
    queryKey: ['conversations', projectId, 'list', { search, unread, page, limit }],
    queryFn: () =>
      api.get<Paginated<Conversation>>(path('/conversations'), { search, unread, page, limit }),
    enabled: !!projectId,
    placeholderData: keepPreviousData,
  });
}

/** Misma queryKey que el globo del menú (app-shell): comparten caché. */
export function useUnreadConversations() {
  const { projectId, path, can } = useProject();
  return useQuery({
    queryKey: ['conversations', projectId, 'unread-count'],
    queryFn: () => api.get<UnreadCount>(path('/conversations/unread-count')),
    enabled: !!projectId && can('LEAD_READ'),
  });
}

/* ---------------------------- Chat ----------------------------- */

export function messagesKey(projectId: string, leadId: string) {
  return ['messages', projectId, leadId] as const;
}

/**
 * Historial con paginación por cursor hacia ARRIBA: la primera página son los
 * mensajes más recientes; cada página siguiente, los anteriores a nextCursor.
 */
export function useLeadMessages(leadId: string) {
  const { projectId, path } = useProject();
  return useInfiniteQuery({
    queryKey: messagesKey(projectId, leadId),
    queryFn: ({ pageParam, signal }) =>
      api.get<LeadMessagesPage>(
        path(`/leads/${leadId}/messages`),
        { before: pageParam, limit: MESSAGES_PAGE_SIZE },
        signal,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!projectId && !!leadId,
  });
}

/** Agrega al final del chat (página más reciente) un mensaje recién enviado. */
function appendMessage(
  data: InfiniteData<LeadMessagesPage, string | undefined> | undefined,
  message: Message,
): InfiniteData<LeadMessagesPage, string | undefined> | undefined {
  if (!data || data.pages.length === 0) return data;
  const [first, ...rest] = data.pages;
  if (first.data.some((item) => item.id === message.id)) return data;
  return { ...data, pages: [{ ...first, data: [...first.data, message] }, ...rest] };
}

/** Tras enviar: pinta el mensaje sin esperar y refresca bandeja y lead. */
function useAfterSend(leadId: string) {
  const { projectId } = useProject();
  const queryClient = useQueryClient();
  return (message: Message) => {
    queryClient.setQueryData<InfiniteData<LeadMessagesPage, string | undefined>>(
      messagesKey(projectId, leadId),
      (data) => appendMessage(data, message),
    );
    void queryClient.invalidateQueries({ queryKey: ['conversations', projectId] });
    void queryClient.invalidateQueries({ queryKey: ['leads', projectId] });
  };
}

export function useSendMessage(leadId: string) {
  const { path } = useProject();
  const afterSend = useAfterSend(leadId);
  return useMutation({
    mutationFn: (content: string) => api.post<Message>(path(`/leads/${leadId}/messages`), { content }),
    onSuccess: afterSend,
  });
}

export function useSendTemplate(leadId: string) {
  const { path } = useProject();
  const afterSend = useAfterSend(leadId);
  return useMutation({
    mutationFn: (input: SendTemplateInput) =>
      api.post<Message>(path(`/leads/${leadId}/messages/template`), input),
    onSuccess: afterSend,
  });
}

/** Sube el archivo a /attachments (del lead) y lo envía por WhatsApp. */
export function useSendMedia(leadId: string) {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  const afterSend = useAfterSend(leadId);
  return useMutation({
    mutationFn: async ({ file, caption }: { file: File; caption?: string }) => {
      const form = new FormData();
      form.append('file', file);
      form.append('leadId', leadId);
      const attachment = await api.upload<UploadedAttachment>(path('/attachments'), form);
      return api.post<Message>(path(`/leads/${leadId}/messages/media`), {
        attachmentId: attachment.id,
        caption: caption?.trim() || undefined,
      });
    },
    onSuccess: (message) => {
      afterSend(message);
      void queryClient.invalidateQueries({ queryKey: ['attachments', projectId] });
    },
  });
}

/** POST /messages/read: apaga los no leídos de este chat. */
export function useMarkConversationRead(leadId: string) {
  const { projectId, path } = useProject();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<void>(path(`/leads/${leadId}/messages/read`)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['conversations', projectId] });
    },
  });
}

export function useQuickReplies(enabled = true) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['quick-replies', projectId],
    queryFn: () => api.get<QuickReply[]>(path('/quick-replies')),
    enabled: !!projectId && enabled,
    staleTime: 5 * 60_000,
  });
}

export function useWhatsAppTemplates(enabled: boolean) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['whatsapp-templates', projectId],
    queryFn: () => api.get<WhatsAppTemplate[]>(path('/whatsapp/templates')),
    enabled: !!projectId && enabled,
    staleTime: 5 * 60_000,
  });
}

/**
 * URL local (blob:) de un adjunto protegido. Un <img src> no puede mandar el
 * Bearer, así que se descarga con fetch y se crea un object URL.
 */
export function useAttachmentObjectUrl(attachmentId: string | null, enabled = true) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['attachments', projectId, 'blob', attachmentId],
    queryFn: async () => {
      const response = await apiFetch<Response>(path(`/attachments/${attachmentId}/download`), {
        raw: true,
      });
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    },
    enabled: !!projectId && !!attachmentId && enabled,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
  });
}

/* ------------------------ Panel del lead ------------------------ */

/** Misma queryKey que useLead de features/leads: comparten caché. */
export function useLeadPanel(leadId: string) {
  const { projectId, path } = useProject();
  return useQuery({
    queryKey: ['leads', projectId, 'detail', leadId],
    queryFn: () => api.get<LeadPanelData>(path(`/leads/${leadId}`)),
    enabled: !!projectId && !!leadId,
  });
}

/** Misma queryKey que useLeadQuotes de features/leads. */
export function useLeadQuoteSummaries(leadId: string) {
  const { projectId, path, can } = useProject();
  return useQuery({
    queryKey: ['quotes', projectId, { leadId }],
    queryFn: () => api.get<Paginated<LeadQuoteSummary>>(path('/quotes'), { leadId, limit: 100 }),
    enabled: !!projectId && !!leadId && can('QUOTE_READ'),
  });
}
