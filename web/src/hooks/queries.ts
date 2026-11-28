import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  aiSettingsService,
  authService,
  conversationsService,
  customersService,
  dashboardService,
  leadsService,
  notesService,
  notificationsService,
  productsService,
  quotesService,
} from '@/services'
import { projectService } from '@/services/project.service'
import type { SimulatedPaymentInput } from '@/services/quotes.service'
import { searchService } from '@/services/search.service'
import type { AiSettings, LeadFilters, LeadStatus, NotificationKind, Paginated, Lead, QuoteStatus, ApiQuoteStatus } from '@/types/domain'

/** Claves de caché centralizadas. */
export const qk = {
  dashboard: ['dashboard'] as const,
  users: ['users'] as const,
  leads: (f?: LeadFilters) => ['leads', f ?? {}] as const,
  lead: (id: string) => ['lead', id] as const,
  conversations: (p?: object) => ['conversations', p ?? {}] as const,
  messages: (id: string) => ['messages', id] as const,
  aiSettings: ['ai-settings'] as const,
  customers: (p?: object) => ['customers', p ?? {}] as const,
  customer: (id: string) => ['customer', id] as const,
  customerQuotes: (id: string) => ['customer-quotes', id] as const,
  products: (p?: object) => ['products', p ?? {}] as const,
  quotes: (p?: object) => ['quotes', p ?? {}] as const,
  quote: (id: string) => ['quote', id] as const,
  recurrenteAvailability: ['recurrente-availability'] as const,
  recurrenteCheckout: (id: string) => ['recurrente-checkout', id] as const,
  notes: (p?: object) => ['notes', p ?? {}] as const,
  notifications: (kind?: string) => ['notifications', kind ?? ''] as const,
  quoteSummary: ['quote-summary'] as const,
  customersSummary: ['customers-summary'] as const,
}

/* Dashboard */
export const useDashboard = () => useQuery({ queryKey: qk.dashboard, queryFn: dashboardService.summary })
export const useUsers = () => useQuery({ queryKey: qk.users, queryFn: authService.users, staleTime: 5 * 60_000 })

/* Leads */
export const useLeads = (filters: LeadFilters) =>
  useQuery({ queryKey: qk.leads(filters), queryFn: () => leadsService.list(filters), placeholderData: keepPreviousData })

export const useLead = (id?: string) => useQuery({ queryKey: qk.lead(id ?? ''), queryFn: () => leadsService.get(id!), enabled: !!id })
export const useLeadActivity = (id?: string) => useQuery({ queryKey: ['lead-activity', id], queryFn: () => leadsService.activity(id!), enabled: !!id })

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: leadsService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: qk.dashboard })
    },
  })
}

export function useUpdateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof leadsService.update>[1] }) => leadsService.update(id, input),
    onSuccess: (lead) => {
      qc.setQueryData(qk.lead(lead.id), lead)
      qc.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

export function useDeleteLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: leadsService.remove,
    onSuccess: (_d, id) => {
      qc.removeQueries({ queryKey: qk.lead(id) })
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['notes'] })
      qc.invalidateQueries({ queryKey: qk.dashboard })
    },
  })
}

/** Cambia el estado de un lead con actualización optimista (kanban). */
export function useUpdateLeadStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) => leadsService.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['leads'] })
      const snapshots = qc.getQueriesData<Paginated<Lead>>({ queryKey: ['leads'] })
      snapshots.forEach(([key, data]) => {
        if (!data) return
        qc.setQueryData<Paginated<Lead>>(key, { ...data, data: data.data.map((l) => (l.id === id ? { ...l, status } : l)) })
      })
      return { snapshots }
    },
    onError: (_e, _v, ctx) => ctx?.snapshots.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSettled: (_d, _e, { id }) => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: qk.lead(id) })
      qc.invalidateQueries({ queryKey: ['lead-activity', id] })
      qc.invalidateQueries({ queryKey: qk.dashboard })
    },
  })
}

/* Conversaciones e IA */
export const useConversations = (params: { search?: string; channel?: string; leadId?: string; unread?: boolean }) =>
  useQuery({ queryKey: qk.conversations(params), queryFn: () => conversationsService.list(params), refetchInterval: 15_000 })

/** Conversaciones con mensajes sin leer (globo del menú). */
export const useConversationsUnread = () =>
  useQuery({ queryKey: ['conversations', 'unread-count'], queryFn: conversationsService.unreadCount, refetchInterval: 30_000 })

export const useMessages = (id?: string) =>
  useQuery({ queryKey: qk.messages(id ?? ''), queryFn: () => conversationsService.messages(id!), enabled: !!id, refetchInterval: 8_000 })

