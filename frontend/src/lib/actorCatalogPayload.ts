/**
 * Actor catalog `data` payload (docs/data/actor-models.md): exactly one of person or organization identifies the actor.
 */

import type {
  Actor,
  Address,
  BiographicalNote,
  Organization,
  OrganizationHistory,
  NameDetail,
  Person,
  PersonName,
  Spatial,
} from '../types/record/actor'
import type { DateDetailWithTemporalMeta, Label, Temporal } from '../types/record/common'
import {
  ACTOR_ORGANIZATION_ADDRESS_TYPE_AUTO_FI,
  ACTOR_PERSON_ADDRESS_TYPE_AUTO_FI,
} from '../data/actorFormAllowlists'
import { migrateLegacyTemporalTextInTree } from './recordPayloadNormalize'
import { referenceFieldFi } from './referenceField'
import { dateDetailHasPersistableContent, temporalNote } from './temporalPayload'

export function emptyActorData(): Actor {
  return { person: {}, organization: {} }
}

/** `last_name` is a list; coerce legacy single-object payloads to a one-element list. */
export function normalizePersonLastNameList(ln: PersonName | PersonName[] | undefined): PersonName[] | undefined {
  if (ln == null) return undefined
  if (Array.isArray(ln)) return ln.length ? ln : undefined
  return [ln]
}

/** Legacy `PersonName.date` was Temporal; coerce to DateDetail (optionally merged with note/association/period). */
function coercePersonNameDateForForm(v: unknown): DateDetailWithTemporalMeta | undefined {
  if (v == null || typeof v !== 'object') return undefined
  const d = v as Temporal & DateDetailWithTemporalMeta
  if (dateDetailHasPersistableContent(d)) {
    return d as DateDetailWithTemporalMeta
  }
  const t = v as Temporal
  if (t.earliest || t.latest) {
    const e = t.earliest
    const l = t.latest
    const merged: DateDetailWithTemporalMeta = {
      single: e?.single?.trim() || l?.single?.trim(),
      certanity: e?.certanity ?? l?.certanity,
      qualifier: e?.qualifier ?? l?.qualifier,
      note: temporalNote(t) || undefined,
      association: referenceFieldFi(t.association) ? t.association : undefined,
      period: referenceFieldFi(t.period) ? t.period : undefined,
    }
    return dateDetailHasPersistableContent(merged) ? merged : undefined
  }
  return undefined
}

/** Same idea as organization address: implicit type when any line is filled; strip when empty. */
function normalizePersonAddress(p: Person): Person {
  const addr = p.address
  if (!addr) return p
  const hasContact = !!(addr.text?.trim() || addr.email?.trim() || addr.phone_number?.trim())
  if (!hasContact) {
    const { address: _a, ...rest } = p
    return rest
  }
  return {
    ...p,
    address: { ...addr, type: ACTOR_PERSON_ADDRESS_TYPE_AUTO_FI },
  }
}

function normalizePersonNameDates(p: Person): Person {
  const first = p.first_name?.map((row) => ({
    ...row,
    date: coercePersonNameDateForForm(row.date),
  }))
  const last = p.last_name?.map((row) => ({
    ...row,
    date: coercePersonNameDateForForm(row.date),
  }))
  const other = p.other_name?.map((row) => ({
    ...row,
    date: coercePersonNameDateForForm(row.date),
  }))
  return {
    ...p,
    first_name: first,
    last_name: last,
    other_name: other,
    birth_date: coercePersonNameDateForForm(p.birth_date),
    death_date: coercePersonNameDateForForm(p.death_date),
  }
}

const DROPPED_ORG_KEYS = ['main_body', 'sub_body', 'other_name', 'addition_to_name', 'name_date'] as const

function normalizeOrganizationShape(raw: Record<string, unknown>): Organization {
  const o = { ...raw }
  for (const k of DROPPED_ORG_KEYS) {
    delete o[k]
  }

  const org = o as Organization
  if (Array.isArray(raw.name) && raw.name.length) {
    org.name = raw.name as NameDetail[]
  } else {
    delete org.name
  }

  const contact_person = raw.contact_person
  if (contact_person && typeof contact_person === 'object') {
    const cp = contact_person as Person
    const normalizedCp: Person = normalizePersonAddress(
      normalizePersonNameDates({
        ...cp,
        last_name: normalizePersonLastNameList(cp.last_name as PersonName | PersonName[] | undefined),
      }),
    )
    org.contact_person = personHasIdentity(normalizedCp) ? normalizedCp : undefined
  }

  const addr = org.address
  if (addr) {
    const hasContact = !!(addr.text?.trim() || addr.email?.trim() || addr.phone_number?.trim())
    if (hasContact) {
      org.address = { ...addr, type: ACTOR_ORGANIZATION_ADDRESS_TYPE_AUTO_FI }
    } else {
      org.address = undefined
    }
  }

  return org
}

export function normalizeActorData(raw: Partial<Actor> | undefined): Actor {
  const pr = raw?.person ?? {}
  const last_name = normalizePersonLastNameList(
    pr.last_name as PersonName | PersonName[] | undefined,
  )
  const orgRaw = normalizeOrganizationShape({ ...(raw?.organization ?? {}) } as Record<string, unknown>)
  const out: Actor = {
    person: normalizePersonAddress(normalizePersonNameDates({ ...pr, last_name })),
    organization: orgRaw,
  }
  migrateLegacyTemporalTextInTree(out)
  return out
}

