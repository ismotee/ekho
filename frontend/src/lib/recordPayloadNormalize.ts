/**
 * Normalize API / legacy payload shapes for the record form.
 */

import type { RecordPayload } from '../types/record'
import type { Rights } from '../types/record/rights'

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

/** Single-object `rights` from older API payloads is wrapped as a one-element list. */
export function normalizeRecordPayloadForForm(data: RecordPayload): RecordPayload {
  const raw = data.rights as unknown
  let out: RecordPayload = data
  if (raw != null && !Array.isArray(raw) && typeof raw === 'object') {
    out = { ...data, rights: [raw as Rights] }
  }
  migrateLegacyTemporalTextInTree(out)
  return out
}
