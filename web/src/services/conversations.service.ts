import type { AiSettings, AiSuggestion, Conversation, LeadInsight, Message, MessageDelivery, WhatsAppTemplate } from '@/types/domain'
import { ApiError, getCurrentProject, http, pp, type ApiPaginated } from './http'
import { STAGE_TO_STATUS, type ApiLeadStage } from './mappers/leads'

/*
 * En la API no existe la entidad "conversación": la bandeja es la vista de los
 * mensajes de WhatsApp agrupados por lead. Por eso Conversation.id = leadId.
 *  - Bandeja:      GET  /conversations                       (un elemento por lead)
 *  - Chat:         GET  /leads/:leadId/messages
 *  - Enviar:       POST /leads/:leadId/messages              (texto libre, ventana de 24 h)
 *                  POST /leads/:leadId/messages/template     (plantilla aprobada)
 *  - Leído:        POST /leads/:leadId/messages/read
 *  - Sugerencias:  POST /assistant/leads/:leadId/reply-suggestions
 *
 * Sin respaldo en la API (se guardan en este navegador, por empresa):
 *  - el interruptor de IA por conversación (aiEnabled),
 *  - la configuración del asistente (aiSettingsService),
 *  - qué mensajes enviados salieron de una sugerencia de IA (para la etiqueta).
 */

/* ───────────── Formas de la API ───────────── */

interface ApiMessage {
  id: string
  projectId: string
  leadId: string
  whatsappMessageId: string
  direction: 'INBOUND' | 'OUTBOUND'
  type: 'TEXT' | 'TEMPLATE' | 'IMAGE' | 'DOCUMENT' | 'AUDIO' | 'VIDEO' | 'OTHER'
  content: string
  templateName: string | null
  attachmentId: string | null
  status: string
  errorMessage: string | null
  readAt: string | null
  creadoEn: string
}

interface ApiConversation {
  lead: { id: string; name: string; phone: string | null; company: string | null; stage: ApiLeadStage }
  lastMessage: ApiMessage
  unreadCount: number
  windowOpenUntil: string | null
}

interface ApiLeadMessages {
  data: ApiMessage[]
  nextCursor: string | null
  windowOpenUntil: string | null
}

/* ───────────── Almacenamiento local (por empresa) ───────────── */

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* almacenamiento no disponible */
  }
}

const scoped = (name: string) => `fc.${name}.${getCurrentProject() ?? 'none'}`

export const DEFAULT_AI_SETTINGS: AiSettings = {
  enabled: true,
  autoReply: false,
  tone: 'cercano',
  businessHoursOnly: false,
  handoffKeywords: ['asesor', 'humano', 'queja'],
  instructions: '',
}

const readAiSettings = (): AiSettings => readJson(scoped('aiSettings'), DEFAULT_AI_SETTINGS)

/** Interruptor de IA por lead; sin valor propio hereda "Activar asistente". */
function aiEnabledFor(leadId: string): boolean {
  const map = readJson<Record<string, boolean>>(scoped('aiByLead'), {})
  return map[leadId] ?? readAiSettings().enabled
}

