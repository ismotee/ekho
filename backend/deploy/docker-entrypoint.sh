#!/bin/sh
set -e

# User uploads: must match EKHO_MEDIA_ROOT in Django (settings_deployment) and Railway volume mount.
MEDIA_FS="${EKHO_MEDIA_ROOT:-/data/media}"
export MEDIA_FS
mkdir -p "$MEDIA_FS"

# Railway injects PORT; required for nginx to listen where the proxy forwards.
if [ -z "${PORT}" ]; then
  echo "docker-entrypoint: PORT is unset. For local testing use: docker run -e PORT=8000 ..." >&2
  exit 1
fi

# Only substitute PORT and MEDIA_FS; leave nginx $variables intact.
envsubst '$PORT $MEDIA_FS' < /app/deploy/nginx-railway.conf.template > /etc/nginx/conf.d/ekho.conf

rm -f /etc/nginx/sites-enabled/default /etc/nginx/conf.d/default.conf 2>/dev/null || true

if [ "${EKHO_RUN_MIGRATIONS:-1}" != "0" ]; then
  python manage.py migrate --noinput
fi

exec /usr/bin/supervisord -c /app/deploy/supervisord.conf
