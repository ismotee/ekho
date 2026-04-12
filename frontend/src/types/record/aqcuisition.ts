/**
 * docs/data/aqcuisition-models.md (spelling per domain spec)
 */

import type { DateDetail, ReferenceField, Temporal } from './common'
import type { ActorField, Spatial } from './actor'

/** One acquisition actor row: catalog/inline actor plus optional role (hankinnan toimijan rooli). */
export interface AcquisitionActorRow {
  actor?: ActorField
  /** Reference — closed Finnish enum (see ACQUISITION_ACTOR_ROLE_FI). */
  acquisition_actor_role?: ReferenceField
}

/**
 * Legacy items are bare ActorField (`{ id }` or inline actor). Wrapped rows use `AcquisitionActorRow`.
 */
export type AcquisitionActorListItem = ActorField | AcquisitionActorRow

export interface AqcuisitionDetails {
  reference_number?: string
  /** Primary acquisition time (hankinta-aika). */
  acquisition_time?: DateDetail
  /** Additional acquisition-related temporal information (hankinnan muut aikatiedot). */
  date?: Temporal[]
  method?: ReferenceField
  reason?: string
  place?: Spatial[]
  actor?: AcquisitionActorListItem[]
  provisos?: string
  note?: string
  group_purchase_price?: number
  group_purchase_price_denomination?: ReferenceField
  original_object_purchase_price?: number
  original_object_purchase_price_denomination?: ReferenceField
  transfer_of_title_number?: string
}
