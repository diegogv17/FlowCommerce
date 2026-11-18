import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Solo páginas públicas e indexables. Las rutas del CRM requieren sesión.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/precios`, lastModified, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/registro`, lastModified, changeFrequency: 'yearly', priority: 0.5 },
  ];
}
