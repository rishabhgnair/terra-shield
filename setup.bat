@echo off
setlocal enabledelayedexpansion
echo ========================================================
echo   SIH Prototype Setup: Terra Shield Landslide System
echo ========================================================
echo.

cd /d "%~dp0"

:: Determine Python executable
set "PYTHON_EXE="
if exist ".venv\Scripts\python.exe" (
    set "PYTHON_EXE=.venv\Scripts\python.exe"
) else (
    where uv >nul 2>nul
    if !errorlevel! equ 0 (
        echo [INFO] Creating Python virtual environment using uv...
        uv venv --python 3.12
        if exist ".venv\Scripts\python.exe" set "PYTHON_EXE=.venv\Scripts\python.exe"
    ) else (
        where python >nul 2>nul
        if !errorlevel! equ 0 (
            python -m venv .venv
            if exist ".venv\Scripts\python.exe" set "PYTHON_EXE=.venv\Scripts\python.exe"
        )
    )
)

if "%PYTHON_EXE%"=="" (
    set "PYTHON_EXE=python"
)

echo 1. Installing Backend Python Dependencies using %PYTHON_EXE%...
where uv >nul 2>nul
if %errorlevel% equ 0 (
    uv pip install -r backend/requirements.txt -r iot/requirements.txt python-pptx
) else (
    "%PYTHON_EXE%" -m pip install -r backend/requirements.txt -r iot/requirements.txt python-pptx
)

echo.
echo 2. Training Machine Learning Model...
"%PYTHON_EXE%" ml/train.py

echo.
echo 3. Generating SIH Presentation Deck...
"%PYTHON_EXE%" generate_ppt.py

echo.
echo 4. Installing Frontend Node.js Dependencies...
cd frontend
call npm install
cd ..

echo.
echo ========================================================
echo   SETUP COMPLETE!
echo   Run 'start_backend.bat', 'start_frontend.bat', and 'start_iot.bat'
echo ========================================================
pause
