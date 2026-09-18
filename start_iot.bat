@echo off
setlocal
cd /d "%~dp0"
echo Starting IoT Sensor Data Simulator...

set "PYTHON_EXE=python"
if exist ".venv\Scripts\python.exe" (
    set "PYTHON_EXE=.venv\Scripts\python.exe"
)

cd iot
"..\%PYTHON_EXE%" sensor_simulator.py --mode auto
if %errorlevel% neq 0 (
    "%PYTHON_EXE%" sensor_simulator.py --mode auto
)
pause
