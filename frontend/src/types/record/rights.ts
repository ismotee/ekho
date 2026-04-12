/**
 * docs/data/rights-models.md
 */

import type { DateDetail, ReferenceField } from './common'
import type { ActorField } from './actor'

export interface Rights {
  type?: ReferenceField
  note?: string
  holder?: ActorField[]
  begin_date?: DateDetail
  end_date?: DateDetail
  reference_number?: string
}
