"""
Deployment-oriented defaults: turn off DEBUG, read hosts and CORS from the environment.

Use when distributing pre-exhibition or exhibit builds (still SQLite by default).

    set DJANGO_SETTINGS_MODULE=ekho_backend.settings_deployment

See backend/DEPLOY.md and backend/.env.example.
"""

from .settings import *  # noqa: F403, F405

DEBUG = os.getenv("DJANGO_DEBUG", "false").lower() in ("1", "true", "yes")

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

if os.getenv("CSRF_COOKIE_SECURE", "").lower() in ("1", "true", "yes"):
    CSRF_COOKIE_SECURE = True

if os.getenv("SECURE_SSL_REDIRECT", "").lower() in ("1", "true", "yes"):
    SECURE_SSL_REDIRECT = True
