/**
 * Minimal person/org actor helpers for repeatable record form rows (acquisition, description, …).
 */

import i18n from '../../i18n'
import { isActorRef } from '../../lib/actorField'
import type { Actor, ActorField } from '../../types/record/actor'

export function recordActorLabelHasText(l?: { fi?: string; en?: string; und?: string }): boolean {
  if (!l) return false
  return !!(l.fi?.trim() || l.en?.trim() || l.und?.trim())
}

export function recordActorEditorKind(actor: Actor): 'person' | 'organization' {
  if (
    recordActorLabelHasText(actor.organization?.main_body) ||
    recordActorLabelHasText(actor.organization?.sub_body)
  ) {
    return 'organization'
  }
  if (actor.person?.first_name?.some((n) => n.name?.trim()) || actor.person?.last_name?.name?.trim()) {
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

/** Collapsed-row summary without requiring catalog to be loaded. */
export function recordActorSlotSummary(v: ActorField | undefined): string {
  if (!v) return i18n.t('recordForm.summaries.emptyActor')
  if (isActorRef(v)) return i18n.t('recordForm.summaries.actorNumber', { id: v.id })
  const s = recordActorDisplayName(v).trim()
  return s || i18n.t('recordForm.summaries.legacyActor')
}

function organizationDisplayPart(actor: Actor): string {
  const mb =
    actor.organization?.main_body?.fi?.trim() ||
    actor.organization?.main_body?.en?.trim() ||
    actor.organization?.main_body?.und?.trim()
  if (mb) return mb
  const sb =
    actor.organization?.sub_body?.fi?.trim() ||
    actor.organization?.sub_body?.en?.trim() ||
    actor.organization?.sub_body?.und?.trim()
  return sb ?? ''
}

function personDisplayPart(actor: Actor): string {
  const first = actor.person?.first_name?.find((n) => n.name?.trim())?.name?.trim()
  const last = actor.person?.last_name?.name?.trim()
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
