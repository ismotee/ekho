"""
Walk Record.data JSON for actor reference ids ({ "id": <int> } only) and strip them.

Must match actor-shaped slots in the record domain (see docs/data/record-models.md).
Legacy inline actors carry "person" or "organization" keys and are ignored here.
"""

from __future__ import annotations

import copy
from typing import Any, Callable, List, Set, Tuple

from django.contrib.auth.models import AnonymousUser
from rest_framework.exceptions import ValidationError as DRFValidationError


def _actor_ref_id(value: Any) -> int | None:
    if not isinstance(value, dict):
        return None
    if "person" in value or "organization" in value:
        return None
    if set(value.keys()) != {"id"}:
        return None
    v = value.get("id")
    if isinstance(v, int) and v > 0:
        return v
    return None


def _add_id(ids: Set[int], value: Any) -> None:
    rid = _actor_ref_id(value)
    if rid is not None:
        ids.add(rid)


def _acquisition_actor_list_item_actor_value(value: Any) -> Any:
    """Bare ActorField row or wrapped ``{ actor, acquisition_actor_role }``."""
    if not isinstance(value, dict):
        return None
    if "actor" in value or "acquisition_actor_role" in value:
        return value.get("actor")
    return value


def _acquisition_wrapped_row_has_meaningful_content(row: dict) -> bool:
    """After removing ``actor`` ref, whether the row should still be kept."""
    if _ref_has_content(row.get("acquisition_actor_role")):
        return True
    sub = row.get("actor")
    if sub is None:
        return False
    if _actor_ref_id(sub) is not None:
        return True
    return isinstance(sub, dict) and ("person" in sub or "organization" in sub)


def _walk_spatial(spatial: Any, visit_actor: Callable[[Any], None]) -> None:
    if not isinstance(spatial, dict):
        return
    visit_actor(spatial.get("owner"))
    # Nested structures that may contain Spatial are handled by callers passing dicts


def _walk_roled_list(rows: Any, ids: Set[int]) -> None:
    if not isinstance(rows, list):
        return
    for row in rows:
        if isinstance(row, dict):
            _add_id(ids, row.get("actor"))


def collect_actor_ids(data: Any) -> Set[int]:
    """Return all positive integer actor catalog ids referenced in record `data`."""
    ids: Set[int] = set()
    if not isinstance(data, dict):
        return ids

    acq = data.get("aquisition_details")
    if isinstance(acq, dict):
        for a in acq.get("actor") or []:
            _add_id(ids, _acquisition_actor_list_item_actor_value(a))
        for place in acq.get("place") or []:
            _walk_spatial(place, lambda v: _add_id(ids, v))

    rights = data.get("rights")
    if isinstance(rights, list):
        for r in rights:
            if isinstance(r, dict):
                for h in r.get("holder") or []:
                    _add_id(ids, h)

    hist = data.get("history")
    if isinstance(hist, dict):
        for oh in hist.get("owner_history") or []:
            if isinstance(oh, dict):
                _add_id(ids, oh.get("owner"))
                _walk_spatial(oh.get("place"), lambda v: _add_id(ids, v))
        for opi in hist.get("object_production_information") or []:
            if isinstance(opi, dict):
                _walk_roled_list(opi.get("actor"), ids)
                pl = opi.get("place")
                if isinstance(pl, list):
                    for p in pl:
                        _walk_spatial(p, lambda v: _add_id(ids, v))
                else:
                    _walk_spatial(pl, lambda v: _add_id(ids, v))
        for uh in hist.get("usage_history") or []:
            pass
        for obh in hist.get("object_history") or []:
            if isinstance(obh, dict):
                _walk_roled_list(obh.get("actor"), ids)
                for pl in obh.get("place") or []:
                    _walk_spatial(pl, lambda v: _add_id(ids, v))
                ev = obh.get("event")
                if isinstance(ev, dict):
                    _walk_roled_list(ev.get("actor"), ids)
                    for pl in ev.get("place") or []:
                        _walk_spatial(pl, lambda v: _add_id(ids, v))

    desc = data.get("description")
    if isinstance(desc, dict):
        for ins in desc.get("inscription") or []:
            if isinstance(ins, dict):
                _add_id(ids, ins.get("inscriber"))
                for inter in ins.get("interpretation") or []:
                    if isinstance(inter, dict):
                        _add_id(ids, inter.get("interpretator"))
                for tr in ins.get("translation") or []:
                    if isinstance(tr, dict):
                        _add_id(ids, tr.get("translator"))
        content = desc.get("content")
        if isinstance(content, dict):
            actors_list = content.get("actors")
            if isinstance(actors_list, list):
                for item in actors_list:
                    _add_id(ids, item)
            _add_id(ids, content.get("person"))
            places_list = content.get("places")
            if isinstance(places_list, list):
                for pl in places_list:
                    _walk_spatial(pl, lambda v: _add_id(ids, v))
            _walk_spatial(content.get("place"), lambda v: _add_id(ids, v))

    loc = data.get("object_location")
    if isinstance(loc, list):
        for item in loc:
            if isinstance(item, dict):
                _walk_spatial(item.get("location"), lambda v: _add_id(ids, v))
    elif isinstance(loc, dict):
        _walk_spatial(loc.get("location"), lambda v: _add_id(ids, v))

    return ids


