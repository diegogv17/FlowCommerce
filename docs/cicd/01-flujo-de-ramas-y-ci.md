# 1. Flujo de ramas e integración continua

## Ramas

| Rama | Para qué | Despliega a |
|------|----------|-------------|
| `main` | Lo que está en producción. Solo entra por PR desde `develop` (release). | Supabase **production** (con aprobación manual) |
| `develop` | Integración del equipo. Todo PR de trabajo apunta aquí. | Supabase **staging** (automático) |
| `feat/*`, `fix/*` | Trabajo diario; se borran al fusionar. | — |
| `ci/*`, `cd/*`, `ops/*` | Cambios de pipelines e infraestructura. | — |
| `hotfix/*` | Arreglo urgente desde `main`; se fusiona a `main` y de vuelta a `develop`. | production |

```
feat/x ──PR──▶ develop ──(CI ✔ + migración a staging)──PR release──▶ main ──(aprobación)──▶ production
```

## Qué corre en cada PR (`.github/workflows/ci.yml`)

1. **API**: lint sin `--fix`, `tsc --noEmit`, pruebas unitarias con cobertura y `nest build`.
2. **API e2e**: Postgres 17 efímero, aplica **todas** las migraciones desde cero, comprueba que `schema.ts` no tenga cambios sin migración y corre los e2e.
3. **Web**: oxlint y `tsc -b && vite build` (React + Vite).

Buenas prácticas aplicadas: `--frozen-lockfile`, versión de pnpm fijada en `packageManager`, caché de pnpm y de Next, `concurrency` que cancela runs viejos, permisos mínimos (`contents: read`), `timeout-minutes` y ningún secreto en CI.

## Configuración que hace la dueña del repo (Settings, requiere admin)

**Settings → Branches → Add rule** para `main` y `develop`:
- Require a pull request before merging (1 aprobación en `main`).
- Require status checks to pass: `API · lint, tipos y pruebas unitarias`, `API · migraciones y pruebas e2e (Postgres 17)`, `Web · tipos, pruebas y build (Next.js)`.
- Require branches to be up to date before merging.
- Do not allow force pushes ni deletions.

**Dependabot** (`.github/dependabot.yml`) abre PRs semanales agrupados contra `develop`.
