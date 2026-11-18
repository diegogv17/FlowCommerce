import { ImageResponse } from 'next/og';

// Imagen para compartir en redes (Open Graph / Twitter), generada en build.
// Satori (motor de next/og) exige display:flex en todo div con varios hijos.

export const alt = 'FlowCommerce — Del primer contacto a la venta, sin perder el hilo.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: '#0f172a',
          color: '#ffffff',
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Círculos decorativos como en el login */}
        <div
          style={{
            position: 'absolute',
            top: -180,
            right: -120,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background: 'rgba(255,255,255,0.05)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -260,
            left: 420,
            width: 520,
            height: 520,
            borderRadius: 9999,
            background: 'rgba(59,130,246,0.18)',
            display: 'flex',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 40 40">
            <defs>
              <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#22c55e" />
                <stop offset="1" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <circle cx="20" cy="20" r="16" fill="none" stroke="url(#g)" strokeWidth="6" strokeDasharray="70 30" />
            <circle cx="20" cy="20" r="7" fill="none" stroke="#e2e8f0" strokeWidth="4" strokeDasharray="30 14" />
          </svg>
          <div style={{ display: 'flex', fontSize: 52, fontWeight: 700, letterSpacing: -1 }}>
            <span style={{ color: '#3b82f6' }}>Flow</span>
            <span>Commerce</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2, maxWidth: 960 }}>
            Del primer contacto a la venta, sin perder el hilo.
          </div>
          <div style={{ display: 'flex', fontSize: 32, color: '#94a3b8' }}>
            Pipeline, WhatsApp y cotizaciones con IA. La IA propone; tú apruebas.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, fontSize: 24, color: '#cbd5e1' }}>
          <div style={{ display: 'flex', padding: '10px 22px', borderRadius: 9999, background: '#3b82f6', color: '#fff' }}>
            Empieza gratis
          </div>
          <div style={{ display: 'flex', padding: '10px 22px', borderRadius: 9999, border: '2px solid rgba(255,255,255,0.2)' }}>
            CRM con IA para Guatemala
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