function labelHasText(l?: Label): boolean {
  return !!(l?.fi?.trim() || l?.en?.trim() || l?.und?.trim())
}

/** Collapsible repeatable: any persisted field on an organization name row. */
export function organizationNameDetailRowHasContent(row: NameDetail): boolean {
  if (labelHasText(row.name)) return true
  if (refStringHasText(row.name_type)) return true
  if (row.addition_to_name?.trim()) return true
  if (dateDetailHasPersistableContent(row.earliest) || dateDetailHasPersistableContent(row.latest))
    return true
  return false
}

function refStringHasText(v: unknown): boolean {
  if (v == null) return false
  if (typeof v === 'string') return !!v.trim()
  if (typeof v === 'object' && v !== null && 'pref_label' in (v as object)) {
    const pl = (v as { pref_label?: Label }).pref_label
    return labelHasText(pl)
  }
  return false
}

function addressHasText(a?: Address): boolean {
  if (!a) return false
  return !!(
    a.text?.trim() ||
    a.email?.trim() ||
    a.phone_number?.trim() ||
    refStringHasText(a.type)
  )
}

function spatialHasText(s?: Spatial): boolean {
  if (!s) return false
  return !!(
    labelHasText(s.name) ||
    s.note?.trim() ||
    s.environmental_details?.trim() ||
    s.position?.trim() ||
    refStringHasText(s.name_type) ||
    refStringHasText(s.status) ||
    s.coordinates?.text?.trim() ||
    (s.coordinates?.coordinates_qualifier != null && String(s.coordinates.coordinates_qualifier).trim()) ||
    refStringHasText(s.coordinates?.coordinates_type) ||
    (s.reference_number && typeof s.reference_number.text === 'string' && s.reference_number.text.trim()) ||
    refStringHasText(s.reference_number?.type)
  )
}

function bioHasText(b?: BiographicalNote): boolean {
  if (!b) return false
  if (b.note?.trim()) return true
  const src = b.source
  if (!src) return false
  return !!(
    src.citation?.trim() ||
    src.note?.trim() ||
    refStringHasText(src.source_type) ||
    dateDetailHasPersistableContent(src.source_date)
  )
}

export function organizationHistoryHasContent(h?: OrganizationHistory): boolean {
  if (!h) return false
  return !!(
    (h.foundation_date && dateDetailHasPersistableContent(h.foundation_date)) ||
    (h.dissolution_date && dateDetailHasPersistableContent(h.dissolution_date)) ||
    spatialHasText(h.foundation_place) ||
    bioHasText(h.biographical_note)
  )
}

export function personNameRowHasIdentity(n?: PersonName): boolean {
  if (!n) return false
  if (n.name?.trim()) return true
  if (refStringHasText(n.name_type)) return true
  if (n.date && dateDetailHasPersistableContent(n.date)) return true
  return false
}

export function personHasIdentity(p?: Person): boolean {
  if (!p || typeof p !== 'object') return false
  if (p.first_name?.some(personNameRowHasIdentity)) return true
  if (p.last_name?.some(personNameRowHasIdentity)) return true
  if (p.other_name?.some(personNameRowHasIdentity)) return true
  if (p.additions_to_name?.trim()) return true
  if (p.birth_date && dateDetailHasPersistableContent(p.birth_date)) return true
  if (p.death_date && dateDetailHasPersistableContent(p.death_date)) return true
  if (spatialHasText(p.place_of_birth)) return true
  if (refStringHasText(p.gender)) return true
  if (refStringHasText(p.nationality)) return true
  if (addressHasText(p.address)) return true
  if (p.website?.trim()) return true
  if (refStringHasText(p.school_or_style)) return true
  if (refStringHasText(p.occupation)) return true
  if (p.reference_number?.text?.trim()) return true
  if (bioHasText(p.biographical_note)) return true
  return false
}

export function organizationHasIdentity(o?: Organization): boolean {
  if (!o || typeof o !== 'object') return false
  if (o.name?.some(organizationNameDetailRowHasContent)) return true
  if (refStringHasText(o.function)) return true
  if (addressHasText(o.address)) return true
  if (o.website?.trim()) return true
  const rn = o.reference_number
  if (rn && typeof rn === 'object' && 'text' in rn && (rn as { text?: string }).text?.trim()) return true
  if (organizationHistoryHasContent(o.history)) return true
  return false
}

/** Exactly one of person or organization must carry identifying data. */
export function actorCatalogHasIdentity(a: Actor): boolean {
  const pi = personHasIdentity(a.person)
  const oi = organizationHasIdentity(a.organization)
  return (pi && !oi) || (oi && !pi)
}

/** Which catalog branch identifies this actor, if unambiguous. */
export function inferActorCatalogKind(a: Actor): 'person' | 'organization' | null {
  const pi = personHasIdentity(a.person)
  const oi = organizationHasIdentity(a.organization)
  if (pi && !oi) return 'person'
  if (oi && !pi) return 'organization'
  return null
}
