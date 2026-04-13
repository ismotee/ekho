"""
ImageMagick-style format tags, extension mapping, and upload MIME allowlist.

ImageMagick identifies raster formats by a short **Tag** in the Supported Image
Formats table (e.g. ``JPEG``, ``PNG``, ``GIF``, ``TIFF``, ``WEBP``). Official
reference: https://imagemagick.org/script/formats.php

Tag spellings used here match the ``Tag`` column in that table (checked
against a local capture of the page), e.g. ``GIF``, ``JPEG``, ``PNG``. Rows for
``TIFF``, ``WEBP``, ``HEIC``, ``JP2``, and other Tags are easy to add from the
same table when upload policy widens.

Only formats in ``ALLOWED_MIME_TYPES`` are accepted at upload time. Extension
fallback mapping exists **only** for those formats (plus the same tags in
``PILLOW_FORMAT_TO_MAGICK_TAG`` for decoded bytes). When the policy widens, add
a row to ``_CURATED_FORMAT_ROWS`` and extend serializers/views to match.
"""

from __future__ import annotations

# (extensions with leading dot, lowercased), ImageMagick Tag, canonical MIME
# Tags match ImageMagick’s Supported Image Formats table (not file suffixes).
_CURATED_FORMAT_ROWS: tuple[tuple[tuple[str, ...], str, str], ...] = (
    (
        (".jpg", ".jpeg", ".jpe", ".jfif", ".jif", ".jfi"),
        "JPEG",
        "image/jpeg",
    ),
    ((".png",), "PNG", "image/png"),
    ((".gif",), "GIF", "image/gif"),
)


def _build_maps() -> tuple[
    dict[str, str],
    dict[str, str],
    frozenset[str],
    frozenset[str],
]:
    ext_to_tag: dict[str, str] = {}
    tag_to_mime: dict[str, str] = {}
    mimes: set[str] = set()
    exts: set[str] = set()
    for extensions, tag, mime in _CURATED_FORMAT_ROWS:
        tag_to_mime[tag] = mime
        mimes.add(mime)
        for e in extensions:
            ext_to_tag[e] = tag
            exts.add(e)
    return ext_to_tag, tag_to_mime, frozenset(mimes), frozenset(exts)


EXTENSION_TO_MAGICK_TAG, MAGICK_TAG_TO_MIME, ALLOWED_MIME_TYPES, ALLOWED_UPLOAD_EXTENSIONS = (
    _build_maps()
)

ALLOWED_MAGICK_TAGS: frozenset[str] = frozenset(MAGICK_TAG_TO_MIME.keys())

# Pillow ``Image.format`` strings (uppercase keys) -> ImageMagick Tag.
PILLOW_FORMAT_TO_MAGICK_TAG: dict[str, str] = {
    "JPEG": "JPEG",
    "JPG": "JPEG",
    "PNG": "PNG",
    "GIF": "GIF",
}

# Non-canonical client / platform Content-Type values -> normalized MIME.
CONTENT_TYPE_ALIASES: dict[str, str] = {
    "image/jpg": "image/jpeg",
    "image/pjpeg": "image/jpeg",
    "image/x-png": "image/png",
    "image/x-citrix-pjpeg": "image/jpeg",
}

# Short phrase for validation errors (keep in sync with ``ALLOWED_MIME_TYPES``).
IMAGE_UPLOAD_POLICY_SHORT_TEXT = "JPEG, PNG, or GIF"


def normalized_image_mime(reported: str | None) -> str | None:
    """Strip parameters, lowercase, and apply ``CONTENT_TYPE_ALIASES``."""
    if not reported:
        return None
    key = reported.split(";", 1)[0].strip().lower()
    return CONTENT_TYPE_ALIASES.get(key, key)
