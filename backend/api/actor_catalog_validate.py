"""Validate Actor.data JSON: exactly one of person or organization must identify the actor (not both)."""

from __future__ import annotations

from typing import Any


def _label_nonempty(l: Any) -> bool:
    if not isinstance(l, dict):
        return False
    for k in ("fi", "en", "und"):
        v = l.get(k)
        if isinstance(v, str) and v.strip():
            return True
    return False


def _ref_like_nonempty(v: Any) -> bool:
    if v is None:
        return False
    if isinstance(v, str):
        return bool(v.strip())
    if isinstance(v, dict):
        pl = v.get("pref_label")
        if isinstance(pl, dict):
            for lang in ("fi", "en", "und"):
                x = pl.get(lang)
                if isinstance(x, str) and x.strip():
                    return True
    return False


def _date_detail_nonempty(d: Any) -> bool:
    if not isinstance(d, dict):
        return False
    s = d.get("single")
    if isinstance(s, str) and s.strip():
        return True
    return _ref_like_nonempty(d.get("certanity")) or _ref_like_nonempty(d.get("qualifier"))


def _temporal_nonempty(t: Any) -> bool:
    if not isinstance(t, dict):
        return False
    for k in ("text", "note", "association", "period"):
        v = t.get(k)
        if isinstance(v, str) and v.strip():
            return True
        if k in ("association", "period") and _ref_like_nonempty(v):
            return True
    for dk in ("earliest", "latest"):
        if _date_detail_nonempty(t.get(dk)):
            return True
    return False


def _ref_nonempty(v: Any) -> bool:
    if v is None:
        return False
    if isinstance(v, str):
        return bool(v.strip())
    if isinstance(v, dict):
        pl = v.get("pref_label")
        if isinstance(pl, dict):
            return _label_nonempty(pl)
    return False


def _address_nonempty(a: Any) -> bool:
    if not isinstance(a, dict):
        return False
    for k in ("text", "email", "phone_number"):
        v = a.get(k)
        if isinstance(v, str) and v.strip():
            return True
    return _ref_nonempty(a.get("type"))


def _spatial_nonempty(s: Any) -> bool:
    if not isinstance(s, dict):
        return False
    if _label_nonempty(s.get("name")):
        return True
    for k in ("note", "environmental_details", "position"):
        v = s.get(k)
        if isinstance(v, str) and v.strip():
            return True
    return _ref_nonempty(s.get("association")) or _ref_nonempty(s.get("status"))


def _bio_nonempty(b: Any) -> bool:
    if not isinstance(b, dict):
        return False
    n = b.get("note")
    if isinstance(n, str) and n.strip():
        return True
    src = b.get("source")
    if not isinstance(src, dict):
        return False
    if isinstance(src.get("note"), str) and src["note"].strip():
        return True
    if _ref_nonempty(src.get("source_type")):
        return True
    sd = src.get("source_date")
    if isinstance(sd, dict) and isinstance(sd.get("single"), str) and sd["single"].strip():
        return True
    return False


def _org_history_nonempty(h: Any) -> bool:
    if not isinstance(h, dict):
        return False
    if _temporal_nonempty(h.get("foundation_date")):
        return True
    if _temporal_nonempty(h.get("dissolution_date")):
        return True
    if _spatial_nonempty(h.get("foundation_place")):
        return True
    if _bio_nonempty(h.get("biographical_note")):
        return True
    return False


def _person_name_row_nonempty(row: Any) -> bool:
    if not isinstance(row, dict):
        return False
    n = row.get("name")
    if isinstance(n, str) and n.strip():
        return True
    if _ref_nonempty(row.get("name_type")):
        return True
    return _temporal_nonempty(row.get("date"))


def _person_has_identity(p: Any) -> bool:
    if not isinstance(p, dict):
        return False
    fn = p.get("first_name")
    if isinstance(fn, list) and any(_person_name_row_nonempty(x) for x in fn):
        return True
    ln = p.get("last_name")
    if isinstance(ln, list):
        if any(_person_name_row_nonempty(x) for x in ln):
            return True
    elif _person_name_row_nonempty(ln):
        return True
    on = p.get("other_name")
    if isinstance(on, list) and any(_person_name_row_nonempty(x) for x in on):
        return True
    an = p.get("additions_to_name")
    if isinstance(an, str) and an.strip():
        return True
    if _temporal_nonempty(p.get("birth_date")):
        return True
    if _temporal_nonempty(p.get("death_date")):
        return True
    if _spatial_nonempty(p.get("place_of_birth")):
        return True
    if _ref_nonempty(p.get("gender")):
        return True
    if _ref_nonempty(p.get("nationality")):
        return True
    if _address_nonempty(p.get("address")):
        return True
    w = p.get("website")
    if isinstance(w, str) and w.strip():
        return True
    if _ref_nonempty(p.get("school_or_style")):
        return True
    if _ref_nonempty(p.get("occupation")):
        return True
    rn = p.get("reference_number")
    if isinstance(rn, dict) and isinstance(rn.get("text"), str) and rn["text"].strip():
        return True
    if _bio_nonempty(p.get("biographical_note")):
        return True
    return False


def _other_name_nonempty(o: Any) -> bool:
    if not isinstance(o, dict):
        return False
    if _label_nonempty(o.get("name")):
        return True
    return _ref_nonempty(o.get("type"))


def _org_has_identity(o: Any) -> bool:
    """True if organization core fields identify the actor (ignores nested contact_person)."""
    if not isinstance(o, dict):
        return False
    if _label_nonempty(o.get("main_body")) or _label_nonempty(o.get("sub_body")):
        return True
    on = o.get("other_name")
    if isinstance(on, list) and any(_other_name_nonempty(x) for x in on):
        return True
    an = o.get("addition_to_name")
    if isinstance(an, str) and an.strip():
        return True
    if _temporal_nonempty(o.get("name_date")):
        return True
    if _ref_nonempty(o.get("function")):
        return True
    if _address_nonempty(o.get("address")):
        return True
    w = o.get("website")
    if isinstance(w, str) and w.strip():
        return True
    rn = o.get("reference_number")
    if isinstance(rn, dict) and isinstance(rn.get("text"), str) and rn["text"].strip():
        return True
    if _org_history_nonempty(o.get("history")):
        return True
    return False


def actor_catalog_data_has_identity(data: Any) -> bool:
    """True if exactly one of person or organization carries identifying information."""
    if not isinstance(data, dict):
        return False
    pi = _person_has_identity(data.get("person"))
    oi = _org_has_identity(data.get("organization"))
    return (pi and not oi) or (oi and not pi)


def validate_actor_catalog_data(value: Any) -> Any:
    """Raise ValidationError if payload is not a dict or has no identifiable person/org."""
    from rest_framework.exceptions import ValidationError

    if value is None:
        value = {}
    if not isinstance(value, dict):
        raise ValidationError("Actor data must be a JSON object.")
    if not actor_catalog_data_has_identity(value):
        raise ValidationError(
            "Actor data must identify either a person or an organization, not both and not neither "
            "(see docs/data/actor-models.md). Organizations may include an optional contact_person object."
        )
    return value
