/**
 * docs/data/rights-models.md
 */

import type { ReferenceField, Temporal } from './common'
import type { ActorField } from './actor'

export interface Rights {
  type?: ReferenceField
  note?: string
  holder?: ActorField[]
  begin_date?: Temporal
  end_date?: Temporal
  reference_number?: string
}
