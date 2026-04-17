"""
Deployment-oriented defaults: turn off DEBUG, read hosts and CORS from the environment,
and enable stricter security settings suitable for HTTPS deployments (e.g. Railway).

Use when distributing pre-exhibition or exhibit builds (still SQLite by default).

    set DJANGO_SETTINGS_MODULE=ekho_backend.settings_deployment

See backend/DEPLOY.md and backend/.env.example.
"""

from django.core.exceptions import ImproperlyConfigured

from .settings import *  # noqa: F403, F405

# PostgreSQL: prefer DATABASE_URL (Railway / Heroku). Else libpq-style PG* / POSTGRES_* when
# PGHOST is set (e.g. referenced vars from the Postgres plugin). Otherwise SQLite from settings.py.
_database_url = os.getenv("DATABASE_URL", "").strip()
if _database_url:
    import dj_database_url

    DATABASES = {
        "default": dj_database_url.config(
            default=_database_url,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    _pg_host = os.getenv("PGHOST", "").strip()
    if _pg_host:
        _pg_user = (os.getenv("PGUSER") or os.getenv("POSTGRES_USER") or "").strip()
        _pg_password = os.getenv("PGPASSWORD") or os.getenv("POSTGRES_PASSWORD") or ""
        _pg_name = (os.getenv("PGDATABASE") or os.getenv("POSTGRES_DB") or "").strip()
        if not _pg_name:
            raise ImproperlyConfigured(
                "PGDATABASE or POSTGRES_DB must be set when PGHOST is set without DATABASE_URL."
            )
        if not _pg_user:
            raise ImproperlyConfigured(
                "PGUSER or POSTGRES_USER must be set when PGHOST is set without DATABASE_URL."
            )
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
if os.getenv("SECURE_SSL_REDIRECT", "").lower() in ("1", "true", "yes"):
    SECURE_SSL_REDIRECT = True
# Optional: HSTS, only when DEBUG is false and explicitly enabled.
if not DEBUG and os.getenv("SECURE_HSTS", "").lower() in ("1", "true", "yes"):
    SECURE_HSTS_SECONDS = int(os.getenv("SECURE_HSTS_SECONDS", "31536000"))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = os.getenv("SECURE_HSTS_PRELOAD", "false").lower() in ("1", "true", "yes")