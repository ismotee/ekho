/**
 * docs/data/access-models.md
 */

import type { DateDetail, ReferenceField } from './common'

export interface ObjectDisplayStatus {
  type?: ReferenceField
  date?: DateDetail
}

export interface Access {
  category?: ReferenceField
  date?: DateDetail
  note?: string
  museological_value?: ReferenceField
  credit_line?: string
  object_display_status?: ObjectDisplayStatus
}
