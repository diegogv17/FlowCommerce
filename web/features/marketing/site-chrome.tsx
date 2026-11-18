import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { TrackedLink } from './tracked-link';

// Navbar y footer del sitio público (Server Components). El menú móvil usa
// <details> nativo: funciona sin JavaScript.

const NAV = [
  { id: 'funciones', label: 'Funciones' },
  { id: 'ia', label: 'IA' },
  { id: 'precios', label: 'Precios' },
  { id: 'preguntas', label: 'Preguntas' },
] as const;

function navHref(id: (typeof NAV)[number]['id'], onLanding: boolean) {
  if (onLanding) return `#${id}`;
  return id === 'precios' ? '/precios' : `/#${id}`;
}

export function SiteHeader({ onLanding = false }: { onLanding?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/85 backdrop-blur supports-[backdrop-filter]:bg-canvas/70">
      <nav aria-label="Principal" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="FlowCommerce, inicio" className="shrink-0">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-7 text-sm font-medium text-muted md:flex">
          {NAV.map((item) => (
            <li key={item.id}>
              <a href={navHref(item.id, onLanding)} className="transition-colors hover:text-ink">
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden h-10 items-center rounded-full px-4 text-sm font-semibold text-ink transition-colors hover:bg-white sm:inline-flex"
          >
            Iniciar sesión
          </Link>
          <TrackedLink
            href="/registro"
            ubicacion="navbar"
            etiqueta="Empieza gratis"
            className="inline-flex h-10 items-center rounded-full bg-brand-500 px-4 text-sm font-semibold text-white shadow-sm shadow-brand-500/30 transition-colors hover:bg-brand-600"
          >
            Empieza gratis
          </TrackedLink>

          <details className="group relative md:hidden">
            <summary
              aria-label="Abrir menú"
              className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-full text-ink hover:bg-white [&::-webkit-details-marker]:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </summary>
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-line bg-white p-2 shadow-xl">
              {NAV.map((item) => (
                <a
                  key={item.id}
                  href={navHref(item.id, onLanding)}
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-ink hover:bg-slate-50"
                >
                  {item.label}
                </a>
              ))}
              <Link
                href="/login"
                className="mt-1 block rounded-xl border-t border-line px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-slate-50"
              >
                Iniciar sesión
              </Link>
            </div>
          </details>
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  const year = 2026;
  return (
    <footer className="bg-night text-slate-400">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo dark />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            CRM de ventas con IA para negocios de Guatemala. Del primer contacto a la venta, sin perder el hilo.
          </p>
        </div>
        <FooterColumn
          title="Producto"
          links={[
            { href: '/#funciones', label: 'Funciones' },
            { href: '/#ia', label: 'Inteligencia artificial' },
            { href: '/precios', label: 'Precios' },
            { href: '/#preguntas', label: 'Preguntas frecuentes' },
          ]}
        />
        <FooterColumn
          title="Cuenta"
          links={[
            { href: '/registro', label: 'Crear cuenta' },
            { href: '/login', label: 'Iniciar sesión' },
            { href: '/olvide-contrasena', label: 'Recuperar contraseña' },
          ]}
        />
        <FooterColumn
          title="Contacto"
          links={[{ href: 'mailto:hola@flowcommerce.gt', label: 'hola@flowcommerce.gt' }]}
        />
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>© {year} FlowCommerce. Todos los derechos reservados.</p>
          <p>
            Proyecto universitario · Universidad San Pablo de Guatemala · Programación IV 2026. Los precios son
            ilustrativos.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            {link.href.startsWith('/') ? (
              <Link href={link.href} className="transition-colors hover:text-white">
                {link.label}
              </Link>
            ) : (
              <a href={link.href} className="transition-colors hover:text-white">
                {link.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
