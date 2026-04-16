"""
Deployment-oriented defaults: turn off DEBUG, read hosts and CORS from the environment,
and enable stricter security settings suitable for HTTPS deployments (e.g. Railway).

Use when distributing pre-exhibition or exhibit builds (still SQLite by default).

    set DJANGO_SETTINGS_MODULE=ekho_backend.settings_deployment

See backend/DEPLOY.md and backend/.env.example.
"""

from django.core.exceptions import ImproperlyConfigured

from .settings import *  # noqa: F403, F405

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