# Contrato de API · FlowCommerce CRM

Este documento describe los endpoints que consume el front. Mientras el backend no exista, el front responde
con datos simulados (`VITE_USE_MOCKS=true`) que respetan **exactamente** estas rutas y formas.

Los tipos TypeScript equivalentes están en [`src/types/domain.ts`](../src/types/domain.ts) y las rutas
simuladas en [`src/mocks/server.ts`](../src/mocks/server.ts); sirven como referencia ejecutable.

## Convenciones

| Tema | Regla |
| --- | --- |
| Base URL | `VITE_API_URL` (por defecto `/api`) |
| Formato | JSON (`Content-Type: application/json`) |
| Autenticación | `Authorization: Bearer <token>` en todas las rutas salvo `/auth/login` |
| Fechas | ISO 8601 en UTC (`2026-11-21T14:30:00.000Z`) |
| Montos | `number` en quetzales (GTQ), sin formato |
| IDs | `string` |
| Idioma de mensajes | Español (se muestran tal cual al usuario) |

### Errores

Cualquier respuesta fuera de 2xx debe traer:

```json
{ "message": "Texto legible para el usuario", "errors": { "campo": "detalle opcional" } }
```

- `401` → el front borra el token y envía al usuario a `/login`.
- `404`, `422` y `500` se muestran con el `message` recibido.

### Paginación

Los listados paginados reciben `page` (desde 1) y `pageSize`, y responden:

```json
{ "data": [ ... ], "meta": { "page": 1, "pageSize": 8, "total": 24 } }
```

## Endpoints

### Autenticación

| Método | Ruta | Body | Respuesta |
| --- | --- | --- | --- |
| POST | `/auth/login` | `{ email, password }` | `{ token, user }` |
| GET | `/auth/me` | — | `User` |
| POST | `/auth/logout` | — | `{ ok: true }` |
| PATCH | `/auth/me` | `{ name, email, phone? }` | `User` actualizado |
| GET | `/users` | — | `User[]` (equipo; se usa en selects de responsable y en Configuración → Usuarios) |

`User`: `{ id, name, email, role: 'admin'|'supervisor'|'asesor', roleLabel, phone?, avatarUrl? }`

### Dashboard

| Método | Ruta | Respuesta |
| --- | --- | --- |
| GET | `/dashboard/summary` | `DashboardSummary`: KPIs, leads por estado, conversión mensual, cotizaciones por estado, ventas por período, seguimientos de hoy y actividad reciente |

### Leads

| Método | Ruta | Notas |
| --- | --- | --- |
| GET | `/leads` | Query: `search`, `status`, `ownerId`, `source`, `period` (`7d`\|`30d`\|`90d`, según fecha de alta), `sort` (`valor`; por defecto más recientes), `page`, `pageSize`. Respuesta paginada. La vista Pipeline pide `pageSize=200`. |
| GET | `/leads/:id` | `Lead` |
| POST | `/leads` | `{ name, company, email, phone, source, value, ownerId?, status? }` → `Lead` |
| PATCH | `/leads/:id` | Campos parciales → `Lead` |
| GET | `/leads/:id/activity` | `ActivityItem[]` = `{ id, title, detail, at, tone }` (pestaña Actividad del lead) |
| PATCH | `/leads/:id/status` | `{ status }` → `Lead`. Se usa al arrastrar tarjetas en el pipeline. |
| DELETE | `/leads/:id` | `{ ok: true }` |

Estados: `nuevo`, `contactado`, `seguimiento`, `cotizacion`, `negociacion`, `ganado`, `perdido`.
Fuentes: `whatsapp`, `web`, `referido`, `facebook`, `instagram`, `llamada`, `otro`.

### Conversaciones e IA

| Método | Ruta | Notas |
| --- | --- | --- |
| GET | `/conversations` | Query: `search`, `channel`, `leadId`. Devuelve `Conversation[]` ordenadas por último mensaje. El front consulta cada 15 s. |
| GET | `/conversations/:id/messages` | `Message[]` ascendente por fecha. El front consulta cada 8 s (se puede reemplazar por WebSocket). |
| POST | `/conversations/:id/messages` | `{ text, author: 'agent'\|'ai' }` → `Message`. Debe enviar el mensaje al canal externo (WhatsApp, etc.). |
| POST | `/conversations/:id/read` | Marca como leída. |
| PATCH | `/conversations/:id` | `{ aiEnabled }` activa o desactiva la IA en ese chat. |
| POST | `/conversations/:id/ai-suggestions` | → `AiSuggestion[]` = `{ id, text, intent, confidence (0..1) }` |
| GET / PUT | `/settings/ai` | `AiSettings` = `{ enabled, autoReply, tone, businessHoursOnly, handoffKeywords[], instructions }` |

