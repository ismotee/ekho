/**
 * Generic recursive presentation for record domain JSON (RecordDetail sections).
 */

import { observer } from 'mobx-react-lite'
import type { i18n as I18nType } from 'i18next'
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { translateRecordFieldKey } from '../../lib/recordFieldLabel'
import { fintoConceptBrowserUrl } from '../../services/yso'
import { useActorStore } from '../../stores/actorStore'
import { recordActorDisplayName } from './actorMiniForm'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

const REFERENCE_LIKE_KEYS = new Set(['label', 'value', 'code'])

function referencePrefLabelPreview(obj: Record<string, unknown>): string | null {
  const pref = obj.pref_label
  if (!pref || typeof pref !== 'object' || Array.isArray(pref)) return null
  const pl = pref as Record<string, unknown>
  for (const k of ['fi', 'en', 'und'] as const) {
    const s = pl[k]
    if (typeof s === 'string' && s.trim()) return s.trim()
  }
  return null
}

function referenceLikePreview(obj: Record<string, unknown>): string | null {
  const fromPref = referencePrefLabelPreview(obj)
  if (fromPref) return fromPref
  const label = obj.label
  if (typeof label === 'string' && label.trim()) return label.trim()
  const v = obj.value
  if (typeof v === 'string' && v.trim()) return v.trim()
  const code = obj.code
  if (typeof code === 'string' && code.trim()) return code.trim()
  return null
}

function isReferenceLikeObject(obj: Record<string, unknown>): boolean {
  const keys = Object.keys(obj)
  return keys.length > 0 && keys.every((k) => REFERENCE_LIKE_KEYS.has(k))
}

interface NestedDomainFieldsProps {
  value: unknown
  /** Nesting depth; used to avoid runaway recursion. */
  depth?: number
  /** Parent JSON field key (e.g. `content` vs `object_history`) for disambiguating reused child keys like `activity`. */
  parentFieldKey?: string
}

const MAX_DEPTH = 12

/**
 * Renders arbitrary JSON-shaped domain data as label + value rows and nested lists.
 */
function fieldLabelForKey(k: string, parentFieldKey: string | undefined, i18n: I18nType, t: TFunction): string {
  if (parentFieldKey === 'content' && k === 'activity') {
    return t('recordForm.labels.contentActivity')
  }
  if (parentFieldKey === 'content' && k === 'position') {
    return t('recordForm.labels.contentPosition')
  }
  if (parentFieldKey === 'content' && k === 'script') {
    return t('recordForm.labels.contentScript')
  }
  if (parentFieldKey === 'content' && k === 'language') {
    return t('recordForm.labels.contentLanguage')
  }
  if (parentFieldKey === 'content_event_row' && k === 'name') {
    return t('recordForm.labels.contentSubEventName')
  }
  if (parentFieldKey === 'content_event_row' && k === 'name_type') {
    return t('recordForm.labels.contentSubEventNameType')
  }
  return translateRecordFieldKey(k, i18n, t)
}

function NestedDomainFieldsInner({ value, depth = 0, parentFieldKey }: NestedDomainFieldsProps) {
  const { t, i18n } = useTranslation()
  const actorStore = useActorStore()

  if (depth > MAX_DEPTH) {
    return <span className="record-field-truncated">{t('recordForm.detail.truncated')}</span>
  }

  if (value === null || value === undefined) {
    return <span className="record-field-empty">{t('recordForm.detail.noData')}</span>
  }

  if (typeof value === 'boolean') {
    return <span>{value ? t('recordForm.detail.yes') : t('recordForm.detail.no')}</span>
  }

  if (typeof value === 'number') {
    const em = t('recordForm.detail.emDash')
    return <span>{Number.isFinite(value) ? String(value) : em}</span>
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    const em = t('recordForm.detail.emDash')
    if (!trimmed) return <span className="record-field-empty">{em}</span>
    if (/^https?:\/\//i.test(trimmed)) {
      return (
        <a href={trimmed} className="record-field-link" target="_blank" rel="noopener noreferrer">
          {trimmed}
        </a>
      )
    }
    return <span className="record-field-text">{value}</span>
  }

  if (Array.isArray(value)) {
    const em = t('recordForm.detail.emDash')
    if (value.length === 0) {
      return <span className="record-field-empty">{em}</span>
    }
    const itemParentKey = parentFieldKey === 'event' ? 'content_event_row' : parentFieldKey
    return (
      <ul className="record-nested-list">
        {value.map((item, index) => (
          <li key={index} className="record-nested-list-item">
            <NestedDomainFieldsInner value={item} depth={depth + 1} parentFieldKey={itemParentKey} />
          </li>
        ))}
      </ul>
    )
  }

  if (isPlainObject(value)) {
    const idOnly = value as Record<string, unknown>
    if (
      Object.keys(idOnly).length === 1 &&
      idOnly.id != null &&
      typeof idOnly.id === 'number' &&
      Number.isFinite(idOnly.id) &&
      idOnly.id > 0
    ) {
      const aid = idOnly.id
      const catalog = actorStore.actorById(aid)
      const label = catalog ? recordActorDisplayName(catalog.data ?? {}).trim() : ''
      return (
        <span className="record-field-text">
          {label || t('recordForm.summaries.actorNumber', { id: aid })}
        </span>
      )
    }

    const entries = Object.entries(value).filter(([, v]) => v !== undefined)
    const em = t('recordForm.detail.emDash')
    if (entries.length === 0) {
      return <span className="record-field-empty">{em}</span>
    }

    const onlyRefKeys = Object.keys(value).every((k) => k === 'pref_label' || k === 'in_scheme')
    if (onlyRefKeys) {
      const refText = referencePrefLabelPreview(value)
      const schemeRaw = value.in_scheme
      const scheme = typeof schemeRaw === 'string' ? schemeRaw.trim() : ''
      const conceptPage = scheme ? fintoConceptBrowserUrl(scheme) : undefined
      const fintoLinkLabel = /\/koko\//i.test(scheme)
        ? 'KOKO'
        : /\/yso\//i.test(scheme)
          ? 'YSO'
          : /\/onto\/(?:mao|tao)\//i.test(scheme)
            ? 'MAO'
            : 'Finto'
      if (refText || conceptPage) {
        return (
          <span className="record-field-text">
            {refText || scheme}
            {conceptPage ? (
              <>
                {' '}
                <a className="record-field-link" href={conceptPage} target="_blank" rel="noopener noreferrer">
                  {fintoLinkLabel}
                </a>
              </>
            ) : null}
          </span>
        )
      }
    }

    if (isReferenceLikeObject(value)) {
      const preview = referenceLikePreview(value)
      if (preview != null) {
        return <span className="record-field-text">{preview}</span>
      }
    }

    return (
      <dl className="record-nested-dl">
        {entries.map(([k, v]) => (
          <div key={k} className="record-field-row">
            <dt className="record-field-label">{fieldLabelForKey(k, parentFieldKey, i18n, t)}</dt>
            <dd className="record-field-value">
              <NestedDomainFieldsInner value={v} depth={depth + 1} parentFieldKey={k} />
            </dd>
          </div>
        ))}
      </dl>
    )
  }

  return <span className="record-field-empty">{t('recordForm.detail.emDash')}</span>
}

export const NestedDomainFields = observer(NestedDomainFieldsInner)
