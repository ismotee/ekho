import type { ObjectName, Title } from '../types/record/identification'
import { referenceFieldFi } from './referenceField'

/** New shape is `title: Title[]`; accept legacy single `Title` object when reading API data. */
export function identificationTitlesAsList(title: Title | Title[] | null | undefined): Title[] {
  if (title == null) return []
  return Array.isArray(title) ? title : [title]
}

export function firstTitleValueTrimmed(title: Title | Title[] | null | undefined): string {
  for (const t of identificationTitlesAsList(title)) {
    const v = t.value?.trim()
    if (v) return v
  }
  return ''
}

export function titleRowHasContent(row: Title): boolean {
  return !!(
    row.value?.trim() ||
    row.note?.trim() ||
    referenceFieldFi(row.type) ||
    referenceFieldFi(row.language)
  )
}

export function objectNameRowHasContent(row: ObjectName): boolean {
  return !!(referenceFieldFi(row.value) || referenceFieldFi(row.type) || referenceFieldFi(row.language))
}
