#!/usr/bin/env bash
# One-shot prep install: dependencies (Poetry or local venv + pip), then prep_first_run (migrate, optional seed).
# Run from anywhere. From backend/: ./scripts/prep_install.sh
#
# Poetry is used when: poetry is on PATH, pyproject.toml exists, and PREP_NO_POETRY is not 1.
# Otherwise: creates backend/venv if missing and pip install -r requirements.txt.
#
# Environment:
#   PREP_NO_POETRY=1  — force venv + pip even if Poetry is installed.
#   PY_BIN — interpreter for "python -m venv" when not using Poetry (default: python3, else python).
#   PREP_SEED_CATALOG — passed through to prep_first_run.sh (set to 1 to seed catalog).
set -euo pipefail

BACKEND_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$BACKEND_ROOT"

if [[ ! -f .env.example ]]; then
  echo "error: missing .env.example in $BACKEND_ROOT" >&2
  exit 1
fi

USE_POETRY=0
if [[ "${PREP_NO_POETRY:-}" != "1" ]] && command -v poetry >/dev/null 2>&1 && [[ -f pyproject.toml ]]; then
  USE_POETRY=1
fi

if [[ "$USE_POETRY" -eq 1 ]]; then
  unset PREP_PYTHON
  echo "Installing dependencies with Poetry..."
  poetry install
else
  unset PREP_PYTHON
  VENV_DIR="$BACKEND_ROOT/venv"
  PY_BIN="${PY_BIN:-python3}"
  if ! command -v "$PY_BIN" >/dev/null 2>&1; then
    PY_BIN=python
  fi
  if [[ ! -d "$VENV_DIR" ]]; then
    echo "Creating venv at $VENV_DIR ..."
    "$PY_BIN" -m venv "$VENV_DIR"
  fi
  echo "Installing dependencies with pip (venv)..."
  "$VENV_DIR/bin/python" -m pip install --upgrade pip
  "$VENV_DIR/bin/pip" install -r requirements.txt
  export PREP_PYTHON="$VENV_DIR/bin/python"
fi

exec bash "$BACKEND_ROOT/scripts/prep_first_run.sh"
