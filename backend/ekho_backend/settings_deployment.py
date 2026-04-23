"""
Deployment-oriented defaults: turn off DEBUG, read hosts and CORS from the environment,
and enable stricter security settings suitable for HTTPS deployments (e.g. Railway).

PostgreSQL is required (DATABASE_URL or PGHOST + credentials); there is no SQLite fallback.

    set DJANGO_SETTINGS_MODULE=ekho_backend.settings_deployment

See backend/DEPLOY.md and backend/.env.example.
"""

import logging

from django.core.exceptions import ImproperlyConfigured

from .settings import *  # noqa: F403, F405

_logger = logging.getLogger(__name__)

# Optional: absolute path for user uploads (Railway volume + nginx /media/ alias).
# When unset, inherits MEDIA_ROOT from settings (typically BASE_DIR / "media").
_ekho_media_root = os.getenv("EKHO_MEDIA_ROOT", "").strip()
if _ekho_media_root:
    MEDIA_ROOT = Path(_ekho_media_root)

# PostgreSQL only: DATABASE_URL (Railway / Heroku) or libpq-style vars when PGHOST is set.
# Missing or invalid configuration raises ImproperlyConfigured with explicit env diagnostics.
_database_url = os.getenv("DATABASE_URL", "").strip()
_pg_host = os.getenv("PGHOST", "").strip()

