/**
 * Object location domain helpers (docs/data/object-location-models.md).
 */

import type { ObjectLocation } from '../types/record/object-location'
import { spatialRowHasContent } from './acquisitionPayload'
import { referenceFieldFi } from './referenceField'
import { temporalHasPersistableContent } from './temporalPayload'

export function objectLocationHasPersistableContent(o: ObjectLocation): boolean {
  if (o.identifier?.trim()) return true
  if (o.note?.trim()) return true
  if (referenceFieldFi(o.type)) return true
  if (referenceFieldFi(o.fitness)) return true
  if (o.location && spatialRowHasContent(o.location)) return true
  if (o.date && temporalHasPersistableContent(o.date)) return true
  return false
}