Canales: `whatsapp`, `instagram`, `facebook`, `email`, `web`.
Autores de mensaje: `lead` (entrante), `agent` (asesor), `ai` (asistente).

> La generación de respuestas con IA ocurre en el backend; el front solo muestra las sugerencias y deja que
> el asesor las edite o envíe.

### Clientes

| Método | Ruta | Notas |
| --- | --- | --- |
| GET | `/customers` | Query: `search`, `page`, `pageSize`. Paginado. |
| GET | `/customers/summary` | `{ active, billedThisYear }` (subtítulo del listado) |
| GET | `/customers/:id` | `Customer` |
| POST | `/customers` | `{ name, nit, contactName, contactRole, email, phone, address }` |
| PATCH | `/customers/:id` | Parcial |
| GET | `/customers/:id/quotes` | `Quote[]` del cliente |

### Productos y servicios

| Método | Ruta | Notas |
| --- | --- | --- |
| GET | `/products` | Query: `search`, `kind` (`producto`\|`servicio`), `active` (`true`\|`false`). Sin paginar. |
| POST | `/products` | `{ sku, name, kind, category, description, unitPrice, active }` |
| PATCH | `/products/:id` | Parcial |
| DELETE | `/products/:id` | `{ ok: true }` |

### Cotizaciones

| Método | Ruta | Notas |
| --- | --- | --- |
| GET | `/quotes` | Query: `search` (folio o cliente), `status`, `page`, `pageSize`. Paginado. |
| GET | `/quotes/summary` | `{ drafts, pending, sent, approved, totalCount, totalValue }` (tarjetas del listado) |
| POST | `/quotes/ai-draft` | `{ customerId, prompt? }` → `Quote` con `aiGenerated: true`, `reviewRequired: true` y estado `pendiente`. El backend arma conceptos y precios usando **solo** el catálogo de productos. |
| GET | `/quotes/:id` | `Quote` con `items[]` |
| POST | `/quotes` | `{ customerId, validUntil, discount, conditions, notes?, status?, items: [{ productId?, description, quantity, unitPrice }] }` (`status` es `borrador` o `pendiente`). **El backend genera el folio (`COT-0242`) y calcula subtotal y total.** |
| PATCH | `/quotes/:id/status` | `{ status }`. Estados: `borrador`, `pendiente`, `enviada`, `aprobada`, `rechazada`. Al cambiar el estado, `reviewRequired` pasa a `false`. |

### Notificaciones

| Método | Ruta | Notas |
| --- | --- | --- |
| GET | `/notifications` | Query: `kind` (`seguimiento`\|`mensaje`\|`cotizacion`\|`lead`). `AppNotification[]` = `{ id, kind, tag, title, description, createdAt, read, tone, href }`. `href` es la ruta interna del front a la que lleva "Ver detalle". El front consulta cada 30 s. |
| PATCH | `/notifications/:id` | `{ read: true }` |
| POST | `/notifications/read-all` | Marca todas como leídas. |

### Notas y seguimientos

| Método | Ruta | Notas |
| --- | --- | --- |
| GET | `/notes` | Query: `leadId`, `done`. |
| POST | `/notes` | `{ body, leadId?, followUpAt? }` |
| PATCH | `/notes/:id` | `{ body?, done?, followUpAt? }` |
| DELETE | `/notes/:id` | `{ ok: true }` |

## Cómo conectar el backend

1. Copia `.env.example` a `.env`.
2. Pon `VITE_USE_MOCKS=false` y ajusta `VITE_API_URL` (o `VITE_API_PROXY` para desarrollo local sin CORS).
3. Implementa los endpoints anteriores. Si una respuesta difiere del contrato, el único archivo que hay que
   tocar es el servicio del módulo en `src/services/` (por ejemplo `leads.service.ts`) y, si cambian los
   campos, `src/types/domain.ts`.

No es necesario modificar componentes ni pantallas.

## Notas sobre cálculos

- Los precios del catálogo **incluyen IVA (12 %)**. `Quote.subtotal` es la suma de importes con IVA, y `total = subtotal − discount`.
  El front desglosa base imponible e IVA solo para mostrarlos (`src/lib/tax.ts`); si el backend prefiere devolver ese desglose,
  basta con agregarlo a `Quote` y ajustar `QuoteDetailPage` y `NewQuotePage`.
