import type { ObjectName, Title } from '../types/record/identification'
import { referenceFieldFi, referenceFieldToPayload } from './referenceField'

/** Object name language is not shown in the form; persisted as Finnish. */
export const IMPLICIT_OBJECT_NAME_LANGUAGE = 'suomi' as const

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

/** True when value or type is set; language alone does not count (implicit default). */
export function objectNameRowHasContent(row: ObjectName): boolean {
  return !!(referenceFieldFi(row.value) || referenceFieldFi(row.type))
}

export function mergeObjectNameWithImplicitLanguage(row: ObjectName, patch: Partial<ObjectName>): ObjectName {
  const next = { ...row, ...patch }
  const has = referenceFieldFi(next.value) || referenceFieldFi(next.type)
  return {
    ...next,
    language: has ? referenceFieldToPayload(IMPLICIT_OBJECT_NAME_LANGUAGE) : undefined,
  }
}
