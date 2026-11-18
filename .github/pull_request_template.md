## Qué cambia

<!-- Resumen en 1-3 líneas. Enlaza la tarea si existe. -->

## Tipo
- [ ] Funcionalidad
- [ ] Corrección
- [ ] Migración de base de datos
- [ ] CI/CD o infraestructura

## Checklist
- [ ] CI en verde (lint, tipos, pruebas unitarias, e2e y build de web)
- [ ] Si toqué `src/db/schema.ts`, generé y subí la migración (`pnpm db:generate`)
- [ ] Si la migración borra o renombra columnas/tablas, lo explico abajo y el PR lleva la etiqueta `migracion-destructiva`
- [ ] No subí secretos (`.env`, claves, contraseñas)
- [ ] Actualicé `.env.example` y el README si agregué variables

## Cómo probarlo
