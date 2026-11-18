import { AppShell } from '@/components/layout/app-shell';
import { ProjectProvider } from '@/hooks/use-project';

// Rutas privadas del CRM. El proxy ya redirige a /login sin sesión.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProjectProvider>
      <AppShell>{children}</AppShell>
    </ProjectProvider>
  );
}
