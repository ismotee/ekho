/**
 * Temporal domain helpers (docs/data/common-models.md, actor-models.md).
 */

import type { Temporal } from '../types/record/common'
import { referenceFieldFi } from './referenceField'

export function dateDetailHasPersistableContent(d?: {
  single?: string
  certanity?: unknown
  qualifier?: unknown
}): boolean {
  if (!d) return false
  if (d.single?.trim()) return true
  if (referenceFieldFi(d.certanity as never)) return true
  if (referenceFieldFi(d.qualifier as never)) return true
  return false
}

/** Free-text / note: canonical `note`, legacy `text`. */
export function temporalNote(t?: Temporal): string {
  return (t?.note ?? t?.text ?? '').trim()
}

/** One-line summary for collapsible rows (cards, repeatables). */
export function temporalSummaryLine(t?: Temporal): string {
  if (!t) return ''
  const n = temporalNote(t)
  if (n) return n.length > 80 ? `${n.slice(0, 77)}…` : n
  const assoc = referenceFieldFi(t.association)
  if (assoc) return assoc
  const per = referenceFieldFi(t.period)
  if (per) return per
  const es = t.earliest?.single?.trim()
  if (es) return es
  const ls = t.latest?.single?.trim()
  if (ls) return ls
  return ''
}

/** True when the temporal object has any field we persist in v1 forms. */
export function temporalHasPersistableContent(t: Temporal): boolean {
  if (temporalNote(t)) return true
  if (referenceFieldFi(t.association)) return true
  if (referenceFieldFi(t.period)) return true
  if (dateDetailHasPersistableContent(t.earliest) || dateDetailHasPersistableContent(t.latest)) return true
  return false
}
