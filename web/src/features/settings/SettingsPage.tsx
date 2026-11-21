import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Info, Mail, Save, Sparkles, Trash2, UserPlus } from 'lucide-react'
import { Avatar, Badge, Button, Card, CardHeader, ErrorState, Field, Input, PageHeader, PageLoader, Segmented, Select, Textarea, Toggle } from '@/components/ui'
import { useAuth } from '@/app/auth'
import { useToast } from '@/app/toast'
import { useAiSettings, useInvitations, useInvite, useProjectDetail, useRevokeInvitation, useSaveAiSettings, useUpdateProject, useUsers } from '@/hooks/queries'
import { authService } from '@/services/auth.service'
import { errorMessage } from '@/services/http'
import type { InvitableRole, ProjectDetail } from '@/services/project.service'
import { getAccessToken } from '@/lib/supabase'
import { cn } from '@/lib/cn'
import { formatDate } from '@/lib/format'
import type { AiSettings } from '@/types/domain'

const tabs = [
  { key: 'perfil', label: 'Perfil' },
  { key: 'usuarios', label: 'Usuarios' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'ia', label: 'IA' },
] as const
type Tab = (typeof tabs)[number]['key']

const roleOptions: Array<{ value: InvitableRole; label: string }> = [
  { value: 'MEMBER', label: 'Asesor' },
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'VIEWER', label: 'Solo lectura' },
]

function Row({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div><p className="text-[13.5px] font-semibold">{title}</p><p className="mt-0.5 text-xs text-navy-400">{text}</p></div>
      {children}
    </div>
  )
}

function useIsAdmin() {
  const { user } = useAuth()
  return user?.apiRole === 'OWNER' || user?.apiRole === 'ADMIN'
}

/** La foto se sirve con autenticación: se descarga con el token y se muestra como blob. */
function useAvatarBlob(url: string | null | undefined) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    if (!url) {
      setSrc(null)
      return
    }
    let objectUrl: string | null = null
    let cancelled = false
    ;(async () => {
      try {
        const token = await getAccessToken()
        const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        if (!res.ok || cancelled) return
        objectUrl = URL.createObjectURL(await res.blob())
        setSrc(objectUrl)
      } catch {
        /* sin foto: se muestran las iniciales */
      }
    })()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url])
  return [src, setSrc] as const
}

function ProfileSection() {
  const { user, updateProfile } = useAuth()
  const toast = useToast()
  const initial = () => ({ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '', position: user?.position ?? '' })
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatar, setAvatar] = useAvatarBlob(user?.avatarUrl)
  const fileRef = useRef<HTMLInputElement>(null)
  const reset = () => setForm(initial())

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      // El correo no se cambia desde la API (es el de la cuenta de acceso).
      const input = { name: form.name.trim(), email: user?.email ?? form.email, phone: form.phone, position: form.position.trim() || null }
      await updateProfile(input)
      toast.success('Perfil actualizado')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return toast.error('Usa una imagen PNG, JPG o WebP.')
    if (file.size > 2 * 1024 * 1024) return toast.error('La imagen no puede pesar más de 2 MB.')
    setUploading(true)
    try {
      await authService.uploadAvatar(file)
      setAvatar(URL.createObjectURL(file))
      toast.success('Foto de perfil actualizada')
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <Card className="pb-6">
      <CardHeader title="Tu perfil" />
      <p className="px-5 pt-1 text-xs text-navy-400">Administra tu cuenta, tu foto y tus datos de contacto.</p>
      <form onSubmit={submit}>
        <div className="flex items-center gap-4 px-5 pt-5">
          {avatar ? <img src={avatar} alt="" className="size-16 rounded-full object-cover" /> : <Avatar name={form.name || 'U'} size={64} className="bg-flow-500! text-white!" />}
          <div>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <Button type="button" variant="secondary" size="sm" loading={uploading} onClick={() => fileRef.current?.click()}>Cambiar imagen</Button>
            <p className="mt-1.5 text-xs text-navy-300">PNG, JPG o WebP, máximo 2 MB</p>
          </div>
        </div>
        <div className="grid gap-4 px-5 pt-5 sm:grid-cols-2">
          <Field label="Nombre completo"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Correo electrónico" hint="Es el correo con el que inicias sesión; no se puede cambiar aquí."><Input type="email" readOnly value={form.email} className="text-navy-400" /></Field>
          <Field label="Teléfono"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="num" /></Field>
          <Field label="Cargo"><Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="Ej. Asesor comercial" /></Field>
          <Field label="Rol en la empresa"><Input readOnly value={user?.roleLabel ?? ''} /></Field>
        </div>
        <div className="flex gap-2 px-5 pt-6"><Button type="submit" loading={saving}>Guardar cambios</Button><Button type="button" variant="secondary" onClick={reset}>Descartar</Button></div>
      </form>
    </Card>
  )
}

