#!/usr/bin/env bash
# First-time prep setup: ensure .env exists, migrate, optional catalog seed.
# Run from anywhere; assumes this file lives in backend/scripts/.
set -euo pipefail

BACKEND_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$BACKEND_ROOT"

if [[ ! -f .env.example ]]; then
  echo "error: missing .env.example in $BACKEND_ROOT" >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example — edit SECRET_KEY and other values as needed."
fi

# PREP_PYTHON: explicit interpreter (e.g. backend/venv/bin/python) — used by prep_install.sh after venv install.
if [[ -n "${PREP_PYTHON:-}" ]]; then
  PYTHON=("$PREP_PYTHON")
  echo "Using: $PREP_PYTHON (PREP_PYTHON)"
elif command -v poetry >/dev/null 2>&1 && [[ -f pyproject.toml ]]; then
  PYTHON=(poetry run python)
  echo "Using: poetry run python"
else
  PYTHON=(python)
fi

dsm="$("${PYTHON[@]}" -c "
from pathlib import Path
from dotenv import dotenv_values
import sys
root = Path(sys.argv[1])
p = root / '.env'
d = dotenv_values(p) if p.exists() else {}
v = d.get('DJANGO_SETTINGS_MODULE')
print(v.strip() if v and str(v).strip() else '', end='')
" "$BACKEND_ROOT")"
if [[ -n "$dsm" ]]; then
  export DJANGO_SETTINGS_MODULE="$dsm"
  echo "DJANGO_SETTINGS_MODULE=$DJANGO_SETTINGS_MODULE (from .env)"
fi

"${PYTHON[@]}" -c "
from pathlib import Path
from dotenv import dotenv_values
import sys
root = Path(sys.argv[1])
d = dotenv_values(root / '.env')
sk = d.get('SECRET_KEY')
s = (sk or '').strip()
if not s or s == 'django-insecure-change-this-in-production':
    print('Reminder: set a unique SECRET_KEY in .env before any shared or public use.')
" "$BACKEND_ROOT"

"${PYTHON[@]}" manage.py migrate

if [[ "${PREP_SEED_CATALOG:-}" == "1" ]]; then
  echo "Running seed_exhibit_catalog (PREP_SEED_CATALOG=1)..."
  "${PYTHON[@]}" manage.py seed_exhibit_catalog
else
  echo "Skipping seed_exhibit_catalog. To run it: PREP_SEED_CATALOG=1 $0"
fi

echo "Next: ${PYTHON[*]} manage.py createsuperuser"
echo "Then start the server: scripts/prep_start.sh"
