import type { Page, Request, Route } from '@playwright/test'

export const API = 'http://api.e2e.invalid/api/v1'
export const PROJECT_ID = '11111111-1111-4111-8111-111111111111'
const SUPABASE = 'https://e2e.supabase.invalid'
const USER_ID = '22222222-2222-4222-8222-222222222222'
const ACCESS_TOKEN = 'e2e-access-token'

// El front (localhost) llama a otro origen: sin CORS el navegador bloquea la
// respuesta. Authorization debe listarse explícitamente (el comodín no la cubre).
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
  'access-control-allow-headers': 'authorization, content-type, accept',
}

/** Un chunk del protocolo "UI message stream" (SSE) del Vercel AI SDK v6. */
export type StreamChunk = Record<string, unknown> & { type: string }

/** Cuerpo SSE tal como lo escribe pipeUIMessageStreamToResponse en la API. */
export function sse(chunks: StreamChunk[]): string {
  return chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join('') + 'data: [DONE]\n\n'
}

/** Texto partido en varios text-delta, como llega del modelo en streaming. */
export function textChunks(id: string, text: string): StreamChunk[] {
  const pieces = text.match(/.{1,12}/gs) ?? []
  return [
    { type: 'text-start', id },
    ...pieces.map((delta) => ({ type: 'text-delta', id, delta })),
    { type: 'text-end', id },
  ]
}

/**
 * Sesión de Supabase sembrada en localStorage (persistSession: true), con la
 * clave que usa supabase-js: sb-<subdominio>-auth-token.
 */
async function seedSession(page: Page) {
  const nowSec = Math.floor(Date.now() / 1000)
  const session = {
    access_token: ACCESS_TOKEN,
    refresh_token: 'e2e-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: nowSec + 3600,
    user: {
      id: USER_ID,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'asesora@flowcommerce.test',
      app_metadata: {},
      user_metadata: {},
      created_at: new Date().toISOString(),
    },
  }
  await page.addInitScript(
    ([key, value, projectId]) => {
      window.localStorage.setItem(key, value)
      window.localStorage.setItem('fc.projectId', projectId)
    },
    ['sb-e2e-auth-token', JSON.stringify(session), PROJECT_ID] as const,
  )
}

export interface FakeBackend {
  /** Cuerpos JSON recibidos por POST /assistant/chat, en orden. */
  chatBodies: Array<{ id?: string; messages: Array<Record<string, any>> }>
  /** Cabeceras Authorization recibidas por la API. */
  authHeaders: string[]
  /** Hosts a los que intentó salir el navegador fuera de la app. */
  externalHosts: Set<string>
}

/**
 * Instala la sesión y la API falsa. "chat" decide qué stream devolver para
 * cada envío del chat (n = 0 el primero, 1 el segundo…).
 */
export async function installFakeBackend(
  page: Page,
  chat: (n: number, body: FakeBackend['chatBodies'][number]) => StreamChunk[],
): Promise<FakeBackend> {
  const backend: FakeBackend = { chatBodies: [], authHeaders: [], externalHosts: new Set() }
  await seedSession(page)

  page.on('request', (req: Request) => {
    const host = new URL(req.url()).hostname
    if (host !== 'localhost') backend.externalHosts.add(host)
  })

  // Supabase: nunca se habla con el real.
  await page.route(`${SUPABASE}/**`, (route) => route.fulfill({ status: 200, headers: CORS, json: {} }))

  await page.route(`${API}/**`, async (route: Route) => {
    const req = route.request()
    const url = new URL(req.url())
    const path = url.pathname.replace('/api/v1', '')
    const auth = req.headers()['authorization']
    if (auth) backend.authHeaders.push(auth)

    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS })
    if (path === '/users/me') {
      return route.fulfill({
        headers: CORS,
        json: { id: USER_ID, name: 'Ana Asesora', email: 'asesora@flowcommerce.test', phone: null, position: null, avatarUrl: null },
      })
    }
    if (path === '/projects/my') {
      return route.fulfill({
        headers: CORS,
        json: [{ id: PROJECT_ID, name: 'Distribuidora E2E', slug: 'distribuidora-e2e', description: null, role: 'MEMBER' }],
      })
    }
    if (path === `/projects/${PROJECT_ID}/assistant/chat` && req.method() === 'POST') {
      const body = req.postDataJSON() as FakeBackend['chatBodies'][number]
      const n = backend.chatBodies.push(body) - 1
      return route.fulfill({
        status: 200,
        headers: {
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache',
          'x-vercel-ai-ui-message-stream': 'v1',
          ...CORS,
        },
        body: sse(chat(n, body)),
      })
    }
    // Resto de pantallas (menú lateral, notificaciones…): respuesta vacía
    // con la forma paginada de la API; esta prueba no las evalúa.
    return route.fulfill({ headers: CORS, json: { data: [], meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 } } })
  })

  return backend
}
