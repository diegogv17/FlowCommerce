import Link from 'next/link';
import { Logo } from '@/components/layout/logo';
import { AuthSidePanel } from '@/features/auth/auth-side-panel';

// Pantallas públicas de acceso (login, registro, recuperación, invitación).
// Izquierda: formulario sobre el fondo canvas. Derecha (solo escritorio): panel
// oscuro con el mensaje de la marca.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-2">
      <main className="flex flex-col justify-center px-4 py-10 sm:px-8">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" className="mb-10 inline-block" aria-label="FlowCommerce, ir al inicio">
            <Logo />
          </Link>
          {children}
        </div>
      </main>
      <AuthSidePanel />
    </div>
  );
}
