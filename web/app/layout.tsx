import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-poppins',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'FlowCommerce — CRM de ventas con IA',
    template: '%s · FlowCommerce',
  },
  description:
    'Pipeline, conversaciones de WhatsApp y cotizaciones en un solo lugar. La IA propone; tú apruebas.',
  openGraph: {
    title: 'FlowCommerce — CRM de ventas con IA',
    description:
      'Del primer contacto a la venta, sin perder el hilo. Leads, WhatsApp y cotizaciones con IA.',
    type: 'website',
    locale: 'es_GT',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  return (
    <html lang="es" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </html>
  );
}
