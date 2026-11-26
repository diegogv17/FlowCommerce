import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Building2, MailX } from 'lucide-react'
import { useAuth } from '@/app/auth'
import { useToast } from '@/app/toast'
import { Button, Spinner } from '@/components/ui'
import { formatDate } from '@/lib/format'
import { getSupabase } from '@/lib/supabase'
import { ApiError, errorMessage, http } from '@/services/http'
import type { ApiRole } from '@/types/domain'
import { AuthHeading, AuthLoading, AuthNotice, AuthShell, linkButton } from './AuthShell'

interface InvitationPreview {
  projectId: string
  projectName: string
  email: string
  role: ApiRole
  expiresAt: string
}

interface AcceptedInvitation {
  projectId: string
  role: ApiRole
}

const ROLE_LABEL: Record<string, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  MEMBER: 'Asesor',
  VIEWER: 'Solo lectura',
}

/**
 * /invitacion?token=… — El token va en el BODY (POST /invitations/preview, público,
 * y /invitations/accept, con sesión del mismo correo invitado). Sin sesión se
 * manda a login/registro con ?next de vuelta a esta pantalla.
 */
export function InvitationPage() {
  const { hasSession, loading, refresh, selectProject, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const validToken = token.length >= 20 && token.length <= 200
  // undefined = todavía no se sabe; null = la sesión no tiene correo.
  const [sessionEmail, setSessionEmail] = useState<string | null | undefined>(undefined)

  // Correo de la sesión abierta (para avisar si es distinto al invitado).
  useEffect(() => {
    if (!hasSession) {
      setSessionEmail(undefined)
      return
    }
    let cancelled = false
    getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        if (!cancelled) setSessionEmail(data.session?.user.email ?? null)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [hasSession])

  const preview = useQuery({
    queryKey: ['invitation-preview', token],
    queryFn: () => http.post<InvitationPreview>('/invitations/preview', { token }),
    enabled: validToken,
    retry: false,
    staleTime: Infinity,
  })

  const accept = useMutation({
    mutationFn: () => http.post<AcceptedInvitation>('/invitations/accept', { token }),
    onSuccess: async (result) => {
      selectProject(result.projectId)
      try {
        await refresh()
      } catch {
        /* AppLayout mostrará el error con "Reintentar" */
      }
      selectProject(result.projectId)
      toast.success(`Te uniste a ${preview.data?.projectName ?? 'la empresa'}`)
      navigate('/dashboard', { replace: true })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) toast.error('Esta invitación ya se usó o ya eres parte de la empresa.')
      else if (error instanceof ApiError && error.status === 403) toast.error('Inicia sesión con el mismo correo al que llegó la invitación.')
      else toast.error(errorMessage(error))
    },
  })

  if (!validToken) {
    return (
      <AuthShell>
        <AuthHeading icon={<MailX className="size-6" />} title="Invitación no válida" subtitle="El enlace está incompleto. Ábrelo de nuevo desde el correo." />
        <Link to="/login" className="text-sm font-medium text-flow-600 hover:underline">
          Ir a iniciar sesión
        </Link>
      </AuthShell>
    )
  }

  if (preview.isLoading || (loading && !accept.isPending)) return <AuthLoading text="Cargando la invitación…" />

  if (preview.isError || !preview.data) {
    const tooMany = preview.error instanceof ApiError && preview.error.status === 429
    return (
      <AuthShell>
        <AuthHeading
          icon={<MailX className="size-6" />}
          title="Invitación no disponible"
          subtitle={
            tooMany
              ? 'Demasiados intentos. Espera un momento y recarga la página.'
              : 'La invitación no existe, ya se usó, se revocó o venció. Pide una nueva a quien te invitó.'
          }
        />
        <Link to={hasSession ? '/dashboard' : '/login'} className="text-sm font-medium text-flow-600 hover:underline">
          {hasSession ? 'Ir al dashboard' : 'Ir a iniciar sesión'}
        </Link>
      </AuthShell>
    )
  }

  const invitation = preview.data
  const back = `/invitacion?token=${encodeURIComponent(token)}`
  const sameEmail = !!sessionEmail && sessionEmail.toLowerCase() === invitation.email.toLowerCase()

  return (
    <AuthShell>
      <AuthHeading
        icon={<Building2 className="size-6" />}
        title={`Te invitaron a ${invitation.projectName}`}
        subtitle={
          <>
            Entrarás como <b className="text-navy-700">{ROLE_LABEL[invitation.role] ?? invitation.role}</b> con el correo{' '}
            <b className="text-navy-700">{invitation.email}</b>. La invitación vence el {formatDate(invitation.expiresAt)}.
          </>
        }
      />

      {!hasSession ? (
        <div className="space-y-3">
          <p className="text-sm text-navy-400">Para aceptarla, inicia sesión o crea tu cuenta con ese correo.</p>
          <Link to={`/login?next=${encodeURIComponent(back)}`} className={linkButton.primary}>
            Iniciar sesión
          </Link>
          <Link to={`/registro?next=${encodeURIComponent(back)}&email=${encodeURIComponent(invitation.email)}`} className={linkButton.secondary}>
            Crear cuenta
          </Link>
        </div>
      ) : sessionEmail === undefined ? (
        <div className="flex items-center gap-3 text-sm text-navy-400">
          <Spinner /> Revisando tu sesión…
        </div>
      ) : sameEmail ? (
        <Button size="lg" className="w-full" loading={accept.isPending} onClick={() => accept.mutate()}>
          Aceptar invitación
        </Button>
      ) : (
        <div className="space-y-4">
          <AuthNotice tone="warning">
            Tienes la sesión abierta como <b>{sessionEmail ?? 'otro usuario'}</b>. Esta invitación es para <b>{invitation.email}</b>.
          </AuthNotice>
          <Button size="lg" variant="secondary" className="w-full" onClick={() => void logout()}>
            Cerrar sesión y usar otro correo
          </Button>
        </div>
      )}
    </AuthShell>
  )
}
