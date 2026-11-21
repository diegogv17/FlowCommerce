import { Link, useNavigate } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDownRight, ArrowUpRight, CalendarClock, CheckCircle2, FileText, Mail, MessageCircle, Phone, Plus, TrendingUp, Users, Video, Wallet, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useAuth } from '@/app/auth'
import { Badge, Button, Card, CardHeader, ErrorState, Skeleton } from '@/components/ui'
import { useDashboard } from '@/hooks/queries'
import { cn } from '@/lib/cn'
import { compactMoney, money, relativeTime } from '@/lib/format'
import { leadStatusMeta, toneColor, type Tone } from '@/lib/labels'
import type { DashboardSummary } from '@/types/domain'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

const kpiTone: Record<string, string> = {
  blue: 'bg-flow-50 text-flow-600',
  amber: 'bg-amber-50 text-amber-600',
  violet: 'bg-violet-50 text-violet-600',
  green: 'bg-teal-50 text-teal-600',
  cyan: 'bg-cyan-50 text-cyan-600',
  orange: 'bg-orange-50 text-orange-600',
}

function KpiCard({ icon, tone, label, value, delta, suffix = '%', mono, className }: { icon: ReactNode; tone: Tone; label: string; value: string; delta: number; suffix?: string; mono?: boolean; className?: string }) {
  const positive = delta >= 0
  return (
    <Card className={cn('p-4', className)}>
      <div className="mb-3 flex items-center gap-2.5">
        <span className={cn('grid size-8 shrink-0 place-items-center rounded-full', kpiTone[tone])}>{icon}</span>
        <span className="text-xs font-medium text-navy-500">{label}</span>
      </div>
      <p className={cn('font-display text-[30px] leading-none font-semibold', mono && 'num')}>{value}</p>
      <p className={cn('mt-2.5 flex items-center gap-1 text-xs font-medium', positive ? 'text-teal-600' : 'text-red-500')}>
        {positive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
        {positive ? '+' : '−'}
        {Math.abs(delta)}
        {suffix} <span className="font-normal text-navy-300">vs mes anterior</span>
      </p>
    </Card>
  )
}

const typeMeta: Record<DashboardSummary['todayFollowUps'][number]['type'], { label: string; icon: LucideIcon }> = {
  llamada: { label: 'Llamada', icon: Phone },
  reunion: { label: 'Reunión', icon: Video },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle },
  correo: { label: 'Correo', icon: Mail },
}

const followTone: Record<DashboardSummary['todayFollowUps'][number]['status'], { label: string; tone: Tone }> = {
  pendiente: { label: 'Pendiente', tone: 'amber' },
  confirmado: { label: 'Confirmado', tone: 'blue' },
  realizado: { label: 'Realizado', tone: 'green' },
}

const quoteLabel = { borrador: 'Borradores', pendiente: 'Pendientes', enviada: 'Enviadas', aprobada: 'Aprobadas', rechazada: 'Rechazadas' }

