// Utilidades de autenticación compartidas por las páginas públicas y el Route
// Handler de /auth/callback (sin 'use client': también corren en el servidor).

/**
 * Devuelve `next` solo si es una ruta interna ("/leads?x=1"). Así un enlace
 * como /login?next=https://sitio-malo.com no puede sacar al usuario de la app
 * (open redirect).
 */
export function safeNext(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next) return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  return next;
}

/** URL pública de la web para los enlaces que manda Supabase por correo. */
export function siteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return 'http://localhost:3001';
}

/** /auth/callback?next=... listo para emailRedirectTo / redirectTo. */
export function callbackUrl(next: string): string {
  return `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`;
}

export const MIN_PASSWORD_LENGTH = 8;

/**
 * Deja seleccionado un proyecto para cuando cargue el CRM. Usa la misma clave
 * que hooks/use-project.tsx (STORAGE_KEY = 'fc.projectId').
 */
export function rememberProject(projectId: string) {
  try {
    window.localStorage.setItem('fc.projectId', projectId);
  } catch {
    // almacenamiento no disponible
  }
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Traduce los errores de Supabase Auth (vienen en inglés) a mensajes en
 * español. Se mira primero el `code` (estable) y luego el texto.
 */
export function authErrorMessage(error: unknown): string {
  const { code, message, status } = (error ?? {}) as {
    code?: string;
    message?: string;
    status?: number;
  };
  const text = (message ?? '').toLowerCase();

  if (code === 'invalid_credentials' || text.includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos.';
  }
  if (code === 'email_not_confirmed' || text.includes('email not confirmed')) {
    return 'Aún no confirmas tu correo. Revisa tu bandeja de entrada.';
  }
  if (code === 'user_already_exists' || code === 'email_exists' || text.includes('already registered')) {
    return 'Ya existe una cuenta con ese correo. Inicia sesión.';
  }
  if (code === 'weak_password' || text.includes('password should')) {
    return `La contraseña es muy débil: usa al menos ${MIN_PASSWORD_LENGTH} caracteres, con letras y números.`;
  }
  if (code === 'same_password' || text.includes('different from the old password')) {
    return 'La nueva contraseña debe ser distinta de la anterior.';
  }
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || status === 429 || text.includes('rate limit')) {
    return 'Demasiados intentos. Espera un momento y vuelve a intentarlo.';
  }
  if (code === 'signup_disabled' || text.includes('signups not allowed')) {
    return 'El registro está deshabilitado. Solicita acceso a tu administrador.';
  }
  if (code === 'session_not_found' || code === 'session_expired' || text.includes('auth session missing')) {
    return 'Tu sesión venció. Vuelve a abrir el enlace del correo.';
  }
  if (text.includes('failed to fetch') || text.includes('network')) {
    return 'No pudimos conectar con el servidor. Revisa tu conexión.';
  }
  if (text.includes('faltan next_public_supabase')) {
    return 'La web no tiene configurado Supabase (variables NEXT_PUBLIC_SUPABASE_*).';
  }
  return 'No pudimos completar la operación. Inténtalo de nuevo.';
}
