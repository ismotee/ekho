# Prep laptops: local Django + SQLite

Use this guide for **pre-exhibition machines** that run the Ekho **backend** locally (Django + SQLite), with an optional React UI. Align installs with a single **Git revision** or tag, then follow release and smoke-test notes in [`backend/DEPLOY.md`](../../backend/DEPLOY.md).

---

## Prerequisites

| Requirement | Notes |
|-------------|--------|
| **Python 3.10+** | Matches `python = "^3.10"` in [`backend/pyproject.toml`](../../backend/pyproject.toml). |
| **Poetry** *or* **pip + venv** | Poetry is the recommended install path (see [README](../../README.md)). pip is supported via [`backend/requirements.txt`](../../backend/requirements.txt). |
| **Git** | To clone or checkout a pinned commit/tag. |
| **Node.js 18+** | Only if you need the full curator UI (`frontend/`). Not required for API + Django admin alone. |

SQLite is bundled with Python; no separate database server is required.

---

## Poetry vs pip

**Poetry (recommended)**

1. Install Poetry ([README](../../README.md) has platform commands).
2. `cd backend`
3. `poetry install`
4. Use `poetry run python …` for Django commands, or `poetry shell` then `python …`.

The prep scripts under `backend/scripts/` detect Poetry when `poetry` is on `PATH` and `pyproject.toml` exists, and use `poetry run python` automatically.

**One-shot install (dependencies + first run)** — from `backend/` after checkout:

| Shell | Command |
|--------|---------|
| **Bash** (Linux, macOS Terminal, Git Bash) | `chmod +x scripts/prep_install.sh && ./scripts/prep_install.sh` |
| **zsh** (macOS default as of Catalina) | `chmod +x scripts/prep_install.zsh && ./scripts/prep_install.zsh` *(delegates to the Bash script)* |
| **PowerShell** (Windows) | `pwsh -ExecutionPolicy Bypass -File scripts\prep_install.ps1` |

These install either with **Poetry** (`poetry install`) or, if Poetry is not used, a **`backend/venv`** and `pip install -r requirements.txt`. Set **`PREP_NO_POETRY=1`** (Unix) or **`$env:PREP_NO_POETRY = "1"`** (PowerShell) to force the venv path even when Poetry is installed. Optional catalog seed: **`PREP_SEED_CATALOG=1`** (same as `prep_first_run`).

**pip + venv (fallback)**

1. `cd backend`
2. `python -m venv venv`
3. Activate the environment (Windows: `venv\Scripts\activate`; macOS/Linux: `source venv/bin/activate`).
4. `pip install -r requirements.txt`
5. Run `python manage.py …` with the venv **activated** so the prep scripts use the right interpreter.

---

## Backend setup (summary)

1. Checkout the **same** tag or commit everywhere (see [`backend/DEPLOY.md`](../../backend/DEPLOY.md) release freeze).
2. `cd backend`
3. Install dependencies: either run **`scripts/prep_install.sh`**, **`prep_install.zsh`**, or **`prep_install.ps1`** (see table above), *or* install manually (Poetry or pip as in the previous section).
4. If you did **not** use `prep_install.*`: copy environment file: `cp .env.example .env` (Windows: `copy .env.example .env`).
5. Edit `.env`: set **`SECRET_KEY`** to a new random value before shared or LAN use. Optionally set `DJANGO_SETTINGS_MODULE=ekho_backend.settings_deployment` for stricter, production-like settings (see `.env.example` and [`backend/DEPLOY.md`](../../backend/DEPLOY.md)).
6. **First run (manual path):** from `backend/`, run `scripts/prep_first_run.sh` or `scripts\prep_first_run.bat` if you already installed dependencies yourself (creates `.env` if missing, runs migrations; optional catalog seed with `PREP_SEED_CATALOG=1`). Skip this step if you already ran `prep_install.*`.
7. Create an admin user: `python manage.py createsuperuser` (or `poetry run python manage.py createsuperuser`).
8. **Daily start:** `scripts/prep_start.sh` or `scripts\prep_start.bat` (migrates, then Django `runserver`).
9. **Long prep sessions (optional):** `scripts/prep_start_production.sh` or `scripts\prep_start_production.bat` — same migrations and **`PREP_RUNSERVER_HOST`** / `.env` behavior, but serves the app with **[Waitress](https://docs.pylonsproject.org/projects/waitress/)** (`python -m waitress …`) instead of `runserver`. Waitress is a pure-Python WSGI server that behaves more predictably than the dev server during extended local use (especially on Windows). It is still **prep-grade** serving, not exhibit hardening.

**Binding address:** By default prep start scripts bind to **127.0.0.1:8000** (local only). To allow other devices on the LAN to reach the API, set **`PREP_RUNSERVER_HOST=0.0.0.0`** (Unix) or `set PREP_RUNSERVER_HOST=0.0.0.0` before `prep_start` or `prep_start_production` (Windows). See **Firewall** below.

---

## Frontend options

| Option | When to use | Notes |
|--------|-------------|--------|
| **A — Django admin only** | Quick setup, no Node | Open `http://127.0.0.1:8000/admin/` (adjust host if you bind to LAN). |
| **B — Vite dev server** | Full curator UI during prep | `cd frontend`, `npm install`, `npm run dev`. [`frontend/vite.config.ts`](../../frontend/vite.config.ts) proxies `/api` to `http://localhost:8000`, so keep the backend on port **8000**. UI defaults to port **3000** in that config. If the backend uses production-like settings, set **`CORS_ALLOWED_ORIGINS`** / **`CSRF_TRUSTED_ORIGINS`** in `.env` for your UI origin (see `.env.example`). |
| **C — Static build** | Serving built assets without `npm run dev` | `cd frontend`, `npm run build`. The app uses `VITE_API_BASE_URL` when set ([`frontend/src/services/api.ts`](../../frontend/src/services/api.ts)); otherwise it uses the relative path `/api`. For a static host on another origin or port, set **`VITE_API_BASE_URL`** at build time to the full API base URL (e.g. `http://192.168.1.10:8000/api`) and configure CORS/CSRF on the backend for that origin. |

Curator-facing operations: [`docs/curator-runbook.md`](../curator-runbook.md).

---

## Where data lives (backup before OS reinstall)

All paths below are under the **`backend/`** directory (the Django project root — same folder as `manage.py`).

| Path | Contents |
|------|----------|
| **`db.sqlite3`** | SQLite database (collections, records, users, etc.). |
| **`media/`** | Uploaded images and other media referenced by the app. |

Copy both to backup or migrate a prep machine. After restoring files, run `python manage.py migrate` on the target environment so the schema matches the code revision you are running.

Organization actors and imports: [`docs/deployment/actors-for-import.md`](actors-for-import.md).

---

## Firewall (optional)

- If you bind the dev server to **`0.0.0.0:8000`**, other machines on the LAN can connect only if the **host firewall** allows **inbound TCP 8000** (and any port you use for the built UI, if applicable).
- Restrict to trusted networks; `runserver` and Waitress prep scripts are for development and prep, not hardened production serving.

---

## Related documentation

- [`backend/DEPLOY.md`](../../backend/DEPLOY.md) — release freeze, export/import smoke test, production-like settings.
- [`docs/curator-runbook.md`](../curator-runbook.md) — curator workflows.
- [`backend/.env.example`](../../backend/.env.example) — environment variables.