export function useSendMessage(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ text, author }: { text: string; author?: 'agent' | 'ai' }) => conversationsService.send(id, text, author),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.messages(id) })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

/** Plantillas de WhatsApp aprobadas (solo se piden con la ventana de 24 h cerrada). */
export const useWhatsAppTemplates = (enabled: boolean) =>
  useQuery({ queryKey: ['whatsapp-templates'], queryFn: conversationsService.templates, enabled, staleTime: 5 * 60_000, retry: false })

export function useSendTemplate(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { name: string; language: string; parameters: string[] }) => conversationsService.sendTemplate(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.messages(id) })
      qc.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: conversationsService.markRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

/** Insight de IA de un lead: se pide bajo demanda (consume cuota de IA). */
export const useLeadInsight = (leadId: string, enabled: boolean) =>
  useQuery({ queryKey: ['lead-insight', leadId], queryFn: () => conversationsService.insight(leadId), enabled, staleTime: 10 * 60_000, retry: false })

export function useToggleConversationAi() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, aiEnabled }: { id: string; aiEnabled: boolean }) => conversationsService.setAi(id, aiEnabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  })
}

export const useAiSuggestions = () => useMutation({ mutationFn: conversationsService.suggestions })

export const useAiSettings = () => useQuery({ queryKey: qk.aiSettings, queryFn: aiSettingsService.get })
export function useSaveAiSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (s: AiSettings) => aiSettingsService.save(s),
    onSuccess: (data) => qc.setQueryData(qk.aiSettings, data),
  })
}

/* Clientes */
export const useCustomers = (params: { search?: string; page?: number; pageSize?: number; active?: boolean }) =>
  useQuery({ queryKey: qk.customers(params), queryFn: () => customersService.list(params), placeholderData: keepPreviousData })
export const useCustomersSummary = () => useQuery({ queryKey: qk.customersSummary, queryFn: customersService.summary })
export const useCustomer = (id?: string) =>
  useQuery({ queryKey: qk.customer(id ?? ''), queryFn: () => customersService.get(id!), enabled: !!id })
export const useCustomerQuotes = (id?: string) =>
  useQuery({ queryKey: qk.customerQuotes(id ?? ''), queryFn: () => customersService.quotes(id!), enabled: !!id })
export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: customersService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: qk.customersSummary })
    },
  })
}
export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof customersService.update>[1] }) => customersService.update(id, input),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: qk.customer(c.id) })
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: qk.customersSummary })
    },
  })
}

/* Productos */
export const useProducts = (params: { search?: string; kind?: string; active?: boolean } = {}) =>
  useQuery({ queryKey: qk.products(params), queryFn: () => productsService.list(params), placeholderData: keepPreviousData })
export function useSaveProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: Parameters<typeof productsService.create>[0] }) =>
      id ? productsService.update(id, input) : productsService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

/* Cotizaciones */
/** Tras cualquier cambio en una cotización: listados, resumen, ficha del cliente y dashboard. */
function invalidateQuotes(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['quotes'] })
  qc.invalidateQueries({ queryKey: qk.quoteSummary })
  qc.invalidateQueries({ queryKey: ['customer-quotes'] })
  qc.invalidateQueries({ queryKey: ['customer'] })
  qc.invalidateQueries({ queryKey: qk.dashboard })
}
export const useQuotes = (params: { search?: string; status?: string; leadId?: string; clientId?: string; page?: number; pageSize?: number }) =>
  useQuery({ queryKey: qk.quotes(params), queryFn: () => quotesService.list(params), placeholderData: keepPreviousData })
export const useQuoteSummary = () => useQuery({ queryKey: qk.quoteSummary, queryFn: quotesService.summary })
/** Leads elegibles para cotizar (selector de Nueva cotización y del modal de IA). */
export const useQuoteLeads = (params: { search?: string; clientId?: string } = {}) =>
  useQuery({ queryKey: ['quote-leads', params], queryFn: () => quotesService.leadOptions(params), placeholderData: keepPreviousData })
