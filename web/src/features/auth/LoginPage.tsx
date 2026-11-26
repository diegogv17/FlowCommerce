import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/app/auth'
import { Button, Field, Input } from '@/components/ui'
import { AuthHeading, AuthNotice, AuthShell } from './AuthShell'
import { PasswordInput } from './PasswordInput'
import { safeNext } from './utils'

export function LoginPage() {
  const { hasSession, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const linkError = params.get('error') === 'link'
  const nextParam = params.get('next')
  // ?next= (p. ej. volver a una invitación) o la ruta protegida de la que vino.
  const target = safeNext(nextParam, safeNext((location.state as { from?: string } | null)?.from, '/dashboard'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (hasSession) return <Navigate to={target} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login({ email, password })
      navigate(target, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos iniciar sesión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const registerHref = nextParam ? `/registro?next=${encodeURIComponent(target)}` : '/registro'

  return (
    <AuthShell>
      <AuthHeading title="Bienvenido de nuevo" subtitle="Ingresa con tu cuenta para continuar." />

      <form onSubmit={submit} className="space-y-4">
        <Field label="Correo electrónico">
          <Input type="email" autoComplete="email" required placeholder="nombre@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Contraseña">
          <PasswordInput autoComplete="current-password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>

        <div className="flex justify-end text-xs">
          <Link to="/olvide-contrasena" className="font-medium text-flow-600 hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        {linkError && !error && <AuthNotice tone="warning">El enlace del correo expiró o ya se usó. Inicia sesión o pide uno nuevo.</AuthNotice>}

        {error && <AuthNotice>{error}</AuthNotice>}

        <Button type="submit" size="lg" loading={loading} className="w-full">
          Iniciar sesión
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-navy-400">
        ¿No tienes cuenta?{' '}
        <Link to={registerHref} className="font-medium text-flow-600 hover:underline">
          Crea tu cuenta gratis
        </Link>
      </p>
    </AuthShell>
  )
}
