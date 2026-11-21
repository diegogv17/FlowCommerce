import { useEffect, useState, type FormEvent } from 'react'
import { Save, Sparkles } from 'lucide-react'
import { Avatar, Badge, Button, Card, CardHeader, ErrorState, Field, Input, PageHeader, PageLoader, Segmented, Textarea, Toggle } from '@/components/ui'
import { useAuth } from '@/app/auth'
import { useToast } from '@/app/toast'
import { useAiSettings, useSaveAiSettings, useUsers } from '@/hooks/queries'
import { cn } from '@/lib/cn'
import type { AiSettings } from '@/types/domain'

const tabs = ['Perfil', 'Usuarios', 'IA'] as const
type Tab = (typeof tabs)[number]

function Row({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4">
      <div><p className="text-[13.5px] font-semibold">{title}</p><p className="mt-0.5 text-xs text-navy-400">{text}</p></div>
      {children}
    </div>
  )
}

function ProfileSection() {
  const { user, updateProfile } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' })
  const [saving, setSaving] = useState(false)
  const reset = () => setForm({ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile(form)
      toast.success('Perfil actualizado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="pb-6">
      <CardHeader title="Tu perfil" />
      <p className="px-5 pt-1 text-xs text-navy-400">Administra tu cuenta, tus iniciales y tus datos de contacto.</p>
      <form onSubmit={submit}>
        <div className="flex items-center gap-4 px-5 pt-5">
          <Avatar name={form.name || 'U'} size={64} className="bg-flow-500! text-white!" />
          <div><Button type="button" variant="secondary" size="sm" disabled title="Requiere el endpoint de carga de imagen">Cambiar imagen</Button><p className="mt-1.5 text-xs text-navy-300">PNG o JPG, máximo 2 MB</p></div>
        </div>
        <div className="grid gap-4 px-5 pt-5 sm:grid-cols-2">
          <Field label="Nombre completo"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Correo electrónico"><Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Teléfono"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="num" /></Field>
          <Field label="Rol"><Input readOnly value={user?.roleLabel ?? ''} /></Field>
        </div>
        <div className="flex gap-2 px-5 pt-6"><Button type="submit" loading={saving}>Guardar cambios</Button><Button type="button" variant="secondary" onClick={reset}>Descartar</Button></div>
      </form>
    </Card>
  )
}

function UsersSection() {
  const { data, isLoading } = useUsers()
  if (isLoading || !data) return <PageLoader />
  return (
    <Card className="pb-2">
      <CardHeader title="Usuarios del equipo" />
      <ul className="mt-3 divide-y divide-navy-100/60 px-2">
        {data.map((u) => (
          <li key={u.id} className="flex items-center gap-3 rounded-xl px-3 py-3.5">
            <Avatar name={u.name} size={38} />
            <div className="min-w-0 flex-1"><p className="text-[13px] font-semibold">{u.name}</p><p className="truncate text-xs text-navy-400">{u.email}</p></div>
            <Badge tone={u.role === 'admin' ? 'violet' : u.role === 'supervisor' ? 'amber' : 'blue'}>{u.roleLabel}</Badge>
          </li>
        ))}
      </ul>
    </Card>
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
      onSuccess: () => toast.success('Configuración de IA guardada'),
      onError: (e) => toast.error(e.message),
    })

  return (
    <Card className="pb-5">
      <CardHeader title={<span className="flex items-center gap-2"><Sparkles className="size-4 text-teal-500" /> Asistente de IA</span>} action={<Button size="sm" icon={<Save className="size-3.5" />} loading={save.isPending} onClick={submit}>Guardar cambios</Button>} />
      <div className="divide-y divide-navy-100/70 px-5">
        <Row title="Activar asistente" text="Permite sugerencias de respuesta en la bandeja de conversaciones."><Toggle checked={form.enabled} onChange={(v) => setForm({ ...form, enabled: v })} label="Activar asistente" /></Row>
        <Row title="Responder automáticamente" text="La IA envía la respuesta sin revisión de un asesor."><Toggle checked={form.autoReply} disabled={!form.enabled} onChange={(v) => setForm({ ...form, autoReply: v })} label="Responder automáticamente" /></Row>
        <Row title="Solo fuera de horario" text="Limita las respuestas automáticas al horario no laboral."><Toggle checked={form.businessHoursOnly} disabled={!form.enabled} onChange={(v) => setForm({ ...form, businessHoursOnly: v })} label="Solo fuera de horario" /></Row>
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
  const [tab, setTab] = useState<Tab>('Perfil')
  return (
    <>
      <PageHeader title="Configuración" subtitle="Administra tu cuenta, tu equipo y el asistente de IA." />
      <div className="mb-4 flex gap-1 border-b border-navy-100/70">
        {tabs.map((t) => <button key={t} onClick={() => setTab(t)} className={cn('-mb-px border-b-2 px-4 py-2.5 text-[13px] font-medium transition-colors', tab === t ? 'border-flow-500 text-flow-700' : 'border-transparent text-navy-400 hover:text-navy-900')}>{t}</button>)}
      </div>
      <div className="max-w-3xl">
        {tab === 'Perfil' && <ProfileSection />}
        {tab === 'Usuarios' && <UsersSection />}
        {tab === 'IA' && <AiSection />}
      </div>
    </>
  )
}
