@echo off
setlocal
cd /d "%~dp0"
echo Starting Flask REST API Backend...

set "PYTHON_EXE=python"
if exist ".venv\Scripts\python.exe" (
    set "PYTHON_EXE=.venv\Scripts\python.exe"
)

cd backend
"..\%PYTHON_EXE%" run.py
if %errorlevel% neq 0 (
    "%PYTHON_EXE%" run.py
)
pause
