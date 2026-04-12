/**
 * Aggregate shape from docs/data/record-models.md (REST: nested under `data`).
 */

import type { IdentificationDetails } from './identification'
import type { AqcuisitionDetails } from './aqcuisition'
import type { Rights } from './rights'
import type { History } from './history'
import type { Description } from './description'
import type { Access } from './access'
import type { ObjectLocation } from './object-location'
import type { InformationConfidentiality } from './confidentiality'

export const RECORD_DATA_DOMAIN_KEYS = [
  'identification_details',
  'aquisition_details',
  'rights',
  'history',
  'description',
  'access',
  'object_location',
  'confidentiality',
] as const

export type RecordDataDomainKey = (typeof RECORD_DATA_DOMAIN_KEYS)[number]

export interface RecordPayload {
  identification_details?: IdentificationDetails | null
  aquisition_details?: AqcuisitionDetails | null
  /** docs/data/record-models.md — list of rights entries */
  rights?: Rights[] | null
  history?: History | null
  description?: Description | null
  access?: Access | null
  /** docs/data/object-location-models.md — list of location entries */
  object_location?: ObjectLocation[] | null
  confidentiality?: InformationConfidentiality | null
}

/** Empty domain object for forms (all keys omitted). */
export function emptyRecordPayload(): RecordPayload {
  return {}
}
