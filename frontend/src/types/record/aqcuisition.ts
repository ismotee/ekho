/**
 * docs/data/aqcuisition-models.md (spelling per domain spec)
 */

import type { ReferenceField, Temporal } from './common'
import type { ActorField, Spatial } from './actor'

export interface AqcuisitionDetails {
  reference_number?: string
  date?: Temporal[]
  method?: ReferenceField
  reason?: string
  place?: Spatial[]
  actor?: ActorField[]
  provisos?: string
  note?: string
  group_purchase_price?: number
  group_purchase_price_denomination?: ReferenceField
  original_object_purchase_price?: number
  original_object_purchase_price_denomination?: ReferenceField
  transfer_of_title_number?: string
}
