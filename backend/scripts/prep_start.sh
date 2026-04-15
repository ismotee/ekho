#!/usr/bin/env bash
# Start Django for prep work: migrate then runserver.
# PREP_RUNSERVER_HOST: bind address (default 127.0.0.1 = local only).
#   Use PREP_RUNSERVER_HOST=0.0.0.0 to allow other devices on the LAN (open firewall if needed).
set -euo pipefail

BACKEND_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$BACKEND_ROOT"

if command -v poetry >/dev/null 2>&1 && [[ -f pyproject.toml ]]; then
  PYTHON=(poetry run python)
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
fi

HOST="${PREP_RUNSERVER_HOST:-127.0.0.1}"
if [[ "$HOST" == "127.0.0.1" ]]; then
  echo "Binding to $HOST:8000 (local only). For LAN access: PREP_RUNSERVER_HOST=0.0.0.0 $0"
else
  echo "Binding to $HOST:8000"
fi

"${PYTHON[@]}" manage.py migrate --noinput
exec "${PYTHON[@]}" manage.py runserver "${HOST}:8000"
