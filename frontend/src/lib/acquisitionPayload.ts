/**
 * Acquisition domain helpers for save compaction (docs/data/aqcuisition-models.md).
 */

import type { ActorField, Spatial } from '../types/record/actor'
import { actorFieldHasContent } from './actorField'
import type { Label, Temporal } from '../types/record/common'
import type {
  AcquisitionActorListItem,
  AcquisitionActorRow,
  AqcuisitionDetails,
} from '../types/record/aqcuisition'
import { referenceFieldFi } from './referenceField'
import { dateDetailHasPersistableContent, temporalHasPersistableContent } from './temporalPayload'

function labelHasText(l?: Label): boolean {
  if (!l) return false
  return !!(l.fi?.trim() || l.en?.trim() || l.und?.trim())
}

export function spatialRowHasContent(s: Spatial): boolean {
  if (actorFieldHasContent(s.owner)) return true
  if (labelHasText(s.name)) return true
  if (s.note?.trim() || s.environmental_details?.trim() || s.position?.trim()) return true
  if (referenceFieldFi(s.name_type)) return true
  if (referenceFieldFi(s.acquisition_place_role)) return true
  if (referenceFieldFi(s.content_place_role)) return true
  if (referenceFieldFi(s.status)) return true
  const rn = s.reference_number
  if (rn && typeof rn === 'object') {
    if (typeof rn.text === 'string' && rn.text.trim()) return true
    if (referenceFieldFi(rn.type)) return true
  }
  const c = s.coordinates
  if (c && typeof c === 'object') {
    if (c.text?.trim()) return true
    const cq = c.coordinates_qualifier
    if (cq !== undefined && cq !== null && String(cq).trim()) return true
    if (referenceFieldFi(c.coordinates_type)) return true
  }
  return false
}

export function actorRowHasContent(a: ActorField | undefined): boolean {
  return actorFieldHasContent(a)
}

/** Normalize legacy bare ActorField vs `{ actor, acquisition_actor_role }` wrapper. */
export function unwrapAcquisitionActorSlot(v: AcquisitionActorListItem | undefined): AcquisitionActorRow {
  if (v == null || typeof v !== 'object') return {}
  const o = v as AcquisitionActorRow & ActorField
  if ('actor' in o || 'acquisition_actor_role' in o) {
    return {
      actor: o.actor,
      acquisition_actor_role: o.acquisition_actor_role,
    }
  }
  return { actor: v as ActorField }
}

/** True if this acquisition actor list item should be kept when saving or shown as non-empty in the form. */
export function acquisitionActorListItemHasContent(item: AcquisitionActorListItem | undefined): boolean {
  const r = unwrapAcquisitionActorSlot(item)
  return actorFieldHasContent(r.actor) || !!referenceFieldFi(r.acquisition_actor_role)
}

/**
 * Persist minimal JSON: bare ActorField when no role; wrapped object when role (or role-only) is set.
 */
export function persistAcquisitionActorRow(r: AcquisitionActorRow): AcquisitionActorListItem {
  const hasActor = actorFieldHasContent(r.actor)
  const hasRole = referenceFieldFi(r.acquisition_actor_role)
  if (!hasActor && !hasRole) return {}
  if (hasRole) {
    const out: AcquisitionActorRow = {}
    if (hasActor) out.actor = r.actor
    out.acquisition_actor_role = r.acquisition_actor_role
    return out
  }
  return r.actor as ActorField
}

/** Drop empty rows and emit minimal actor list items for API persist. */
export function compactAcquisitionActorsForSave(
  rows: AcquisitionActorListItem[] | undefined,
): AcquisitionActorListItem[] | undefined {
  if (!rows?.length) return undefined
  const next = rows
    .map(unwrapAcquisitionActorSlot)
    .filter((r) => actorFieldHasContent(r.actor) || referenceFieldFi(r.acquisition_actor_role))
    .map(persistAcquisitionActorRow)
  return next.length ? next : undefined
}

export function acquisitionDateRowHasContent(t: {
  single?: string
  certanity?: unknown
  qualifier?: unknown
  note?: unknown
  text?: unknown
  association?: unknown
  period?: unknown
  earliest?: unknown
  latest?: unknown
}): boolean {
  return temporalHasPersistableContent(t as Temporal)
}

/** True if acquisition should be persisted after list compaction and trimming. */
export function acquisitionHasPersistableContent(a: AqcuisitionDetails): boolean {
  if (a.reference_number?.trim()) return true
  if (a.reason?.trim()) return true
  if (a.note?.trim()) return true
  if (a.provisos?.trim()) return true
  if (a.acquisition_time && dateDetailHasPersistableContent(a.acquisition_time)) return true
  if (a.date?.some((t) => temporalHasPersistableContent(t))) return true
  if (referenceFieldFi(a.method)) return true
  if (a.transfer_of_title_number?.trim()) return true
  if (a.group_purchase_price != null && Number.isFinite(a.group_purchase_price)) return true
  if (a.original_object_purchase_price != null && Number.isFinite(a.original_object_purchase_price)) return true
  if (referenceFieldFi(a.group_purchase_price_denomination)) return true
  if (referenceFieldFi(a.original_object_purchase_price_denomination)) return true
  if (a.place?.some(spatialRowHasContent)) return true
  if (a.actor?.some((row) => acquisitionActorListItemHasContent(row))) return true
  return false
}
