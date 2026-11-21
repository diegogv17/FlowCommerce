import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, MailCheck } from 'lucide-react'
import { Button, Field, Input } from '@/components/ui'
import { getSupabase } from '@/lib/supabase'
import { AuthHeading, AuthNotice, AuthShell } from './AuthShell'
import { callbackUrl, isValidEmail } from './utils'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!isValidEmail(email)) {
      setError('Escribe un correo válido.')
      return
    }
    setLoading(true)
    try {
      await getSupabase().auth.resetPasswordForEmail(email.trim(), { redirectTo: callbackUrl('/restablecer-contrasena') })
    } catch {
      // Respuesta neutra: no se revela si el correo existe ni si falló.
    } finally {
      setLoading(false)
      setSent(true)
    }
  }

  return (
    <AuthShell>
      {sent ? (
        <AuthHeading
          icon={<MailCheck className="size-6" />}
          title="Revisa tu correo"
          subtitle="Si existe una cuenta con ese correo, te enviamos un enlace para crear una contraseña nueva. Si no lo ves, revisa la carpeta de spam."
        />
      ) : (
        <>
          <AuthHeading title="Recupera tu contraseña" subtitle="Escribe el correo de tu cuenta y te enviaremos un enlace." />
          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field label="Correo electrónico">
              <Input type="email" autoComplete="email" placeholder="nombre@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            {error && <AuthNotice>{error}</AuthNotice>}
            <Button type="submit" size="lg" loading={loading} className="w-full">
              Enviar enlace
            </Button>
          </form>
        </>
      )}

      <Link to="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-flow-600 hover:underline">
        <ArrowLeft className="size-4" /> Volver a iniciar sesión
      </Link>
    </AuthShell>
  )
}
