"""Unit tests for ``record_image_ingest`` autofill (checksum, dimensions, format/MIME)."""

import io

import pytest
from PIL import Image

from api.record_image_format_map import (
    EXTENSION_TO_MAGICK_TAG,
    MAGICK_TAG_TO_MIME,
    normalized_image_mime,
)
from api.record_image_ingest import (
    analyze_image_bytes,
    magick_tag_from_filename,
    magick_tag_from_pillow,
    resolve_magick_tag,
    resolve_mime_type,
)


def _jpeg_bytes(size=(7, 11), color="blue"):
    im = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    im.save(buf, format="JPEG")
    return buf.getvalue()


def _png_bytes(size=(13, 5)):
    im = Image.new("RGBA", size, color=(200, 100, 50, 255))
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return buf.getvalue()


def test_analyze_image_bytes_checksum_stable():
    data = _jpeg_bytes()
    a = analyze_image_bytes(data, original_name="a.jpg")
    b = analyze_image_bytes(data, original_name="b.jpg")
    assert a["checksum_sha256"] == b["checksum_sha256"]
    assert len(a["checksum_sha256"]) == 64


def test_analyze_image_bytes_dimensions():
    data = _jpeg_bytes(size=(40, 22))
    info = analyze_image_bytes(data, original_name="x.jpeg")
    assert info["width"] == 40
    assert info["height"] == 22
    assert info["byte_size"] == len(data)


def test_analyze_image_bytes_format_from_pillow():
    data = _png_bytes()
    info = analyze_image_bytes(data, original_name="ignored.tmp", reported_content_type="image/jpeg")
    assert info["magick_format"] == "PNG"
    assert info["mime_type"] == "image/png"


def test_analyze_image_bytes_extension_fallback():
    """JFIF extension maps to JPEG per ImageMagick-style tag table."""
    data = _jpeg_bytes()
    info = analyze_image_bytes(
        data,
        original_name="legacy.jfif",
        reported_content_type="image/pjpeg",
    )
    assert info["magick_format"] == "JPEG"
    assert info["mime_type"] == "image/jpeg"


def test_resolve_mime_type_normalizes_image_jpg():
    assert resolve_mime_type(None, original_name="x.bin", reported_content_type="image/jpg") == (
        "image/jpeg"
    )


def test_magick_tag_from_filename():
    assert magick_tag_from_filename("x.JPEG") == "JPEG"
    assert magick_tag_from_filename("a.png") == "PNG"
    assert magick_tag_from_filename("noext") is None


def test_magick_tag_from_pillow_aliases():
    assert magick_tag_from_pillow("JPEG") == "JPEG"
    assert magick_tag_from_pillow("JPG") == "JPEG"


def test_curated_extension_map_matches_mime_tags():
    for ext, tag in EXTENSION_TO_MAGICK_TAG.items():
        assert ext.startswith(".") and ext == ext.lower()
        assert tag in MAGICK_TAG_TO_MIME


def test_normalized_image_mime_aliases():
    assert normalized_image_mime("image/jpg") == "image/jpeg"
    assert normalized_image_mime("Image/JPEG") == "image/jpeg"


def test_resolve_magick_tag_prefers_pillow_over_wrong_extension():
    png_data = _png_bytes()
    buf = io.BytesIO(png_data)
    with Image.open(buf) as im:
        pil_fmt = im.format
    assert pil_fmt == "PNG"
    assert resolve_magick_tag(pil_fmt, "disguised.jpg") == "PNG"


def test_analyze_rejects_oversize():
    with pytest.raises(ValueError, match="25MB"):
        analyze_image_bytes(b"x" * (25 * 1024 * 1024 + 1), original_name="huge.jpg")
