import type { AiSettings, AiSuggestion, Conversation, Message } from '@/types/domain'
import { http } from './http'

export const conversationsService = {
  list: (params: { search?: string; channel?: string; leadId?: string } = {}) =>
    http.get<Conversation[]>('/conversations', { params }),
  messages: (id: string) => http.get<Message[]>(`/conversations/${id}/messages`),
  send: (id: string, text: string, author: 'agent' | 'ai' = 'agent') =>
    http.post<Message>(`/conversations/${id}/messages`, { text, author }),
  markRead: (id: string) => http.post<{ ok: boolean }>(`/conversations/${id}/read`),
  setAi: (id: string, aiEnabled: boolean) => http.patch<Conversation>(`/conversations/${id}`, { aiEnabled }),
  suggestions: (id: string) => http.post<AiSuggestion[]>(`/conversations/${id}/ai-suggestions`),
}

export const aiSettingsService = {
  get: () => http.get<AiSettings>('/settings/ai'),
  save: (settings: AiSettings) => http.put<AiSettings>('/settings/ai', settings),
}
