import { useEffect, useMemo, useState } from 'react'
import AsyncSelect from 'react-select/async'
import type { MultiValue } from 'react-select'
import { useTranslation } from 'react-i18next'
import type { ReferencePayload } from '../../types/record/common'
import {
  fetchIconclassConceptLabels,
  notationFromIconclassUri,
  searchIconclass,
  type IconclassSearchItem,
} from '../../services/iconclass'
import { FieldInfoText } from './FieldInfoText'

export interface IconclassReferenceSelectProps {
  id: string
  label: string
  infoKey?: string
  value: ReferencePayload[]
  onChange: (next: ReferencePayload[]) => void
  disabled?: boolean
}

interface IconclassOption {
  value: string
  label: string
  finnishLabel?: string
  englishLabel?: string
  uri: string
}

function normalizeUri(raw: string): string {
  if (raw.startsWith('http://')) return `https://${raw.slice('http://'.length)}`
  return raw
}

function chipLabel(
  notation: string,
  storedFi: string,
  storedEn: string,
  overlay?: { fi?: string; en?: string },
): string {
  const fi = overlay?.fi?.trim() || storedFi
  const en = overlay?.en?.trim() || storedEn
  const storedFiIsNotation = notation && fi === notation
  if (!storedFiIsNotation && fi) return fi
  if (overlay?.fi?.trim()) return overlay.fi.trim()
  if (en) return en
  return notation || fi
}

export function IconclassReferenceSelect({
  id,
  label,
  infoKey,
  value,
  onChange,
  disabled,
}: IconclassReferenceSelectProps) {
  const { t } = useTranslation()
  const [labelOverlay, setLabelOverlay] = useState<Record<string, { fi?: string; en?: string }>>({})

  const legacyUrisKey = useMemo(() => {
    const uris = new Set<string>()
    for (const v of value ?? []) {
      const uri = v.in_scheme?.trim()
      if (!uri) continue
      const nUri = normalizeUri(uri)
      const notation = notationFromIconclassUri(uri)
      const fi = v.pref_label?.fi?.trim() ?? ''
      if (notation && fi === notation) uris.add(nUri)
    }
    return [...uris].sort().join('|')
  }, [value])

  useEffect(() => {
    if (!legacyUrisKey) return
    let cancelled = false
    const uris = legacyUrisKey.split('|').filter(Boolean)
    void (async () => {
      for (const uri of uris) {
        const labels = await fetchIconclassConceptLabels(uri)
        if (cancelled) return
        setLabelOverlay((prev) => {
          if (prev[uri]?.fi || prev[uri]?.en) return prev
          return { ...prev, [uri]: labels }
        })
      }
    })()
    return () => {
      cancelled = true
    }
  }, [legacyUrisKey])

  const selectedOptions: IconclassOption[] = useMemo(() => {
    const items: IconclassOption[] = []
    for (const v of value ?? []) {
      const uriRaw = v.in_scheme?.trim() || ''
      const uri = uriRaw ? normalizeUri(uriRaw) : ''
      const notation =
        notationFromIconclassUri(uriRaw) || v.pref_label?.fi?.trim() || ''
      if (!notation) continue
      const storedFi = v.pref_label?.fi?.trim() ?? ''
      const storedEn = v.pref_label?.en?.trim() ?? ''
      const overlay = uri ? labelOverlay[uri] : undefined
      const finnishLabel = overlay?.fi ?? (storedFi !== notation ? storedFi : undefined)
      const englishLabel = overlay?.en ?? (storedEn || undefined)
      const chip = chipLabel(notation, storedFi, storedEn, overlay)
      items.push({
        value: notation,
        label: chip,
        finnishLabel,
        englishLabel,
        uri: uri || `https://iconclass.org/${notation}`,
      })
    }
    return items
  }, [value, labelOverlay])

  const loadOptions = async (inputValue: string): Promise<IconclassOption[]> => {
    const q = inputValue.trim()
    if (q.length < 2) return []
    const results = await searchIconclass(q, 20)
    return results.map((item: IconclassSearchItem) => {
      const fi = item.finnishLabel?.trim()
      const en = item.englishLabel?.trim()
      return {
        value: item.notation,
        label: fi || en || item.notation,
        finnishLabel: fi || undefined,
        englishLabel: en || undefined,
        uri: item.uri,
      }
    })
  }

  const handleChange = (items: MultiValue<IconclassOption>) => {
    const next = items.map((item) => {
      const fi = item.finnishLabel?.trim() || item.englishLabel?.trim() || item.value
      const en = item.englishLabel?.trim() || item.finnishLabel?.trim() || item.value
      return {
        pref_label: { fi, en },
        in_scheme: item.uri,
      }
    })
    onChange(next)
  }

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <FieldInfoText infoKey={infoKey} />
      <AsyncSelect<IconclassOption, true>
        id={id}
        instanceId={id}
        isMulti
        cacheOptions
        defaultOptions={false}
        loadOptions={loadOptions}
        value={selectedOptions}
        onChange={handleChange}
        isDisabled={disabled}
        closeMenuOnSelect={false}
        hideSelectedOptions={true}
        getOptionLabel={(o) => o.finnishLabel || o.englishLabel || o.value}
        formatOptionLabel={(opt, { context }) => {
          const primary = opt.finnishLabel || opt.englishLabel || opt.value
          if (context === 'menu') {
            return `${primary} (${opt.value})`
          }
          return primary
        }}
        noOptionsMessage={({ inputValue }) =>
          inputValue.trim().length < 2
            ? t('recordForm.description.classificationSelect.typeMinChars')
            : t('recordForm.description.classificationSelect.noResults')
        }
        loadingMessage={() => t('recordForm.description.classificationSelect.loading')}
        placeholder={t('recordForm.description.classificationSelect.placeholder')}
      />
    </div>
  )
}