if _database_url:
    import dj_database_url

    DATABASES = {
        "default": dj_database_url.config(
            default=_database_url,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
elif _pg_host:
    _pg_name = (os.getenv("PGDATABASE") or os.getenv("POSTGRES_DB") or "").strip()
    _pg_user = (os.getenv("PGUSER") or os.getenv("POSTGRES_USER") or "").strip()
    missing = []
    if not _pg_name:
        missing.append(
            "PGDATABASE or POSTGRES_DB (non-empty; required when using PGHOST without DATABASE_URL)"
        )
    if not _pg_user:
        missing.append(
            "PGUSER or POSTGRES_USER (non-empty; required when using PGHOST without DATABASE_URL)"
        )
    if missing:
        raise ImproperlyConfigured(
            "ekho_backend.settings_deployment: PostgreSQL via PGHOST is missing environment "
            "variables: " + "; ".join(missing)
        )
    _pg_password = os.getenv("PGPASSWORD") or os.getenv("POSTGRES_PASSWORD") or ""
    _pg_port = (os.getenv("PGPORT") or "5432").strip() or "5432"
    _pg_opts = {}
    _sslmode = os.getenv("PGSSLMODE", "").strip()
    if _sslmode:
        _pg_opts["sslmode"] = _sslmode
    _default_db = {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": _pg_name,
        "USER": _pg_user,
        "PASSWORD": _pg_password,
        "HOST": _pg_host,
        "PORT": _pg_port,
        "CONN_MAX_AGE": 600,
        "CONN_HEALTH_CHECKS": True,
    }
    if _pg_opts:
        _default_db["OPTIONS"] = _pg_opts
    DATABASES = {"default": _default_db}
else:
    _diagnostics = []
    if "DATABASE_URL" in os.environ:
        if not _database_url:
            _diagnostics.append("DATABASE_URL is set but empty or whitespace-only")
    else:
        _diagnostics.append("DATABASE_URL is not set")
    if "PGHOST" in os.environ:
        if not _pg_host:
            _diagnostics.append("PGHOST is set but empty or whitespace-only")
    else:
        _diagnostics.append("PGHOST is not set")
    raise ImproperlyConfigured(
        "ekho_backend.settings_deployment: PostgreSQL is required (no SQLite). "
        + " ".join(_diagnostics)
        + ". Fix: set a non-empty DATABASE_URL (e.g. reference Railway Postgres), or set PGHOST "
        "with PGDATABASE or POSTGRES_DB and PGUSER or POSTGRES_USER."
    )

# Railway (and similar) terminate TLS at the edge; Django sees HTTP from the proxy.
# Without this, SECURE_SSL_REDIRECT makes SecurityMiddleware 301 to HTTPS forever
# (browser uses HTTPS → edge forwards as HTTP → Django redirects again).
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

DEBUG = os.getenv("DJANGO_DEBUG", "false").lower() in ("1", "true", "yes")

# In deployment we **require** a strong SECRET_KEY from the environment.
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ImproperlyConfigured("SECRET_KEY environment variable must be set for deployment.")

_hosts = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1")
ALLOWED_HOSTS = [h.strip() for h in _hosts.split(",") if h.strip()]

_extra_cors = os.getenv("CORS_ALLOWED_ORIGINS", "").strip()
if _extra_cors:
    CORS_ALLOWED_ORIGINS = [
        x.strip() for x in _extra_cors.split(",") if x.strip()
    ]

_extra_csrf = os.getenv("CSRF_TRUSTED_ORIGINS", "").strip()
if _extra_csrf:
    CSRF_TRUSTED_ORIGINS = [
        x.strip() for x in _extra_csrf.split(",") if x.strip()
    ]

# Only enable secure cookies / redirects when explicitly requested via env.
if os.getenv("CSRF_COOKIE_SECURE", "").lower() in ("1", "true", "yes"):
    CSRF_COOKIE_SECURE = True
if os.getenv("SESSION_COOKIE_SECURE", "").lower() in ("1", "true", "yes"):
    SESSION_COOKIE_SECURE = True

# Single-domain production (HTML + /api on the same host, e.g. one Railway service behind one URL):
#   Leave EKHO_CROSS_SITE_SESSION unset/false. Defaults from settings.py apply (SameSite=Lax).
#   Set SESSION_COOKIE_SECURE=1 and CSRF_COOKIE_SECURE=1 for HTTPS.
# Split-origin (separate frontend and API hostnames, e.g. two Railway services):
#   Set EKHO_CROSS_SITE_SESSION=1 plus CORS_ALLOWED_ORIGINS and CSRF_TRUSTED_ORIGINS to the
#   browser origin (https://frontend-host, no path). That forces SameSite=None + Secure cookies.
_cross_site = os.getenv("EKHO_CROSS_SITE_SESSION", "").lower() in ("1", "true", "yes")
if _cross_site:
    if not _extra_cors:
        raise ImproperlyConfigured(
            "EKHO_CROSS_SITE_SESSION is enabled but CORS_ALLOWED_ORIGINS is empty. "
            "Set it to your frontend origin(s), e.g. "
            "https://ekho-frontend-production.up.railway.app (comma-separated, no spaces)."
        )
    if not _extra_csrf:
        raise ImproperlyConfigured(
            "EKHO_CROSS_SITE_SESSION is enabled but CSRF_TRUSTED_ORIGINS is empty. "
            "Set it to the same frontend origin(s) as CORS_ALLOWED_ORIGINS."
        )
    CORS_ALLOW_CREDENTIALS = True
    SESSION_COOKIE_SAMESITE = "None"
    CSRF_COOKIE_SAMESITE = "None"
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
if os.getenv("SECURE_SSL_REDIRECT", "").lower() in ("1", "true", "yes"):
    SECURE_SSL_REDIRECT = True
# Optional: HSTS, only when DEBUG is false and explicitly enabled.
if not DEBUG and os.getenv("SECURE_HSTS", "").lower() in ("1", "true", "yes"):
    SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "31536000"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = os.getenv("SECURE_HSTS_PRELOAD", "false").lower() in ("1", "true", "yes")

_logger.warning(
    "Ekho: ekho_backend.settings_deployment is active; default DB from %s; ENGINE=%s.",
    "DATABASE_URL" if _database_url else "PGHOST",
    DATABASES["default"]["ENGINE"],
)
if _ekho_media_root:
    _logger.warning("Ekho: EKHO_MEDIA_ROOT set; MEDIA_ROOT=%s", MEDIA_ROOT)