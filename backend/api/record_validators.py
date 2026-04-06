"""Light validation for Record.data JSON (domain keys per docs/data/record-models.md)."""

RECORD_DATA_DOMAIN_KEYS = frozenset(
    (
        "identification_details",
        "aquisition_details",
        "rights",
        "history",
        "description",
        "access",
        "object_location",
        "confidentiality",
    )
)


def validate_record_data_payload(value):
    """
    Ensure `data` is a dict and only uses allowed top-level domain keys.
    Values may be any JSON-serializable structure; deeper validation can be added later.
    """
    if value is None:
        return None
    if not isinstance(value, dict):
        raise ValueError("Must be a JSON object.")
    unknown = set(value.keys()) - RECORD_DATA_DOMAIN_KEYS
    if unknown:
        raise ValueError(f"Unknown keys in data: {', '.join(sorted(unknown))}")
    return value
