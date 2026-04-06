/**
 * docs/data/identification-models.md
 */

import type { ReferenceField, Temporal } from './common'
import type { Organization, Person } from './actor'

export interface ObjectName {
  value?: ReferenceField
  type?: ReferenceField
  language?: ReferenceField
}

export interface TitleTranslation {
  value?: string
  translator?: Person
  translation_time?: Temporal
  note?: string
}

export interface Title {
  value?: string
  type?: ReferenceField
  language?: ReferenceField
  translation?: TitleTranslation[]
  note?: string
}

export interface IdentificationDetails {
  owning_organization?: Organization
  responsible_department?: string
  collection?: string
  object_type?: ReferenceField
  object_number?: string
  object_name?: ObjectName[]
  /** docs/data/identification-models.md — List<Title> */
  title?: Title[]
  number_of_objects?: number
}
