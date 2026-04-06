import type { ReferenceField, ReferencePayload } from '../types/record/common'

/** Finnish primary label for Reference<X> (object, legacy string, or legacy `{ label }`). */
export function referenceFieldFi(value: ReferenceField | undefined): string {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  const pl = value.pref_label
  if (pl && typeof pl.fi === 'string') return pl.fi.trim()
  const legacy = value as { label?: unknown }
  if (typeof legacy.label === 'string') return legacy.label.trim()
  return ''
}

export function referenceFieldToPayload(fi: string): ReferencePayload | undefined {
  const t = fi.trim()
  if (!t) return undefined
  return { pref_label: { fi: t } }
}

/** If current is non-empty and not in the doc list, prepend it so `<select>` can show legacy data. */
export function referenceSelectOptions(allowlist: readonly string[], currentFi: string): string[] {
  const cur = currentFi.trim()
  if (!cur) return [...allowlist]
  if (allowlist.includes(cur)) return [...allowlist]
  return [cur, ...allowlist]
}
