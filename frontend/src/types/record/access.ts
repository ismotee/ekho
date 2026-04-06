/**
 * docs/data/access-models.md
 */

import type { ReferenceField, Temporal } from './common'

export interface ObjectDisplayStatus {
  type?: ReferenceField
  date?: Temporal
}

export interface Access {
  category?: ReferenceField
  date?: Temporal
  note?: string
  museological_value?: ReferenceField
  credit_line?: string
  object_display_status?: ObjectDisplayStatus
}
