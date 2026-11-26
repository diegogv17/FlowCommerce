import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/app/auth'
import { ErrorState, PageLoader } from '@/components/ui'
import { cn } from '@/lib/cn'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const { user, loading, hasSession, projects, loadError, refresh } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  if (loading) return <PageLoader />
  if (!hasSession) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (loadError) return <ErrorState message={loadError} onRetry={() => void refresh()} />
  // Con sesión pero sin empresa: primero hay que crear una (o aceptar una invitación).
  if (!user && projects.length === 0) return <Navigate to="/onboarding" replace />
  if (!user) return <PageLoader />

  return (
    <div className="flex h-full gap-4 p-4">
      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      </div>

      <div className={cn('fixed inset-0 z-40 lg:hidden', !mobileOpen && 'pointer-events-none')}>
        <div className={cn('absolute inset-0 bg-navy-900/40 transition-opacity', mobileOpen ? 'opacity-100' : 'opacity-0')} onClick={() => setMobileOpen(false)} />
        <div className={cn('absolute inset-y-0 left-0 p-4 transition-transform', mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
          <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} onNavigate={() => setMobileOpen(false)} />
        </div>
      </div>

      <main className="scroll-thin min-w-0 flex-1 overflow-y-auto pr-1">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <Outlet />
      </main>
    </div>
  )
}
