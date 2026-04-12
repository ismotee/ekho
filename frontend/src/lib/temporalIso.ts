/**
 * Trim and normalize Temporal / DateDetail for API save (ISO 8601-shaped strings).
 */

import type { Temporal } from '../types/record/common'
import { temporalHasPersistableContent } from './temporalPayload'

const TEMPORAL_TOP_KEYS = new Set(['text', 'note', 'association', 'period', 'earliest', 'latest'])
const DATE_DETAIL_KEYS = new Set(['single', 'certanity', 'qualifier'])

function isLikelyDateDetailObject(o: Record<string, unknown>): boolean {
  const keys = Object.keys(o)
  if (keys.length === 0) return false
  return keys.every((k) => DATE_DETAIL_KEYS.has(k))
}

/** Object mixes DateDetail keys with Temporal top-level keys (e.g. `single` + `note` on an acquisition date row). */
function isMergedDateTemporalRow(o: Record<string, unknown>): boolean {
  const keys = Object.keys(o)
  if (keys.length === 0) return false
  let hasDetail = false
  let hasTemporal = false
  for (const k of keys) {
    if (DATE_DETAIL_KEYS.has(k)) hasDetail = true
    if (TEMPORAL_TOP_KEYS.has(k)) hasTemporal = true
  }
  return hasDetail && hasTemporal
}

/** Normalize `single` / certainty / qualifier plus legacy note fields on a merged row (mutates in place). */
function normalizeMergedDateTemporalRowInPlace(o: Record<string, unknown>): void {
  normalizeDateDetailInPlace(o)
  const legacy = o.text
  if (typeof legacy === 'string' && legacy.trim()) {
    const n = o.note
    if (typeof n !== 'string' || !n.trim()) o.note = legacy.trim()
  }
  delete o.text
  const note = typeof o.note === 'string' ? o.note.trim() : ''
  if (note) o.note = note
  else delete o.note
  if (o.earliest && typeof o.earliest === 'object' && o.earliest !== null) {
    normalizeDateDetailInPlace(o.earliest as Record<string, unknown>)
  }
  if (o.latest && typeof o.latest === 'object' && o.latest !== null) {
    normalizeDateDetailInPlace(o.latest as Record<string, unknown>)
  }
}

function isLikelyTemporalObject(o: Record<string, unknown>): boolean {
  const keys = Object.keys(o)
  if (keys.length === 0) return false
  return keys.every((k) => TEMPORAL_TOP_KEYS.has(k))
}

function trimSingle(s: unknown): string | undefined {
  if (typeof s !== 'string') return undefined
  const t = s.trim()
  return t || undefined
}

function normalizeDateDetailInPlace(d: Record<string, unknown>): void {
  d.single = trimSingle(d.single)
  const c = d.certanity
  if (typeof c === 'string') {
    const t = c.trim()
    d.certanity = t || undefined
  }
  const q = d.qualifier
  if (typeof q === 'string') {
    const t = q.trim()
    d.qualifier = t || undefined
  }
}

/** Mutates a plain object in place if it matches Temporal wire shape. */
export function finalizeTemporalObjectForSave(o: Record<string, unknown>): void {
  if (!isLikelyTemporalObject(o)) return

  const legacy = o.text
  if (typeof legacy === 'string' && legacy.trim()) {
    const n = o.note
    if (typeof n !== 'string' || !n.trim()) o.note = legacy.trim()
  }
  delete o.text

  const note = typeof o.note === 'string' ? o.note.trim() : ''
  if (note) o.note = note
  else delete o.note

  if (o.earliest && typeof o.earliest === 'object' && o.earliest !== null) {
    normalizeDateDetailInPlace(o.earliest as Record<string, unknown>)
  }
  if (o.latest && typeof o.latest === 'object' && o.latest !== null) {
    normalizeDateDetailInPlace(o.latest as Record<string, unknown>)
  }

  const t = o as unknown as Temporal
  if (!temporalHasPersistableContent(t)) {
    for (const k of Object.keys(o)) delete o[k]
  }
}

function isPhysicalDescriptionValuePath(path: string[]): boolean {
  return path.length > 0 && path[path.length - 1] === 'physical_description'
}

/** Walk JSON tree; `path` is parent keys from root (e.g. description.physical_description must not be treated as Temporal). */
export function finalizeTemporalDeep(value: unknown, path: string[] = []): void {
  if (value === null || value === undefined) return
  if (Array.isArray(value)) {
    value.forEach((item, i) => finalizeTemporalDeep(item, [...path, String(i)]))
    return
  }
  if (typeof value !== 'object') return
  const o = value as Record<string, unknown>

  if (isPhysicalDescriptionValuePath(path)) {
    for (const k of Object.keys(o)) finalizeTemporalDeep(o[k], [...path, k])
    return
  }

  if (isMergedDateTemporalRow(o)) {
    normalizeMergedDateTemporalRowInPlace(o)
    for (const k of Object.keys(o)) finalizeTemporalDeep(o[k], [...path, k])
    return
  }

  if (isLikelyDateDetailObject(o)) {
    normalizeDateDetailInPlace(o)
    return
  }
  finalizeTemporalObjectForSave(o)
  for (const k of Object.keys(o)) finalizeTemporalDeep(o[k], [...path, k])
}

