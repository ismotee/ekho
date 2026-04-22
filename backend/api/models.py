"""
Django models for Ekho Art Collection Management Application

Record payload: docs/data/record-models.md (stored in `data` JSONField).
"""

import uuid

from django.db import models
from django.contrib.auth.models import User

from .record_image_vocab import (
    RECORD_IMAGE_CONTEXTS,
    RECORD_IMAGE_ROLES,
    RECORD_IMAGE_STATUSES,
)


class SystemIdentity(models.Model):
    """
    Single row: unique id for this Ekho instance (cross-deployment provenance).
    """

    instance_id = models.UUIDField(unique=True, default=uuid.uuid4)

    class Meta:
        verbose_name_plural = "System identity"

    def __str__(self):
        return str(self.instance_id)


class Collection(models.Model):
    """
    Represents an art collection owned by a user.
    Collections can be open (editable) or closed (read-only).
    """
    name = models.CharField(max_length=200)
    description = models.TextField(max_length=1000, blank=True)
    responsible_department = models.CharField(max_length=500, blank=True)
    owning_organization = models.ForeignKey(
        "Actor",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="owned_collections",
    )
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    is_closed = models.BooleanField(default=False)
    stable_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    origin_ekho_instance_id = models.UUIDField(null=True, blank=True)
    is_listed = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner']),
            models.Index(fields=['is_closed']),
            models.Index(fields=['is_listed']),
        ]
    
    def __str__(self):
        return self.name


class Record(models.Model):
    """
    Art record within a collection. Domain fields live in `data` (see record-models.md).
    `representative_image` is optional presentation metadata for list/detail thumbnails.
    """
    data = models.JSONField(default=dict, blank=True)
    representative_image = models.ImageField(
        upload_to="records/",
        blank=True,
        null=True,
        max_length=255,
    )
    collection = models.ForeignKey(
        Collection, on_delete=models.CASCADE, related_name="records"
    )
    is_listed = models.BooleanField(default=True)
    imported_first = models.DateTimeField(null=True, blank=True)
    imported_last = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["collection"]),
            models.Index(fields=["is_listed"]),
        ]

    def __str__(self):
        payload = self.data if isinstance(self.data, dict) else {}
        id_details = payload.get("identification_details")
        if isinstance(id_details, dict):
            title = id_details.get("title")
            if isinstance(title, list):
                for item in title:
                    if isinstance(item, dict) and item.get("value"):
                        return str(item["value"])
            elif isinstance(title, dict) and title.get("value"):
                return str(title["value"])
            num = id_details.get("object_number")
            if num:
                return str(num)
        return f"Record {self.pk}"

    def get_representative_image_file(self):
        """
        FieldFile for list/detail thumbnail: legacy `representative_image`, else the first
        RecordImage with role/context thumbnail+portfolio, else first thumbnail.
        """
        if self.representative_image:
            return self.representative_image
        qs = self.images.order_by("sort_order", "id")
        for im in qs:
            if im.role == "thumbnail" and im.context == "portfolio":
                return im.image
        for im in qs:
            if im.role == "thumbnail":
                return im.image
        return None


class RecordImage(models.Model):
    """
    Multi-image attachment for a record (role/context vocab in record_image_vocab).
    Binary file and indexed autofill columns live here, not in Record.data JSON.
    """

    record = models.ForeignKey(
        Record,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.ImageField(upload_to="records/", max_length=255)
    role = models.CharField(max_length=32, choices=[(r, r) for r in RECORD_IMAGE_ROLES])
    context = models.CharField(
        max_length=32, choices=[(c, c) for c in RECORD_IMAGE_CONTEXTS]
    )
    byte_size = models.PositiveIntegerField()
    width = models.PositiveIntegerField()
    height = models.PositiveIntegerField()
    magick_format = models.CharField(max_length=32, blank=True, null=True)
    mime_type = models.CharField(max_length=128)
    checksum_sha256 = models.CharField(max_length=64)
    sort_order = models.IntegerField(default=0)
    is_primary = models.BooleanField(default=False)
    status = models.CharField(
        max_length=16,
        choices=[(s, s) for s in RECORD_IMAGE_STATUSES],
        default=RECORD_IMAGE_STATUSES[0],
    )
    derived_from = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="derivatives",
    )
    labels = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "id"]
        indexes = [
            models.Index(fields=["record", "sort_order"]),
            models.Index(fields=["record", "role", "context"]),
        ]

    def __str__(self):
        return f"RecordImage {self.pk} ({self.role}/{self.context})"


class Actor(models.Model):
    """
    Catalog entry: person or organization JSON (docs/data/actor-models.md).
    owner=null: global actor visible to everyone; else user-owned.
    """

    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="actors",
    )
    import_id = models.UUIDField(null=True, blank=True, unique=True, db_index=True)
    data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["owner"]),
        ]

    def __str__(self):
        return f"Actor {self.pk}"