/** IVA, vigencia y condiciones por defecto de la empresa activa. */
export const useQuoteSettings = () => useQuery({ queryKey: ['quote-settings'], queryFn: quotesService.settings, staleTime: 5 * 60_000 })
export function useCreateAiQuote() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: quotesService.aiDraft, onSuccess: () => invalidateQuotes(qc) })
}
export const useQuote = (id?: string) => useQuery({ queryKey: qk.quote(id ?? ''), queryFn: () => quotesService.get(id!), enabled: !!id })
export function useCreateQuote() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: quotesService.create, onSuccess: () => invalidateQuotes(qc) })
}
export function useUpdateQuoteStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: QuoteStatus | ApiQuoteStatus }) => quotesService.updateStatus(id, status),
    onSuccess: (q) => {
      qc.setQueryData(qk.quote(q.id), q)
      invalidateQuotes(qc)
    },
  })
}
export function useSimulateQuotePayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & SimulatedPaymentInput) => quotesService.simulatePayment(id, input),
    onSuccess: (q) => {
      qc.setQueryData(qk.quote(q.id), q)
      invalidateQuotes(qc)
    },
  })
}
export function useRecurrenteAvailability() {
  return useQuery({ queryKey: qk.recurrenteAvailability, queryFn: quotesService.recurrenteAvailability, staleTime: 30_000, retry: false })
}
export function useRecurrenteCheckout(quoteId: string) {
  return useQuery({ queryKey: qk.recurrenteCheckout(quoteId), queryFn: () => quotesService.recurrenteCheckout(quoteId) })
}
export function useCreateRecurrenteCheckout(quoteId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => quotesService.createRecurrenteCheckout(quoteId),
    onSuccess: (checkout) => qc.setQueryData(qk.recurrenteCheckout(quoteId), checkout),
  })
}
export function useVerifyRecurrentePayment(quoteId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => quotesService.verifyRecurrentePayment(quoteId),
    onSuccess: (result) => {
      qc.setQueryData(qk.recurrenteCheckout(quoteId), result.checkout)
      qc.setQueryData(qk.quote(quoteId), result.quote)
      if (result.outcome === 'PAID') invalidateQuotes(qc)
    },
  })
}
export function useSendQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; to?: string; message?: string }) => quotesService.send(id, input),
    onSuccess: (q) => {
      qc.setQueryData(qk.quote(q.id), q)
      invalidateQuotes(qc)
    },
  })
}
export function useDeleteQuote() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: quotesService.remove, onSuccess: () => invalidateQuotes(qc) })
}

/* Notas */
export const useNotes = (params: { leadId?: string; done?: boolean } = {}) =>
  useQuery({ queryKey: qk.notes(params), queryFn: () => notesService.list(params) })
/** Los seguimientos cambian el "próximo seguimiento" / "último contacto" del lead y la actividad. */
function invalidateNotes(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['notes'] })
  qc.invalidateQueries({ queryKey: ['leads'] })
  qc.invalidateQueries({ queryKey: ['lead'] })
  qc.invalidateQueries({ queryKey: ['lead-activity'] })
  qc.invalidateQueries({ queryKey: qk.dashboard })
}
export function useCreateNote() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: notesService.create, onSuccess: () => invalidateNotes(qc) })
}
export function useUpdateNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; done?: boolean; body?: string; followUpAt?: string | null }) => notesService.update(id, input),
    onSuccess: () => invalidateNotes(qc),
  })
}
export function useDeleteNote() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: notesService.remove, onSuccess: () => invalidateNotes(qc) })
}

/* Notificaciones */
export const useNotifications = (kind: NotificationKind | '' = '') =>
  useQuery({ queryKey: qk.notifications(kind), queryFn: () => notificationsService.list({ kind }), refetchInterval: 30_000 })
/** No leídas (campana). Clave bajo 'notifications' para que se invalide junto con la lista. */
export const useNotificationsUnread = () =>
  useQuery({ queryKey: ['notifications', '__unread'], queryFn: notificationsService.unreadCount, refetchInterval: 30_000 })
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: notificationsService.markAllRead, onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) })
}
export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: notificationsService.markRead, onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) })
}

/* Búsqueda global (barra superior) */
export const useGlobalSearch = (q: string) =>
  useQuery({
    queryKey: ['search', q],
    queryFn: () => searchService.search(q),
    enabled: q.trim().length >= 2,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })

/* Empresa (Configuración → Empresa y Usuarios) */
export const useProjectDetail = () => useQuery({ queryKey: ['project-detail'], queryFn: projectService.get })
export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: projectService.update, onSuccess: (data) => qc.setQueryData(['project-detail'], data) })
}
export const useInvitations = (enabled: boolean) =>
  useQuery({ queryKey: ['invitations'], queryFn: projectService.invitations, enabled, retry: false })
export function useInvite() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: projectService.invite, onSuccess: () => qc.invalidateQueries({ queryKey: ['invitations'] }) })
}
export function useRevokeInvitation() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: projectService.revokeInvitation, onSuccess: () => qc.invalidateQueries({ queryKey: ['invitations'] }) })
}
