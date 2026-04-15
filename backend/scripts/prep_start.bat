@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

set "PY_CMD=python"
where poetry >nul 2>&1
if %ERRORLEVEL% equ 0 if exist "pyproject.toml" set "PY_CMD=poetry run python"

for /f "usebackq delims=" %%i in (`%PY_CMD% -c "from pathlib import Path; from dotenv import dotenv_values; import sys; root = Path(r'%CD%'); p = root / '.env'; d = dotenv_values(p) if p.exists() else {}; v = d.get('DJANGO_SETTINGS_MODULE'); print(v.strip() if v and str(v).strip() else '', end='')"`) do (
  if not "%%i"=="" set "DJANGO_SETTINGS_MODULE=%%i"
)

if not defined PREP_RUNSERVER_HOST set "PREP_RUNSERVER_HOST=127.0.0.1"
if "%PREP_RUNSERVER_HOST%"=="127.0.0.1" (
  echo Binding to %PREP_RUNSERVER_HOST%:8000 ^(local only^). For LAN: set PREP_RUNSERVER_HOST=0.0.0.0 ^& scripts\prep_start.bat
) else (
  echo Binding to %PREP_RUNSERVER_HOST%:8000
)

%PY_CMD% manage.py migrate --noinput
if errorlevel 1 exit /b 1
%PY_CMD% manage.py runserver "%PREP_RUNSERVER_HOST%:8000"
