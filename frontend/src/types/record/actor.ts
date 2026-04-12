/**
 * Actor and related types from docs/data/actor-models.md
 */

import type {
  Label,
  ReferenceString,
  ReferenceField,
  Coordinates,
  ReferenceNumber,
  SpatialContext,
  SpatialFeature,
  SourceBase,
  DateDetail,
} from './common'

/** Organization name row (docs/data/actor-models.md). */
export interface NameDetail {
  name?: Label
  name_type?: ReferenceField
  addition_to_name?: string
  earliest?: DateDetail
  latest?: DateDetail
  /** When true, this row’s label is used for catalog lists and actor select options (with other in-use rows). */
  in_use?: boolean
}

export interface BiographicalNote {
  note?: string
  source?: SourceBase
}

export interface OrganizationHistory {
  foundation_date?: DateDetail
  foundation_place?: Spatial
  dissolution_date?: DateDetail
  biographical_note?: BiographicalNote
}

export interface Address {
  text?: string
  type?: ReferenceString
  email?: string
  phone_number?: string
}

export interface OrganizationIdentifier {
  text?: string
  type?: ReferenceString
}

/** Reference<PersonNameType> (Finnish label string or pref_label payload) */
export interface PersonName {
  name?: string
  date?: DateDetail
  name_type?: ReferenceField
  /** When true, this row is used for catalog lists and actor select options (with other in-use rows in the same group). */
  in_use?: boolean
}

export interface Person {
  first_name?: PersonName[]
  last_name?: PersonName[]
  other_name?: PersonName[]
  additions_to_name?: string
  birth_date?: DateDetail
  place_of_birth?: Spatial
  death_date?: DateDetail
  gender?: ReferenceString
  nationality?: ReferenceString
  address?: Address
  website?: string
  school_or_style?: ReferenceString
  biographical_note?: BiographicalNote
  occupation?: ReferenceString
  reference_number?: ReferenceNumber
}

export interface Organization {
  /** Name rows (types, additions, date bounds per row). */
  name?: NameDetail[]
  history?: OrganizationHistory
  function?: ReferenceString
  address?: Address
  website?: string
  reference_number?: OrganizationIdentifier | ReferenceNumber
  /** Optional contact for this organization. */
  contact_person?: Person
}

/** Inline person/org document (catalog row payload or legacy record JSON). */
export interface Actor {
  person?: Person
  organization?: Organization
}

/** Catalog reference stored in record JSON (`docs/data/record-models.md`). */
export interface ActorRef {
  id: number
}

/** Actor-shaped slot: catalog id or legacy inline blob. */
export type ActorField = ActorRef | Actor

export interface Spatial {
  name?: Label
  /** Reference — paikannimen tyyppi (closed Finnish term list). */
  name_type?: ReferenceField
  /** Reference — hankintapaikan rooli (acquisition places only; closed Finnish term list). */
  acquisition_place_role?: ReferenceField
  /** Reference — sisällön paikan rooli (content description places only; same vocabulary as `acquisition_place_role`). */
  content_place_role?: ReferenceField
  note?: string
  environmental_details?: string
  /** Reference — paikan asema (closed Finnish term list). */
  status?: ReferenceString
  coordinates?: Coordinates
  reference_number?: ReferenceNumber
  position?: string
  owner?: ActorField
  context?: SpatialContext
  feature?: SpatialFeature
}

export interface RoledActor {
  actor?: ActorField
  /** Role of the actor (closed Finnish term list; same vocabulary as acquisition actor role). */
  association?: ReferenceField
}

export interface SourceOrganizationHistory extends SourceBase {
  author?: ActorField
}

export interface SourcePersonHistory extends SourceBase {
  author?: ActorField
}
