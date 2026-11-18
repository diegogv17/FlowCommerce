# 2. Conexión con Supabase

## Ambientes

| Ambiente de GitHub | Proyecto Supabase | Se despliega desde |
|---|---|---|
| `staging` | proyecto de pruebas (crear uno gratis, p. ej. `flowcommerce-staging`) | `develop` |
| `production` | `ozlmmqkdrgmtixbxuubk` | `main` (con aprobación manual) |

## Qué cadena usar y dónde

Supabase da tres cadenas en **Connect** (botón arriba en el dashboard):

| Cadena | Host / puerto | ¿Para qué? |
|---|---|---|
| Direct connection | `db.<ref>.supabase.co:5432` | Solo desde redes con IPv6. **GitHub Actions NO la alcanza** (los runners son solo IPv4). |
| **Session pooler** | `aws-0-<región>.pooler.supabase.com:5432`, usuario `postgres.<ref>` | **Migraciones desde GitHub Actions** → secreto `SUPABASE_DB_URL`. |
| Transaction pooler | `aws-0-<región>.pooler.supabase.com:6543` | La API en producción (muchas conexiones cortas). El backend detecta el 6543 y desactiva los prepared statements. |

La contraseña es la de la base (Project Settings → Database). Si tiene caracteres especiales, codifícalos en la URL: `@` → `%40`, `#` → `%23`, `/` → `%2F`.

## Configurar los secretos (lo hace alguien con rol admin del repo)

1. **Settings → Environments → New environment** → `staging`.
   - Add environment secret `SUPABASE_DB_URL` = Session pooler del proyecto de **staging**.
   - Deployment branches: *Selected branches* → `develop`.
2. **New environment** → `production`.
   - Secret `SUPABASE_DB_URL` = Session pooler de `ozlmmqkdrgmtixbxuubk`.
   - **Required reviewers**: al menos 1 persona (la migración espera su aprobación).
   - Deployment branches: *Selected branches* → `main`.
3. Probar: **Actions → Supabase · probar conexión → Run workflow** con cada ambiente.

Reglas: la contraseña **nunca** va en el código, en `.env.example`, en issues ni en chats. Si se filtra, se cambia en Supabase (Database → Reset password) y se actualiza el secreto. El script `scripts/db/status.mjs` nunca imprime la contraseña.

## En local

```bash
SUPABASE_DB_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres" node scripts/db/status.mjs
```
