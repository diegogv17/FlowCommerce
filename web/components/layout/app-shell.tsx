'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bot,
  Building2,
  ChevronsLeft,
  FileText,
  LayoutGrid,
  LogOut,
  MessageCircle,
  Package,
  Plus,
  Settings,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { api } from '@/lib/api';
import { useMe, useLogout } from '@/hooks/use-session';
import { useProject } from '@/hooks/use-project';
import { Avatar, Button, Spinner } from '@/components/ui';
import { GlobalSearch } from './global-search';
import { NotificationBell } from './notification-bell';
import { QuickActions } from './quick-actions';
import { Logo } from './logo';
import { RealtimeBridge } from '@/features/realtime/realtime-bridge';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const { data: me } = useMe();
  const logout = useLogout();
  const { project, projects, isLoading, selectProject, path, can } = useProject();

  // Sin proyectos: crear el primero.
  useEffect(() => {
    if (!isLoading && projects.length === 0 && pathname !== '/onboarding') {
      router.replace('/onboarding');
    }
  }, [isLoading, projects.length, pathname, router]);

  const { data: summary } = useQuery({
    queryKey: ['dashboard', project?.id, 'nav'],
    queryFn: () => api.get<{ summary: { leadsActivos: number } }>(path('/dashboard')),
    enabled: Boolean(project),
    staleTime: 60_000,
  });
  const { data: unread } = useQuery({
    queryKey: ['conversations', project?.id, 'unread-count'],
    queryFn: () => api.get<{ conversations: number; messages: number }>(path('/conversations/unread-count')),
    enabled: Boolean(project) && can('LEAD_READ'),
    refetchInterval: 30_000,
  });

  const nav: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { href: '/leads', label: 'Leads', icon: Users, count: summary?.summary.leadsActivos },
    { href: '/conversaciones', label: 'Conversaciones', icon: MessageCircle, count: unread?.conversations },
    { href: '/cotizaciones', label: 'Cotizaciones', icon: FileText },
    { href: '/clientes', label: 'Clientes', icon: Building2 },
    { href: '/productos', label: 'Productos y Servicios', icon: Package },
    { href: '/asistente', label: 'Asistente IA', icon: Bot },
    { href: '/configuracion', label: 'Configuración', icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen gap-4 p-3 md:p-4">
      <RealtimeBridge />
      <aside
        className={cn(
          'sticky top-4 hidden h-[calc(100vh-2rem)] shrink-0 flex-col rounded-2xl bg-white p-3 shadow-sm md:flex',
          collapsed ? 'w-[76px]' : 'w-60',
        )}
      >
        <Link href="/dashboard" className="mb-4 px-2 py-2">
          <Logo compact={collapsed} />
        </Link>

        {projects.length > 1 && !collapsed ? (
          <select
            className="mb-3 rounded-lg border border-line px-2 py-1.5 text-xs"
            value={project?.id}
            onChange={(event) => selectProject(event.target.value)}
            aria-label="Proyecto"
          >
            {projects.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        ) : null}

        <nav className="flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active ? 'bg-brand-500 text-white shadow-sm' : 'text-ink hover:bg-slate-100',
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed ? <span className="flex-1 truncate">{item.label}</span> : null}
                {!collapsed && item.count ? (
                  <span
                    className={cn(
                      'rounded-full px-2 text-xs font-semibold',
                      active ? 'bg-white/25 text-white' : 'bg-emerald-500 text-white',
                    )}
                  >
                    {item.count}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-2 border-t border-line pt-3">
          <button
            onClick={() => setCollapsed((value) => !value)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink hover:bg-slate-100"
          >
            <ChevronsLeft className={cn('h-[18px] w-[18px] transition-transform', collapsed && 'rotate-180')} />
            {!collapsed ? 'Contraer' : null}
          </button>
          <div className="flex items-center gap-2 px-2 py-3">
            <Avatar name={me?.name} size="sm" />
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{me?.name ?? '…'}</p>
                <p className="truncate text-xs text-muted">{me?.position ?? project?.name}</p>
              </div>
            ) : null}
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink hover:bg-slate-100"
          >
            <LogOut className="h-[18px] w-[18px]" />
            {!collapsed ? 'Cerrar sesión' : null}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="mb-6 flex items-center gap-3">
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-3">
            <QuickActions />
            <NotificationBell />
            <Link href="/configuracion" className="hidden items-center gap-2 sm:flex">
              <div className="text-right">
                <p className="text-sm font-semibold leading-tight">{me?.name}</p>
                <p className="text-xs text-muted">{me?.position ?? ''}</p>
              </div>
              <Avatar name={me?.name} />
            </Link>
          </div>
        </header>

        {/* Menú inferior en móvil */}
        <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-line bg-white py-2 md:hidden">
          {nav.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={cn('flex flex-col items-center text-[10px]', active ? 'text-brand-600' : 'text-muted')}>
                <Icon className="h-5 w-5" />
                {item.label.split(' ')[0]}
              </Link>
            );
          })}
        </nav>

        <main className="min-w-0 flex-1 pb-20 md:pb-4">{children}</main>
      </div>
    </div>
  );
}

export function NewButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href}>
      <Button size="md">
        <Plus className="h-4 w-4" />
        {children}
      </Button>
    </Link>
  );
}
