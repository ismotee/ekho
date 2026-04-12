/**
 * docs/data/object-location-models.md
 */

import type { DateDetail, ReferenceField } from './common'
import type { Spatial } from './actor'

export interface ObjectLocation {
  identifier?: string
  location?: Spatial
  type?: ReferenceField
  date?: DateDetail
  note?: string
  fitness?: ReferenceField
}
