/**
 * Access domain helpers (docs/data/access-models.md).
 */

import type { Access, ObjectDisplayStatus } from '../types/record/access'
import { referenceFieldFi } from './referenceField'
import { temporalHasPersistableContent } from './temporalPayload'

export function objectDisplayStatusHasPersistableContent(s: ObjectDisplayStatus): boolean {
  if (referenceFieldFi(s.type)) return true
  if (s.date && temporalHasPersistableContent(s.date)) return true
  return false
}

export function accessHasPersistableContent(a: Access): boolean {
  if (referenceFieldFi(a.category)) return true
  if (a.note?.trim()) return true
  if (a.credit_line?.trim()) return true
  if (referenceFieldFi(a.museological_value)) return true
  if (a.date && temporalHasPersistableContent(a.date)) return true
  if (a.object_display_status && objectDisplayStatusHasPersistableContent(a.object_display_status)) return true
  return false
}
