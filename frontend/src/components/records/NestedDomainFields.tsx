/**
 * Generic recursive presentation for record domain JSON (RecordDetail sections).
 */

import { useMemo, useState, type ReactNode } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { isLanguageMapObject, pickLanguageMapString } from '../../lib/languageMapDisplay'
import { recordDomainFieldLabelForKey } from '../../lib/recordFieldLabel'
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
  /** When set (depth 0), used as the root row label instead of `parentFieldKey` (e.g. array element with primitive value). */
  rootLabelOverride?: string
  /** Optional field-label resolver, used by actor detail to localize field names with actor-specific i18n keys. */
  fieldLabelForKey?: (key: string, parentKey?: string) => string
}

const MAX_DEPTH = 12
const FIELD_TEXT_PAGE_CHAR_LIMIT = 700

function splitTextIntoPages(text: string, maxChars: number): string[] {
  const src = text.trim()
  if (!src) return ['']
  const pages: string[] = []
  let i = 0
  while (i < src.length) {
    let end = Math.min(i + maxChars, src.length)
    if (end < src.length) {
      const breakAt = src.lastIndexOf(' ', end)
      if (breakAt > i + Math.floor(maxChars * 0.6)) {
        end = breakAt
      }
    }
    const page = src.slice(i, end).trim()
    pages.push(page)
    i = end
    while (i < src.length && src[i] === ' ') i += 1
  }
  return pages.length > 0 ? pages : [src]
}

function PagedTextValue({ text }: { text: string }) {
  const { t } = useTranslation()
  const pages = useMemo(() => splitTextIntoPages(text, FIELD_TEXT_PAGE_CHAR_LIMIT), [text])
  const [page, setPage] = useState(0)
  const safePage = Math.min(Math.max(0, page), pages.length - 1)
  const hasPagination = pages.length > 1

  return (
    <div className="record-field-text-paged">
      <span className="record-field-text">{pages[safePage]}</span>
      {hasPagination ? (
        <div className="record-field-text-paged__controls">
          <button
            type="button"
            className="record-field-text-paged__nav-btn"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            {t('recordForm.detail.paginationPrevious')}
          </button>
          <span className="record-field-text-paged__status">
            {t('recordForm.detail.domainNavPageStatus', { current: safePage + 1, total: pages.length })}
          </span>
          <button
            type="button"
            className="record-field-text-paged__nav-btn"
            disabled={safePage >= pages.length - 1}
            onClick={() => setPage((p) => Math.min(pages.length - 1, p + 1))}
          >
            {t('recordForm.detail.paginationNext')}
          </button>
        </div>
      ) : null}
    </div>
  )
}

/**
 * Renders arbitrary JSON-shaped domain data as label + value rows and nested lists.
 */
