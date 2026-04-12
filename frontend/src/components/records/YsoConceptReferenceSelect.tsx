import { useEffect, useMemo, useState } from 'react'
import AsyncSelect from 'react-select/async'
import type { MultiValue } from 'react-select'
import { useTranslation } from 'react-i18next'
import type { ReferencePayload } from '../../types/record/common'
import {
  fetchYsoConceptLabels,
  normalizeYsoUri,
  searchKokoConcepts,
  searchYsoConcepts,
  type YsoSearchItem,
} from '../../services/yso'
import { referenceFieldToPayload } from '../../lib/referenceField'
import { FieldInfoText } from './FieldInfoText'

export interface YsoConceptReferenceSelectProps {
  id: string
  label: string
  infoKey?: string
  /** Finto vocabulary for search (`yso` = YSO, `koko` = KOKO). */
  vocabulary?: 'yso' | 'koko'
  /** i18n key prefix for placeholder / loading / noResults / typeMinChars (e.g. `recordForm.description.contentKokoSelect`). */
  messagesKey?: string
  value: ReferencePayload[]
  onChange: (next: ReferencePayload[]) => void
  disabled?: boolean
}

type Option =
  | { kind: 'yso'; uri: string; label: string; fi?: string; en?: string }
  | { kind: 'legacy'; text: string }

function optionFromSearch(item: YsoSearchItem): Option {
  const fi = item.finnishLabel?.trim()
  const en = item.englishLabel?.trim()
  const label = fi || en || item.uri
  return {
    kind: 'yso',
    uri: item.uri,
    label,
    fi: fi || undefined,
    en: en || undefined,
  }
}

function optionToPayload(opt: Option): ReferencePayload | undefined {
  if (opt.kind === 'legacy') {
    return referenceFieldToPayload(opt.text)
  }
  const fi = opt.fi?.trim() || opt.label.trim()
  const en = opt.en?.trim() || opt.fi?.trim() || fi
  return {
    pref_label: { fi, en: en || fi },
    in_scheme: normalizeYsoUri(opt.uri),
  }
}

function optionKey(opt: Option): string {
  return opt.kind === 'yso' ? opt.uri : `legacy:${opt.text}`
}

export function YsoConceptReferenceSelect({
  id,
  label,
  infoKey,
  vocabulary = 'yso',
  messagesKey = 'recordForm.description.contentActivitySelect',
  value,
  onChange,
  disabled,
}: YsoConceptReferenceSelectProps) {
  const { t } = useTranslation()
  const [labelOverlay, setLabelOverlay] = useState<Record<string, { fi?: string; en?: string }>>({})

  const legacyUrisKey = useMemo(() => {
    const uris = new Set<string>()
    for (const v of value ?? []) {
      const uri = v.in_scheme?.trim()
      if (!uri) continue
      uris.add(normalizeYsoUri(uri))
    }
    return [...uris].sort().join('|')
  }, [value])

  useEffect(() => {
    if (!legacyUrisKey) {
      setLabelOverlay({})
      return
    }
    let cancelled = false
    const uris = legacyUrisKey.split('|').filter(Boolean)
    void (async () => {
      const next: Record<string, { fi?: string; en?: string }> = {}
      for (const uri of uris) {
        const labels = await fetchYsoConceptLabels(uri)
        if (cancelled) return
        next[uri] = labels
      }
      if (!cancelled) setLabelOverlay(next)
    })()
    return () => {
      cancelled = true
    }
  }, [legacyUrisKey])

  const selectedOptions: Option[] = useMemo(() => {
    const out: Option[] = []
    for (const v of value ?? []) {
      const uriRaw = v.in_scheme?.trim()
      const uri = uriRaw ? normalizeYsoUri(uriRaw) : ''
      const storedFi = v.pref_label?.fi?.trim() ?? ''
      const storedEn = v.pref_label?.en?.trim() ?? ''
      const overlay = uri ? labelOverlay[uri] : undefined
      const fi = overlay?.fi?.trim() || storedFi
      const en = overlay?.en?.trim() || storedEn
      if (uri) {
        const display = fi || en || uri
        out.push({
          kind: 'yso',
          uri,
          label: display,
          fi: fi || undefined,
          en: en || undefined,
        })
      } else if (storedFi || storedEn) {
        out.push({ kind: 'legacy', text: storedFi || storedEn })
      }
    }
    return out
  }, [value, labelOverlay])

  const loadOptions = async (inputValue: string): Promise<Option[]> => {
    const items =
      vocabulary === 'koko'
        ? await searchKokoConcepts(inputValue.trim(), 20)
        : await searchYsoConcepts(inputValue.trim(), 20)
    return items.map(optionFromSearch)
  }

  const handleChange = (items: MultiValue<Option>) => {
    const next: ReferencePayload[] = []
    for (const opt of items) {
      const p = optionToPayload(opt)
      if (p) next.push(p)
    }
    onChange(next)
  }

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <FieldInfoText infoKey={infoKey} />
      <AsyncSelect<Option, true>
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
        getOptionValue={optionKey}
        getOptionLabel={(o) => (o.kind === 'legacy' ? o.text : o.label)}
        formatOptionLabel={(opt, { context }) => {
          if (opt.kind === 'legacy') return opt.text
          if (context === 'menu') {
            const primary = opt.fi || opt.en || opt.label
            return opt.en && opt.fi && opt.fi !== opt.en ? `${primary} (${opt.en})` : primary
          }
          return opt.label
        }}
        noOptionsMessage={({ inputValue }) =>
          inputValue.trim().length < 2
            ? t(`${messagesKey}.typeMinChars`)
            : t(`${messagesKey}.noResults`)
        }
        loadingMessage={() => t(`${messagesKey}.loading`)}
        placeholder={t(`${messagesKey}.placeholder`)}
      />
    </div>
  )
}