const activityIcon: Record<string, LucideIcon> = { blue: Plus, violet: FileText, amber: TrendingUp, green: CheckCircle2, red: FileText }

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useDashboard()

  const header = (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[30px] leading-tight font-semibold">
          {greeting()}, {user?.name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-navy-400">Aquí tienes el resumen de tu actividad comercial.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button icon={<Plus className="size-4" />} onClick={() => navigate('/leads?nuevo=1')}>Nuevo Lead</Button>
        <Button variant="secondary" icon={<Plus className="size-4" />} onClick={() => navigate('/cotizaciones/nueva')}>Nueva Cotización</Button>
        <Button variant="secondary" icon={<Plus className="size-4" />} onClick={() => navigate('/notas?nueva=1')}>Registrar Seguimiento</Button>
      </div>
    </div>
  )

  if (isError) return <>{header}<Card><ErrorState onRetry={() => refetch()} /></Card></>
  if (isLoading || !data) {
    return (
      <>
        {header}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-[132px]" />)}</div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-72" />)}</div>
      </>
    )
  }

  const k = data.kpis
  const maxStatus = Math.max(...data.leadsByStatus.map((s) => s.count), 1)
  const quotesTotal = data.quotesByStatus.reduce((a, b) => a + b.count, 0)
  const pending = data.todayFollowUps.filter((f) => f.status === 'pendiente').length
  const quoteColor: Record<string, string> = { borrador: '#8b5cf6', pendiente: '#f59e0b', enviada: '#3b82f6', aprobada: '#10b981', rechazada: '#ef4444' }

  return (
    <>
      {header}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard icon={<Users className="size-4" />} tone="blue" label="Leads activos" value={String(k.activeLeads.value)} delta={k.activeLeads.delta} />
        <KpiCard icon={<CalendarClock className="size-4" />} tone="amber" label="Seguimientos pendientes" value={String(k.pendingFollowUps.value)} delta={k.pendingFollowUps.delta} suffix="" />
        <KpiCard icon={<FileText className="size-4" />} tone="violet" label="Cotizaciones enviadas" value={String(k.sentQuotes.value)} delta={k.sentQuotes.delta} />
        <KpiCard icon={<CheckCircle2 className="size-4" />} tone="green" label="Ventas ganadas" value={String(k.wonSales.value)} delta={k.wonSales.delta} suffix="" />
        <KpiCard icon={<TrendingUp className="size-4" />} tone="cyan" label="Conversión" value={`${k.conversion.value}%`} delta={k.conversion.delta} suffix=" pts" />
        <KpiCard icon={<Wallet className="size-4" />} tone="orange" label="Pipeline estimado" value={money(k.estimatedPipeline.value)} delta={k.estimatedPipeline.delta} mono className="sm:col-span-2 xl:col-span-1" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="pb-5">
          <CardHeader title="Leads por estado" action={<span className="text-xs text-navy-300">{data.periodLabel}</span>} />
          <ul className="mt-5 space-y-4 px-5">
            {data.leadsByStatus.map(({ status, count }) => {
              const meta = leadStatusMeta[status]
              return (
                <li key={status} className="flex items-center gap-3 text-[13px]">
                  <span className="w-24 text-navy-500">{meta.label}</span>
                  <div className="h-2 flex-1 rounded-full bg-navy-100/70">
                    <div className="h-full rounded-full" style={{ width: `${(count / maxStatus) * 100}%`, background: toneColor[meta.tone] }} />
                  </div>
                  <span className="num w-5 text-right font-medium">{count}</span>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Conversión mensual" action={<Badge tone="green">+{k.conversion.delta} pts</Badge>} />
          <p className="num px-5 pt-3 font-display text-[30px] font-semibold">{k.conversion.value}%</p>
          <div className="h-44 px-3 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.monthlyConversion} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis hide domain={[0, 36]} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(v) => [`${v}%`, 'Conversión']} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {data.monthlyConversion.map((_, i) => <Cell key={i} fill={i === data.monthlyConversion.length - 1 ? '#10b981' : '#3b82f6'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Cotizaciones por estado" />
          <div className="flex items-center gap-5 px-5 py-5">
            <div className="relative size-36 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data.quotesByStatus} dataKey="count" innerRadius={46} outerRadius={68} paddingAngle={2} stroke="none">
                    {data.quotesByStatus.map((q) => <Cell key={q.status} fill={quoteColor[q.status]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="num font-display text-xl font-semibold">{quotesTotal}</p>
                  <p className="text-[11px] text-navy-400">total</p>
                </div>
              </div>
            </div>
            <ul className="flex-1 space-y-2.5 text-[13px]">
              {data.quotesByStatus.map((q) => (
                <li key={q.status} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: quoteColor[q.status] }} />
                  <span className="flex-1 text-navy-500">{quoteLabel[q.status]}</span>
                  <span className="num font-medium">{q.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="pb-3 lg:col-span-1">
          <CardHeader title="Ventas por período" action={<span className="text-xs text-navy-300">Últimos 8 meses</span>} />
          <p className="num px-5 pt-3 font-display text-[30px] font-semibold">{money(data.salesTotal)}</p>
          <div className="h-44 px-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.salesByPeriod} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={compactMoney} width={48} />
                <Tooltip formatter={(v, n) => [money(Number(v)), n === 'sales' ? 'Ventas' : 'Meta']} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2.5} fill="url(#salesFill)" />
                <Line type="monotone" dataKey="goal" stroke="#475569" strokeDasharray="5 4" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 px-5 pt-2 pb-2 text-xs text-navy-400">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-teal-500" /> Ventas</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded border-t-2 border-dashed border-navy-500" /> Meta</span>
          </div>
        </Card>

        <Card className="pb-2 lg:col-span-2">
          <CardHeader title="Seguimientos de hoy" action={<Badge tone="blue">{pending} pendientes</Badge>} />
          <div className="scroll-thin mt-3 overflow-x-auto">
            <table className="w-full min-w-[620px] text-[13px]">
              <thead>
                <tr className="text-left text-[11px] font-semibold tracking-wider text-navy-300 uppercase">
                  <th className="px-5 py-2">Cliente</th><th className="px-3 py-2">Hora</th><th className="px-3 py-2">Tipo</th><th className="px-3 py-2">Responsable</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100/60">
                {data.todayFollowUps.map((f) => {
                  const t = typeMeta[f.type]
                  const st = followTone[f.status]
                  return (
                    <tr key={f.id} className="hover:bg-navy-50/50">
                      <td className="px-5 py-3"><p className="font-semibold">{f.leadName}</p><p className="text-xs text-navy-400">{f.company}</p></td>
                      <td className="num px-3 py-3 font-medium">{f.time}</td>
                      <td className="px-3 py-3"><span className="flex items-center gap-2 text-navy-600"><t.icon className="size-3.5 text-navy-400" />{t.label}</span></td>
                      <td className="px-3 py-3 text-navy-600">{f.ownerName}</td>
                      <td className="px-3 py-3"><Badge tone={st.tone}>{st.label}</Badge></td>
                      <td className="px-3 py-3 text-right"><Link to={`/leads/${f.leadId}`} className="rounded-full bg-flow-50 px-3.5 py-1.5 text-xs font-medium text-flow-700 hover:bg-flow-100">Ver Lead</Link></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card className="mt-4 pb-3">
        <CardHeader title="Actividad reciente" />
        <ul className="mt-3 grid gap-x-8 px-5 md:grid-cols-2 xl:grid-cols-3">
          {data.recentActivity.map((a) => {
            const Icon = activityIcon[a.tone] ?? Plus
            return (
              <li key={a.id} className="flex gap-3 py-3">
                <span className={cn('grid size-8 shrink-0 place-items-center rounded-full', kpiTone[a.tone])}><Icon className="size-4" /></span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold">{a.title}</p>
                  <p className="truncate text-xs text-navy-500">{a.detail}</p>
                  <p className="mt-0.5 text-[11px] text-navy-300">{relativeTime(a.at)}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </Card>
    </>
  )
}

