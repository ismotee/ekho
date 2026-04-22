# Production image: nginx (edge port + /media + /static) + gunicorn (Django API).
# Intended for Railway with a persistent volume on EKHO_MEDIA_ROOT (default /data/media).
# Set Railway service root directory to `backend` so this Dockerfile is the build context.

FROM python:3.12-slim-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    gettext-base \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x /app/deploy/docker-entrypoint.sh \
    && mkdir -p /data/media /app/staticfiles \
    && rm -f /etc/nginx/sites-enabled/default /etc/nginx/conf.d/default.conf

ENV DJANGO_SETTINGS_MODULE=ekho_backend.settings_deployment

# collectstatic uses base settings (SQLite) so the image build does not require DATABASE_URL.
RUN DJANGO_SETTINGS_MODULE=ekho_backend.settings python manage.py collectstatic --noinput

EXPOSE 8000

ENTRYPOINT ["/app/deploy/docker-entrypoint.sh"]
