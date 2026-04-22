# Railway: Docker backend with persistent media (volume + nginx)

This stack matches a **single backend replica**: nginx listens on Railway’s `PORT`, proxies `/api/`, `/admin/`, etc. to Gunicorn, serves **`/media/`** from disk, and serves **`/static/`** from collected static files (Django admin assets).

## Prerequisites

- Backend service uses **`backend/Dockerfile`** (set Railway **Root Directory** to `backend`, or set the Dockerfile path to `backend/Dockerfile` if the repo root is the service root).
- PostgreSQL and the usual Django env vars (`DJANGO_SETTINGS_MODULE`, `SECRET_KEY`, `DATABASE_URL`, `ALLOWED_HOSTS`, CORS/CSRF as needed).

## 1. Add a volume

In the **backend** Railway service:

1. Open **Volumes** (or **Settings → Volume**).
2. Create a volume and mount it at **`/data`** (recommended) or directly at **`/data/media`**.

If you mount at `/data`, use a **nested** media directory **`/data/media`** so the app has a dedicated folder.

## 2. Environment variables

| Variable | Required | Notes |
|----------|----------|--------|
| `EKHO_MEDIA_ROOT` | Recommended | Absolute path where uploads are stored. **Must match** the volume mount layout. Default in the image entrypoint is `/data/media` if unset. |
| `DJANGO_SETTINGS_MODULE` | Yes | `ekho_backend.settings_deployment` |
| `PORT` | Automatic | Set by Railway; do not override manually. |

Optional:

| Variable | Default | Notes |
|----------|---------|--------|
| `EKHO_RUN_MIGRATIONS` | `1` | Runs `python manage.py migrate --noinput` on container start. Set to `0` if you run migrations separately. |

## 3. How paths line up

- Django writes files under `MEDIA_ROOT` (e.g. `records/…`) → on disk that is `EKHO_MEDIA_ROOT/records/…`.
- The API returns URLs like `https://<backend-host>/media/records/…`.
- nginx `location /media/` uses `alias` to the same `EKHO_MEDIA_ROOT` directory.

If `EKHO_MEDIA_ROOT` and the volume do not align, uploads may succeed in the DB but files will be missing or 404 in the browser.

## 4. Local smoke test (Docker)

From the repository root (requires a reachable Postgres URL for runtime):

```bash
docker build -t ekho-backend -f backend/Dockerfile backend
docker run --rm -p 8080:8080 \
  -e PORT=8080 \
  -e SECRET_KEY=local-test-secret-change-me \
  -e DATABASE_URL=postgresql://USER:PASS@HOST:5432/DBNAME \
  -e ALLOWED_HOSTS=localhost,127.0.0.1 \
  -e EKHO_MEDIA_ROOT=/data/media \
  -v ekho-media:/data/media \
  ekho-backend
```

Then open `http://127.0.0.1:8080/api/` (or your health check) and verify an image upload returns a URL that loads from `/media/…`.

## 5. Migrating from ephemeral storage

If you already have rows pointing at `/media/records/…` but files lived only on the old container disk, you must **re-upload** or restore files into the new volume under the same relative paths (`records/…`).
