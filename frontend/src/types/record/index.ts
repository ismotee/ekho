/**
 * Record domain types (docs/data/record-models.md + domain modules).
 */

import type { RecordPayload } from './payload'
import type { RecordImageContext, RecordImageRole } from './imageVocabulary'

export type {
  ReferenceString,
  Label,
  ImageRef,
  DateDetail,
  DateDetailWithTemporalMeta,
  Temporal,
  Coordinates,
  ReferenceNumber,
  SpatialContext,
  SpatialFeature,
  SourceBase,
} from './common'

export type {
  Actor,
  ActorField,
  ActorRef,
  Person,
  Organization,
  PersonName,
  Address,
  Spatial,
  RoledActor,
  NameDetail,
  BiographicalNote,
  OrganizationHistory,
  OrganizationIdentifier,
} from './actor'

export type { IdentificationDetails, ObjectName, Title, TitleTranslation } from './identification'

export type {
  AcquisitionActorListItem,
  AcquisitionActorRow,
  AqcuisitionDetails,
} from './aqcuisition'
export type { Rights } from './rights'
export type { History, Technique } from './history'
export type { ContentDateEntry, ContentEvent, Description, ObjectComponent } from './description'
export type { Access } from './access'
export type { ObjectLocation } from './object-location'
export type { InformationConfidentiality } from './confidentiality'

export {
  RECORD_DATA_DOMAIN_KEYS,
  emptyRecordPayload,
} from './payload'

export type { RecordPayload, RecordDataDomainKey } from './payload'

export {
  RECORD_IMAGE_ROLES,
  RECORD_IMAGE_CONTEXTS,
  type RecordImageRole,
  type RecordImageContext,
} from './imageVocabulary'

/** One row from GET /api/records/{id}/images/ or embedded `images` on a record. */
export interface RecordImage {
  id: number
  url: string
  role: RecordImageRole
  context: RecordImageContext
  byte_size: number
  width: number
  height: number
  format: string | null
  mime_type: string
  checksum_sha256: string
  sort_order: number
  is_primary: boolean
  status: 'draft' | 'approved' | 'suppressed'
  derived_from: { id: number } | null
  labels: { [key: string]: unknown }
  created_at: string
  updated_at: string
}

/** API record resource (list/detail/create/update). Domain lives under `data`. */
export interface Record {
  id: number
  data: RecordPayload
  representative_image: string | null
  /** Present on normal API list/detail responses; may be omitted in local stubs. */
  images?: RecordImage[]
  collection: number
  is_listed: boolean
  collection_name?: string
  collection_owner_username?: string
  created_at: string
  updated_at: string
}

export {
  getRecordPrimaryLabel,
  getRecordSecondaryLine,
  getRecordCardYearLine,
  getRecordCardSummary,
  getLegacyArtistLine,
  getLegacyYearLine,
  getLegacyMedium,
  getLegacyDimensions,
  getLegacyCondition,
  getLegacyFreeDescription,
  getRecordThumbnailUrl,
  type RecordDisplaySource,
  type RecordCardSummarySource,
  type RecordCardSummary,
} from './display'

export {
  recordPayloadFromFlatForm,
  flatFormStateFromRecordPayload,
  mergeRecordPayload,
  type FlatRecordFormFields,
} from './flatFormMap'
