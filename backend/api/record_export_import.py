"""
Record JSON export/import helpers (versioned payloads).

See docs/api-specification.md — Export record / Import record.
"""

from __future__ import annotations

import base64
import mimetypes
import os
import uuid
from typing import Any

from django.core.files.base import ContentFile

from .models import Actor, Record, RecordImage
from .record_actor_refs import collect_actor_ids
from .record_image_format_map import (
    ALLOWED_MIME_TYPES,
    IMAGE_UPLOAD_POLICY_SHORT_TEXT,
    normalized_image_mime,
)
from .record_image_ingest import MAX_IMAGE_BYTES, analyze_image_bytes
from .record_image_vocab import (
    RECORD_IMAGE_CONTEXT_SET,
    RECORD_IMAGE_ROLE_SET,
    RECORD_IMAGE_STATUSES,
    RECORD_IMAGE_STATUS_SET,
)

EKHO_EXPORT_VERSION_CURRENT = 2
EKHO_EXPORT_VERSIONS_IMPORT = frozenset({1, 2})


def _ensure_actor_import_id(actor: Actor) -> uuid.UUID:
    """Guarantee stable actor import id for export payloads."""
    if actor.import_id is None:
        actor.import_id = uuid.uuid4()
        actor.save(update_fields=["import_id", "updated_at"])
    return actor.import_id


def _embed_file_as_b64(file_field) -> dict[str, str]:
    file_field.open("rb")
    try:
        blob = file_field.read()
    finally:
        file_field.close()
    name = file_field.name or ""
    filename = os.path.basename(name) if name else ""
    content_type = (
        mimetypes.guess_type(filename)[0] or "application/octet-stream"
    )
    return {
        "filename": filename,
        "content_type": content_type,
        "base64": base64.b64encode(blob).decode("ascii"),
    }


def build_record_export_payload(
    record: Record,
    *,
    system_instance_id: uuid.UUID,
    validated_data: dict | None = None,
) -> dict:
    """
    Build export JSON for a record (version EKHO_EXPORT_VERSION_CURRENT).
    If ``validated_data`` is set, it is used as ``record.data`` in the payload
    (caller-validated domain object); otherwise the stored JSON is copied.
    """
    collection = record.collection
    origin = collection.origin_ekho_instance_id
    owner = collection.owner

    payload: dict[str, Any] = {
        "ekho_export_version": EKHO_EXPORT_VERSION_CURRENT,
        "source_ekho_instance_id": str(system_instance_id),
        "collection": {
            "stable_id": str(collection.stable_id),
            "name": collection.name,
            "description": collection.description,
            "responsible_department": collection.responsible_department or "",
            "owning_organization": (
                {
                    "id": collection.owning_organization_id,
                    "import_id": (
                        str(_ensure_actor_import_id(collection.owning_organization))
                        if collection.owning_organization
                        else None
                    ),
                }
                if collection.owning_organization_id
                else None
            ),
            "origin_ekho_instance_id": str(origin) if origin is not None else None,
            "is_closed": collection.is_closed,
            "is_listed": collection.is_listed,
            "original_creator": {
                "username": owner.username,
            },
        },
        "record": {
            "data": validated_data
            if validated_data is not None
            else (record.data if isinstance(record.data, dict) else {}),
        },
    }

    rep_file = record.get_representative_image_file()
    if rep_file:
        payload["record"]["representative_image"] = _embed_file_as_b64(rep_file)

    ordered = list(record.images.order_by("sort_order", "id"))
    idx_by_pk = {img.pk: i for i, img in enumerate(ordered)}
    images_out: list[dict[str, Any]] = []
    for img in ordered:
        if not img.image:
            continue
        block: dict[str, Any] = {
            "role": img.role,
            "context": img.context,
            "sort_order": img.sort_order,
            "is_primary": img.is_primary,
            "status": img.status,
            "labels": img.labels if isinstance(img.labels, dict) else {},
            "image": _embed_file_as_b64(img.image),
        }
        if img.derived_from_id and img.derived_from_id in idx_by_pk:
            block["derived_from_index"] = idx_by_pk[img.derived_from_id]
        else:
            block["derived_from_index"] = None
        images_out.append(block)
    payload["record"]["images"] = images_out

    actor_ids = collect_actor_ids(payload["record"]["data"])
    owning_id = collection.owning_organization_id
    if owning_id:
        actor_ids.add(owning_id)
    actors = Actor.objects.filter(pk__in=actor_ids).order_by("id")
    payload["actors"] = [
        {
            "source_id": actor.pk,
            "import_id": str(_ensure_actor_import_id(actor)),
            "data": actor.data if isinstance(actor.data, dict) else {},
        }
        for actor in actors
    ]

    return payload


def decode_import_representative_image(rec_block: dict) -> tuple[bytes, str] | None:
    """Decode optional record.representative_image block; same rules as legacy import."""
    p = rec_block.get("representative_image")
    if not p:
        return None
    if not isinstance(p, dict):
        raise ValueError("record.representative_image must be an object.")
    b64 = p.get("base64")
    if not isinstance(b64, str) or not b64.strip():
        raise ValueError(
            "record.representative_image.base64 is required when an image is present."
        )
    try:
        raw = base64.b64decode(b64)
    except Exception:
        raise ValueError("record.representative_image.base64 is not valid base64.") from None
    if len(raw) > MAX_IMAGE_BYTES:
        raise ValueError("Image file size cannot exceed 10MB")
    filename = p.get("filename") or "import.jpg"
    if not isinstance(filename, str):
        filename = "import.jpg"
    filename = os.path.basename(filename.strip()) or "import.jpg"
    content_type = p.get("content_type")
    if content_type is None:
        content_type = mimetypes.guess_type(filename)[0]
    ct = normalized_image_mime(content_type)
    if ct not in ALLOWED_MIME_TYPES:
        raise ValueError(f"Image must be {IMAGE_UPLOAD_POLICY_SHORT_TEXT}")
    return raw, filename


