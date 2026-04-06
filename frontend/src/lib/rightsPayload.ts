/**
 * Rights domain helpers (docs/data/rights-models.md).
 */

import type { Rights } from '../types/record/rights'
import { referenceFieldFi } from './referenceField'
import { actorRowHasContent } from './acquisitionPayload'
import { temporalHasPersistableContent } from './temporalPayload'

export function rightsHasPersistableContent(r: Rights): boolean {
  if (referenceFieldFi(r.type)) return true
  if (r.note?.trim()) return true
  if (r.reference_number?.trim()) return true
  if (r.holder?.some(actorRowHasContent)) return true
  if (r.begin_date && temporalHasPersistableContent(r.begin_date)) return true
  if (r.end_date && temporalHasPersistableContent(r.end_date)) return true
  return false
}

/** One entry after stripping empty nested rows / temporal placeholders. */
export function compactRightsEntryForSave(r: Rights): Rights | undefined {
  const x = { ...r }
  if (x.holder?.length) {
    x.holder = x.holder.filter(actorRowHasContent)
    if (x.holder.length === 0) delete x.holder
  }
  if (x.begin_date && !temporalHasPersistableContent(x.begin_date)) delete x.begin_date
  if (x.end_date && !temporalHasPersistableContent(x.end_date)) delete x.end_date
  if (x.note !== undefined && !String(x.note).trim()) delete x.note
  if (x.reference_number !== undefined && !String(x.reference_number).trim()) delete x.reference_number
  if (!referenceFieldFi(x.type)) delete x.type
  return rightsHasPersistableContent(x) ? x : undefined
}

export function compactRightsListForSave(
  list: Rights[] | null | undefined,
): Rights[] | undefined {
  if (!list?.length) return undefined
  const out = list.map(compactRightsEntryForSave).filter((x): x is Rights => x != null)
  return out.length ? out : undefined
}