def _strip_actor_value(value: Any, actor_id: int) -> Any:
    """If value is a ref to actor_id, return None (caller removes key). Else return value."""
    if _actor_ref_id(value) == actor_id:
        return None
    return value


def _clean_spatial(spatial: Any, actor_id: int) -> Any:
    if not isinstance(spatial, dict):
        return spatial
    out = copy.deepcopy(spatial)
    if _actor_ref_id(out.get("owner")) == actor_id:
        out.pop("owner", None)
    return out


def _ref_has_content(assoc: Any) -> bool:
    if isinstance(assoc, str):
        return bool(assoc.strip())
    if isinstance(assoc, dict):
        pl = assoc.get("pref_label")
        if isinstance(pl, dict):
            for v in pl.values():
                if isinstance(v, str) and v.strip():
                    return True
        ins = assoc.get("in_scheme")
        if isinstance(ins, str) and ins.strip():
            return True
    return False


def _roled_row_empty(row: dict) -> bool:
    if not isinstance(row, dict):
        return True
    if row.get("actor") is not None:
        return False
    return not _ref_has_content(row.get("association"))


def _strip_roled_list(rows: Any, actor_id: int) -> tuple[Any, bool]:
    """Returns (new_list_or_original, changed)."""
    if not isinstance(rows, list):
        return rows, False
    out: list = []
    changed = False
    for row in rows:
        if not isinstance(row, dict):
            out.append(row)
            continue
        nr = copy.deepcopy(row)
        if _actor_ref_id(nr.get("actor")) == actor_id:
            nr.pop("actor", None)
            changed = True
        if _roled_row_empty(nr):
            changed = True
            continue
        out.append(nr)
    if not changed:
        return rows, False
    return out, True


def strip_actor_id(data: dict, actor_id: int) -> dict:
    """Deep copy of data with all references to actor_id removed from actor slots."""
    out = copy.deepcopy(data)
    if not isinstance(out, dict):
        return out

    acq = out.get("aquisition_details")
    if isinstance(acq, dict):
        actors = acq.get("actor")
        if isinstance(actors, list):
            na: list = []
            changed = False
            for a in actors:
                if not isinstance(a, dict):
                    na.append(a)
                    continue
                if "actor" in a or "acquisition_actor_role" in a:
                    sub = a.get("actor")
                    if _actor_ref_id(sub) == actor_id:
                        new_a = copy.deepcopy(a)
                        new_a.pop("actor", None)
                        changed = True
                        if _acquisition_wrapped_row_has_meaningful_content(new_a):
                            na.append(new_a)
                        continue
                    na.append(a)
                elif _actor_ref_id(a) == actor_id:
                    changed = True
                    continue
                else:
                    na.append(a)
            if len(na) != len(actors) or changed:
                if na:
                    acq["actor"] = na
                else:
                    acq.pop("actor", None)
        places = acq.get("place")
        if isinstance(places, list):
            acq["place"] = [_clean_spatial(p, actor_id) for p in places]

    rights = out.get("rights")
    if isinstance(rights, list):
        for r in rights:
            if not isinstance(r, dict):
                continue
            holders = r.get("holder")
            if isinstance(holders, list):
                nh = [h for h in holders if _actor_ref_id(h) != actor_id]
                if len(nh) != len(holders):
                    if nh:
                        r["holder"] = nh
                    else:
                        r.pop("holder", None)

    hist = out.get("history")
    if isinstance(hist, dict):
        for oh in hist.get("owner_history") or []:
            if isinstance(oh, dict):
                if _actor_ref_id(oh.get("owner")) == actor_id:
                    oh.pop("owner", None)
                pl = oh.get("place")
                if isinstance(pl, dict):
                    oh["place"] = _clean_spatial(pl, actor_id)
        for opi in hist.get("object_production_information") or []:
            if isinstance(opi, dict):
                new_rows, roled_changed = _strip_roled_list(opi.get("actor"), actor_id)
                if roled_changed:
                    if new_rows:
                        opi["actor"] = new_rows
                    else:
                        opi.pop("actor", None)
                pl = opi.get("place")
                if isinstance(pl, list):
                    opi["place"] = [_clean_spatial(p, actor_id) for p in pl]
                elif isinstance(pl, dict):
                    opi["place"] = _clean_spatial(pl, actor_id)
        for obh in hist.get("object_history") or []:
            if isinstance(obh, dict):
                new_rows, roled_changed = _strip_roled_list(obh.get("actor"), actor_id)
                if roled_changed:
                    if new_rows:
                        obh["actor"] = new_rows
                    else:
                        obh.pop("actor", None)
                places = obh.get("place")
                if isinstance(places, list):
                    obh["place"] = [_clean_spatial(p, actor_id) for p in places]
                ev = obh.get("event")
                if isinstance(ev, dict):
                    new_rows, roled_changed = _strip_roled_list(ev.get("actor"), actor_id)
                    if roled_changed:
                        if new_rows:
                            ev["actor"] = new_rows
                        else:
                            ev.pop("actor", None)
                    evps = ev.get("place")
                    if isinstance(evps, list):
                        ev["place"] = [_clean_spatial(p, actor_id) for p in evps]

    desc = out.get("description")
    if isinstance(desc, dict):
        for ins in desc.get("inscription") or []:
            if not isinstance(ins, dict):
                continue
            if _actor_ref_id(ins.get("inscriber")) == actor_id:
                ins.pop("inscriber", None)
            for inter in ins.get("interpretation") or []:
                if isinstance(inter, dict) and _actor_ref_id(inter.get("interpretator")) == actor_id:
                    inter.pop("interpretator", None)
            for tr in ins.get("translation") or []:
                if isinstance(tr, dict) and _actor_ref_id(tr.get("translator")) == actor_id:
                    tr.pop("translator", None)
        content = desc.get("content")
        if isinstance(content, dict):
            actors_list = content.get("actors")
            if isinstance(actors_list, list):
                na: list = []
                changed = False
                for item in actors_list:
                    if _actor_ref_id(item) == actor_id:
                        changed = True
                        continue
                    na.append(item)
                if changed:
                    if na:
                        content["actors"] = na
                    else:
                        content.pop("actors", None)
            if _actor_ref_id(content.get("person")) == actor_id:
                content.pop("person", None)
            places_list = content.get("places")
            if isinstance(places_list, list):
                content["places"] = [_clean_spatial(p, actor_id) for p in places_list]
            pl = content.get("place")
            if isinstance(pl, dict):
                content["place"] = _clean_spatial(pl, actor_id)

    loc = out.get("object_location")
    if isinstance(loc, list):
        for item in loc:
            if not isinstance(item, dict):
                continue
            lpl = item.get("location")
            if isinstance(lpl, dict):
                item["location"] = _clean_spatial(lpl, actor_id)
    elif isinstance(loc, dict):
        lpl = loc.get("location")
        if isinstance(lpl, dict):
            loc["location"] = _clean_spatial(lpl, actor_id)

    return out


