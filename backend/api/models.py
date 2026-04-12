"""
Django models for Ekho Art Collection Management Application

Record payload: docs/data/record-models.md (stored in `data` JSONField).
"""

import uuid

from django.db import models
from django.contrib.auth.models import User


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
    imported_first = models.DateTimeField(null=True, blank=True)
    imported_last = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["collection"]),
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
