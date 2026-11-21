import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, FilePlus2, Menu, NotebookPen, Plus, Search, UserPlus, UserRound, Zap } from 'lucide-react'
import { useAuth } from '@/app/auth'
import { useNotifications } from '@/hooks/queries'
import { Avatar, Button, IconButton } from '@/components/ui'

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user } = useAuth()
  const { data: notifications } = useNotifications()
  const hasUnread = (notifications ?? []).some((n) => !n.read)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    navigate(`/leads${query ? `?search=${encodeURIComponent(query)}` : ''}`)
  }

  const actions = [
    { label: 'Nuevo lead', icon: UserPlus, to: '/leads?nuevo=1' },
    { label: 'Nueva cotización', icon: FilePlus2, to: '/cotizaciones/nueva' },
    { label: 'Nuevo cliente', icon: UserRound, to: '/clientes?nuevo=1' },
    { label: 'Registrar seguimiento', icon: NotebookPen, to: '/notas?nueva=1' },
  ]

  return (
    <header className="mb-6 flex items-center gap-3 rounded-[16px] border border-navy-100/70 bg-white px-4 py-2.5 shadow-card">
      <IconButton className="lg:hidden" onClick={onMenu} aria-label="Abrir menú">
        <Menu className="size-5" />
      </IconButton>

      <form onSubmit={submit} className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-navy-300" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar leads, cotizaciones, clientes…"
          className="h-10 w-full rounded-full bg-neutral-light pr-14 pl-10 text-sm placeholder:text-navy-300 focus:ring-4 focus:ring-flow-500/10 focus:outline-none"
        />
        <kbd className="num absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md bg-white px-1.5 py-0.5 text-[10px] text-navy-300 sm:block">⌘K</kbd>
      </form>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative" ref={menuRef}>
          <Button onClick={() => setOpen((v) => !v)} icon={<Zap className="size-4" />}>
            <span className="hidden sm:inline">Acciones rápidas</span>
            <Plus className="size-4 sm:hidden" />
          </Button>
          {open && (
            <div className="absolute right-0 z-40 mt-2 w-56 rounded-2xl border border-navy-100/70 bg-white p-1.5 shadow-pop">
              {actions.map(({ label, icon: Icon, to }) => (
                <button
                  key={label}
                  onClick={() => {
                    setOpen(false)
                    navigate(to)
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-navy-600 hover:bg-navy-50"
                >
                  <Icon className="size-4 text-flow-500" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <IconButton aria-label="Notificaciones" className="relative" onClick={() => navigate('/notificaciones')}>
          <Bell className="size-5" />
          {hasUnread && <span className="absolute top-2 right-2.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />}
        </IconButton>

        <div className="hidden items-center gap-2.5 pl-2 md:flex">
          <div className="text-right leading-tight">
            <p className="text-[13px] font-semibold">{user?.name}</p>
            <p className="text-xs text-navy-400">{user?.roleLabel}</p>
          </div>
          <Avatar name={user?.name ?? 'U'} size={36} className="bg-flow-500! text-white!" />
        </div>
      </div>
    </header>
  )
}
