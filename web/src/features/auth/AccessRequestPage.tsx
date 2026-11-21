import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { Button, Field, Input } from '@/components/ui'
import { ApiError, http } from '@/services/http'
import { AuthHeading, AuthNotice, AuthShell } from './AuthShell'
import { isValidEmail } from './utils'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * /solicitar-acceso?proyecto=<id> — POST /auth/access-requests { projectId, email } (público).
 * El backend responde 202 siempre (no revela si el correo existe); 404 solo si la empresa no existe.
 */
export function AccessRequestPage() {
  const [params] = useSearchParams()
  const fromLink = params.get('proyecto') ?? params.get('projectId') ?? ''
  const [projectId, setProjectId] = useState(fromLink)
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const found: Record<string, string> = {}
    if (!UUID_RE.test(projectId.trim())) found.projectId = 'El código de la empresa no es válido.'
    if (!isValidEmail(email)) found.email = 'Escribe un correo válido.'
    setErrors(found)
    if (Object.keys(found).length) return

    setLoading(true)
    try {
      await http.post('/auth/access-requests', { projectId: projectId.trim(), email: email.trim() })
      setSent(true)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setError('No encontramos esa empresa. Revisa el enlace o el código que te compartieron.')
      else if (err instanceof ApiError && err.status === 429) setError('Demasiadas solicitudes. Espera unos minutos e intenta de nuevo.')
      else if (err instanceof ApiError && err.status === 400) setError('Revisa los datos: el correo o el código no son válidos.')
      else setError('No pudimos enviar la solicitud. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      {sent ? (
        <AuthHeading
          icon={<MailCheck className="size-6" />}
          title="Solicitud enviada"
          subtitle="Los administradores de la empresa la revisarán. Si la aprueban, te llegará un correo para crear tu contraseña."
        />
      ) : (
        <>
          <AuthHeading title="Solicita acceso" subtitle="Pide a los administradores de tu empresa que te den acceso a FlowCommerce." />
          <form onSubmit={submit} className="space-y-4" noValidate>
            {!UUID_RE.test(fromLink) && (
              <Field label="Código de la empresa" error={errors.projectId} hint="Pídelo a tu administrador.">
                <Input className="font-mono text-xs" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
              </Field>
            )}
            <Field label="Correo electrónico" error={errors.email}>
              <Input type="email" autoComplete="email" placeholder="nombre@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            {error && <AuthNotice>{error}</AuthNotice>}
            <Button type="submit" size="lg" loading={loading} className="w-full">
              Enviar solicitud
            </Button>
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm text-navy-400">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-medium text-flow-600 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  )
}
