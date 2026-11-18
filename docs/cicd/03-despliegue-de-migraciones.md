# 3. Despliegue de migraciones a Supabase

## Cómo fluye un cambio de base de datos

1. En una rama `feat/*`: cambia `src/db/schema.ts` y corre `pnpm db:generate`. Revisa el SQL generado y súbelo junto con el cambio.
2. **PR a `develop`**:
   - **CI** aplica todas las migraciones en un Postgres limpio, verifica que `schema.ts` y las migraciones coincidan y corre los e2e.
   - **Revisión de migraciones** (`migraciones-pr.yml`) falla si editaste una migración vieja, o si hay `DROP`/`RENAME`/cambio de tipo sin la etiqueta `migracion-destructiva`.
3. **Merge a `develop`** → `deploy-db.yml` migra **staging** automáticamente.
4. **PR de release `develop` → `main`** → al fusionar, `deploy-db.yml` espera la **aprobación** del ambiente `production`, hace un **respaldo cifrado** y migra.

## Garantías del workflow
- `concurrency` por ambiente sin cancelación: dos migraciones nunca corren juntas y ninguna queda a medias.
- Production solo se migra desde `main`, aunque alguien lo lance a mano.
- Antes y después muestra el estado (`scripts/db/status.mjs`) y falla si quedó algo pendiente.
- Idempotente: drizzle registra cada migración en `drizzle.__drizzle_migrations`.

## Secretos por ambiente
| Secreto | Dónde | Para qué |
|---|---|---|
| `SUPABASE_DB_URL` | staging y production | Session pooler (puerto 5432), ver docs 02. Añade `?sslmode=require` al final. |
| `BACKUP_PASSPHRASE` | production | Clave larga y aleatoria para cifrar los respaldos (guárdenla en un gestor de contraseñas: sin ella no se pueden restaurar). |

## Cambios que pueden perder datos (expand → contract)
No renombres ni borres una columna en un solo paso: la versión de la API que sigue corriendo la usa. Hazlo en dos releases:
1. **Expand**: agrega la columna nueva, copia los datos y haz que el código escriba en ambas.
2. **Contract** (release siguiente): deja de usar la vieja y bórrala, con la etiqueta `migracion-destructiva`.

## Revertir
Drizzle no genera "down migrations". Para revertir se escribe **una migración nueva** que deshaga el cambio. Si se perdieron datos, se restaura el respaldo del run (artifact `respaldo-pre-migracion-<id>`), ver la acción `.github/actions/db-backup`.
