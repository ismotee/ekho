/**
 * Maps the legacy flat create/edit form fields ↔ RecordPayload until the form is sectioned by domain.
 */

import { firstTitleValueTrimmed } from '../../lib/identificationTitles'
import type { IdentificationDetails } from './identification'
import type { RecordPayload } from './payload'
import { RECORD_DATA_DOMAIN_KEYS } from './payload'

export interface FlatRecordFormFields {
  title: string
  artist: string
  year: string
  medium: string
  dimensions: string
  description: string
  condition: string
}

export function recordPayloadFromFlatForm(fields: FlatRecordFormFields): RecordPayload {
  const payload: RecordPayload = {}
  const titleTrim = fields.title.trim()
  const id: IdentificationDetails = {}
  if (titleTrim) id.title = [{ value: titleTrim }]
  if (Object.keys(id).length) payload.identification_details = id

  const physLines: string[] = []
  if (fields.medium.trim()) physLines.push(`Medium: ${fields.medium.trim()}`)
  if (fields.dimensions.trim()) physLines.push(`Dimensions: ${fields.dimensions.trim()}`)
  if (fields.condition.trim()) physLines.push(`Condition: ${fields.condition.trim()}`)

  const contentLines: string[] = []
  if (fields.artist.trim()) contentLines.push(`Artist: ${fields.artist.trim()}`)
  if (fields.year.trim()) contentLines.push(`Year: ${fields.year.trim()}`)
  if (fields.description.trim()) contentLines.push(fields.description.trim())

  const physText = physLines.join('\n')
  const contentText = contentLines.join('\n')

  if (physText || contentText) {
    payload.description = {}
    if (physText) payload.description.physical_description = { text: physText }
    if (contentText) payload.description.content = { description: contentText }
  }

  return payload
}

export function flatFormStateFromRecordPayload(data: RecordPayload): FlatRecordFormFields {
  const title = firstTitleValueTrimmed(data.identification_details?.title) || ''
  const phys = data.description?.physical_description?.text ?? ''
  const content = data.description?.content?.description ?? ''

  const medium = extractLine(phys, 'Medium: ')
  const dimensions = extractLine(phys, 'Dimensions: ')
  const condition = extractLine(phys, 'Condition: ')

  const artist = extractLine(content, 'Artist: ')
  const year = extractLine(content, 'Year: ')
  const description = stripLeadingStructuredLines(content)

  return { title, artist, year, medium, dimensions, description, condition }
}

function extractLine(block: string, prefix: string): string {
  const line = block.split('\n').find((l) => l.startsWith(prefix))
  return line ? line.slice(prefix.length).trim() : ''
}

function stripLeadingStructuredLines(block: string): string {
  return block
    .split('\n')
    .filter((line) => !/^\s*Artist:\s*/.test(line) && !/^\s*Year:\s*\d/.test(line))
    .join('\n')
    .trim()
}

/** Shallow merge by domain key so a partial form save does not wipe other sections. */
export function mergeRecordPayload(base: RecordPayload | undefined, patch: RecordPayload): RecordPayload {
  const out: RecordPayload = { ...(base ?? {}) }
  for (const key of RECORD_DATA_DOMAIN_KEYS) {
    if (patch[key] !== undefined) {
      // Each domain key is independent; assign without forcing an impossible intersection type.
      ;(out as Record<string, unknown>)[key] = patch[key]
    }
  }
  return out
}
