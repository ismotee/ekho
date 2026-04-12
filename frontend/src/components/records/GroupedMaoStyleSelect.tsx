import { useMemo } from 'react'
import type { ReferenceField, ReferencePayload } from '../../types/record/common'
import { MAO_STYLE_GROUPS, type MaoStyleItem } from '../../data/maoStyleGroups'
import { normalizeYsoUri } from '../../services/yso'
import { referenceFieldFi } from '../../lib/referenceField'
import { FieldInfoText } from './FieldInfoText'

const URI_TO_ITEM = (() => {
  const m = new Map<string, MaoStyleItem>()
  for (const g of MAO_STYLE_GROUPS) {
    for (const it of g.items) {
      m.set(normalizeYsoUri(it.uri), it)
    }
  }
  return m
})()

/** Finnish label → first matching item (legacy rows without URI). */
const FI_TO_ITEM = (() => {
  const m = new Map<string, MaoStyleItem>()
  for (const g of MAO_STYLE_GROUPS) {
    for (const it of g.items) {
      if (!m.has(it.fi)) m.set(it.fi, it)
    }
  }
  return m
})()

export interface GroupedMaoStyleSelectProps {
  id: string
  label: string
  infoKey?: string
  value: ReferenceField | undefined
  onChange: (next: ReferenceField | undefined) => void
  disabled?: boolean
  emptyLabel?: string
}

export function GroupedMaoStyleSelect({
  id,
  label,
  infoKey,
  value,
  onChange,
  disabled,
  emptyLabel = '—',
}: GroupedMaoStyleSelectProps) {
  const selectedUri = useMemo(() => {
    if (value == null) return ''
    if (typeof value === 'string') {
      const t = value.trim()
      if (!t) return ''
      const byFi = FI_TO_ITEM.get(t)
      return byFi ? normalizeYsoUri(byFi.uri) : ''
    }
    const raw = value.in_scheme?.trim()
    if (raw) {
      const u = normalizeYsoUri(raw)
      return URI_TO_ITEM.has(u) ? u : ''
    }
    const fi = referenceFieldFi(value)
    const byFi = fi ? FI_TO_ITEM.get(fi) : undefined
    return byFi ? normalizeYsoUri(byFi.uri) : ''
  }, [value])

  const legacyLabel = useMemo(() => {
    if (value == null) return null
    const fi = typeof value === 'string' ? value.trim() : referenceFieldFi(value)
    const raw =
      typeof value === 'object' && value && 'in_scheme' in value
        ? String((value as ReferencePayload).in_scheme ?? '').trim()
        : ''
    const uri = raw ? normalizeYsoUri(raw) : ''
    if (uri && URI_TO_ITEM.has(uri)) return null
    if (fi) return fi
    if (uri) return uri
    return null
  }, [value])

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      {infoKey ? <FieldInfoText infoKey={infoKey} /> : null}
      {legacyLabel ? <p className="record-form-repeatable-hint">{legacyLabel}</p> : null}
      <select
        id={id}
        value={selectedUri}
        onChange={(e) => {
          const uri = e.target.value.trim()
          if (!uri) {
            onChange(undefined)
            return
          }
          const item = URI_TO_ITEM.get(normalizeYsoUri(uri))
          if (!item) return
          onChange({
            pref_label: { fi: item.fi, en: item.en ?? item.fi },
            in_scheme: normalizeYsoUri(item.uri),
          })
        }}
        disabled={disabled}
      >
        <option value="">{emptyLabel}</option>
        {MAO_STYLE_GROUPS.map((g) => (
          <optgroup key={g.group} label={g.group}>
            {g.items.map((it) => (
              <option key={it.uri} value={normalizeYsoUri(it.uri)}>
                {it.fi}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
