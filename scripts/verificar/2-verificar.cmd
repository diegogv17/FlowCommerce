@echo off
rem Compila y prueba todo. Cada paso deja su log en .verify\ y su codigo de salida.
cd /d "%~dp0\..\.."
if not exist .verify mkdir .verify
echo INICIO %date% %time% > .verify\resumen.log

call pnpm run build:packages > .verify\types.log 2>&1
echo types %errorlevel% >> .verify\resumen.log

call pnpm exec tsc --noEmit -p tsconfig.json > .verify\api-tsc.log 2>&1
echo api-tsc %errorlevel% >> .verify\resumen.log

call pnpm run lint > .verify\api-lint.log 2>&1
echo api-lint %errorlevel% >> .verify\resumen.log

call pnpm test > .verify\api-test.log 2>&1
echo api-test %errorlevel% >> .verify\resumen.log

call pnpm --filter @flowcommerce/web typecheck > .verify\web-tsc.log 2>&1
echo web-tsc %errorlevel% >> .verify\resumen.log

call pnpm --filter @flowcommerce/web test > .verify\web-test.log 2>&1
echo web-test %errorlevel% >> .verify\resumen.log

call pnpm --filter @flowcommerce/web build > .verify\web-build.log 2>&1
echo web-build %errorlevel% >> .verify\resumen.log

echo FIN %date% %time% >> .verify\resumen.log
