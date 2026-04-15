#!/usr/bin/env zsh
# macOS default shell: thin wrapper — install logic is POSIX bash in prep_install.sh.
# Usage: chmod +x scripts/prep_install.zsh && ./scripts/prep_install.zsh
# Same env vars as prep_install.sh (PREP_NO_POETRY, PY_BIN, PREP_SEED_CATALOG, etc.).
SCRIPT_DIR=${0:A:h}
exec /usr/bin/env bash "$SCRIPT_DIR/prep_install.sh" "$@"
