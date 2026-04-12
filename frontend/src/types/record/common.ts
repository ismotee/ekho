/**
 * Shared primitives from docs/data/common-models.md and actor-models.md (Label, Temporal, Spatial, …).
 * Reference<*> values are Finnish label strings in API v1.
 */

export type ReferenceString = string

export type Label = Partial<Record<'fi' | 'en' | 'und', string>>

/** docs/data/common-models.md — Reference wire shape */
export interface ReferencePayload {
  pref_label?: Label
  in_scheme?: string
}

/** Reference<X> as JSON object or legacy plain string (API payloads). */
export type ReferenceField = string | ReferencePayload

/** Absolute URL or null per common-models (nested images, same idea as representative_image). */
export type ImageRef = string | null

export interface DateDetail {
  single?: string
  certanity?: ReferenceString
  qualifier?: ReferenceString
  /** @deprecated Legacy wire payloads; prefer `note` when merged with temporal metadata. */
  text?: string
}

export interface Temporal {
  association?: ReferenceField
  earliest?: DateDetail
  latest?: DateDetail
  period?: ReferenceField
  /** docs/data/actor-models.md — description of the temporal detail */
  note?: string
  /** @deprecated legacy payloads; prefer `note` */
  text?: string
}

/** DateDetail row that may carry Temporal metadata (note, association, period) on the same object (e.g. acquisition dates). */
export type DateDetailWithTemporalMeta = DateDetail &
  Partial<Pick<Temporal, 'note' | 'text' | 'association' | 'period'>>

export interface Coordinates {
  text?: string
  /** Accuracy or precision of the coordinates (free text). */
  coordinates_qualifier?: string
  coordinates_type?: ReferenceString
}

export interface ReferenceNumber {
  text?: string
  type?: ReferenceString
}

export interface SpatialContext {
  text?: string
  level?: string
  date?: Temporal
}

export interface SpatialFeature {
  feature?: ReferenceString
  feature_type?: ReferenceString
  feature_date?: Temporal
}

export interface SourceBase {
  /** Free-text source reference (lähde), above source type. */
  citation?: string
  source_type?: ReferenceString
  source_date?: DateDetail
  note?: string
}
