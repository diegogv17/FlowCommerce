import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Rutas privadas del CRM y flujos de cuenta que no aportan al buscador.
const PRIVATE_PATHS = [
  '/dashboard',
  '/leads',
  '/conversaciones',
  '/cotizaciones',
  '/clientes',
  '/productos',
  '/notificaciones',
  '/configuracion',
  '/asistente',
  '/auth',
  '/invitacion',
  '/restablecer-contrasena',
  '/olvide-contrasena',
  '/api',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/precios', '/registro', '/login'],
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
