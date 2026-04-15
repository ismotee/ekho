@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

if not exist ".env.example" (
  echo error: missing .env.example in %CD%
  exit /b 1
)

if not exist ".env" (
  copy /y ".env.example" ".env" >nul
  echo Created .env from .env.example - edit SECRET_KEY and other values as needed.
)

set "PY_CMD=python"
where poetry >nul 2>&1
if %ERRORLEVEL% equ 0 if exist "pyproject.toml" set "PY_CMD=poetry run python"
echo Using: %PY_CMD%

for /f "usebackq delims=" %%i in (`%PY_CMD% -c "from pathlib import Path; from dotenv import dotenv_values; import sys; root = Path(r'%CD%'); p = root / '.env'; d = dotenv_values(p) if p.exists() else {}; v = d.get('DJANGO_SETTINGS_MODULE'); print(v.strip() if v and str(v).strip() else '', end='')"`) do (
  if not "%%i"=="" set "DJANGO_SETTINGS_MODULE=%%i"
)
if defined DJANGO_SETTINGS_MODULE if not "%DJANGO_SETTINGS_MODULE%"=="" (
  echo DJANGO_SETTINGS_MODULE=%DJANGO_SETTINGS_MODULE% ^(from .env^)
)

%PY_CMD% -c "from pathlib import Path; from dotenv import dotenv_values; d = dotenv_values(Path('.') / '.env'); s = (d.get('SECRET_KEY') or '').strip(); (not s or s == 'django-insecure-change-this-in-production') and print('Reminder: set a unique SECRET_KEY in .env before any shared or public use.')"

%PY_CMD% manage.py migrate
if errorlevel 1 exit /b 1

if "%PREP_SEED_CATALOG%"=="1" (
  echo Running seed_exhibit_catalog PREP_SEED_CATALOG=1...
  %PY_CMD% manage.py seed_exhibit_catalog
  if errorlevel 1 exit /b 1
) else (
  echo Skipping seed_exhibit_catalog. To run: set PREP_SEED_CATALOG=1 ^& scripts\prep_first_run.bat
)

echo Next: %PY_CMD% manage.py createsuperuser
echo Then: scripts\prep_start.bat
exit /b 0