def record_references_actor(record_data: dict, actor_id: int) -> bool:
    return actor_id in collect_actor_ids(record_data)


def sanitize_actor_refs_for_import(data: dict, user: Any) -> dict:
    """
    Return a deep copy of `data` with actor refs removed when the actor is missing
    or not visible to `user` (global or owned by user). Used by record import so
    foreign-catalog ids never block ingestion.
    """
    if not isinstance(data, dict):
        return data
    out = copy.deepcopy(data)
    ids = collect_actor_ids(out)
    if not ids:
        return out
    from .models import Actor

    invalid: Set[int] = set()
    for aid in ids:
        try:
            act = Actor.objects.get(pk=aid)
        except Actor.DoesNotExist:
            invalid.add(aid)
            continue
        if act.owner_id is None:
            continue
        if act.owner_id != user.id:
            invalid.add(aid)
    for aid in sorted(invalid, reverse=True):
        out = strip_actor_id(out, aid)
    return out


def validate_actor_refs_for_user(data: dict, user: Any) -> None:
    """Ensure every actor ref in `data` exists and is global or owned by `user`."""
    if user is None or isinstance(user, AnonymousUser) or not user.is_authenticated:
        raise DRFValidationError({"data": ["Authentication required for actor references."]})
    ids = collect_actor_ids(data)
    if not ids:
        return
    from .models import Actor

    for aid in ids:
        try:
            act = Actor.objects.get(pk=aid)
        except Actor.DoesNotExist:
            raise DRFValidationError(
                {"data": [f"Unknown actor id in record data: {aid}."]}
            )
        if act.owner_id is None:
            continue
        if act.owner_id != user.id:
            raise DRFValidationError(
                {"data": [f"Actor id {aid} is not available (not global or yours)."]}
            )


def record_label_from_data(data: dict) -> str:
    """Short label for usage UI (object number or title)."""
    id_details = data.get("identification_details")
    if isinstance(id_details, dict):
        title = id_details.get("title")
        if isinstance(title, list) and title:
            first = title[0]
            if isinstance(first, dict) and first.get("value"):
                return str(first["value"])
        if isinstance(title, dict) and title.get("value"):
            return str(title["value"])
        num = id_details.get("object_number")
        if num:
            return str(num)
    return ""


def list_record_usage_for_actor(actor_id: int, limit: int = 50) -> Tuple[int, List[dict]]:
    """Scan all records; return total count and up to `limit` {id, label} entries."""
    from .models import Record

    out: List[dict] = []
    count = 0
    for rec in Record.objects.iterator(chunk_size=200):
        d = rec.data if isinstance(rec.data, dict) else {}
        if actor_id not in collect_actor_ids(d):
            continue
        count += 1
        if len(out) < limit:
            label = record_label_from_data(d) or f"Record {rec.pk}"
            out.append({"id": rec.id, "label": label})
    return count, out
