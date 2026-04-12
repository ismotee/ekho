/**
 * docs/data/history-models.md
 */

import type { DateDetail, ReferenceField } from './common'
import type { ActorField, RoledActor, Spatial } from './actor'

/** One production technique row: technique name + optional type (Reference<TechniqueType>). */
export interface Technique {
  name?: ReferenceField
  type?: ReferenceField
}

export interface OwnershipExchange {
  method?: ReferenceField
  price?: number
  denomination?: ReferenceField
  note?: string
}

export interface Ownership {
  owner?: ActorField
  date?: DateDetail
  place?: Spatial
  exchange?: OwnershipExchange
}

export interface ObjectProductInformation {
  actor?: RoledActor[]
  /** Valmistukseen liittyvät aikatiedot (each row may include ajan rooli via temporal metadata on DateDetail). */
  date?: DateDetail[]
  /** Valmistukseen liittyvät paikat. */
  place?: Spatial[]
  reason?: string
  note?: string
  /** Valmistustekniikat (each row: tekniikka + tyyppi). */
  techniques?: Technique[]
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
  date?: DateDetail[]
  place?: Spatial[]
}

export interface ObjectHistory {
  activity?: AssociatedActivity
  cultural_affinity?: ReferenceField
  actor?: RoledActor[]
  date?: DateDetail[]
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
