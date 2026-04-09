/**
 * docs/data/description-models.md
 */

import type { ReferenceField, Temporal, ImageRef } from './common'
import type { ActorField, Spatial } from './actor'

export interface PhysicalDescription {
  object_status?: ReferenceField
  object_component_name?: ReferenceField
  text?: string
  photo_format?: ReferenceField
  orientation?: ReferenceField
  color?: ReferenceField
  audio?: ReferenceField
  form?: ReferenceField
  edition_number?: string
  copy_number?: number
}

export interface MaterialComponent {
  type?: ReferenceField
  note?: string
}

export interface Material {
  type?: ReferenceField
  name?: string
  source?: Spatial
  component?: MaterialComponent[]
}

export interface Interpretation {
  text?: string
  interpretator?: ActorField
  date?: Temporal
  photo?: ImageRef
}

export interface Translation {
  translator?: ActorField
  text?: string
  language?: ReferenceField
}

export interface Inscription {
  position?: string
  content?: string
  description?: string
  script?: ReferenceField
  language?: ReferenceField
  translation?: Translation[]
  transliteration?: string
  type?: ReferenceField
  method?: ReferenceField
  direction?: ReferenceField
  inscriber?: ActorField
  date?: Temporal
  interpretation?: Interpretation[]
}

export interface Measurement {
  unit?: ReferenceField
  value?: number
  measurement_unit?: ReferenceField
  value_qualifier?: string
}

export interface ContentEvent {
  name?: ReferenceField
  type?: ReferenceField
}

export interface Content {
  description?: string
  person?: ActorField
  date?: Temporal
  place?: Spatial
  activity?: ReferenceField
  event?: ContentEvent[]
  position?: ReferenceField
  script?: ReferenceField
  language?: ReferenceField
  note?: string
  style?: ReferenceField[]
  general_concept?: ReferenceField
  classification?: ReferenceField[]
}

export interface Description {
  physical_description?: PhysicalDescription
  material?: Material[]
  technical_attribute?: Measurement[]
  inscription?: Inscription[]
  dimension?: Measurement[]
  content?: Content
}
