/**
 * Temporal domain helpers (docs/data/common-models.md, actor-models.md).
 */

import type { DateDetailWithTemporalMeta, Temporal } from '../types/record/common'
import type { ObjectProductInformation } from '../types/record/history'
import { referenceFieldFi } from './referenceField'

/** True when a DateDetail value should be kept on save — includes optional temporal metadata on the same object (note, association, period). */
export function dateDetailHasPersistableContent(d?: {
  single?: string
  certanity?: unknown
  qualifier?: unknown
  note?: unknown
  text?: unknown
  association?: unknown
  period?: unknown
}): boolean {
  if (!d) return false
  if (d.single?.trim()) return true
  if (referenceFieldFi(d.certanity as never)) return true
  if (referenceFieldFi(d.qualifier as never)) return true
  if (temporalNote(d as Temporal)) return true
  if (referenceFieldFi(d.association as never)) return true
  if (referenceFieldFi(d.period as never)) return true
  return false
}

/** One-line summary for collapsible rows when the value is DateDetail (optionally merged with temporal metadata). */
export function dateDetailSummaryLine(d?: DateDetailWithTemporalMeta): string {
  if (!d) return ''
  const s = d.single?.trim()
  if (s) return s.length > 80 ? `${s.slice(0, 77)}…` : s
  const n = temporalNote(d as Temporal)
  if (n) return n.length > 80 ? `${n.slice(0, 77)}…` : n
  const q = referenceFieldFi(d.qualifier as never)
  if (q) return q
  const c = referenceFieldFi(d.certanity as never)
  if (c) return c
  const assoc = referenceFieldFi(d.association as never)
  if (assoc) return assoc
  const per = referenceFieldFi(d.period as never)
  if (per) return per
  return ''
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

/**
 * Title card: first non-empty one-line summary from `object_production_information[].date[]`
 * (same ordering as form: first OPI block, first date row with displayable content).
 */
export function objectProductionTimeForTitleCard(rows: ObjectProductInformation[] | undefined): string {
  for (const row of rows ?? []) {
    for (const d of row.date ?? []) {
      const line = dateDetailSummaryLine(d as DateDetailWithTemporalMeta).trim()
      if (line) return line
    }
  }
  return ''
}
