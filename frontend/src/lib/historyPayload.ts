/**
 * History domain helpers for save compaction (docs/data/history-models.md).
 */

import type { RoledActor, Spatial } from '../types/record/actor'
import type { DateDetail, ReferenceField } from '../types/record/common'
import type {
  AssociatedActivity,
  AssociatedEvent,
  History,
  ObjectHistory,
  ObjectProductInformation,
  Ownership,
  OwnershipExchange,
  Technique,
  UsageHistory,
} from '../types/record/history'
import { actorRowHasContent, spatialRowHasContent } from './acquisitionPayload'
import { referenceFieldFi, referenceFieldToPayload } from './referenceField'
import { dateDetailHasPersistableContent } from './temporalPayload'

function dateDetailHasContent(t?: { single?: string; certanity?: unknown; qualifier?: unknown }): boolean {
  return dateDetailHasPersistableContent(t)
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
  if (dateDetailHasContent(row.date)) return true
  if (row.place && spatialRowHasContent(row.place)) return true
  if (ownershipExchangeHasContent(row.exchange)) return true
  return false
}

export function roledActorRowHasContent(r: RoledActor): boolean {
  return (r.actor != null && actorRowHasContent(r.actor)) || !!referenceFieldFi(r.association)
}

function legacyTechniqueTypeEntryHasContent(t: unknown): boolean {
  if (t == null) return false
  if (typeof t === 'string') return !!t.trim()
  return !!referenceFieldFi(t as ReferenceField)
}

export function techniqueRowHasContent(t: Technique): boolean {
  return !!(referenceFieldFi(t.name) || referenceFieldFi(t.type))
}

/**
 * Merge legacy `technique` + `technique_type[]` into `techniques[]` and drop legacy keys.
 * If `techniques` is a non-empty array (including `{}` placeholders from “Lisää tekniikka”), keep it
 * and do not strip — only legacy migration collapses empty rows.
 */
export function migrateObjectProductInformationTechniques(
  row: ObjectProductInformation & { technique?: ReferenceField; technique_type?: ReferenceField[] },
): ObjectProductInformation {
  const hasTechniquesList = row.techniques != null && row.techniques.length > 0
  if (hasTechniquesList) {
    const out = { ...row }
    delete (out as { technique?: unknown }).technique
    delete (out as { technique_type?: unknown }).technique_type
    return out
  }

  const legacyName = row.technique
  const legacyTypes = (row.technique_type ?? []).filter(legacyTechniqueTypeEntryHasContent)
  const nameOk = !!referenceFieldFi(legacyName)

  let techniques: Technique[] | undefined
  if (legacyTypes.length > 0) {
    techniques = legacyTypes.map((typeItem) => ({
      ...(nameOk ? { name: legacyName } : {}),
      type:
        typeof typeItem === 'string'
          ? (referenceFieldToPayload(typeItem) as ReferenceField)
          : (typeItem as ReferenceField),
    }))
  } else if (nameOk) {
    techniques = [{ name: legacyName }]
  }

  const out: ObjectProductInformation = { ...row }
  delete (out as { technique?: unknown }).technique
  delete (out as { technique_type?: unknown }).technique_type
  if (techniques?.length) out.techniques = techniques
  else delete out.techniques
  return out
}

/** Legacy API may send a single `Spatial` for object history `place` or `event.place`; normalize to lists. */
export function normalizeObjectHistoryList(rows: ObjectHistory[]): ObjectHistory[] {
  return rows.map((row) => {
    let out: ObjectHistory = { ...row }
    const rawP = row.place as unknown
    if (rawP != null && !Array.isArray(rawP)) {
      out = { ...out, place: [rawP as Spatial] }
    }
    if (row.event) {
      const ev = row.event
      const rawEvP = ev.place as unknown
      if (rawEvP != null && !Array.isArray(rawEvP)) {
        out.event = { ...ev, place: [rawEvP as Spatial] }
      }
    }
    return out
  })
}