function InviteCard() {
  const toast = useToast()
  const invitations = useInvitations(true)
  const invite = useInvite()
  const revoke = useRevokeInvitation()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<InvitableRole>('MEMBER')
  const pending = (invitations.data ?? []).filter((i) => i.status === 'PENDING')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    invite.mutate(
      { email: email.trim(), role },
      {
        onSuccess: () => {
          toast.success(`Invitación enviada a ${email.trim()}`)
          setEmail('')
        },
        onError: (err) => {
          const m = errorMessage(err)
          if (/already a member/i.test(m)) toast.error('Esa persona ya es parte del equipo.')
          else if (/cannot invite members with that role/i.test(m)) toast.error('Tu rol no puede invitar personas con ese rol.')
          else toast.error(m)
        },
      },
    )
  }

  return (
    <Card className="pb-4">
      <CardHeader title="Invitar al equipo" />
      <form onSubmit={submit} className="flex flex-wrap items-end gap-3 px-5 pt-4">
        <Field label="Correo" className="min-w-56 flex-1"><Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="persona@empresa.com" /></Field>
        <Field label="Rol" className="w-44">
          <Select value={role} onChange={(e) => setRole(e.target.value as InvitableRole)}>
            {roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </Select>
        </Field>
        <Button type="submit" icon={<UserPlus className="size-4" />} loading={invite.isPending}>Invitar</Button>
      </form>
      <p className="px-5 pt-2 text-xs text-navy-400">Le llegará un enlace por correo que vence en 7 días.</p>
      {pending.length > 0 && (
        <ul className="mt-3 divide-y divide-navy-100/60 px-2">
          {pending.map((i) => (
            <li key={i.id} className="flex items-center gap-3 px-3 py-3">
              <span className="grid size-9 place-items-center rounded-full bg-amber-50 text-amber-600"><Mail className="size-4" /></span>
              <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium">{i.email}</p><p className="text-xs text-navy-400">{roleOptions.find((r) => r.value === i.role)?.label} · vence {formatDate(i.expiresAt)}</p></div>
              <Badge tone="amber">Pendiente</Badge>
              <Button variant="ghost" size="sm" aria-label="Cancelar invitación" title="Cancelar invitación" loading={revoke.isPending && revoke.variables === i.id} onClick={() => revoke.mutate(i.id, { onError: (err) => toast.error(errorMessage(err)) })} icon={<Trash2 className="size-3.5" />} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

function UsersSection() {
  const isAdmin = useIsAdmin()
  const { data, isLoading, isError, refetch } = useUsers()
  if (isError) return <Card><ErrorState onRetry={() => refetch()} /></Card>
  if (isLoading || !data) return <PageLoader />
  return (
    <div className="space-y-4">
      <Card className="pb-2">
        <CardHeader title="Usuarios del equipo" action={<span className="text-xs text-navy-300">{data.length} {data.length === 1 ? 'persona' : 'personas'}</span>} />
        <ul className="mt-3 divide-y divide-navy-100/60 px-2">
          {data.map((u) => (
            <li key={u.id} className="flex items-center gap-3 rounded-xl px-3 py-3.5">
              <Avatar name={u.name} size={38} />
              <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold">{u.name}</p><p className="truncate text-xs text-navy-400">{u.email}{u.position ? ` · ${u.position}` : ''}</p></div>
              <Badge tone={u.role === 'admin' ? 'violet' : u.role === 'supervisor' ? 'amber' : 'blue'}>{u.roleLabel}</Badge>
            </li>
          ))}
        </ul>
      </Card>
      {isAdmin ? <InviteCard /> : <p className="flex items-center gap-1.5 px-1 text-xs text-navy-400"><Info className="size-3.5" /> Solo los administradores pueden invitar personas.</p>}
    </div>
  )
}

type CompanyForm = {
  name: string
  description: string
  legalName: string
  taxId: string
  address: string
  phone: string
  email: string
  taxPercent: string
  folioPrefix: string
  validityDays: string
  defaultTerms: string
}

function toForm(p: ProjectDetail): CompanyForm {
  return {
    name: p.name,
    description: p.description ?? '',
    legalName: p.billing.legalName ?? '',
    taxId: p.billing.taxId ?? '',
    address: p.billing.address ?? '',
    phone: p.billing.phone ?? '',
    email: p.billing.email ?? '',
    taxPercent: String(p.quoteSettings.taxPercent),
    folioPrefix: p.quoteSettings.folioPrefix,
    validityDays: String(p.quoteSettings.validityDays),
    defaultTerms: p.quoteSettings.defaultTerms ?? '',
  }
}

const orNull = (v: string) => (v.trim() ? v.trim() : null)

function CompanySection() {
  const toast = useToast()
  const { refresh } = useAuth()
  const isAdmin = useIsAdmin()
  const { data, isLoading, isError, refetch } = useProjectDetail()
  const update = useUpdateProject()
  const [form, setForm] = useState<CompanyForm | null>(null)

  useEffect(() => {
    if (data) setForm(toForm(data))
  }, [data])

  if (isError) return <Card><ErrorState onRetry={() => refetch()} /></Card>
  if (isLoading || !form || !data) return <PageLoader />

  const set = (k: keyof CompanyForm) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value })

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const tax = Number(form.taxPercent)
    const days = Number(form.validityDays)
    const prefix = form.folioPrefix.trim().toUpperCase()
    if (!Number.isFinite(tax) || tax < 0 || tax > 100) return toast.error('El IVA debe estar entre 0 y 100.')
    if (!Number.isInteger(days) || days < 1 || days > 3650) return toast.error('La vigencia debe ser un número de días entre 1 y 3650.')
    if (!/^[A-Z0-9][A-Z0-9-]{0,15}$/.test(prefix)) return toast.error('El prefijo del folio admite de 1 a 16 caracteres: letras, números o guion.')
    const nameChanged = form.name.trim() !== data.name
    update.mutate(
      {
        name: form.name.trim(),
        description: orNull(form.description),
        billing: { legalName: orNull(form.legalName), taxId: orNull(form.taxId), address: orNull(form.address), phone: orNull(form.phone), email: orNull(form.email) },
        quoteSettings: { taxPercent: tax, folioPrefix: prefix, validityDays: days, defaultTerms: orNull(form.defaultTerms) },
      },
      {
        onSuccess: () => {
          toast.success('Datos de la empresa guardados')
          // El nombre se muestra en el menú: se vuelven a leer las empresas.
          if (nameChanged) refresh().catch(() => undefined)
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {!isAdmin && <p className="flex items-center gap-1.5 px-1 text-xs text-navy-400"><Info className="size-3.5" /> Solo los administradores pueden modificar estos datos.</p>}
      <fieldset disabled={!isAdmin} className="space-y-4">
        <Card className="pb-5">
          <CardHeader title="Empresa" />
          <div className="grid gap-4 px-5 pt-4 sm:grid-cols-2">
            <Field label="Nombre"><Input required maxLength={255} value={form.name} onChange={set('name')} /></Field>
            <Field label="Identificador"><Input readOnly value={data.slug} className="text-navy-400" /></Field>
            <Field label="Descripción" className="sm:col-span-2"><Textarea rows={2} maxLength={2000} value={form.description} onChange={set('description')} /></Field>
          </div>
        </Card>
        <Card className="pb-5">
          <CardHeader title="Datos de facturación" />
          <p className="px-5 pt-1 text-xs text-navy-400">Aparecen en el PDF de las cotizaciones.</p>
          <div className="grid gap-4 px-5 pt-4 sm:grid-cols-2">
            <Field label="Razón social"><Input maxLength={255} value={form.legalName} onChange={set('legalName')} /></Field>
            <Field label="NIT"><Input maxLength={32} value={form.taxId} onChange={set('taxId')} className="num" /></Field>
            <Field label="Dirección" className="sm:col-span-2"><Input maxLength={500} value={form.address} onChange={set('address')} /></Field>
            <Field label="Teléfono"><Input maxLength={32} value={form.phone} onChange={set('phone')} className="num" /></Field>
            <Field label="Correo"><Input type="email" maxLength={255} value={form.email} onChange={set('email')} /></Field>
          </div>
        </Card>
        <Card className="pb-5">
          <CardHeader title="Cotizaciones" />
          <div className="grid gap-4 px-5 pt-4 sm:grid-cols-3">
            <Field label="IVA (%)"><Input type="number" min={0} max={100} step="0.01" value={form.taxPercent} onChange={set('taxPercent')} className="num" /></Field>
            <Field label="Prefijo del folio" hint={`Ej. ${form.folioPrefix.trim().toUpperCase() || 'COT'}-000123`}><Input maxLength={16} value={form.folioPrefix} onChange={set('folioPrefix')} className="num uppercase" /></Field>
            <Field label="Vigencia (días)"><Input type="number" min={1} max={3650} step={1} value={form.validityDays} onChange={set('validityDays')} className="num" /></Field>
            <Field label="Moneda"><Input readOnly value={data.quoteSettings.currency} className="text-navy-400" /></Field>
            <Field label="Condiciones por defecto" className="sm:col-span-3"><Textarea rows={4} maxLength={10000} value={form.defaultTerms} onChange={set('defaultTerms')} /></Field>
          </div>
        </Card>
      </fieldset>
      {isAdmin && (
        <div className="flex gap-2">
          <Button type="submit" icon={<Save className="size-4" />} loading={update.isPending}>Guardar cambios</Button>
          <Button type="button" variant="secondary" onClick={() => setForm(toForm(data))}>Descartar</Button>
        </div>
      )}
    </form>
  )
}

function AiSection() {
  const toast = useToast()
  const { data, isLoading, isError, refetch } = useAiSettings()
  const save = useSaveAiSettings()
  const [form, setForm] = useState<AiSettings | null>(null)
  const [keywords, setKeywords] = useState('')

  useEffect(() => {
    if (data) {
      setForm(data)
      setKeywords(data.handoffKeywords.join(', '))
    }
  }, [data])

  if (isError) return <Card><ErrorState onRetry={() => refetch()} /></Card>
  if (isLoading || !form) return <PageLoader />

  const submit = () =>
    save.mutate({ ...form, handoffKeywords: keywords.split(',').map((k) => k.trim()).filter(Boolean) }, {
      onSuccess: () => toast.success('Preferencias de IA guardadas en este navegador'),
      onError: (e) => toast.error(e.message),
    })

  const soon = 'Próximamente: el servidor aún no envía respuestas automáticas.'

  return (
    <Card className="pb-5">
      <CardHeader title={<span className="flex items-center gap-2"><Sparkles className="size-4 text-teal-500" /> Asistente de IA</span>} action={<Button size="sm" icon={<Save className="size-3.5" />} loading={save.isPending} onClick={submit}>Guardar cambios</Button>} />
      <p className="mx-5 mt-1 flex items-start gap-2 rounded-xl bg-flow-50/60 px-3 py-2 text-xs text-flow-700">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Estas preferencias se guardan solo en este navegador (por empresa). Las sugerencias de respuesta y el análisis de leads usan la IA del servidor; el tono, las palabras clave y las instrucciones todavía no se envían a la IA.
      </p>
      <div className="divide-y divide-navy-100/70 px-5">
        <Row title="Activar asistente" text="Permite pedir sugerencias de respuesta en la bandeja de conversaciones."><Toggle checked={form.enabled} onChange={(v) => setForm({ ...form, enabled: v })} label="Activar asistente" /></Row>
        <Row title="Responder automáticamente" text={`La IA envía la respuesta sin revisión de un asesor. ${soon}`}><Toggle checked={false} disabled onChange={() => undefined} label="Responder automáticamente" /></Row>
        <Row title="Solo fuera de horario" text={`Limita las respuestas automáticas al horario no laboral. ${soon}`}><Toggle checked={false} disabled onChange={() => undefined} label="Solo fuera de horario" /></Row>
        <Row title="Tono de las respuestas" text="Estilo con el que escribe el asistente."><Segmented value={form.tone} onChange={(tone) => setForm({ ...form, tone })} options={[{ value: 'formal', label: 'Formal' }, { value: 'cercano', label: 'Cercano' }, { value: 'neutro', label: 'Neutro' }]} /></Row>
      </div>
      <div className="space-y-4 px-5 pt-4">
        <Field label="Palabras que derivan a un asesor" hint="Separadas por comas. Si el lead las menciona, la IA se detiene."><Input value={keywords} onChange={(e) => setKeywords(e.target.value)} /></Field>
        <Field label="Instrucciones para el asistente"><Textarea rows={5} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></Field>
      </div>
    </Card>
  )
}

export function SettingsPage() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('tab')
  const tab: Tab = tabs.some((t) => t.key === requested) ? (requested as Tab) : 'perfil'
  const setTab = (t: Tab) => setParams(t === 'perfil' ? {} : { tab: t }, { replace: true })
  return (
    <>
      <PageHeader title="Configuración" subtitle="Administra tu cuenta, tu equipo, tu empresa y el asistente de IA." />
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-navy-100/70">
        {tabs.map((t) => <button key={t.key} onClick={() => setTab(t.key)} className={cn('-mb-px shrink-0 border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors', tab === t.key ? 'border-flow-500 text-flow-700' : 'border-transparent text-navy-400 hover:text-navy-900')}>{t.label}</button>)}
      </div>
      <div className="max-w-3xl">
        {tab === 'perfil' && <ProfileSection />}
        {tab === 'usuarios' && <UsersSection />}
        {tab === 'empresa' && <CompanySection />}
        {tab === 'ia' && <AiSection />}
      </div>
    </>
  )
}
