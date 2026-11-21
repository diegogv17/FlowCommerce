import { authErrorMessage } from '@/app/auth'
import { appUrl } from '@/lib/supabase'

export const MIN_PASSWORD_LENGTH = 8

/**
 * Devuelve `next` solo si es una ruta interna ("/leads?x=1"). Así un enlace como
 * /login?next=https://sitio-malo.com no puede sacar al usuario de la app.
 */
export function safeNext(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next) return fallback
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback
  return next
}

/** URL de /auth/callback?next=… para emailRedirectTo / redirectTo de Supabase. */
export function callbackUrl(next: string): string {
  return appUrl(`/auth/callback?next=${encodeURIComponent(next)}`)
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/** Mismo patrón que valida CreateProjectDto: kebab-case con guiones simples. */
export const SLUG_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')
}

/** authErrorMessage() + los casos propios de registro y cambio de contraseña. */
export function authError(error: unknown): string {
  const { code, message } = (error ?? {}) as { code?: string; message?: string }
  const text = (message ?? '').toLowerCase()
  if (code === 'same_password' || text.includes('different from the old password')) {
    return 'La nueva contraseña debe ser distinta de la anterior.'
  }
  if (code === 'signup_disabled' || text.includes('signups not allowed')) {
    return 'El registro está deshabilitado. Pide acceso a tu administrador.'
  }
  if (code === 'session_not_found' || text.includes('auth session missing')) {
    return 'Tu enlace venció. Pide uno nuevo.'
  }
  if (text.includes('failed to fetch') || text.includes('network')) {
    return 'No pudimos conectar con el servidor. Revisa tu conexión.'
  }
  return authErrorMessage(message)
}
