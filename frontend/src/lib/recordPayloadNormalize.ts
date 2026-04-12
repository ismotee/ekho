/**
 * Normalize API / legacy payload shapes for the record form.
 */

import type { RecordPayload } from '../types/record'
import type { ObjectLocation } from '../types/record/object-location'
import type { DateDetail, ReferenceField, Temporal } from '../types/record/common'
import type { Rights } from '../types/record/rights'
import { referenceFieldFi } from './referenceField'
import type { Spatial } from '../types/record/actor'
import { spatialRowHasContent } from './acquisitionPayload'
import { dateDetailHasPersistableContent } from './temporalPayload'

const TEMPORAL_TOP_KEYS = new Set(['text', 'note', 'association', 'period', 'earliest', 'latest'])

function isLikelyTemporalObject(o: Record<string, unknown>): boolean {
  const keys = Object.keys(o)
  if (keys.length === 0) return false
  return keys.every((k) => TEMPORAL_TOP_KEYS.has(k))
}

/** Migrate legacy `text` → `note` on Temporal-shaped objects (docs/data/actor-models.md). */
function migrateTemporalTextToNoteInPlace(o: Record<string, unknown>): void {
  if (!isLikelyTemporalObject(o)) return
  const legacy = o.text
  if (typeof legacy === 'string' && legacy.trim()) {
    const n = o.note
    if (typeof n !== 'string' || !n.trim()) o.note = legacy
  }
  delete o.text
}

/** Migrate legacy Temporal `text` → `note` anywhere in a JSON tree (records, actors, …). */
export function migrateLegacyTemporalTextInTree(value: unknown, path: string[] = []): void {
  if (value === null || value === undefined) return
  if (Array.isArray(value)) {
    value.forEach((item, i) => migrateLegacyTemporalTextInTree(item, [...path, String(i)]))
    return
  }
  if (typeof value !== 'object') return
  const o = value as Record<string, unknown>
  if (path.length > 0 && path[path.length - 1] === 'physical_description') {
    for (const k of Object.keys(o)) migrateLegacyTemporalTextInTree(o[k], [...path, k])
    return
  }
  migrateTemporalTextToNoteInPlace(o)
  for (const k of Object.keys(o)) migrateLegacyTemporalTextInTree(o[k], [...path, k])
}

/**
 * Legacy acquisition `date[]` rows mixed DateDetail fields (`single`, …) with temporal metadata on the same object.
 * Canonical shape is `Temporal` (earliest/latest DateDetail, top-level note / association / period).
 */
/** Exported for acquisition save compaction (legacy API rows may omit `earliest` / `latest`). */
/**
 * Migrate legacy `acquisition_time` saved as `Temporal` (or merged shapes) to `DateDetail`.
 */
export function migrateAcquisitionTimeToDateDetail(value: unknown): DateDetail | undefined {
  if (value == null || typeof value !== 'object') return undefined
  const o = value as Record<string, unknown>

  if (o.earliest || o.latest || o.association || o.period || o.note) {
    const earliest = o.earliest as { single?: string; certanity?: string; qualifier?: string } | undefined
    const latest = o.latest as { single?: string; certanity?: string; qualifier?: string } | undefined
    const pick =
      earliest?.single?.trim() ? earliest : latest?.single?.trim() ? latest : undefined
    const d: DateDetail = {}
    if (pick) {
      if (pick.single?.trim()) d.single = pick.single.trim()
      if (pick.certanity) d.certanity = pick.certanity as DateDetail['certanity']
      if (pick.qualifier) d.qualifier = pick.qualifier as DateDetail['qualifier']
    }
    const note = typeof o.note === 'string' ? o.note.trim() : ''
    const text = typeof o.text === 'string' ? o.text.trim() : ''
    if (note) d.text = note
    else if (text) d.text = text
    if (!pick?.single?.trim() && typeof o.single === 'string' && o.single.trim()) {
      d.single = o.single.trim()
    }
    return dateDetailHasPersistableContent(d) ? d : undefined
  }

  const d: DateDetail = {}
  if (typeof o.single === 'string' && o.single.trim()) d.single = o.single.trim()
  if (o.certanity) d.certanity = o.certanity as DateDetail['certanity']
  if (o.qualifier) d.qualifier = o.qualifier as DateDetail['qualifier']
  if (typeof o.text === 'string' && o.text.trim()) d.text = o.text.trim()
  return dateDetailHasPersistableContent(d) ? d : undefined
}

