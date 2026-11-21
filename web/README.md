# FlowCommerce CRM · Frontend

Interfaz web del CRM de FlowCommerce para la conversión de leads y la atención con respuestas asistidas por IA.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router · TanStack Query · Recharts · dnd-kit

## Puesta en marcha

```bash
npm install
cp .env.example .env
npm run dev
```

La aplicación abre en <http://localhost:5173>. Con `VITE_USE_MOCKS=true` (valor por defecto) funciona sin
backend y acepta cualquier correo y contraseña.

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Revisión de tipos + build de producción en `dist/` |
| `npm run preview` | Sirve el build localmente |
| `npm run lint` | Análisis estático |

## Módulos

Dashboard · Leads (tabla, pipeline kanban y ficha del lead) · Conversaciones con sugerencias de IA y panel del lead ·
Cotizaciones (listado, creación manual o con IA y documento imprimible) · Clientes (listado y ficha) · Productos y servicios ·
Notificaciones · Configuración (perfil, usuarios y asistente de IA).

## Estructura

```
src/
├── app/            Providers, rutas, autenticación y notificaciones
├── components/
│   ├── layout/     Sidebar, Topbar, layout principal, logotipo
│   └── ui/         Componentes base (botones, formularios, tablas, modales…)
├── config/         Variables de entorno
├── features/       Una carpeta por módulo (pantallas y componentes propios)
├── hooks/          Consultas y mutaciones (TanStack Query)
├── lib/            Formatos (moneda, fechas), etiquetas y utilidades
├── mocks/          Datos y servidor simulado en memoria
├── services/       Capa de acceso a la API  ← punto de integración con el backend
├── styles/         Tokens de marca y estilos globales
└── types/          Modelos de dominio compartidos
```

## Integración con el backend

Toda la comunicación pasa por `src/services/`. Cada módulo tiene su archivo (`leads.service.ts`,
`quotes.service.ts`, …) con funciones que llaman a un único cliente HTTP (`http.ts`), que ya se encarga del token,
los errores y el cierre de sesión en 401.

El contrato completo de endpoints está en [`docs/API.md`](docs/API.md). Para pasar de datos simulados a la API real:

```bash
# .env
VITE_USE_MOCKS=false
VITE_API_URL=https://api.tu-dominio.com/v1
```

## Identidad de marca

Los tokens definidos en `src/styles/index.css` siguen el manual de marca:

| Token | Color |
| --- | --- |
| Flow Blue | `#3B82F6` |
| Navy | `#0F172A` |
| Teal Green | `#10B981` |
| Light Neutral | `#F3F6FA` |

Tipografías: **Poppins** (títulos y KPIs), **IBM Plex Sans** (interfaz) e **IBM Plex Mono** (montos, folios y fechas).
