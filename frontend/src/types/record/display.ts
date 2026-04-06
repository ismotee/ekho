/**
 * List/detail display helpers (see plan: card summary rules).
 */

import { firstTitleValueTrimmed } from '../../lib/identificationTitles'
import { referenceFieldFi } from '../../lib/referenceField'
import type { RecordPayload } from './payload'

export interface RecordDisplaySource {
  data: RecordPayload
  representative_image: string | null
}

/** Inputs needed for list card copy and thumbnail (see getRecordCardSummary). */
export type RecordCardSummarySource = RecordDisplaySource & {
  collection_name?: string
}

export interface RecordCardSummary {
  primaryLabel: string
  secondaryLine?: string
  yearLine?: string
  thumbnailUrl?: string
  collectionName?: string
}

export function getRecordPrimaryLabel(data: RecordPayload): string {
  const id = data.identification_details
  const title = firstTitleValueTrimmed(id?.title)
  if (title) return title
  const firstName = referenceFieldFi(id?.object_name?.[0]?.value)
  if (firstName) return firstName
  const num = id?.object_number?.trim()
  if (num) return num
  return 'Untitled record'
}

export function getRecordSecondaryLine(data: RecordPayload): string | undefined {
  const id = data.identification_details
  const parts: string[] = []
  const ot = id?.object_type
  if (ot != null && ot !== '') {
    const s = referenceFieldFi(ot)
    if (s) parts.push(s)
  }
  return parts.length ? parts.join(' · ') : undefined
}

/** Best-effort: legacy flat form stored `Artist:` / `Year:` lines in content.description. */
export function getLegacyArtistLine(data: RecordPayload): string | undefined {
  const text = data.description?.content?.description
  if (!text) return undefined
  const m = text.match(/^\s*Artist:\s*(.+)$/m)
  return m?.[1]?.trim()
}

export function getLegacyYearLine(data: RecordPayload): string | undefined {
  const text = data.description?.content?.description
  if (!text) return undefined
  const m = text.match(/^\s*Year:\s*(\d{4})\s*$/m)
  return m?.[1]?.trim()
}

/** Tertiary card line: legacy `Year:` line, else first acquisition Temporal hint. */
export function getRecordCardYearLine(data: RecordPayload): string | undefined {
  const legacy = getLegacyYearLine(data)
  if (legacy) return legacy
  const first = data.aquisition_details?.date?.[0]
  if (!first) return undefined
  const note = (first.note ?? first.text)?.trim()
  if (note) {
    if (/^\d{4}$/.test(note)) return note
    const m = note.match(/\b(1\d{3}|20\d{2})\b/)
    if (m) return m[1]
  }
  const es = first.earliest?.single?.trim()
  if (es && /^\d{4}$/.test(es)) return es
  const ls = first.latest?.single?.trim()
  if (ls && /^\d{4}$/.test(ls)) return ls
  return undefined
}

function extractPrefixedLine(block: string, prefix: string): string {
  const line = block.split('\n').find((l) => l.startsWith(prefix))
  return line ? line.slice(prefix.length).trim() : ''
}

export function getLegacyMedium(data: RecordPayload): string | undefined {
  const text = data.description?.physical_description?.text
  if (!text) return undefined
  const v = extractPrefixedLine(text, 'Medium: ')
  return v || undefined
}

export function getLegacyDimensions(data: RecordPayload): string | undefined {
  const text = data.description?.physical_description?.text
  if (!text) return undefined
  const v = extractPrefixedLine(text, 'Dimensions: ')
  return v || undefined
}

export function getLegacyCondition(data: RecordPayload): string | undefined {
  const text = data.description?.physical_description?.text
  if (!text) return undefined
  const v = extractPrefixedLine(text, 'Condition: ')
  return v || undefined
}

export function getLegacyFreeDescription(data: RecordPayload): string | undefined {
  const text = data.description?.content?.description
  if (!text) return undefined
  const rest = text
    .split('\n')
    .filter((line) => !/^\s*Artist:\s*/.test(line) && !/^\s*Year:\s*\d/.test(line))
    .join('\n')
    .trim()
  return rest || undefined
}

export function getRecordThumbnailUrl(source: RecordDisplaySource): string | undefined {
  return source.representative_image || undefined
}

/** Single place to derive list-card strings and thumbnail from a record. */
export function getRecordCardSummary(source: RecordCardSummarySource): RecordCardSummary {
  const data = source.data ?? {}
  return {
    primaryLabel: getRecordPrimaryLabel(data),
    secondaryLine: getRecordSecondaryLine(data),
    yearLine: getRecordCardYearLine(data),
    thumbnailUrl: getRecordThumbnailUrl(source),
    collectionName: source.collection_name?.trim() || undefined,
  }
}
