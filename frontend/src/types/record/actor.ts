/**
 * Actor and related types from docs/data/actor-models.md
 */

import type {
  Label,
  ReferenceString,
  ReferenceField,
  Temporal,
  Coordinates,
  ReferenceNumber,
  SpatialNameType,
  SpatialContext,
  SpatialFeature,
  SourceBase,
} from './common'

export interface OtherName {
  name?: Label
  type?: ReferenceField
}

export interface BiographicalNote {
  note?: string
  source?: SourceBase
}

export interface OrganizationHistory {
  foundation_date?: Temporal
  foundation_place?: Spatial
  dissolution_date?: Temporal
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
  date?: Temporal
  name_type?: ReferenceField
}

export interface Person {
  first_name?: PersonName[]
  last_name?: PersonName
  other_name?: PersonName[]
  additions_to_name?: string
  birth_date?: Temporal
  place_of_birth?: Spatial
  death_date?: Temporal
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
  main_body?: Label
  sub_body?: Label
  other_name?: OtherName[]
  addition_to_name?: string
  name_date?: Temporal
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
  association?: ReferenceString
  name?: Label
  name_type?: SpatialNameType
  note?: string
  environmental_details?: string
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
  association?: ReferenceString
}

export interface SourceOrganizationHistory extends SourceBase {
  author?: ActorField
}

export interface SourcePersonHistory extends SourceBase {
  author?: ActorField
}
