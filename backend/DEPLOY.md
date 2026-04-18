# Ekho backend: deployment notes (pre-exhibition and exhibit)

## Release freeze

Before distributing builds to prep machines or the exhibit server:

1. Use one **Git revision** (or release tag) for every environment.
2. Run migrations on each instance: `python manage.py migrate`.
3. Record the latest migration name in this checklist (example):   `python manage.py showmigrations api | findstr /C:"[X]"` (Windows) or `grep '\[X\]'` after `showmigrations api` on Unix.

Optional Git tag (run from repo root):

```bash
git tag -a v1.x.y -m "Pre-exhibition freeze"
```

## Smoke test: export and import

On a **source** database with at least one record (with or without `RecordImage` rows):

1. **GET** `/api/records/{id}/export/` — expect `ekho_export_version` **2** and `record.images` as an array.
2. On a **clean** database (or second machine), authenticate, pick `current_collection_id`, **POST** `/api/records/import/` with `mode: acquisition` and the JSON body.
3. **GET** the new record — domain `data`, representative image, and `images` should match what you exported.

## Organization actors

If imports should preserve organization actors, see [docs/deployment/actors-for-import.md](../docs/deployment/actors-for-import.md) and run `python manage.py seed_exhibit_catalog` where appropriate.

## Production-like settings

For packages that should not run with `DEBUG=True`, set:

- `DJANGO_SETTINGS_MODULE=ekho_backend.settings_deployment`
- Variables from [`.env.example`](.env.example) (`SECRET_KEY`, `ALLOWED_HOSTS`, optional CORS/CSRF for your browser origin).

`settings_deployment` sets `SECURE_PROXY_SSL_HEADER` for reverse proxies (e.g. Railway) so `SECURE_SSL_REDIRECT` does not cause redirect loops.

Railway: which variables belong to which service (Postgres, backend, frontend) — [docs/deployment/railway-environment-variables.md](../docs/deployment/railway-environment-variables.md).

Curator-facing steps: [docs/curator-runbook.md](../docs/curator-runbook.md).
