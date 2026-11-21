import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Building2, LogOut } from 'lucide-react'
import { useAuth } from '@/app/auth'
import { useToast } from '@/app/toast'
import { Button, ErrorState, Field, Input, Textarea } from '@/components/ui'
import { getSupabase } from '@/lib/supabase'
import { authService } from '@/services/auth.service'
import { ApiError, errorMessage } from '@/services/http'
import { AuthHeading, AuthLoading, AuthNotice, AuthShell } from './AuthShell'
import { SLUG_RE, slugify } from './utils'

/** Primer paso tras registrarse: crear la empresa (proyecto). Con ?nueva=1 sirve para crear otra. */
export function OnboardingPage() {
  const { loading, hasSession, projects, loadError, refresh, selectProject, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()
  const isNew = params.get('nueva') === '1'

  const [firstName, setFirstName] = useState('')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  // El nombre que puso al registrarse (metadata de Supabase) para el saludo.
  useEffect(() => {
    getSupabase()
      .auth.getSession()
      .then(({ data }) => {
        const full = (data.session?.user.user_metadata?.name as string | undefined) ?? ''
        setFirstName(full.trim().split(/\s+/)[0] ?? '')
      })
      .catch(() => undefined)
  }, [])

  if (loading && !saving) return <AuthLoading text="Cargando tu cuenta…" />
  if (!hasSession) return <Navigate to="/login" replace state={{ from: `/onboarding${isNew ? '?nueva=1' : ''}` }} />
  if (!isNew && !saving && !done && projects.length > 0) return <Navigate to="/dashboard" replace />

  const onNameChange = (value: string) => {
    setName(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const found: Record<string, string> = {}
    if (name.trim().length < 2) found.name = 'Escribe el nombre de tu empresa.'
    if (!SLUG_RE.test(slug)) found.slug = 'Usa minúsculas, números y guiones (sin espacios).'
    setErrors(found)
    if (Object.keys(found).length) return

    setSaving(true)
    try {
      const project = await authService.createProject({ name: name.trim(), slug, description: description.trim() || undefined })
      setDone(true)
      // Se deja elegida antes de recargar: refresh() respeta la empresa guardada.
      selectProject(project.id)
      try {
        await refresh()
      } catch {
        /* AppLayout mostrará el error con "Reintentar" */
      }
      selectProject(project.id)
      toast.success(`¡Listo! ${project.name} ya está creada.`)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setDone(false)
      if (err instanceof ApiError && err.status === 409) {
        setErrors({ slug: 'Ese identificador ya está en uso. Prueba con otro.' })
      } else {
        toast.error(errorMessage(err))
      }
    } finally {
      setSaving(false)
    }
  }

  const exit = (
    <button type="button" onClick={() => void logout()} className="inline-flex items-center gap-1.5 text-sm text-navy-400 hover:text-navy-900">
      <LogOut className="size-4" /> Salir
    </button>
  )

  if (loadError && projects.length === 0 && !saving) {
    return (
      <AuthShell action={exit}>
        <ErrorState message={loadError} onRetry={() => void refresh().catch(() => undefined)} />
      </AuthShell>
    )
  }

  return (
    <AuthShell action={exit} wide>
      <AuthHeading
        icon={<Building2 className="size-6" />}
        title={isNew ? 'Crea otra empresa' : firstName ? `Hola, ${firstName}` : 'Te damos la bienvenida'}
        subtitle="Crea tu empresa para empezar. Luego podrás invitar a tu equipo desde Configuración."
      />

      {isNew && projects.length > 0 && (
        <AuthNotice tone="info" className="mb-5">
          Ya perteneces a {projects.length === 1 ? 'una empresa' : `${projects.length} empresas`}.{' '}
          <Link to="/dashboard" className="font-medium underline">
            Volver al dashboard
          </Link>
        </AuthNotice>
      )}

      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Nombre de la empresa" error={errors.name}>
          <Input autoFocus placeholder="Distribuidora El Quetzal" value={name} onChange={(e) => onNameChange(e.target.value)} maxLength={255} />
        </Field>
        <Field label="Identificador" error={errors.slug} hint="Único y permanente: no se puede cambiar después.">
          <Input
            className="font-mono text-xs"
            placeholder="distribuidora-el-quetzal"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value.toLowerCase())
            }}
            maxLength={255}
          />
        </Field>
        <Field label="Descripción (opcional)">
          <Textarea placeholder="¿Qué vende tu empresa?" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
        </Field>
        <Button type="submit" size="lg" loading={saving} className="w-full">
          Crear empresa
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-navy-400">¿Te invitaron a una empresa? Abre el enlace de invitación que llegó a tu correo.</p>
    </AuthShell>
  )
}