export function migrateAcquisitionDateListRowToTemporal(row: unknown): Temporal {
  if (!row || typeof row !== 'object') return {}
  const o = row as Record<string, unknown>
  if (o.earliest || o.latest) return row as Temporal

  const earliest: DateDetail = {}
  if (typeof o.single === 'string' && o.single.trim()) earliest.single = o.single.trim()
  if (o.certanity) earliest.certanity = o.certanity as DateDetail['certanity']
  if (o.qualifier) earliest.qualifier = o.qualifier as DateDetail['qualifier']

  const t: Temporal = {}
  if (Object.keys(earliest).length > 0) t.earliest = earliest
  const note = typeof o.note === 'string' ? o.note.trim() : ''
  const legacyText = typeof o.text === 'string' ? o.text.trim() : ''
  if (note) t.note = note
  else if (legacyText) t.note = legacyText
  if (o.association) t.association = o.association as Temporal['association']
  if (o.period) t.period = o.period as Temporal['period']
  return t
}

function normalizeAquisitionDetailsForForm(a: Record<string, unknown>): void {
  if ('acquisition_time' in a && a.acquisition_time != null) {
    const migrated = migrateAcquisitionTimeToDateDetail(a.acquisition_time)
    if (migrated && Object.keys(migrated).length > 0) {
      a.acquisition_time = migrated
    } else {
      delete a.acquisition_time
    }
  }
  const dates = a.date
  if (!Array.isArray(dates) || dates.length === 0) return
  a.date = dates.map((row) => {
    const t = migrateAcquisitionDateListRowToTemporal(row)
    const out = { ...t } as Temporal
    delete out.latest
    return out
  })
}

/** Migrate legacy `physical_description.object_component_name` → `object_component[]`. */
function normalizePhysicalDescriptionForForm(phys: Record<string, unknown>): void {
  const legacy = phys.object_component_name
  const comps = phys.object_component
  const hasComps = Array.isArray(comps) && comps.length > 0
  if (hasComps || legacy == null) {
    if ('object_component_name' in phys) delete phys.object_component_name
    return
  }
  const hasLegacy =
    typeof legacy === 'object' && legacy !== null && !Array.isArray(legacy)
      ? Object.keys(legacy as object).length > 0
      : typeof legacy === 'string' && legacy.trim().length > 0
  if (!hasLegacy) {
    delete phys.object_component_name
    return
  }
  phys.object_component = [{ object_name: { value: legacy as Record<string, unknown> } }]
  delete phys.object_component_name
}

/** Legacy `content.person` → `content.actors` (single slot became a list). */
function normalizeDescriptionContentActors(desc: Record<string, unknown>): void {
  const cont = desc.content
  if (!cont || typeof cont !== 'object' || Array.isArray(cont)) return
  const c = cont as Record<string, unknown>
  const legacy = c.person
  if (legacy != null && typeof legacy === 'object' && !Array.isArray(legacy)) {
    const cur = c.actors
    if (!Array.isArray(cur) || cur.length === 0) {
      c.actors = [legacy]
    }
    delete c.person
  } else if ('person' in c) {
    delete c.person
  }
}

/** Legacy single `content.place` → `content.places` (list of `Spatial`). */
function normalizeDescriptionContentPlaces(desc: Record<string, unknown>): void {
  const cont = desc.content
  if (!cont || typeof cont !== 'object' || Array.isArray(cont)) return
  const c = cont as Record<string, unknown>
  const legacy = c.place
  if (legacy != null && typeof legacy === 'object' && !Array.isArray(legacy)) {
    const cur = c.places
    if (!Array.isArray(cur) || cur.length === 0) {
      c.places = [legacy]
    }
    delete c.place
  } else if ('place' in c) {
    delete c.place
  }
}

/** Legacy single `content.date` → `content.dates` (list of `DateDetail`). */
function normalizeDescriptionContentDates(desc: Record<string, unknown>): void {
  const cont = desc.content
  if (!cont || typeof cont !== 'object' || Array.isArray(cont)) return
  const c = cont as Record<string, unknown>
  const legacy = c.date
  if (legacy != null && typeof legacy === 'object' && !Array.isArray(legacy)) {
    const cur = c.dates
    if (!Array.isArray(cur) || cur.length === 0) {
      c.dates = [legacy]
    }
    delete c.date
  } else if ('date' in c) {
    delete c.date
  }
}

/** Legacy single `content.activity` → `content.activity` (list of `ReferenceField`). */
function normalizeDescriptionContentActivity(desc: Record<string, unknown>): void {
  const cont = desc.content
  if (!cont || typeof cont !== 'object' || Array.isArray(cont)) return
  const c = cont as Record<string, unknown>
  const legacy = c.activity
  if (legacy == null) return
  if (Array.isArray(legacy)) return
  c.activity = [legacy]
}

