/**
 * Actor slots in record JSON: catalog reference `{ id }` or legacy inline person/organization.
 */

import type { Actor, ActorField, ActorRef } from '../types/record/actor'

export type { ActorField, ActorRef }

export function isActorRef(v: unknown): v is ActorRef {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  return typeof o.id === 'number' && o.id > 0 && Object.keys(o).length === 1
}

export function actorRefId(v: ActorField | undefined): number | undefined {
  if (!v) return undefined
  return isActorRef(v) ? v.id : undefined
}

function legacyInlineActorHasContent(a: Actor): boolean {
  if (a.person?.first_name?.some((n) => n.name?.trim())) return true
  if (a.person?.last_name?.some((n) => n.name?.trim())) return true
  if (
    a.organization?.name?.some(
      (r) =>
        r.name?.fi?.trim() ||
        r.name?.en?.trim() ||
        r.name?.und?.trim() ||
        r.addition_to_name?.trim(),
    )
  )
    return true
  return false
}

/** True if slot has a catalog id or legacy inline content. */
export function actorFieldHasContent(v: ActorField | undefined): boolean {
  if (!v) return false
  if (isActorRef(v)) return true
  return legacyInlineActorHasContent(v)
}

export function legacyActorNeedsRebind(v: ActorField | undefined): boolean {
  return !!v && !isActorRef(v) && legacyInlineActorHasContent(v as Actor)
}
