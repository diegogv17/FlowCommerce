import { DefaultChatTransport, type UIMessage } from 'ai'
import { env } from '@/config/env'
import { getAccessToken } from '@/lib/supabase'
import { UNAUTHORIZED_EVENT, pp } from '@/services/http'

/**
 * Transporte del chat del asistente (POST /projects/:id/assistant/chat).
 *  - La URL se arma en CADA envío con la empresa activa (puede cambiar sin
 *    recargar la página).
 *  - El token de Supabase va en Authorization; la clave de Gemini nunca pasa
 *    por el navegador: solo la conoce la API.
 *  - Solo se envían "id" y "messages": la API valida el resto a mano.
 */
export function createAssistantTransport(): DefaultChatTransport<UIMessage> {
  return new DefaultChatTransport<UIMessage>({
    prepareSendMessagesRequest: async ({ id, messages }) => {
      const token = await getAccessToken()
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`
      return {
        api: `${env.apiUrl}${pp('/assistant/chat')}`,
        headers,
        body: { id, messages },
      }
    },
    fetch: async (input, init) => {
      const res = await fetch(input, init)
      if (res.status === 401) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
      if (!res.ok) {
        // Los errores previos al stream (400/403/429/503) llegan como JSON de
        // la API; se convierten en un mensaje legible para el chat.
        const payload = (await res.json().catch(() => null)) as { message?: string | string[] } | null
        const message = Array.isArray(payload?.message) ? payload.message.join('. ') : payload?.message
        throw new Error(message || 'El asistente no está disponible en este momento.')
      }
      return res
    },
  })
}
