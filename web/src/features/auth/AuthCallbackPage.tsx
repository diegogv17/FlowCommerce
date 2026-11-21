import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { EmailOtpType } from '@supabase/supabase-js'
import { getSupabase } from '@/lib/supabase'
import { AuthLoading } from './AuthShell'
import { safeNext } from './utils'

const OTP_TYPES: EmailOtpType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email']

/**
 * Destino de los enlaces que manda Supabase por correo (confirmar registro,
 * recuperar contraseña, invitaciones). Convierte el enlace en sesión y va a ?next.
 *  - PKCE (?code=…): lo canjea supabase-js al iniciar (detectSessionInUrl);
 *    getSession() espera a que termine ese canje.
 *  - Plantillas con token_hash (?token_hash=…&type=…): verifyOtp.
 *  - Flujo implícito (#access_token=…, invitaciones creadas desde el backend): setSession.
 *  - ?error= / #error=: enlace vencido o ya usado → /login?error=link.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate()
  const started = useRef(false)

  useEffect(() => {
    // Solo una vez (StrictMode monta dos veces y un token_hash no se puede usar dos veces).
    if (started.current) return
    started.current = true

    const query = new URLSearchParams(window.location.search)
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const rawType = query.get('type') ?? hash.get('type')
    const type = OTP_TYPES.includes(rawType as EmailOtpType) ? (rawType as EmailOtpType) : null
    const fallback = type === 'recovery' || type === 'invite' ? '/restablecer-contrasena' : '/dashboard'
    const next = safeNext(query.get('next'), fallback)
    const fail = () => navigate('/login?error=link', { replace: true })

    if (query.get('error') || query.get('error_description') || hash.get('error') || hash.get('error_description')) {
      fail()
      return
    }

    const run = async () => {
      const supabase = getSupabase()
      const tokenHash = query.get('token_hash')
      const accessToken = hash.get('access_token')
      const refreshToken = hash.get('refresh_token')

      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
        if (error) return fail()
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        if (error) return fail()
      }

      const { data, error } = await supabase.auth.getSession()
      if (error || !data.session) return fail()
      navigate(next, { replace: true })
    }
    run().catch(fail)
  }, [navigate])

  return <AuthLoading text="Validando el enlace…" />
}
