/**
 * Actor catalog `data` payload (docs/data/actor-models.md): exactly one of person or organization identifies the actor.
 */

import type {
  Actor,
  Address,
  BiographicalNote,
  Organization,
  OrganizationHistory,
  OtherName,
  Person,
  PersonName,
  Spatial,
} from '../types/record/actor'
import type { Label } from '../types/record/common'
import { migrateLegacyTemporalTextInTree } from './recordPayloadNormalize'
import { dateDetailHasPersistableContent, temporalHasPersistableContent } from './temporalPayload'

export function emptyActorData(): Actor {
  return { person: {}, organization: {} }
}

/** Single `PersonName`; coerce legacy array payloads to the first row. */
export function normalizePersonLastName(ln: PersonName | PersonName[] | undefined): PersonName | undefined {
  if (ln == null) return undefined
  if (Array.isArray(ln)) return ln.length ? ln[0] : undefined
  return ln
}

export function normalizeActorData(raw: Partial<Actor> | undefined): Actor {
  const pr = raw?.person ?? {}
  const last_name = normalizePersonLastName(
    pr.last_name as PersonName | PersonName[] | undefined,
  )
  const orgRaw = { ...(raw?.organization ?? {}) }
  if (orgRaw.contact_person) {
    const cp = orgRaw.contact_person
    const normalizedCp: Person = {
      ...cp,
      last_name: normalizePersonLastName(cp.last_name as PersonName | PersonName[] | undefined),
    }
    orgRaw.contact_person = personHasIdentity(normalizedCp) ? normalizedCp : undefined
    if (orgRaw.contact_person === undefined) {
      delete orgRaw.contact_person
    }
  }
  const out: Actor = {
    person: { ...pr, last_name },
    organization: orgRaw,
  }
  migrateLegacyTemporalTextInTree(out)
  return out
}

function labelHasText(l?: Label): boolean {
  return !!(l?.fi?.trim() || l?.en?.trim() || l?.und?.trim())
}

/** Collapsible repeatable: row has any name label or type ref (organization other names). */
export function organizationOtherNameRowHasContent(row: OtherName): boolean {
  return labelHasText(row.name) || refStringHasText(row.type)
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
    refStringHasText(s.association) ||
    refStringHasText(s.status)
  )
}

function bioHasText(b?: BiographicalNote): boolean {
  if (!b) return false
  if (b.note?.trim()) return true
  const src = b.source
  if (!src) return false
  return !!(
    src.note?.trim() ||
    refStringHasText(src.source_type) ||
    dateDetailHasPersistableContent(src.source_date)
  )
}

export function organizationHistoryHasContent(h?: OrganizationHistory): boolean {
  if (!h) return false
  return !!(
    (h.foundation_date && temporalHasPersistableContent(h.foundation_date)) ||
    (h.dissolution_date && temporalHasPersistableContent(h.dissolution_date)) ||
    spatialHasText(h.foundation_place) ||
    bioHasText(h.biographical_note)
  )
}

export function personNameRowHasIdentity(n?: PersonName): boolean {
  if (!n) return false
  if (n.name?.trim()) return true
  if (refStringHasText(n.name_type)) return true
  if (n.date && temporalHasPersistableContent(n.date)) return true
  return false
}

export function personHasIdentity(p?: Person): boolean {
  if (!p || typeof p !== 'object') return false
  if (p.first_name?.some(personNameRowHasIdentity)) return true
  if (personNameRowHasIdentity(p.last_name)) return true
  if (p.other_name?.some(personNameRowHasIdentity)) return true
  if (p.additions_to_name?.trim()) return true
  if (p.birth_date && temporalHasPersistableContent(p.birth_date)) return true
  if (p.death_date && temporalHasPersistableContent(p.death_date)) return true
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
  if (labelHasText(o.main_body) || labelHasText(o.sub_body)) return true
  if (o.other_name?.some((x) => labelHasText(x.name) || refStringHasText(x.type))) return true
  if (o.addition_to_name?.trim()) return true
  if (o.name_date && temporalHasPersistableContent(o.name_date)) return true
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
