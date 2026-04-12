from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        # Ensure Ekho instance id exists once DB is migrated (no-op if tables missing).
        try:
            from .system_identity import get_or_create_system_instance_id

            get_or_create_system_instance_id()
        except Exception:
            pass
