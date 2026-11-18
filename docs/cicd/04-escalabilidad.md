# 4. Escalabilidad y operación de la base de datos

## Conexiones: la primera barrera al crecer
Postgres no escala por número de conexiones: cada una consume memoria del servidor. Por eso:

| Quién se conecta | Cadena | Por qué |
|---|---|---|
| API en producción (varias instancias) | **Transaction pooler** `:6543` + `?sslmode=require` | Supavisor reparte pocas conexiones reales entre muchas peticiones. El backend detecta el 6543 y desactiva los prepared statements. |
| Migraciones y respaldos (GitHub Actions) | **Session pooler** `:5432` | IPv4 y sesión completa (DDL, `pg_dump`). |
| Desarrollo local | Docker (`pnpm docker:up`) | Nunca contra producción. |

**Tamaño del pool** (variables de la API):
- `DATABASE_POOL_MAX` (por instancia, por defecto 10). Regla: `instancias × DATABASE_POOL_MAX ≤ límite de clientes del pooler de tu plan` (Supabase → Database → Settings muestra el límite).
- `DATABASE_IDLE_TIMEOUT_S` (20) cierra conexiones ociosas; `DATABASE_MAX_LIFETIME_S` (1800) las renueva; `DATABASE_CONNECT_TIMEOUT_S` (10) falla rápido si la base no responde.

## Escalar la API horizontalmente
La API es *stateless* (sesión por JWT de Supabase), así que se pueden correr varias instancias detrás de un balanceador. Dos piezas guardan estado en memoria y habría que moverlas al pasar de 1 instancia:
- **Tiempo real (SSE, `src/realtime`)**: hoy cada instancia solo ve sus eventos → usar Redis Pub/Sub, Postgres `LISTEN/NOTIFY` o Supabase Realtime.
- **Rate limiting (`@nestjs/throttler`)**: cuenta por instancia → usar un storage compartido (Redis).
- **Archivos**: usar `FILE_STORAGE_DRIVER=supabase` (Storage), nunca disco local.

## Escalar la base
1. **Medir antes de optimizar**: Supabase → Reports y `pg_stat_statements` (Database → Query Performance). Índices solo con evidencia (`EXPLAIN ANALYZE`); las tablas grandes ya tienen índices por `project_id`.
2. **Vertical**: subir el *compute* del proyecto (Settings → Compute and Disk) cuando CPU/RAM estén altos; también sube el límite de conexiones.
3. **Lecturas**: *read replicas* (plan Pro) para dashboards y reportes.
4. **Respaldos**: plan gratis → workflow diario cifrado (`supabase-mantenimiento.yml`); plan Pro → backups diarios y PITR.

## Operación automática (`.github/workflows/supabase-mantenimiento.yml`)
- **Latido** cada 3 días a staging y production: evita que Supabase pause los proyectos gratis por inactividad.
- **Respaldo diario** de production, cifrado con `BACKUP_PASSPHRASE`, guardado 7 días como artifact.

Requiere un ambiente extra **`mantenimiento`** (Settings → Environments): secretos `SUPABASE_DB_URL` (Session pooler de production) y `BACKUP_PASSPHRASE`; *Deployment branches* = `main`; **sin** required reviewers. Así los jobs programados no se quedan esperando aprobación. Lo ideal es que su `SUPABASE_DB_URL` sea un rol de **solo lectura**:

```sql
-- En el SQL Editor de production (cambia la contraseña):
create role mantenimiento_ro login password '<contraseña-larga>';
grant usage on schema public, drizzle to mantenimiento_ro;
grant select on all tables in schema public, drizzle to mantenimiento_ro;
alter default privileges in schema public grant select on tables to mantenimiento_ro;
alter role mantenimiento_ro bypassrls; -- para respaldar tablas con RLS
```
Con el pooler, el usuario se escribe `mantenimiento_ro.<ref>`.