/** Legacy single `content.general_concept` → list of `ReferenceField`. */
function normalizeDescriptionContentGeneralConcept(desc: Record<string, unknown>): void {
  const cont = desc.content
  if (!cont || typeof cont !== 'object' || Array.isArray(cont)) return
  const c = cont as Record<string, unknown>
  const legacy = c.general_concept
  if (legacy == null) return
  if (Array.isArray(legacy)) return
  c.general_concept = [legacy]
}

/** Legacy `content.event[].name` as Reference and `type` → `name_type`; `name` as plain string. */
function normalizeDescriptionContentEvents(desc: Record<string, unknown>): void {
  const cont = desc.content
  if (!cont || typeof cont !== 'object' || Array.isArray(cont)) return
  const c = cont as Record<string, unknown>
  const evs = c.event
  if (!Array.isArray(evs)) return
  c.event = evs.map((raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return raw
    const row = { ...(raw as Record<string, unknown>) }
    const n = row.name
    if (n != null && typeof n === 'object') {
      const s = referenceFieldFi(n as ReferenceField)
      row.name = s.trim() || undefined
    }
    if ('type' in row && !('name_type' in row)) {
      row.name_type = row.type
      delete row.type
    }
    return row
  })
}

/** Legacy `content.position` as Reference → plain string. */
function normalizeDescriptionContentPosition(desc: Record<string, unknown>): void {
  const cont = desc.content
  if (!cont || typeof cont !== 'object' || Array.isArray(cont)) return
  const c = cont as Record<string, unknown>
  const p = c.position
  if (p == null) return
  if (typeof p === 'string') {
    c.position = p.trim() || undefined
    return
  }
  if (typeof p === 'object') {
    const s = referenceFieldFi(p as ReferenceField).trim()
    c.position = s || undefined
  }
}

/** Material `source.note` removed from UI; strip when loading so stale data does not linger. */
function normalizeDescriptionMaterialSourceNotes(desc: Record<string, unknown>): void {
  const mats = desc.material
  if (!Array.isArray(mats)) return
  for (const row of mats) {
    if (!row || typeof row !== 'object') continue
    const r = row as { source?: Spatial }
    if (!r.source || typeof r.source !== 'object') continue
    const s = { ...r.source }
    delete (s as { note?: string }).note
    r.source = spatialRowHasContent(s) ? s : undefined
  }
}

/** Single-object `rights` from older API payloads is wrapped as a one-element list. */
export function normalizeRecordPayloadForForm(data: RecordPayload): RecordPayload {
  const raw = data.rights as unknown
  let out: RecordPayload = data
  if (raw != null && !Array.isArray(raw) && typeof raw === 'object') {
    out = { ...data, rights: [raw as Rights] }
  }
  const locRaw = out.object_location as unknown
  if (locRaw != null && !Array.isArray(locRaw) && typeof locRaw === 'object') {
    out = { ...out, object_location: [locRaw as ObjectLocation] }
  }
  if (out.identification_details && typeof out.identification_details === 'object' && 'collection' in out.identification_details) {
    const id = { ...out.identification_details }
    delete (id as Record<string, unknown>).collection
    out = {
      ...out,
      identification_details: Object.keys(id).length > 0 ? id : undefined,
    }
  }
  if (out.aquisition_details && typeof out.aquisition_details === 'object') {
    const acq = { ...(out.aquisition_details as Record<string, unknown>) }
    normalizeAquisitionDetailsForForm(acq)
    out = { ...out, aquisition_details: acq }
  }
  if (out.description && typeof out.description === 'object') {
    const desc = { ...(out.description as Record<string, unknown>) }
    normalizeDescriptionContentActors(desc)
    normalizeDescriptionContentPlaces(desc)
    normalizeDescriptionContentDates(desc)
    normalizeDescriptionContentActivity(desc)
    normalizeDescriptionContentGeneralConcept(desc)
    normalizeDescriptionContentEvents(desc)
    normalizeDescriptionContentPosition(desc)
    normalizeDescriptionMaterialSourceNotes(desc)
    const phys = desc.physical_description
    if (phys && typeof phys === 'object' && !Array.isArray(phys)) {
      const p = { ...(phys as Record<string, unknown>) }
      normalizePhysicalDescriptionForForm(p)
      desc.physical_description = Object.keys(p).length ? p : undefined
    }
    out = { ...out, description: Object.keys(desc).length ? desc : undefined }
  }
  migrateLegacyTemporalTextInTree(out)
  return out
}
