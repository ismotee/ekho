"""
Compute byte size, checksum, dimensions, and format/MIME for record image uploads.

Used by RecordImage serializers and by data migrations. Validation matches
RecordSerializer.validate_representative_image (policy in
``record_image_format_map``, 25MB max).

Format tag: ImageMagick-style identifier (``magick_format`` on ``RecordImage``),
resolved from Pillow when possible, otherwise from filename extension via
``record_image_format_map.EXTENSION_TO_MAGICK_TAG`` (curated from IM Tags).
MIME is derived from the resolved tag when possible so decoded content wins over
a misleading ``Content-Type`` header.
"""

from __future__ import annotations

import hashlib
import io
import mimetypes
import os
from typing import Any

from PIL import Image

from .record_image_format_map import (
    ALLOWED_MIME_TYPES,
    EXTENSION_TO_MAGICK_TAG,
    IMAGE_UPLOAD_POLICY_SHORT_TEXT,
    MAGICK_TAG_TO_MIME,
    PILLOW_FORMAT_TO_MAGICK_TAG,
    normalized_image_mime,
)

MAX_IMAGE_BYTES = 25 * 1024 * 1024


def magick_tag_from_pillow(pil_format: str | None) -> str | None:
    """Map Pillow ``Image.format`` to an allowlisted ImageMagick tag, or None."""
    if not pil_format:
        return None
    u = pil_format.upper()
    tag = PILLOW_FORMAT_TO_MAGICK_TAG.get(u)
    if tag:
        return tag
    if u in MAGICK_TAG_TO_MIME:
        return u
    return None


def magick_tag_from_filename(original_name: str) -> str | None:
    """Map filename extension to an allowlisted ImageMagick tag, or None."""
    ext = os.path.splitext((original_name or "").lower())[1]
    return EXTENSION_TO_MAGICK_TAG.get(ext)


def resolve_magick_tag(pil_format: str | None, original_name: str) -> str | None:
    """
    Prefer decoded raster format (Pillow), then extension fallback (IM table).
    """
    from_pil = magick_tag_from_pillow(pil_format)
    if from_pil:
        return from_pil
    return magick_tag_from_filename(original_name)


def resolve_mime_type(
    tag: str | None,
    *,
    original_name: str,
    reported_content_type: str | None,
) -> str | None:
    """
    Choose MIME: tag-derived first (trust decoded image), then normalized
    reported type, then ``mimetypes`` guess from filename.
    """
    if tag and tag in MAGICK_TAG_TO_MIME:
        return MAGICK_TAG_TO_MIME[tag]
    reported = normalized_image_mime(reported_content_type)
    if reported in ALLOWED_MIME_TYPES:
        return reported
    guessed, _ = mimetypes.guess_type(original_name)
    if guessed:
        g = normalized_image_mime(guessed)
        if g in ALLOWED_MIME_TYPES:
            return g
    return None


def analyze_image_bytes(
    data: bytes,
    *,
    original_name: str,
    reported_content_type: str | None = None,
) -> dict[str, Any]:
    """
    Return keys: byte_size, width, height, magick_format, mime_type,
    checksum_sha256.

    ``magick_format`` is None only when the image decodes but no allowlisted
    tag could be resolved (upload path still rejects if MIME is not allowlisted).

    Raises ValueError on policy violations or unreadable image.
    """
    if len(data) > MAX_IMAGE_BYTES:
        raise ValueError(
            f"Image file size cannot exceed {MAX_IMAGE_BYTES // (1024 * 1024)}MB"
        )

    checksum_sha256 = hashlib.sha256(data).hexdigest()
    buf = io.BytesIO(data)
    try:
        with Image.open(buf) as im:
            im.verify()
    except Exception as exc:
        raise ValueError("Image file is corrupt or unreadable.") from exc
    buf.seek(0)
    try:
        with Image.open(buf) as im:
            width, height = im.size
            pil_format = im.format
    except Exception as exc:
        raise ValueError("Image file is corrupt or unreadable.") from exc

    tag = resolve_magick_tag(pil_format, original_name)
    mime_type = resolve_mime_type(
        tag, original_name=original_name, reported_content_type=reported_content_type
    )
    if mime_type is None or mime_type not in ALLOWED_MIME_TYPES:
        raise ValueError(f"Image must be {IMAGE_UPLOAD_POLICY_SHORT_TEXT}")

    return {
        "byte_size": len(data),
        "width": int(width),
        "height": int(height),
        "magick_format": tag,
        "mime_type": mime_type,
        "checksum_sha256": checksum_sha256,
    }


def analyze_uploaded_file(uploaded_file) -> dict[str, Any]:
    """Read an InMemoryUploadedFile / TemporaryUploadedFile and analyze bytes."""
    uploaded_file.seek(0)
    data = uploaded_file.read()
    uploaded_file.seek(0)
    name = getattr(uploaded_file, "name", None) or "upload"
    reported = getattr(uploaded_file, "content_type", None)
    return analyze_image_bytes(
        data, original_name=str(name), reported_content_type=reported
    )
