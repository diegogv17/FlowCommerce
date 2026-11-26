import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { KeyRound, Link2Off } from 'lucide-react'
import { useToast } from '@/app/toast'
import { Button, Field } from '@/components/ui'
import { getSupabase } from '@/lib/supabase'
import { AuthHeading, AuthLoading, AuthNotice, AuthShell, linkButton } from './AuthShell'
import { PasswordInput } from './PasswordInput'
import { MIN_PASSWORD_LENGTH, authError } from './utils'

type SessionState = 'checking' | 'ready' | 'missing'

/**
 * Llega aquí desde /auth/callback con la sesión de recuperación (o de invitación)
 * ya creada. Si el correo usó el flujo implícito (#access_token=… en el hash),
 * se toma la sesión del hash. También sirve para que un usuario con sesión
 * cambie su contraseña.
 */
export function ResetPasswordPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [state, setState] = useState<SessionState>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      const supabase = getSupabase()
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const accessToken = hash.get('access_token')
      const refreshToken = hash.get('refresh_token')
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      }
      if (window.location.hash) {
        // No dejar los tokens en la barra de direcciones ni en el historial.
        window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
      }
      const { data } = await supabase.auth.getSession()
      if (!cancelled) setState(data.session ? 'ready' : 'missing')
    }
    init().catch(() => {
      if (!cancelled) setState('missing')
    })
    return () => {
      cancelled = true
    }
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const found: Record<string, string> = {}
    if (password.length < MIN_PASSWORD_LENGTH) found.password = `Usa al menos ${MIN_PASSWORD_LENGTH} caracteres.`
    if (confirm !== password) found.confirm = 'Las contraseñas no coinciden.'
    setErrors(found)
    if (Object.keys(found).length) return

    setLoading(true)
    try {
      const { error: updateError } = await getSupabase().auth.updateUser({ password })
      if (updateError) {
        setError(authError(updateError))
        return
      }
      toast.success('Contraseña actualizada')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(authError(err))
    } finally {
      setLoading(false)
    }
  }

  if (state === 'checking') return <AuthLoading text="Validando el enlace…" />

  if (state === 'missing') {
    return (
      <AuthShell>
        <AuthHeading icon={<Link2Off className="size-6" />} title="El enlace venció" subtitle="El enlace para crear tu contraseña ya se usó, venció o se abrió en otro navegador." />
        <Link to="/olvide-contrasena" className={linkButton.primary}>
          Pedir un enlace nuevo
        </Link>
        <p className="mt-6 text-center text-sm text-navy-400">
          <Link to="/login" className="font-medium text-flow-600 hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <AuthHeading icon={<KeyRound className="size-6" />} title="Crea una contraseña nueva" subtitle="Escríbela dos veces para confirmarla." />
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Nueva contraseña" error={errors.password} hint={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`}>
          <PasswordInput autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Confirma la contraseña" error={errors.confirm}>
          <PasswordInput autoComplete="new-password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        {error && <AuthNotice>{error}</AuthNotice>}
        <Button type="submit" size="lg" loading={loading} className="w-full">
          Guardar contraseña
        </Button>
      </form>
    </AuthShell>
  )
}