def decode_import_nested_images(
    rec_block: dict, export_version: int
) -> list[dict[str, Any]]:
    """
    Parse record.images for v2+ exports. v1 returns [].
    Each item: role, context, sort_order, is_primary, status, labels,
    derived_from_index, _raw, _filename (internal).
    """
    if export_version < 2:
        return []
    images = rec_block.get("images")
    if images is None:
        return []
    if not isinstance(images, list):
        raise ValueError("record.images must be an array.")

    parsed: list[dict[str, Any]] = []
    for i, item in enumerate(images):
        if not isinstance(item, dict):
            raise ValueError(f"record.images[{i}] must be an object.")
        role = item.get("role")
        if role not in RECORD_IMAGE_ROLE_SET:
            raise ValueError(f"record.images[{i}].role is invalid.")
        context = item.get("context")
        if context not in RECORD_IMAGE_CONTEXT_SET:
            raise ValueError(f"record.images[{i}].context is invalid.")

        so = item.get("sort_order", 0)
        try:
            sort_order = int(so)
        except (TypeError, ValueError):
            raise ValueError(f"record.images[{i}].sort_order must be an integer.") from None

        is_primary = bool(item.get("is_primary", False))

        st = item.get("status", RECORD_IMAGE_STATUSES[0])
        if st not in RECORD_IMAGE_STATUS_SET:
            raise ValueError(f"record.images[{i}].status is invalid.")

        labels = item.get("labels", {})
        if labels in (None, ""):
            labels = {}
        if not isinstance(labels, dict):
            raise ValueError(f"record.images[{i}].labels must be a JSON object.")

        dfi = item.get("derived_from_index")
        if dfi in (None, ""):
            derived_from_index = None
        else:
            try:
                derived_from_index = int(dfi)
            except (TypeError, ValueError):
                raise ValueError(
                    f"record.images[{i}].derived_from_index must be an integer or null."
                ) from None
            if derived_from_index < 0:
                raise ValueError("derived_from_index must be non-negative.")

        img_block = item.get("image")
        if not isinstance(img_block, dict):
            raise ValueError(f"record.images[{i}].image must be an object.")
        b64 = img_block.get("base64")
        if not isinstance(b64, str) or not b64.strip():
            raise ValueError(f"record.images[{i}].image.base64 is required.")
        try:
            raw = base64.b64decode(b64)
        except Exception:
            raise ValueError(
                f"record.images[{i}].image.base64 is not valid base64."
            ) from None
        if len(raw) > MAX_IMAGE_BYTES:
            raise ValueError("Image file size cannot exceed 10MB")
        filename = img_block.get("filename") or "import.jpg"
        if not isinstance(filename, str):
            filename = "import.jpg"
        filename = os.path.basename(filename.strip()) or "import.jpg"
        content_type = img_block.get("content_type")
        if content_type is None:
            content_type = mimetypes.guess_type(filename)[0]
        ct = normalized_image_mime(content_type)
        if ct not in ALLOWED_MIME_TYPES:
            raise ValueError(f"Image must be {IMAGE_UPLOAD_POLICY_SHORT_TEXT}")

        parsed.append(
            {
                "role": role,
                "context": context,
                "sort_order": sort_order,
                "is_primary": is_primary,
                "status": st,
                "labels": labels,
                "derived_from_index": derived_from_index,
                "_raw": raw,
                "_filename": filename,
                "_content_type": ct,
            }
        )

    return parsed


def apply_import_nested_images(record: Record, specs: list[dict[str, Any]]) -> None:
    """Create RecordImage rows for an imported record. Idempotent per call (new record)."""
    if not specs:
        return

    created: list[RecordImage] = []
    for spec in specs:
        raw = spec["_raw"]
        fname = spec["_filename"]
        ct = spec["_content_type"]
        analysis = analyze_image_bytes(
            raw, original_name=fname, reported_content_type=ct
        )
        if spec["is_primary"]:
            RecordImage.objects.filter(record=record).update(is_primary=False)
        cf = ContentFile(bytes(raw), name=fname)
        unique = f"{uuid.uuid4().hex}_{os.path.basename(fname)}"
        ri = RecordImage(
            record=record,
            role=spec["role"],
            context=spec["context"],
            sort_order=spec["sort_order"],
            is_primary=spec["is_primary"],
            status=spec["status"],
            labels=spec["labels"],
            derived_from=None,
            **analysis,
        )
        ri.image.save(unique, cf, save=False)
        ri.save()
        created.append(ri)

    for i, spec in enumerate(specs):
        dfi = spec["derived_from_index"]
        if dfi is None:
            continue
        if dfi >= len(created):
            raise ValueError("derived_from_index out of range for imported images.")
        target = created[i]
        target.derived_from = created[dfi]
        target.save(update_fields=["derived_from"])
