/**
 * docs/data/object-location-models.md
 */

import type { ReferenceField, Temporal } from './common'
import type { Spatial } from './actor'

export interface ObjectLocation {
  identifier?: string
  location?: Spatial
  type?: ReferenceField
  date?: Temporal
  note?: string
  fitness?: ReferenceField
}
