@echo off
cd /d "%~dp0\..\.."
if not exist .verify mkdir .verify
call pnpm run lint > .verify\api-lint.log 2>&1
echo EXIT %errorlevel% >> .verify\api-lint.log
call pnpm test > .verify\api-test.log 2>&1
echo EXIT %errorlevel% >> .verify\api-test.log
echo FIN >> .verify\api-test.log
