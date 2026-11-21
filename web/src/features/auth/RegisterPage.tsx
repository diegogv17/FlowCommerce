import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { useAuth } from '@/app/auth'
import { Button, Field, Input } from '@/components/ui'
import { getSupabase } from '@/lib/supabase'
import { AuthHeading, AuthNotice, AuthShell } from './AuthShell'
import { PasswordInput } from './PasswordInput'
import { MIN_PASSWORD_LENGTH, authError, callbackUrl, isValidEmail, safeNext } from './utils'

export function RegisterPage() {
  const { hasSession } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  // Tras registrarse va a crear su empresa, salvo que venga de una invitación (?next=/invitacion?token=…).
  const next = safeNext(params.get('next'), '/onboarding')

  const [name, setName] = useState('')
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  if (hasSession && !sentTo) return <Navigate to={next} replace />

  const validate = () => {
    const found: Record<string, string> = {}
    if (name.trim().length < 2) found.name = 'Escribe tu nombre.'
    if (!isValidEmail(email)) found.email = 'Escribe un correo válido.'
    if (password.length < MIN_PASSWORD_LENGTH) found.password = `Usa al menos ${MIN_PASSWORD_LENGTH} caracteres.`
    if (confirm !== password) found.confirm = 'Las contraseñas no coinciden.'
    setErrors(found)
    return Object.keys(found).length === 0
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validate()) return
    setLoading(true)
    try {
      const { data, error: signUpError } = await getSupabase().auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim() }, emailRedirectTo: callbackUrl(next) },
      })
      if (signUpError) {
        setError(authError(signUpError))
        return
      }
      if (data.session) {
        // Supabase sin confirmación de correo: ya hay sesión.
        navigate(next, { replace: true })
        return
      }
      // Hay que confirmar el correo (o la cuenta ya existía: Supabase no lo revela).
      setSentTo(email.trim())
    } catch (err) {
      setError(authError(err))
    } finally {
      setLoading(false)
    }
  }

  const loginHref = next !== '/onboarding' ? `/login?next=${encodeURIComponent(next)}` : '/login'

  if (sentTo) {
    return (
      <AuthShell>
        <AuthHeading
          icon={<MailCheck className="size-6" />}
          title="Revisa tu correo"
          subtitle={
            <>
              Te enviamos un enlace a <b className="text-navy-700">{sentTo}</b>. Ábrelo para activar tu cuenta y continuar. Si no lo ves, revisa la carpeta de spam.
            </>
          }
        />
        <Link to={loginHref} className="text-sm font-medium text-flow-600 hover:underline">
          Volver a iniciar sesión
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <AuthHeading title="Crea tu cuenta" subtitle="Ordena tus leads, conversaciones y cotizaciones en minutos." />

      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Nombre completo" error={errors.name}>
          <Input autoComplete="name" placeholder="Mariana Ruiz" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        </Field>
        <Field label="Correo electrónico" error={errors.email}>
          <Input type="email" autoComplete="email" placeholder="nombre@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Contraseña" error={errors.password} hint={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres.`}>
          <PasswordInput autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Confirma la contraseña" error={errors.confirm}>
          <PasswordInput autoComplete="new-password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>

        {error && <AuthNotice>{error}</AuthNotice>}

        <Button type="submit" size="lg" loading={loading} className="w-full">
          Crear cuenta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-navy-400">
        ¿Ya tienes cuenta?{' '}
        <Link to={loginHref} className="font-medium text-flow-600 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  )
}
