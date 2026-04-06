/**
 * Acquisition domain helpers for save compaction (docs/data/aqcuisition-models.md).
 */

import type { ActorField, Spatial } from '../types/record/actor'
import { actorFieldHasContent } from './actorField'
import type { Label, Temporal } from '../types/record/common'
import type { AqcuisitionDetails } from '../types/record/aqcuisition'
import { referenceFieldFi } from './referenceField'
import { temporalHasPersistableContent } from './temporalPayload'

function labelHasText(l?: Label): boolean {
  if (!l) return false
  return !!(l.fi?.trim() || l.en?.trim() || l.und?.trim())
}

export function spatialRowHasContent(s: Spatial): boolean {
  if (actorFieldHasContent(s.owner)) return true
  if (labelHasText(s.name)) return true
  if (s.note?.trim() || s.environmental_details?.trim()) return true
  const rn = s.reference_number
  if (rn && typeof rn === 'object' && typeof rn.text === 'string' && rn.text.trim()) return true
  return false
}

export function actorRowHasContent(a: ActorField | undefined): boolean {
  return actorFieldHasContent(a)
}

export function acquisitionDateRowHasContent(t: Temporal): boolean {
  return !!(t.text?.trim())
}

/** True if acquisition should be persisted after list compaction and trimming. */
export function acquisitionHasPersistableContent(a: AqcuisitionDetails): boolean {
  if (a.reference_number?.trim()) return true
  if (a.reason?.trim()) return true
  if (a.note?.trim()) return true
  if (a.provisos?.trim()) return true
  if (a.date?.some((t) => temporalHasPersistableContent(t))) return true
  if (referenceFieldFi(a.method)) return true
  if (a.transfer_of_title_number?.trim()) return true
  if (a.group_purchase_price != null && Number.isFinite(a.group_purchase_price)) return true
  if (a.original_object_purchase_price != null && Number.isFinite(a.original_object_purchase_price)) return true
  if (referenceFieldFi(a.group_purchase_price_denomination)) return true
  if (referenceFieldFi(a.original_object_purchase_price_denomination)) return true
  if (a.place?.some(spatialRowHasContent)) return true
  if (a.actor?.some(actorRowHasContent)) return true
  return false
}