function aiMessageIds(): Set<string> {
  try {
    const raw = localStorage.getItem(scoped('aiMessages'))
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function rememberAiMessage(id: string) {
  const ids = [...aiMessageIds(), id].slice(-500)
  try {
    localStorage.setItem(scoped('aiMessages'), JSON.stringify(ids))
  } catch {
    /* almacenamiento no disponible */
  }
}

/** Nombres de los contactos vistos en la bandeja (para firmar los mensajes del cliente). */
const contactNames = new Map<string, string>()

/* ───────────── Mapeos ───────────── */

const DELIVERY: Record<string, MessageDelivery> = {
  SENT: 'enviado',
  DELIVERED: 'entregado',
  READ: 'leido',
  FAILED: 'fallido',
}

function whatsappReason(reason: string | null): string | null {
  if (!reason) return null
  if (reason.includes('131047') || /re-engagement/i.test(reason)) {
    return 'Fuera de la ventana de 24 h: WhatsApp solo acepta plantillas aprobadas.'
  }
  return reason
}

function preview(m: ApiMessage): string {
  const text = m.content?.trim() || (m.type === 'TEMPLATE' ? `Plantilla ${m.templateName ?? ''}`.trim() : 'Archivo')
  return m.direction === 'OUTBOUND' ? `Tú: ${text}` : text
}

function toConversation(c: ApiConversation): Conversation {
  contactNames.set(c.lead.id, c.lead.name)
  return {
    id: c.lead.id,
    leadId: c.lead.id,
    contactName: c.lead.name,
    company: c.lead.company ?? '',
    channel: 'whatsapp',
    lastMessage: preview(c.lastMessage),
    lastMessageAt: c.lastMessage.creadoEn,
    unread: c.unreadCount,
    aiEnabled: aiEnabledFor(c.lead.id),
    phone: c.lead.phone ?? undefined,
    status: STAGE_TO_STATUS[c.lead.stage],
    windowOpenUntil: c.windowOpenUntil,
  }
}

function toMessage(m: ApiMessage, aiIds: Set<string>): Message {
  const inbound = m.direction === 'INBOUND'
  const ai = !inbound && aiIds.has(m.id)
  return {
    id: m.id,
    conversationId: m.leadId,
    author: inbound ? 'lead' : ai ? 'ai' : 'agent',
    authorName: inbound ? contactNames.get(m.leadId) ?? 'Cliente' : ai ? 'Sugerencia de IA' : 'Equipo',
    text: m.content,
    createdAt: m.creadoEn,
    delivery: inbound ? undefined : DELIVERY[m.status?.toUpperCase()] ?? 'enviando',
    errorMessage: whatsappReason(m.errorMessage),
    attachmentId: m.attachmentId,
    templateName: m.templateName,
  }
}

/** Traduce los errores del envío por WhatsApp (la API los devuelve en inglés). */
function sendError(err: unknown): never {
  if (!(err instanceof ApiError)) throw err
  const m = err.message
  let text = m
  if (err.status === 403) text = 'No tienes permiso para enviar mensajes en esta empresa.'
  else if (/no phone number/i.test(m)) text = 'Este lead no tiene teléfono: agrégalo para escribirle por WhatsApp.'
  else if (/not a valid WhatsApp destination/i.test(m)) text = 'El teléfono del lead no es un número válido de WhatsApp.'
  else if (/not configured|WABA/i.test(m)) text = 'WhatsApp no está configurado para esta empresa. Un administrador debe conectarlo.'
  else if (/request failed|did not return|returned no id/i.test(m))
    text = 'WhatsApp rechazó el envío. Si el cliente no escribió en las últimas 24 h, usa una plantilla aprobada.'
  else if (/template/i.test(m) && err.status === 404) text = 'La plantilla no existe o aún no está aprobada por Meta.'
  throw new ApiError(err.status, text, err.details)
}

/* ───────────── Servicio ───────────── */

export const conversationsService = {
  /** Bandeja (100 más recientes). Con leadId devuelve la conversación de ese lead (0 o 1). */
  async list(params: { search?: string; channel?: string; leadId?: string; unread?: boolean } = {}): Promise<Conversation[]> {
    // Por ahora el único canal conectado a la API es WhatsApp.
    if (params.channel && params.channel !== 'whatsapp') return []

    if (params.leadId) {
      const res = await http.get<ApiLeadMessages>(pp(`/leads/${params.leadId}/messages`), { params: { limit: 50 } })
      const last = res.data[res.data.length - 1]
      if (!last) return []
      return [
        {
          id: params.leadId,
          leadId: params.leadId,
          contactName: contactNames.get(params.leadId) ?? '',
          company: '',
          channel: 'whatsapp',
          lastMessage: preview(last),
          lastMessageAt: last.creadoEn,
          unread: res.data.filter((m) => m.direction === 'INBOUND' && !m.readAt).length,
          aiEnabled: aiEnabledFor(params.leadId),
          windowOpenUntil: res.windowOpenUntil,
        },
      ]
    }

    const res = await http.get<ApiPaginated<ApiConversation>>(pp('/conversations'), {
      params: { search: params.search?.trim() || undefined, unread: params.unread || undefined, limit: 100 },
    })
    return res.data.map(toConversation)
  },

  /** Conversaciones con mensajes sin leer (globo del menú). */
  unreadCount: () => http.get<{ conversations: number; messages: number }>(pp('/conversations/unread-count')),

  /** Últimos 100 mensajes del chat, del más antiguo al más reciente. */
  async messages(id: string): Promise<Message[]> {
    const res = await http.get<ApiLeadMessages>(pp(`/leads/${id}/messages`), { params: { limit: 100 } })
    const aiIds = aiMessageIds()
    return res.data.map((m) => toMessage(m, aiIds))
  },

  async send(id: string, text: string, author: 'agent' | 'ai' = 'agent'): Promise<Message> {
    const sent = await http.post<ApiMessage>(pp(`/leads/${id}/messages`), { content: text }).catch(sendError)
    if (author === 'ai') rememberAiMessage(sent.id)
    return toMessage(sent, author === 'ai' ? new Set([sent.id]) : new Set())
  },

  /** Plantillas aprobadas por Meta (para escribir con la ventana de 24 h cerrada). */
  templates: () => http.get<WhatsAppTemplate[]>(pp('/whatsapp/templates')).catch(sendError),

  async sendTemplate(id: string, input: { name: string; language: string; parameters: string[] }): Promise<Message> {
    const sent = await http.post<ApiMessage>(pp(`/leads/${id}/messages/template`), input).catch(sendError)
    return toMessage(sent, new Set())
  },

  markRead: (id: string) => http.post<void>(pp(`/leads/${id}/messages/read`)),

  /** Sin respaldo en la API: se guarda en este navegador. */
  async setAi(id: string, aiEnabled: boolean): Promise<{ id: string; aiEnabled: boolean }> {
    const key = scoped('aiByLead')
    writeJson(key, { ...readJson<Record<string, boolean>>(key, {}), [id]: aiEnabled })
    return { id, aiEnabled }
  },

  async suggestions(id: string): Promise<AiSuggestion[]> {
    const res = await http.post<{ suggestions: string[] }>(pp(`/assistant/leads/${id}/reply-suggestions`))
    return (res.suggestions ?? []).map((text, i) => ({ id: `${id}-${Date.now()}-${i}`, text, intent: `Opción ${i + 1}` }))
  },

  insight: (leadId: string) => http.get<LeadInsight>(pp(`/assistant/leads/${leadId}/insight`)),

  downloadAttachment: (attachmentId: string, filename: string) =>
    http.download(pp(`/attachments/${attachmentId}/download`), filename, true),
}

/**
 * La API no guarda preferencias del asistente: se conservan en este navegador
 * (una configuración por empresa). Las sugerencias usan la IA del servidor.
 */
export const aiSettingsService = {
  get: async (): Promise<AiSettings> => readAiSettings(),
  save: async (settings: AiSettings): Promise<AiSettings> => {
    writeJson(scoped('aiSettings'), settings)
    return settings
  },
}
