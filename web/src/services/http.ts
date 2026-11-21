import { env } from '@/config/env'
import { getAccessToken } from '@/lib/supabase'

/**
 * Cliente HTTP único hacia la API de FlowCommerce (NestJS).
 *  - Pone el token de Supabase en Authorization: Bearer.
 *  - Convierte los errores del GlobalExceptionFilter ({ statusCode, message, error })
 *    en ApiError con un mensaje legible.
 *  - En 401 avisa a la app (AuthProvider) para que vuelva a /login.
 */
export class ApiError extends Error {
  status: number
  details?: unknown
  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

type Primitive = string | number | boolean | null | undefined
export type QueryParams = Record<string, Primitive | string[]>

interface RequestOptions {
  params?: QueryParams
  body?: unknown
  signal?: AbortSignal
}

export const UNAUTHORIZED_EVENT = 'flowcommerce:unauthorized'

function toQueryString(params?: QueryParams): string {
  if (!params) return ''
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue
    if (Array.isArray(v)) {
      if (v.length) qs.set(k, v.join(','))
    } else {
      qs.set(k, String(v))
    }
  }
  const text = qs.toString()
  return text ? `?${text}` : ''
}

function messageOf(payload: unknown, fallback: string): string {
  const raw = (payload as { message?: unknown } | null)?.message
  if (Array.isArray(raw)) return raw.join('. ')
  if (typeof raw === 'string' && raw) return raw
  return fallback
}

async function send(method: string, path: string, opts: RequestOptions = {}): Promise<Response> {
  const token = await getAccessToken()
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  let body: BodyInit | undefined
  if (opts.body instanceof FormData) {
    body = opts.body
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(opts.body)
  }

  let res: Response
  try {
    res = await fetch(`${env.apiUrl}${path}${toQueryString(opts.params)}`, { method, headers, body, signal: opts.signal })
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') throw err
    throw new ApiError(0, 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.')
  }

  if (res.status === 401) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
  if (!res.ok) {
    const text = await res.text()
    const payload = text ? safeJson(text) : null
    throw new ApiError(res.status, messageOf(payload, res.statusText || 'Ocurrió un error inesperado'), payload)
  }
  return res
}

async function request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await send(method, path, opts)
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? safeJson(text) : undefined) as T
}

function safeJson(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

export const http = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>('GET', path, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('POST', path, { ...opts, body: body ?? {} }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PUT', path, { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => request<T>('PATCH', path, { ...opts, body }),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),
  upload: <T>(path: string, form: FormData, method = 'POST') => request<T>(method, path, { body: form }),
  /** Descarga un archivo protegido (PDF, adjunto) y lo abre en otra pestaña o lo guarda. */
  async download(path: string, filename: string, open = false) {
    const res = await send('GET', path)
    const url = URL.createObjectURL(await res.blob())
    if (open) {
      window.open(url, '_blank', 'noopener')
    } else {
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  },
}

/* ───────────── Empresa (proyecto) activa ───────────── */

const PROJECT_KEY = 'fc.projectId'
let currentProjectId: string | null = readStoredProject()

function readStoredProject(): string | null {
  try {
    return localStorage.getItem(PROJECT_KEY)
  } catch {
    return null
  }
}

/** La empresa activa la fija AuthProvider; los servicios la leen con `pp()`. */
export function setCurrentProject(id: string | null) {
  currentProjectId = id
  try {
    if (id) localStorage.setItem(PROJECT_KEY, id)
    else localStorage.removeItem(PROJECT_KEY)
  } catch {
    /* almacenamiento no disponible */
  }
}

export function getCurrentProject(): string | null {
  return currentProjectId
}

/** Ruta de la API dentro de la empresa activa: pp('/leads') → /projects/:id/leads */
export function pp(path = ''): string {
  if (!currentProjectId) throw new ApiError(400, 'Selecciona o crea una empresa para continuar.')
  return `/projects/${currentProjectId}${path}`
}

/** Respuesta paginada de nuestra API. */
export interface ApiPaginated<T> {
  data: T[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado'
}