function NestedDomainFieldsInner({
  value,
  depth = 0,
  parentFieldKey,
  rootLabelOverride,
  fieldLabelForKey,
}: NestedDomainFieldsProps) {
  const { t, i18n } = useTranslation()
  const actorStore = useActorStore()
  const resolveFieldLabel = (key: string, parentKey?: string) =>
    fieldLabelForKey?.(key, parentKey) ?? recordDomainFieldLabelForKey(key, parentKey, i18n, t)

  /** RecordDetail leaf panel: scalars need a field label row (or explicit root override). */
  const wrapRootFieldPanelRow = (node: ReactNode): ReactNode => {
    if (depth !== 0) return node
    const label =
      rootLabelOverride?.trim() ||
      (parentFieldKey != null && parentFieldKey !== ''
        ? resolveFieldLabel(parentFieldKey, undefined)
        : '')
    if (!label) return node
    return (
      <dl className="record-nested-dl">
        <div className="record-field-row">
          <dt className="record-field-label">{label}</dt>
          <dd className="record-field-value">{node}</dd>
        </div>
      </dl>
    )
  }

  if (depth > MAX_DEPTH) {
    return wrapRootFieldPanelRow(<span className="record-field-truncated">{t('recordForm.detail.truncated')}</span>)
  }

  if (value === null || value === undefined) {
    return wrapRootFieldPanelRow(<span className="record-field-empty">{t('recordForm.detail.noData')}</span>)
  }

  if (typeof value === 'boolean') {
    return wrapRootFieldPanelRow(<span>{value ? t('recordForm.detail.yes') : t('recordForm.detail.no')}</span>)
  }

  if (typeof value === 'number') {
    const em = t('recordForm.detail.emDash')
    return wrapRootFieldPanelRow(<span>{Number.isFinite(value) ? String(value) : em}</span>)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    const em = t('recordForm.detail.emDash')
    if (!trimmed) return wrapRootFieldPanelRow(<span className="record-field-empty">{em}</span>)
    if (/^https?:\/\//i.test(trimmed)) {
      return wrapRootFieldPanelRow(<PagedTextValue text={trimmed} />)
    }
    return wrapRootFieldPanelRow(<PagedTextValue text={value} />)
  }

  if (Array.isArray(value)) {
    const em = t('recordForm.detail.emDash')
    if (value.length === 0) {
      return wrapRootFieldPanelRow(<span className="record-field-empty">{em}</span>)
    }
    const itemParentKey = parentFieldKey === 'event' ? 'content_event_row' : parentFieldKey
    return wrapRootFieldPanelRow(
      <ul className="record-nested-list">
        {value.map((item, index) => (
          <li key={index} className="record-nested-list-item">
            <NestedDomainFieldsInner value={item} depth={depth + 1} parentFieldKey={itemParentKey} />
          </li>
        ))}
      </ul>,
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
      return wrapRootFieldPanelRow(
        <span className="record-field-text">
          {label || t('recordForm.summaries.actorNumber', { id: aid })}
        </span>,
      )
    }

    if (isLanguageMapObject(idOnly)) {
      const picked = pickLanguageMapString(idOnly, i18n.language)
      const em = t('recordForm.detail.emDash')
      return wrapRootFieldPanelRow(
        picked ? (
          <PagedTextValue text={picked} />
        ) : (
          <span className="record-field-empty">{em}</span>
        ),
      )
    }

    const entries = Object.entries(value).filter(([, v]) => v !== undefined)
    const em = t('recordForm.detail.emDash')
    if (entries.length === 0) {
      return wrapRootFieldPanelRow(<span className="record-field-empty">{em}</span>)
    }

    const onlyRefKeys = Object.keys(value).every((k) => k === 'pref_label' || k === 'in_scheme')
    if (onlyRefKeys) {
      const refText = referencePrefLabelPreview(value)
      const schemeRaw = value.in_scheme
      const scheme = typeof schemeRaw === 'string' ? schemeRaw.trim() : ''
      if (refText || scheme) {
        return wrapRootFieldPanelRow(<PagedTextValue text={refText || scheme} />)
      }
    }

    if (isReferenceLikeObject(value)) {
      const preview = referenceLikePreview(value)
      if (preview != null) {
        return wrapRootFieldPanelRow(<PagedTextValue text={preview} />)
      }
    }

    return (
      <dl className="record-nested-dl">
        {entries.map(([k, v]) => (
          <div key={k} className="record-field-row">
            <dt className="record-field-label">{resolveFieldLabel(k, parentFieldKey)}</dt>
            <dd className="record-field-value">
              <NestedDomainFieldsInner
                value={v}
                depth={depth + 1}
                parentFieldKey={k}
                fieldLabelForKey={fieldLabelForKey}
              />
            </dd>
          </div>
        ))}
      </dl>
    )
  }

  return wrapRootFieldPanelRow(<span className="record-field-empty">{t('recordForm.detail.emDash')}</span>)
}

export const NestedDomainFields = observer(NestedDomainFieldsInner)
