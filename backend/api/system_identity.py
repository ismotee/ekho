"""Singleton Ekho instance id for cross-system provenance (see docs)."""

from __future__ import annotations

import uuid

from django.db import transaction

from .models import SystemIdentity


def get_or_create_system_instance_id() -> uuid.UUID:
    """Return the stable UUID for this Ekho deployment; create row on first call."""
    with transaction.atomic():
        row = SystemIdentity.objects.select_for_update().first()
        if row:
            return row.instance_id
        return SystemIdentity.objects.create(instance_id=uuid.uuid4()).instance_id