/** Legacy API may send a single DateDetail or Spatial; normalize to lists for the form. */
export function normalizeObjectProductionInformationList(
  rows: ObjectProductInformation[],
): ObjectProductInformation[] {
  return rows.map((row) => {
    let out: ObjectProductInformation = { ...row }
    const rawD = row.date as unknown
    if (rawD != null && !Array.isArray(rawD)) {
      out = { ...out, date: [rawD as DateDetail] }
    }
    const rawP = row.place as unknown
    if (rawP != null && !Array.isArray(rawP)) {
      out = { ...out, place: [rawP as Spatial] }
    }
    return migrateObjectProductInformationTechniques(out)
  })
}

export function objectProductInformationRowHasContent(row: ObjectProductInformation): boolean {
  if (row.actor?.some(roledActorRowHasContent)) return true
  if (row.date?.some((d) => dateDetailHasContent(d))) return true
  if (row.place?.some((p) => spatialRowHasContent(p))) return true
  if (row.reason?.trim() || row.note?.trim()) return true
  if (row.techniques?.some(techniqueRowHasContent)) return true
  const legacy = row as ObjectProductInformation & {
    technique?: ReferenceField
    technique_type?: ReferenceField[]
  }
  if (referenceFieldFi(legacy.technique)) return true
  if (legacy.technique_type?.some((t) => referenceFieldFi(t) || (typeof t === 'string' && t.trim()))) {
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
    !!(e.date?.some(dateDetailHasContent)) ||
    !!(e.place?.some(spatialRowHasContent))
  )
}

export function objectHistoryRowHasContent(row: ObjectHistory): boolean {
  if (associatedActivityHasContent(row.activity)) return true
  if (referenceFieldFi(row.cultural_affinity)) return true
  if (row.actor?.some(roledActorRowHasContent)) return true
  if (row.date?.some(dateDetailHasContent)) return true
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
        if (o.date && !dateDetailHasContent(o.date)) delete o.date
        if (o.place && !spatialRowHasContent(o.place)) delete o.place
        if (o.owner && !actorRowHasContent(o.owner)) delete o.owner
        return o
      })
      .filter(ownershipRowHasContent)
    if (out.owner_history.length === 0) delete out.owner_history
  }

  if (out.object_production_information?.length) {
    out.object_production_information = out.object_production_information
      .map((row) => migrateObjectProductInformationTechniques({ ...row }))
      .map((row) => {
        const r = { ...row }
        if (r.actor?.length) {
          r.actor = r.actor.filter(roledActorRowHasContent)
          if (r.actor.length === 0) delete r.actor
        }
        if (r.techniques?.length) {
          r.techniques = r.techniques
            .map((t) => {
              const tr = { ...t }
              if (!referenceFieldFi(tr.name)) delete tr.name
              if (!referenceFieldFi(tr.type)) delete tr.type
              return tr
            })
            .filter(techniqueRowHasContent)
          if (r.techniques.length === 0) delete r.techniques
        }
        if (r.reason !== undefined && !r.reason.trim()) delete r.reason
        if (r.note !== undefined && !r.note.trim()) delete r.note
        if (r.date?.length) {
          r.date = r.date.filter(dateDetailHasContent)
          if (r.date.length === 0) delete r.date
        }
        if (r.place?.length) {
          r.place = r.place.filter(spatialRowHasContent)
          if (r.place.length === 0) delete r.place
        }
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
          const { note: _legacyEventNote, ...ev } = r.event as AssociatedEvent & { note?: string }
          void _legacyEventNote
          if (ev.actor?.length) {
            ev.actor = ev.actor.filter(roledActorRowHasContent)
            if (ev.actor.length === 0) delete ev.actor
          }
          if (ev.date?.length) {
            ev.date = ev.date.filter(dateDetailHasContent)
            if (ev.date.length === 0) delete ev.date
          }
          if (ev.place?.length) {
            ev.place = ev.place.filter(spatialRowHasContent)
            if (ev.place.length === 0) delete ev.place
          }
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
          r.date = r.date.filter(dateDetailHasContent)
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
