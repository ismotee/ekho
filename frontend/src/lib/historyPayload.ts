/**
 * History domain helpers for save compaction (docs/data/history-models.md).
 */

import type { RoledActor } from '../types/record/actor'
import type {
  AssociatedActivity,
  AssociatedEvent,
  History,
  ObjectHistory,
  ObjectProductInformation,
  Ownership,
  OwnershipExchange,
  UsageHistory,
} from '../types/record/history'
import { actorRowHasContent, spatialRowHasContent } from './acquisitionPayload'
import { referenceFieldFi } from './referenceField'
import { temporalHasPersistableContent } from './temporalPayload'
import type { Temporal } from '../types/record/common'

function temporalHasContent(t?: Temporal): boolean {
  return !!(t && temporalHasPersistableContent(t))
}

function ownershipExchangeHasContent(ex?: OwnershipExchange): boolean {
  if (!ex) return false
  return (
    !!referenceFieldFi(ex.method) ||
    (ex.price != null && Number.isFinite(ex.price)) ||
    !!referenceFieldFi(ex.denomination) ||
    !!(ex.note?.trim())
  )
}

export function ownershipRowHasContent(row: Ownership): boolean {
  if (row.owner && actorRowHasContent(row.owner)) return true
  if (temporalHasContent(row.date)) return true
  if (row.place && spatialRowHasContent(row.place)) return true
  if (ownershipExchangeHasContent(row.exchange)) return true
  return false
}

export function roledActorRowHasContent(r: RoledActor): boolean {
  return (r.actor != null && actorRowHasContent(r.actor)) || !!referenceFieldFi(r.association)
}

export function objectProductInformationRowHasContent(row: ObjectProductInformation): boolean {
  if (row.actor?.some(roledActorRowHasContent)) return true
  if (temporalHasContent(row.date)) return true
  if (row.place && spatialRowHasContent(row.place)) return true
  if (row.reason?.trim() || row.note?.trim() || row.technique?.trim()) return true
  if (row.technique_type?.some((t) => referenceFieldFi(t) || (typeof t === 'string' && t.trim()))) {
    return true
  }
  return false
}

function associatedActivityHasContent(a?: AssociatedActivity): boolean {
  if (!a) return false
  return !!referenceFieldFi(a.type) || !!(a.note?.trim())
}

function associatedEventHasContent(e?: AssociatedEvent): boolean {
  if (!e) return false
  return (
    !!referenceFieldFi(e.name) ||
    !!referenceFieldFi(e.name_type) ||
    !!(e.actor?.some(roledActorRowHasContent)) ||
    !!(e.date?.some(temporalHasContent)) ||
    !!(e.place?.some(spatialRowHasContent)) ||
    !!(e.note?.trim())
  )
}

export function objectHistoryRowHasContent(row: ObjectHistory): boolean {
  if (associatedActivityHasContent(row.activity)) return true
  if (referenceFieldFi(row.cultural_affinity)) return true
  if (row.actor?.some(roledActorRowHasContent)) return true
  if (row.date?.some(temporalHasContent)) return true
  if (row.place?.some(spatialRowHasContent)) return true
  if (associatedEventHasContent(row.event)) return true
  if (row.note?.trim() || row.comments?.trim() || row.relevance?.trim()) return true
  return false
}

export function usageHistoryRowHasContent(u: UsageHistory): boolean {
  return (
    !!referenceFieldFi(u.usage) ||
    !!(u.note?.trim()) ||
    !!(u.usage_instructions?.trim())
  )
}

export function historyHasPersistableContent(h: History): boolean {
  if (h.owner_history?.some(ownershipRowHasContent)) return true
  if (h.object_production_information?.some(objectProductInformationRowHasContent)) return true
  if (h.usage_history?.some(usageHistoryRowHasContent)) return true
  if (h.object_history?.some(objectHistoryRowHasContent)) return true
  return false
}

