@echo off
setlocal
cd /d "%~dp0"
echo Starting React Vite Frontend Dashboard...
cd frontend
call npm run dev
pause
