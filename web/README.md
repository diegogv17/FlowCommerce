# FlowCommerce CRM · Frontend

Interfaz web del CRM (diseño del equipo de frontend), conectada a la API de FlowCommerce y a Supabase Auth.

**Stack:** React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router · TanStack Query · Supabase JS · Recharts · dnd-kit

## Puesta en marcha

Desde la raíz del repositorio (workspace de pnpm):

```bash
pnpm install
cp web/.env.example web/.env      # en Windows: copy web\.env.example web\.env
pnpm web:dev                      # http://localhost:3001
```

La API debe estar corriendo (`pnpm start:dev` en la raíz, puerto 3000) con `CORS_ORIGINS=http://localhost:3001`.

| Variable | Ejemplo |
| --- | --- |
| `VITE_API_URL` | `http://localhost:3000/api/v1` |
| `VITE_SUPABASE_URL` | `https://<proyecto>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | anon / publishable key (es pública) |

| Comando (en `web/`) | Descripción |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Revisión de tipos + build de producción en `dist/` |
| `pnpm lint` | Análisis estático (oxlint) |

## Cómo se conecta con el backend

- **Sesión:** Supabase hace login/registro/recuperación (`src/lib/supabase.ts`). La API solo recibe `Authorization: Bearer <token>`.
- **Empresa activa:** casi todo vive en `/projects/:projectId/...`. `src/app/auth.tsx` carga el perfil y las empresas (`/users/me`, `/projects/my`) y fija la empresa activa; los servicios usan `pp('/leads')`.
- **Servicios:** `src/services/*.service.ts` llaman a la API real y traducen sus formas a los tipos de la interfaz (`src/types/domain.ts`). Los mapeos de estados/fuentes están en `src/services/mappers/`.
- **Datos que la API no guarda** (preferencias de IA, IA por chat): se guardan en el navegador y la pantalla lo indica.

## Pantallas

Cuenta: login, registro, onboarding (crear empresa), invitación, solicitar acceso, recuperar/restablecer contraseña, `/auth/callback`.
App: Dashboard · Leads (tabla, pipeline y ficha) · Conversaciones de WhatsApp con sugerencias e insight de IA · Cotizaciones (manual o con IA, aprobación, PDF, envío por correo) · Clientes · Productos y servicios · Notas y seguimientos · Notificaciones · Configuración (perfil, usuarios e invitaciones, empresa, IA).

## Despliegue (Vercel)

Root Directory `web`, Framework **Vite** (lo fija `vercel.json`, que además redirige todas las rutas a `index.html`). Variables: las tres `VITE_*` de arriba con los valores de producción.
