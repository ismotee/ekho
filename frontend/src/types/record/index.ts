/**
 * Record domain types (docs/data/record-models.md + domain modules).
 */

import type { RecordPayload } from './payload'

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

/** API record resource (list/detail/create/update). Domain lives under `data`. */
export interface Record {
  id: number
  data: RecordPayload
  representative_image: string | null
  collection: number
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
