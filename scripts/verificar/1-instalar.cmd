@echo off
rem Instala dependencias del monorepo (backend + web) y deja el log en .verify\instalar.log
cd /d "%~dp0\..\.."
if not exist .verify mkdir .verify
echo INICIO %date% %time% > .verify\instalar.log
call pnpm install >> .verify\instalar.log 2>&1
echo EXIT %errorlevel% >> .verify\instalar.log
echo FIN >> .verify\instalar.log
