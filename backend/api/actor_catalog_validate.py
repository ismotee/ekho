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
    if _ref_nonempty(s.get("name_type")) or _ref_nonempty(s.get("status")):
        return True
    coords = s.get("coordinates")
    if isinstance(coords, dict):
        t = coords.get("text")
        if isinstance(t, str) and t.strip():
            return True
        cq = coords.get("coordinates_qualifier")
        if cq is not None and str(cq).strip():
            return True
        if _ref_nonempty(coords.get("coordinates_type")):
            return True
    rn = s.get("reference_number")
    if isinstance(rn, dict):
        rt = rn.get("text")
        if isinstance(rt, str) and rt.strip():
            return True
        if _ref_nonempty(rn.get("type")):
            return True
    owner = s.get("owner")
    if isinstance(owner, dict) and isinstance(owner.get("id"), int) and owner["id"] > 0:
        return True
    return False


def _bio_nonempty(b: Any) -> bool:
    if not isinstance(b, dict):
        return False
    n = b.get("note")
    if isinstance(n, str) and n.strip():
        return True
    src = b.get("source")
    if not isinstance(src, dict):
        return False
    if isinstance(src.get("citation"), str) and src["citation"].strip():
        return True
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
    if _date_detail_nonempty(h.get("foundation_date")):
        return True
    if _date_detail_nonempty(h.get("dissolution_date")):
        return True
    if _spatial_nonempty(h.get("foundation_place")):
        return True
    if _bio_nonempty(h.get("biographical_note")):
        return True
    return False


def _person_name_date_nonempty(d: Any) -> bool:
    """PersonName.date is DateDetail (optionally merged with note/association/period); legacy Temporal allowed."""
    if not isinstance(d, dict):
        return False
    if _date_detail_nonempty(d):
        return True
    for k in ("note", "text"):
        v = d.get(k)
        if isinstance(v, str) and v.strip():
            return True
    if _ref_like_nonempty(d.get("association")) or _ref_like_nonempty(d.get("period")):
        return True
    return _temporal_nonempty(d)


def _person_name_row_nonempty(row: Any) -> bool:
    if not isinstance(row, dict):
        return False
    n = row.get("name")
    if isinstance(n, str) and n.strip():
        return True
    if _ref_nonempty(row.get("name_type")):
        return True
    return _person_name_date_nonempty(row.get("date"))


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
    if _person_name_date_nonempty(p.get("birth_date")):
        return True
    if _person_name_date_nonempty(p.get("death_date")):
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


def _name_detail_nonempty(row: Any) -> bool:
    if not isinstance(row, dict):
        return False
    if _label_nonempty(row.get("name")):
        return True
    if _ref_nonempty(row.get("name_type")):
        return True
    addn = row.get("addition_to_name")
    if isinstance(addn, str) and addn.strip():
        return True
    if _date_detail_nonempty(row.get("earliest")) or _date_detail_nonempty(row.get("latest")):
        return True
    return False


def _org_has_identity(o: Any) -> bool:
    """True if organization core fields identify the actor (ignores nested contact_person)."""
    if not isinstance(o, dict):
        return False
    names = o.get("name")
    if isinstance(names, list) and any(_name_detail_nonempty(x) for x in names):
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


def actor_catalog_kind(data: Any) -> str | None:
    """Return 'person', 'organization', or None if data does not identify exactly one kind."""
    if not isinstance(data, dict):
        return None
    pi = _person_has_identity(data.get("person"))
    oi = _org_has_identity(data.get("organization"))
    if pi and not oi:
        return "person"
    if oi and not pi:
        return "organization"
    return None


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
