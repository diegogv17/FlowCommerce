import { NavLink } from 'react-router-dom'
import {
  FileText,
  LayoutDashboard,
  LogOut,
  MessagesSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Package,
  Settings,
  Users,
  UserRound,
} from 'lucide-react'
import { useAuth } from '@/app/auth'
import { useConversations, useLeads } from '@/hooks/queries'
import { cn } from '@/lib/cn'
import { Avatar } from '@/components/ui'
import { Logo } from './Logo'

interface Props {
  collapsed: boolean
  onToggle: () => void
  onNavigate?: () => void
}

export function Sidebar({ collapsed, onToggle, onNavigate }: Props) {
  const { user, logout, project, projects, selectProject } = useAuth()
  const leads = useLeads({ pageSize: 1 })
  const conversations = useConversations({})
  const unread = (conversations.data ?? []).reduce((a, c) => a + c.unread, 0)
  const leadTotal = leads.data?.meta.total

  const items = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/leads', label: 'Leads', icon: Users, badge: leadTotal, tone: 'green' },
    { to: '/conversaciones', label: 'Conversaciones', icon: MessagesSquare, badge: unread || undefined, tone: 'green' },
    { to: '/cotizaciones', label: 'Cotizaciones', icon: FileText },
    { to: '/clientes', label: 'Clientes', icon: UserRound },
    { to: '/productos', label: 'Productos y Servicios', icon: Package },
    { to: '/configuracion', label: 'Configuración', icon: Settings },
  ]

  return (
    <aside className={cn('flex h-full flex-col rounded-[20px] border border-navy-100/70 bg-white p-4 shadow-card transition-[width] duration-200', collapsed ? 'w-[84px]' : 'w-[248px]')}>
      <div className={cn('flex items-center px-2 pt-2 pb-6', collapsed && 'justify-center')}>
        {collapsed ? <Logo variant="symbol" height={34} /> : <Logo height={30} />}
      </div>

      {!collapsed && project && (
        <div className="mb-4 px-1">
          <p className="mb-1 px-2 text-[10.5px] font-semibold tracking-wide text-navy-300 uppercase">Empresa</p>
          {projects.length > 1 ? (
            <select
              value={project.id}
              onChange={(e) => {
                if (e.target.value === '__new') window.location.assign('/onboarding?nueva=1')
                else selectProject(e.target.value)
              }}
              className="h-9 w-full truncate rounded-xl border border-navy-100 bg-neutral-light px-2.5 text-[13px] font-semibold text-navy-700 focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              <option value="__new">+ Nueva empresa</option>
            </select>
          ) : (
            <p className="truncate rounded-xl bg-neutral-light px-2.5 py-2 text-[13px] font-semibold text-navy-700" title={project.name}>{project.name}</p>
          )}
        </div>
      )}

      <nav className="scroll-thin flex flex-1 flex-col gap-1 overflow-y-auto">
        {items.map(({ to, label, icon: Icon, badge, tone }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors',
                collapsed && 'justify-center px-0',
                isActive ? 'bg-flow-500 text-white shadow-sm shadow-flow-500/25' : 'text-navy-500 hover:bg-navy-50 hover:text-navy-900',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="size-[18px] shrink-0" strokeWidth={1.8} />
                {!collapsed && <span className="flex-1 truncate">{label}</span>}
                {!collapsed && badge !== undefined && (
                  <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', isActive ? 'bg-white/25 text-white' : tone === 'green' ? 'bg-teal-500 text-white' : 'bg-navy-100 text-navy-500')}>
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 space-y-1 border-t border-navy-100/70 pt-4">
        <button onClick={onToggle} className={cn('hidden w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-navy-400 hover:bg-navy-50 hover:text-navy-900 lg:flex', collapsed && 'justify-center px-0')}>
          {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
          {!collapsed && 'Contraer'}
        </button>

        <div className={cn('flex items-center gap-3 rounded-xl px-2 py-2', collapsed && 'justify-center')}>
          <Avatar name={user?.name ?? 'Usuario'} size={36} dark />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-navy-400">{user?.roleLabel}</p>
            </div>
          )}
        </div>

        <button onClick={() => logout()} className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-navy-400 hover:bg-red-50 hover:text-red-600', collapsed && 'justify-center px-0')}>
          <LogOut className="size-[18px]" />
          {!collapsed && 'Cerrar sesión'}
        </button>
      </div>
    </aside>
  )
}
