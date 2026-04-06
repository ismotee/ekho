/**
 * docs/data/history-models.md
 */

import type { ReferenceField, Temporal } from './common'
import type { ActorField, RoledActor, Spatial } from './actor'

export interface OwnershipExchange {
  method?: ReferenceField
  price?: number
  denomination?: ReferenceField
  note?: string
}

export interface Ownership {
  owner?: ActorField
  date?: Temporal
  place?: Spatial
  exchange?: OwnershipExchange
}

export interface ObjectProductInformation {
  actor?: RoledActor[]
  date?: Temporal
  place?: Spatial
  reason?: string
  note?: string
  technique?: ReferenceField
  technique_type?: ReferenceField[]
}

export interface UsageHistory {
  usage?: ReferenceField
  note?: string
  usage_instructions?: string
}

export interface AssociatedActivity {
  type?: ReferenceField
  note?: string
}

export interface AssociatedEvent {
  name?: ReferenceField
  name_type?: ReferenceField
  actor?: RoledActor[]
  date?: Temporal[]
  place?: Spatial[]
  note?: string
}

export interface ObjectHistory {
  activity?: AssociatedActivity
  cultural_affinity?: ReferenceField
  actor?: RoledActor[]
  date?: Temporal[]
  place?: Spatial[]
  event?: AssociatedEvent
  note?: string
  comments?: string
  relevance?: string
}

export interface History {
  owner_history?: Ownership[]
  object_production_information?: ObjectProductInformation[]
  usage_history?: UsageHistory[]
  object_history?: ObjectHistory[]
}
