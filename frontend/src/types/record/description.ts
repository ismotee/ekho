/**
 * docs/data/description-models.md
 */

import type { DateDetail, ImageRef, ReferenceField } from './common'
import type { ActorField, Spatial } from './actor'
import type { ObjectName } from './identification'

/** Part of the object described in kuvailu (docs/data/description-models.md — ObjectComponent). */
export interface ObjectComponent {
  /** Objektin osan kuvaus */
  description?: string
  /** Same structure and vocabularies as identification `object_name` (value / type / language). */
  object_name?: ObjectName
  /** Objektin osan identifiointitunnus */
  object_number?: string
}

export interface PhysicalDescription {
  object_status?: ReferenceField
  object_component?: ObjectComponent[]
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
  date?: DateDetail
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
  date?: DateDetail
  interpretation?: Interpretation[]
}

export interface Measurement {
  unit?: ReferenceField
  value?: number
  measurement_unit?: ReferenceField
  value_qualifier?: string
}

/** One row under Sisällön tapahtumat (content.event[]). */
export interface ContentEvent {
  /** Vapaa teksti: sisällön tapahtuman nimi. */
  name?: string
  /** YSO tapahtumat (p1051) — tapahtuman tyyppi; URI `in_scheme`. */
  name_type?: ReferenceField
}

/** One row under Sisällön ajat: calendar / certainty / qualifier plus optional role. */
export interface ContentDateEntry extends DateDetail {
  content_time_role?: ReferenceField
}

export interface Content {
  description?: string
  /** People, organizations, or groups depicted or described by the content (catalog refs or embedded actors). */
  actors?: ActorField[]
  /** Times depicted or described by the content. */
  dates?: ContentDateEntry[]
  /** Places depicted or described by the content (same `Spatial` shape as other record places). */
  places?: Spatial[]
  /** YSO (or legacy) content activity terms; URL linkage via `in_scheme` when using YSO picker. */
  activity?: ReferenceField[]
  event?: ContentEvent[]
  /** Kohta tai paikka objektissa (vapaa teksti). */
  position?: string
  script?: ReferenceField
  language?: ReferenceField
  note?: string
  style?: ReferenceField[]
  /** KOKO (Finto) keywords; multiselect, URIs in `in_scheme`. */
  general_concept?: ReferenceField[]
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
