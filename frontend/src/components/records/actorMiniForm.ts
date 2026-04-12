/**
 * Minimal person/org actor helpers for repeatable record form rows (acquisition, description, …).
 */

import i18n from '../../i18n'
import { unwrapAcquisitionActorSlot } from '../../lib/acquisitionPayload'
import { isActorRef } from '../../lib/actorField'
import { referenceFieldFi } from '../../lib/referenceField'
import type { AcquisitionActorListItem } from '../../types/record/aqcuisition'
import type { Actor, ActorField, RoledActor } from '../../types/record/actor'

export function recordActorLabelHasText(l?: { fi?: string; en?: string; und?: string }): boolean {
  if (!l) return false
  return !!(l.fi?.trim() || l.en?.trim() || l.und?.trim())
}

export function recordActorEditorKind(actor: Actor): 'person' | 'organization' {
  if (actor.organization?.name?.some((r) => recordActorLabelHasText(r.name))) {
    return 'organization'
  }
  if (actor.person?.first_name?.some((n) => n.name?.trim()) || actor.person?.last_name?.some((n) => n.name?.trim())) {
    return 'person'
  }
  return 'organization'
}

export function recordActorFieldDisplayName(
  v: ActorField | undefined,
  resolveCatalog: (id: number) => Actor | undefined,
): string {
  if (!v) return ''
  if (isActorRef(v)) {
    return recordActorDisplayName(resolveCatalog(v.id) ?? {})
  }
  return recordActorDisplayName(v)
}

/** True when the actor slot has no catalog ref and no displayable embedded actor. */
export function isActorSlotEmpty(v: ActorField | undefined): boolean {
  if (v == null) return true
  if (isActorRef(v)) return false
  return recordActorDisplayName(v).trim() === ''
}

/** Collapsed-row summary; with `resolveCatalog`, actor refs use the same label as the actor select (`recordActorDisplayName`). */
/** Collapsed summary for acquisition actor rows (optional role suffix). */
export function recordAcquisitionActorRowSummary(
  row: AcquisitionActorListItem | undefined,
  resolveCatalog?: (id: number) => Actor | undefined,
): string {
  const r = unwrapAcquisitionActorSlot(row)
  const name = recordActorSlotSummary(r.actor, resolveCatalog).trim()
  const roleFi = referenceFieldFi(r.acquisition_actor_role)
  if (name && roleFi) return `${name} (${roleFi})`
  if (name) return name
  if (roleFi) return roleFi
  return i18n.t('recordForm.summaries.emptyActor')
}

/** Collapsed summary for roled actor rows (actor + role term). */
export function recordRoledActorRowSummary(
  row: RoledActor | undefined,
  resolveCatalog?: (id: number) => Actor | undefined,
): string {
  const r = row ?? {}
  const name = recordActorSlotSummary(r.actor, resolveCatalog).trim()
  const assoc = referenceFieldFi(r.association as never).trim()
  if (name && assoc) return `${name} (${assoc})`
  if (name) return name
  if (assoc) return assoc
  return i18n.t('recordForm.summaries.emptyActor')
}

export function recordActorSlotSummary(
  v: ActorField | undefined,
  resolveCatalog?: (id: number) => Actor | undefined,
): string {
  if (!v) return i18n.t('recordForm.summaries.emptyActor')
  if (isActorRef(v)) {
    if (resolveCatalog) {
      const name = recordActorFieldDisplayName(v, resolveCatalog).trim()
      if (name) return name
    }
    return i18n.t('recordForm.summaries.actorNumber', { id: v.id })
  }
  const s = recordActorDisplayName(v).trim()
  return s || i18n.t('recordForm.summaries.legacyActor')
}

function orgNameLabelLine(r: { name?: { fi?: string; en?: string; und?: string } }): string | undefined {
  const n = r.name ?? {}
  const t = n.fi?.trim() || n.en?.trim() || n.und?.trim()
  return t || undefined
}

function organizationDisplayPart(actor: Actor): string {
  const rows = actor.organization?.name ?? []
  if (rows.length === 0) return ''
  const anyInUse = rows.some((r) => r.in_use === true)
  const nonempty = rows.filter((r) => recordActorLabelHasText(r.name))
  let useRows: typeof rows
  if (anyInUse) {
    useRows = rows.filter((r) => r.in_use === true && recordActorLabelHasText(r.name))
    if (useRows.length === 0) useRows = nonempty
  } else {
    useRows = nonempty
  }
  return useRows.map((r) => orgNameLabelLine(r)).filter(Boolean).join(' · ')
}

function legacyFirstPersonNameString(rows: { name?: string }[]): string {
  return rows.find((n) => n.name?.trim())?.name?.trim() ?? ''
}

/** Person name rows: if any row has `in_use`, only those rows (with a name string) build the label; else first nonempty (legacy). */
function personNameRowsDisplayPart(rows: { name?: string; in_use?: boolean }[] | undefined): string {
  if (!rows?.length) return ''
  const anyInUse = rows.some((n) => n.in_use === true)
  if (anyInUse) {
    const picked = rows.filter((n) => n.in_use === true && n.name?.trim())
    if (picked.length) return picked.map((n) => n.name!.trim()).join(' ')
    return legacyFirstPersonNameString(rows)
  }
  return legacyFirstPersonNameString(rows)
}

function personDisplayPart(actor: Actor): string {
  const first = personNameRowsDisplayPart(actor.person?.first_name)
  const last = personNameRowsDisplayPart(actor.person?.last_name)
  if (first && last) return `${first} ${last}`.trim()
  return (first || last || '').trim()
}

/** Primary label for cards and selects; combines person and organization when both are set. */
export function recordActorDisplayName(actor: Actor): string {
  const p = personDisplayPart(actor)
  const o = organizationDisplayPart(actor)
  if (p && o) return `${p} · ${o}`
  return p || o || ''
}
