@echo off
rem Pruebas e2e del backend contra el PostgreSQL LOCAL de Docker (nunca contra Supabase).
rem Requiere Docker Desktop abierto.
cd /d "%~dp0\..\.."
if not exist .verify mkdir .verify
set "DATABASE_URL=postgresql://flowcommerce:flowcommerce@localhost:5432/flowcommerce_dev"
set "DIRECT_URL=%DATABASE_URL%"
rem Si la terminal hereda NODE_ENV=production, la app exige claves de produccion y los e2e fallan.
set "NODE_ENV=test"
echo == docker > .verify\api-e2e.log
docker compose up -d --wait >> .verify\api-e2e.log 2>&1
if errorlevel 1 (
  echo Docker no esta corriendo: abre Docker Desktop y vuelve a ejecutar. >> .verify\api-e2e.log
  echo FIN >> .verify\api-e2e.log
  exit /b 1
)
echo == migrate >> .verify\api-e2e.log
call pnpm run db:migrate >> .verify\api-e2e.log 2>&1
echo == e2e >> .verify\api-e2e.log
call pnpm run test:e2e >> .verify\api-e2e.log 2>&1
echo EXIT %errorlevel% >> .verify\api-e2e.log
echo == web e2e (Playwright) >> .verify\api-e2e.log
call pnpm --filter @flowcommerce/web exec playwright install chromium >> .verify\api-e2e.log 2>&1
call pnpm --filter @flowcommerce/web test:e2e >> .verify\api-e2e.log 2>&1
echo EXIT-WEB %errorlevel% >> .verify\api-e2e.log
echo FIN >> .verify\api-e2e.log
