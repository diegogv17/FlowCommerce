import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, FilePlus2, FileText, Menu, NotebookPen, Plus, Search, UserPlus, UserRound, Users, Zap } from 'lucide-react'
import { useAuth } from '@/app/auth'
import { useGlobalSearch, useNotificationsUnread } from '@/hooks/queries'
import { Avatar, Button, IconButton, Spinner } from '@/components/ui'
import { moneyExact } from '@/lib/format'
import { leadStatusMeta } from '@/lib/labels'

function useDebounced<T>(value: T, ms = 250): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user } = useAuth()
  const { data: unreadCount } = useNotificationsUnread()
  const hasUnread = (unreadCount ?? 0) > 0
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const term = useDebounced(query.trim())
  const search = useGlobalSearch(term)
  const results = search.data
  const hasResults = !!results && results.leads.length + results.clients.length + results.quotes.length > 0
  const showResults = searchOpen && term.length >= 2

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false)
      if (!searchRef.current?.contains(e.target as Node)) setSearchOpen(false)
    }
    const shortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setSearchOpen(true)
      }
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', shortcut)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', shortcut)
    }
  }, [])

  const go = (to: string) => {
    setSearchOpen(false)
    setQuery('')
    inputRef.current?.blur()
    navigate(to)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    go(`/leads${query.trim() ? `?search=${encodeURIComponent(query.trim())}` : ''}`)
  }

  const actions = [
    { label: 'Nuevo lead', icon: UserPlus, to: '/leads?nuevo=1' },
    { label: 'Nueva cotización', icon: FilePlus2, to: '/cotizaciones/nueva' },
    { label: 'Nuevo cliente', icon: UserRound, to: '/clientes?nuevo=1' },
    { label: 'Registrar seguimiento', icon: NotebookPen, to: '/notas?nueva=1' },
  ]

  const itemClass = 'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] hover:bg-navy-50'
  const groupTitle = 'px-3 pt-2 pb-1 text-[10.5px] font-semibold tracking-wide text-navy-300 uppercase'

  return (
    <header className="mb-6 flex items-center gap-3 rounded-[16px] border border-navy-100/70 bg-white px-4 py-2.5 shadow-card">
      <IconButton className="lg:hidden" onClick={onMenu} aria-label="Abrir menú">
        <Menu className="size-5" />
      </IconButton>

      <form ref={searchRef} onSubmit={submit} className="relative max-w-md flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-navy-300" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSearchOpen(true)
          }}
          onFocus={() => setSearchOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setSearchOpen(false)
          }}
          placeholder="Buscar leads, cotizaciones, clientes…"
          className="h-10 w-full rounded-full bg-neutral-light pr-14 pl-10 text-sm placeholder:text-navy-300 focus:ring-4 focus:ring-flow-500/10 focus:outline-none"
        />
        <kbd className="num absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md bg-white px-1.5 py-0.5 text-[10px] text-navy-300 sm:block">⌘K</kbd>

        {showResults && (
          <div className="scroll-thin absolute right-0 left-0 z-40 mt-2 max-h-[420px] overflow-y-auto rounded-2xl border border-navy-100/70 bg-white p-1.5 shadow-pop">
            {search.isError ? (
              <p className="px-3 py-3 text-[13px] text-navy-400">No pudimos buscar en este momento.</p>
            ) : !results && search.isFetching ? (
              <div className="grid place-items-center py-4"><Spinner /></div>
            ) : !hasResults ? (
              <p className="px-3 py-3 text-[13px] text-navy-400">Sin resultados para «{term}».</p>
            ) : (
              <>
                {results!.leads.length > 0 && (
                  <>
                    <p className={groupTitle}>Leads</p>
                    {results!.leads.map((l) => (
                      <button type="button" key={l.id} className={itemClass} onClick={() => go(`/leads/${l.id}`)}>
                        <Users className="size-4 shrink-0 text-flow-500" />
                        <span className="min-w-0 flex-1 truncate"><span className="font-medium">{l.name}</span>{l.company && <span className="text-navy-400"> · {l.company}</span>}</span>
                        <span className="shrink-0 text-[11px] text-navy-400">{leadStatusMeta[l.status].label}</span>
                      </button>
                    ))}
                  </>
                )}
                {results!.clients.length > 0 && (
                  <>
                    <p className={groupTitle}>Clientes</p>
                    {results!.clients.map((c) => (
                      <button type="button" key={c.id} className={itemClass} onClick={() => go(`/clientes/${c.id}`)}>
                        <UserRound className="size-4 shrink-0 text-teal-600" />
                        <span className="min-w-0 flex-1 truncate"><span className="font-medium">{c.name}</span>{c.company && <span className="text-navy-400"> · {c.company}</span>}</span>
                        {c.nit && <span className="num shrink-0 text-[11px] text-navy-400">NIT {c.nit}</span>}
                      </button>
                    ))}
                  </>
                )}
                {results!.quotes.length > 0 && (
                  <>
                    <p className={groupTitle}>Cotizaciones</p>
                    {results!.quotes.map((q) => (
                      <button type="button" key={q.id} className={itemClass} onClick={() => go(`/cotizaciones/${q.id}`)}>
                        <FileText className="size-4 shrink-0 text-violet-500" />
                        <span className="min-w-0 flex-1 truncate"><span className="num font-medium">{q.folio}</span><span className="text-navy-400"> · {q.customerName}</span></span>
                        <span className="num shrink-0 text-[11px] text-navy-500">{moneyExact(q.total)}</span>
                      </button>
                    ))}
                  </>
                )}
              </>
            )}
            <button type="submit" className="mt-1 w-full rounded-xl border-t border-navy-100/70 px-3 py-2 text-left text-xs font-medium text-flow-600 hover:bg-navy-50">
              Ver todos los leads con «{query.trim() || term}»
            </button>
          </div>
        )}
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

        <IconButton aria-label={hasUnread ? `Notificaciones (${unreadCount} sin leer)` : 'Notificaciones'} className="relative" onClick={() => navigate('/notificaciones')}>
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
