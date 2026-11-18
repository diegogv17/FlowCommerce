# FlowCommerce · Frontend web

CRM B2C de ventas con IA para negocios de Guatemala. Este paquete (`@flowcommerce/web`) es el frontend: sitio público (landing y precios) y la aplicación del CRM. Consume la API NestJS que vive en la raíz del monorepo.

> Proyecto universitario · Universidad San Pablo de Guatemala · Programación IV 2026.

## Stack

| Pieza | Uso |
| --- | --- |
| Next.js 16 (App Router) + React 19.2 | Páginas, metadata, rutas, `proxy.ts` (antes *middleware*) |
| TypeScript estricto | Todo el código |
| Tailwind CSS v4 | Estilos; tokens en `app/globals.css` (`brand-500` #3b82f6, `canvas`, `ink`, `muted`, `line`, `night`, `font-display` = Poppins) |
| TanStack Query v5 | Datos del CRM (Client Components) |
| Supabase (`@supabase/ssr`, `supabase-js`) | Autenticación; el token va como `Authorization: Bearer` a la API |
| `ai` + `@ai-sdk/react` | Chat del Asistente IA (Gemini en el backend) |
| recharts v3 · lucide-react · sonner | Gráficas · iconos · toasts |
| `@next/third-parties` | Google Analytics 4 |
| Vitest | Pruebas unitarias |
| `@flowcommerce/types` | Tipos compartidos con el backend (`packages/types`) |

## Cómo correrlo

Requisitos: Node 22+ y pnpm 9+.

```bash
# 1. En la RAÍZ del monorepo (instala backend, web y packages/types)
pnpm install

# 2. Variables del frontend
cp web/.env.example web/.env.local
#    y completa NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY

# 3. Backend en http://localhost:3000 (ver README de la raíz).
#    Su .env debe permitir el origen del frontend:
#    CORS_ORIGINS=http://localhost:3001
pnpm dev

# 4. Frontend en http://localhost:3001
pnpm web:dev
```

Otros comandos (desde la raíz):

```bash
pnpm web:build                                 # build de producción
pnpm --filter @flowcommerce/web typecheck      # tsc --noEmit
pnpm --filter @flowcommerce/web test           # Vitest
```

## Variables de entorno (`web/.env.local`)

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Sí | URL de la API con prefijo, p. ej. `http://localhost:3000/api/v1` |
| `NEXT_PUBLIC_SUPABASE_URL` | Sí | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Clave pública *anon/publishable* (no la *service role*) |
| `NEXT_PUBLIC_SITE_URL` | Sí en producción | URL pública de la web: canonical, Open Graph, sitemap, robots y enlaces de correo de Supabase |
| `NEXT_PUBLIC_GA_ID` | No | ID de medición de GA4 (`G-XXXXXXXXXX`). Sin él no se carga Analytics ni se envían eventos |

## Estructura de carpetas

```
web/
├── app/                    Rutas (App Router)
│   ├── page.tsx            Landing pública (Server Component)
│   ├── precios/            Página de precios
│   ├── (auth)/             Login, registro, recuperación de contraseña, invitaciones
│   ├── (app)/              CRM privado (layout con AppShell: menú, buscador, campana)
│   ├── layout.tsx          Fuentes (next/font), metadata base y Google Analytics
│   ├── sitemap.ts · robots.ts · opengraph-image.tsx · icon.svg   SEO
│   └── globals.css         Tokens de diseño (Tailwind v4)
├── features/<area>/        Lógica por área: types.ts, hooks.ts (useQuery/useMutation), componentes
│   └── marketing/          Landing: planes (plans.ts), precios, FAQ, analítica (track.ts)
├── components/
│   ├── ui/                 Botones, inputs, tarjetas, badges, tablas, diálogos, estados vacío/error
│   └── layout/             AppShell, logo, buscador global, notificaciones, acciones rápidas
├── lib/                    api.ts (cliente HTTP), format.ts, labels.ts, supabase/, cn.ts, site.ts
├── hooks/                  useProject (proyecto activo y permisos), useSession (useMe, logout)
├── proxy.ts                Refresca la sesión de Supabase y protege las rutas privadas
└── vitest.config.ts        Pruebas unitarias (entorno node, alias @ → web/)
```

## Pantallas y rutas

**Públicas**

| Pantalla | Ruta |
| --- | --- |
| Landing | `/` |
| Precios | `/precios` |
| Iniciar sesión | `/login` |
| Crear cuenta (acepta `?plan=gratis\|pro\|empresa`) | `/registro` |
| Olvidé mi contraseña | `/olvide-contrasena` |
| Restablecer contraseña | `/restablecer-contrasena` |
| Solicitar acceso | `/solicitar-acceso` |
| Aceptar invitación | `/invitacion` |

**CRM (requieren sesión)**

| Pantalla | Ruta |
| --- | --- |
| Dashboard | `/dashboard` |
| Leads (lista) | `/leads` |
| Lead (detalle) | `/leads/[leadId]` |
| Conversaciones de WhatsApp | `/conversaciones` |
| Cotizaciones (lista) | `/cotizaciones` |
| Nueva cotización (manual o preparada por IA) | `/cotizaciones/nueva` |
| Cotización (detalle / vista PDF) | `/cotizaciones/[quoteId]` |
| Editar cotización | `/cotizaciones/[quoteId]/editar` |
| Clientes (lista) | `/clientes` |
| Cliente (ficha) | `/clientes/[clientId]` |
| Productos y servicios | `/productos` |
| Notificaciones | `/notificaciones` |
| Configuración | `/configuracion` |
| Asistente IA | `/asistente` |

## Rendimiento y SEO (Core Web Vitals)

- La landing y `/precios` son **Server Components**: el HTML llega completo. El único JavaScript del cliente son los enlaces con evento de GA4 (`features/marketing/tracked-link.tsx`) y el conmutador mensual/anual de precios.
- **Sin imágenes pesadas**: la maqueta del producto del hero está hecha con HTML/Tailwind (`features/marketing/product-mockup.tsx`), así el LCP es texto.
- Fuentes Inter y Poppins con `next/font` (auto-hospedadas, sin saltos de diseño).
- Preguntas frecuentes y menú móvil con `<details>/<summary>` nativo (sin JS).
- Metadata por página (`title`, `description`, `openGraph`, `alternates.canonical`), `sitemap.xml`, `robots.txt` (permite `/` y `/precios`, bloquea las rutas del CRM), imagen Open Graph generada con `next/og` e `icon.svg`.
- Datos estructurados JSON-LD `SoftwareApplication` con las ofertas en GTQ en la landing.

Para medir: Chrome DevTools → Lighthouse (modo *Navigation*, móvil) sobre `pnpm web:build && pnpm --filter @flowcommerce/web start`, o PageSpeed Insights sobre la URL publicada.

## Google Analytics 4

`app/layout.tsx` monta `<GoogleAnalytics gaId=…>` de `@next/third-parties/google` solo si existe `NEXT_PUBLIC_GA_ID`. Con eso GA4 registra automáticamente las **vistas de página**, incluidas las navegaciones del App Router (medición mejorada → "Cambios de página según el historial del navegador").

### Crear la propiedad y obtener el ID

1. Entra a <https://analytics.google.com> con una cuenta de Google → **Administrar** (engrane) → **Crear** → **Propiedad**.
2. Nombre `FlowCommerce`, zona horaria *Guatemala*, moneda *Quetzal guatemalteco (GTQ)*.
3. En **Recopilación de datos → Flujos de datos → Web**, escribe la URL del sitio (p. ej. `https://flowcommerce.vercel.app`) y deja activa la **medición mejorada**.
4. Copia el **ID de medición** (`G-XXXXXXXXXX`) y ponlo en `NEXT_PUBLIC_GA_ID` (en `.env.local` y en las variables del hosting). Reinicia `pnpm web:dev`.
5. Comprueba en **Informes → Tiempo real** o en **Administrar → DebugView** (con la extensión *Google Analytics Debugger*) que llegan `page_view` y los eventos de abajo.

### Eventos personalizados

Definidos en `features/marketing/track.ts` (no hacen nada si no hay `NEXT_PUBLIC_GA_ID`; solo se llaman desde Client Components):

| Función | Evento GA4 | Parámetros | Dónde se usa |
| --- | --- | --- | --- |
| `trackCtaClick(ubicacion, etiqueta?)` | `cta_click` | `ubicacion`, `etiqueta` | Todos los CTA de la landing y de precios |
| `trackPlanSelected(plan, ciclo?)` | `select_plan` | `plan`, `ciclo` | Botones de cada plan |
| `trackSignUp(method?, plan?)` | `sign_up` (**conversión**) | `method`, `plan` | Al completar el registro en `/registro` |
| `trackGenerateLead(origen?)` | `generate_lead` | `origen`, `currency`, `value` | "Hablar con ventas" |

### Marcar `sign_up` como evento clave (conversión)

1. Genera el evento al menos una vez (crea una cuenta de prueba) y espera a que aparezca en **Administrar → Visualización de datos → Eventos** (puede tardar hasta 24 h; en DebugView sale al instante).
2. En esa lista activa el interruptor **Marcar como evento clave** de `sign_up`. Si aún no aparece, ve a **Eventos clave → Nuevo evento clave** y escribe `sign_up`.
3. Opcional: marca también `generate_lead` y registra `ubicacion` y `plan` como **dimensiones personalizadas** (Administrar → Definiciones personalizadas → ámbito *Evento*) para verlos en los informes.

## Pruebas

```bash
pnpm --filter @flowcommerce/web test
```

- `lib/__tests__/format.test.ts`: `formatMoney` (GTQ), `formatRelative`, `initials`.
- `lib/__tests__/labels.test.ts`: `stageInfo`, `quoteStatusInfo`, `sourceLabel` con valores conocidos y desconocidos.
- `features/marketing/__tests__/plans.test.ts`: precios y límites de los planes (anual = mensual × 12 × 0.8).

`Intl` de Node puede separar el símbolo `Q` con un espacio especial (U+00A0/U+202F), por eso los montos se comparan con expresiones regulares.