/** Strip empty list rows and return undefined if nothing should persist. */
export function compactHistoryForSave(h: History): History | undefined {
  const out: History = { ...h }

  if (out.owner_history?.length) {
    out.owner_history = out.owner_history
      .map((row) => {
        const o = { ...row }
        if (o.exchange) {
          const x = { ...o.exchange }
          if (!referenceFieldFi(x.method)) delete x.method
          if (x.price == null || !Number.isFinite(x.price)) delete x.price
          if (!referenceFieldFi(x.denomination)) delete x.denomination
          if (x.note !== undefined && !x.note.trim()) delete x.note
          o.exchange = Object.keys(x).length > 0 ? x : undefined
        }
        if (o.date && !temporalHasContent(o.date)) delete o.date
        if (o.place && !spatialRowHasContent(o.place)) delete o.place
        if (o.owner && !actorRowHasContent(o.owner)) delete o.owner
        return o
      })
      .filter(ownershipRowHasContent)
    if (out.owner_history.length === 0) delete out.owner_history
  }

  if (out.object_production_information?.length) {
    out.object_production_information = out.object_production_information
      .map((row) => {
        const r = { ...row }
        if (r.actor?.length) {
          r.actor = r.actor.filter(roledActorRowHasContent)
          if (r.actor.length === 0) delete r.actor
        }
        if (r.technique_type?.length) {
          r.technique_type = r.technique_type.filter(
            (t) => referenceFieldFi(t) || (typeof t === 'string' && t.trim()),
          )
          if (r.technique_type.length === 0) delete r.technique_type
        }
        if (r.reason !== undefined && !r.reason.trim()) delete r.reason
        if (r.note !== undefined && !r.note.trim()) delete r.note
        if (r.technique !== undefined && !r.technique.trim()) delete r.technique
        if (r.date && !temporalHasContent(r.date)) delete r.date
        if (r.place && !spatialRowHasContent(r.place)) delete r.place
        return r
      })
      .filter(objectProductInformationRowHasContent)
    if (out.object_production_information.length === 0) delete out.object_production_information
  }

  if (out.usage_history?.length) {
    out.usage_history = out.usage_history.filter(usageHistoryRowHasContent)
    if (out.usage_history.length === 0) delete out.usage_history
  }

  if (out.object_history?.length) {
    out.object_history = out.object_history
      .map((row) => {
        const r = { ...row }
        if (r.activity && !associatedActivityHasContent(r.activity)) delete r.activity
        if (r.event) {
          const ev = { ...r.event }
          if (ev.actor?.length) {
            ev.actor = ev.actor.filter(roledActorRowHasContent)
            if (ev.actor.length === 0) delete ev.actor
          }
          if (ev.date?.length) {
            ev.date = ev.date.filter(temporalHasContent)
            if (ev.date.length === 0) delete ev.date
          }
          if (ev.place?.length) {
            ev.place = ev.place.filter(spatialRowHasContent)
            if (ev.place.length === 0) delete ev.place
          }
          if (ev.note !== undefined && !ev.note.trim()) delete ev.note
          if (!referenceFieldFi(ev.name)) delete ev.name
          if (!referenceFieldFi(ev.name_type)) delete ev.name_type
          if (associatedEventHasContent(ev)) r.event = ev
          else delete r.event
        }
        if (r.actor?.length) {
          r.actor = r.actor.filter(roledActorRowHasContent)
          if (r.actor.length === 0) delete r.actor
        }
        if (r.date?.length) {
          r.date = r.date.filter(temporalHasContent)
          if (r.date.length === 0) delete r.date
        }
        if (r.place?.length) {
          r.place = r.place.filter(spatialRowHasContent)
          if (r.place.length === 0) delete r.place
        }
        if (!referenceFieldFi(r.cultural_affinity)) delete r.cultural_affinity
        if (r.note !== undefined && !r.note.trim()) delete r.note
        if (r.comments !== undefined && !r.comments.trim()) delete r.comments
        if (r.relevance !== undefined && !r.relevance.trim()) delete r.relevance
        return r
      })
      .filter(objectHistoryRowHasContent)
    if (out.object_history.length === 0) delete out.object_history
  }

  return historyHasPersistableContent(out) ? out : undefined
}
