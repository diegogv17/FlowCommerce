// URL pública del sitio (metadata, sitemap, robots, JSON-LD). Sin "/" final.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001').replace(/\/+$/, '');
