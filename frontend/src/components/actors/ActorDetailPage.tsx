/**
 * Read-only actor detail; links to edit for owner.
 */

import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useActorStore } from '../../stores/actorStore'
import { useAuthStore } from '../../stores/authStore'
import { inferActorCatalogKind } from '../../lib/actorCatalogPayload'
import { isLanguageMapObject, pickLanguageMapString } from '../../lib/languageMapDisplay'
import { recordActorDisplayName } from '../records/actorMiniForm'
import { NestedDomainFields } from '../records/NestedDomainFields'
import '../records/Records.css'
import './Actors.css'

type ActorDetailSectionKey = 'person' | 'organization'
type FieldPathSegment = string | number
type DrillEntry = { kind: 'key'; key: string } | { kind: 'index'; index: number; label: string }

const DOMAIN_NAV_GRID_PAGE_SIZE = 12
const HIDDEN_ACTOR_DETAIL_FIELD_KEYS = new Set(['in_use'])

const ACTOR_DETAIL_SECTIONS: readonly { key: ActorDetailSectionKey; headingKey: string }[] = [
  { key: 'person', headingKey: 'actors.form.person' },
  { key: 'organization', headingKey: 'actors.form.organization' },
] as const

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isActorSectionEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (Array.isArray(value)) return value.length === 0
  if (isPlainObject(value) && Object.keys(value).length === 0) return true
  return false
}

function nonEmptyRootSubkeys(sectionValue: unknown): string[] {
  if (!isPlainObject(sectionValue)) return []
  return Object.entries(sectionValue)
    .filter(([, v]) => !isActorSectionEmpty(v))
    .map(([k]) => k)
}

function getValueAtSectionPath(sectionRoot: unknown, path: FieldPathSegment[]): unknown {
  let cur: unknown = sectionRoot
  for (const seg of path) {
    if (cur === null || cur === undefined) return undefined
    if (typeof seg === 'number') {
      if (!Array.isArray(cur)) return undefined
      cur = cur[seg]
    } else {
      if (!isPlainObject(cur)) return undefined
      cur = cur[seg]
    }
  }
  return cur
}

function tileLabelForArrayItem(item: unknown, index: number): string {
  if (typeof item === 'string' && item.trim() !== '') return item.trim()
  if (typeof item === 'number' && Number.isFinite(item)) return String(item)
  if (isPlainObject(item)) {
    const prefLabelText = readablePrefLabelFromObject(item, 'fi')
    if (prefLabelText) return prefLabelText
    for (const key of ['text', 'value', 'name', 'label', 'type'] as const) {
      const candidate = item[key]
      if (typeof candidate === 'string' && candidate.trim() !== '') return candidate.trim()
    }
  }
  return `${index + 1}`
}

function readablePrefLabelFromObject(obj: Record<string, unknown>, languageTag: string): string | null {
  const pref = obj.pref_label
  if (!isPlainObject(pref)) return null
  if (!isLanguageMapObject(pref)) return null
  return pickLanguageMapString(pref, languageTag)
}

function isPrefLabelReferenceObject(value: unknown): boolean {
  if (!isPlainObject(value)) return false
  const keys = Object.keys(value)
  if (keys.length === 0) return false
  if (!keys.every((k) => k === 'pref_label' || k === 'in_scheme')) return false
  return readablePrefLabelFromObject(value, 'fi') != null
}

function valueSupportsFieldDrillNav(value: unknown): boolean {
  if (isPlainObject(value)) {
    if (isLanguageMapObject(value)) return false
    if (isPrefLabelReferenceObject(value)) return false
    return nonEmptyRootSubkeys(value).length > 0
  }
  if (Array.isArray(value)) return value.length > 0
  return false
}

function readableFieldKey(key: string): string {
  const spaced = key.replaceAll('_', ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export const ActorDetailPage = observer(() => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const actorStore = useActorStore()
  const authStore = useAuthStore()
  const numId = id ? Number(id) : NaN

  const [selectedDomainKey, setSelectedDomainKey] = useState<ActorDetailSectionKey | null>(null)
  const [fieldPath, setFieldPath] = useState<FieldPathSegment[]>([])
  const [domainPage, setDomainPage] = useState(0)
  const [subsectionPage, setSubsectionPage] = useState(0)
  const [drillPage, setDrillPage] = useState(0)

  useEffect(() => {
    if (!Number.isFinite(numId)) return
    actorStore.fetchActor(numId).catch(() => {})
  }, [actorStore, numId])

  useEffect(() => {
    actorStore.fetchActors({ page_size: 200 }).catch(() => {})
  }, [actorStore])

  const a = actorStore.currentActor?.id === numId ? actorStore.currentActor : actorStore.actorById(numId)
  const isMine = authStore.user?.id != null && a?.owner?.id === authStore.user.id

  useLayoutEffect(() => {
    if (!a?.id) return
    setSelectedDomainKey(null)
    setFieldPath([])
    setDomainPage(0)
    setSubsectionPage(0)
    setDrillPage(0)
  }, [a?.id, a?.updated_at])

  const actorFieldLabel = useCallback(
    (key: string) => {
      const i18nKey = `actors.form.fields.${key}`
      const translated = t(i18nKey)
      return translated === i18nKey ? readableFieldKey(key) : translated
    },
    [t],
  )

  if (actorStore.loading && !a) {
    return (
      <div className="record-detail actor-detail-page" role="status">
        {t('common.loading')}
      </div>
    )
  }

  if (!a) {
    return (
      <div className="record-detail actor-detail-page empty-state">
        {t('actors.detail.notFound')}
      </div>
    )
  }

  const label = recordActorDisplayName(a.data ?? {})
  const title = label.trim() || t('actors.actorNumber', { id: a.id })
  const kind = inferActorCatalogKind(a.data ?? {})
  const secondaryLine =
    kind === 'person'
      ? t('actors.form.person')
      : kind === 'organization'
        ? t('actors.form.organization')
        : null
  const data = (a.data ?? {}) as Record<string, unknown>
  const nonEmptySections = ACTOR_DETAIL_SECTIONS.filter(({ key }) => !isActorSectionEmpty(data[key]))
  const hasAnySection = nonEmptySections.length > 0

  const domainPageCount = Math.max(1, Math.ceil(nonEmptySections.length / DOMAIN_NAV_GRID_PAGE_SIZE))
  const safeDomainPage = Math.min(domainPage, domainPageCount - 1)
  const domainPageSlice = nonEmptySections.slice(
    safeDomainPage * DOMAIN_NAV_GRID_PAGE_SIZE,
    safeDomainPage * DOMAIN_NAV_GRID_PAGE_SIZE + DOMAIN_NAV_GRID_PAGE_SIZE,
  )

  const selectedSectionValue = selectedDomainKey ? data[selectedDomainKey] : undefined
  const subsectionKeys = useMemo(
    () => nonEmptyRootSubkeys(selectedSectionValue).filter((key) => !HIDDEN_ACTOR_DETAIL_FIELD_KEYS.has(key)),
    [selectedSectionValue],
  )
  const subsectionPageCount = Math.max(1, Math.ceil(subsectionKeys.length / DOMAIN_NAV_GRID_PAGE_SIZE))
  const safeSubsectionPage = Math.min(subsectionPage, subsectionPageCount - 1)
  const subsectionPageSlice = subsectionKeys.slice(
    safeSubsectionPage * DOMAIN_NAV_GRID_PAGE_SIZE,
    safeSubsectionPage * DOMAIN_NAV_GRID_PAGE_SIZE + DOMAIN_NAV_GRID_PAGE_SIZE,
  )

  const valueAtFieldPath = useMemo(
    () =>
      selectedSectionValue !== undefined ? getValueAtSectionPath(selectedSectionValue, fieldPath) : undefined,
    [selectedSectionValue, fieldPath],
  )
  const drillEntries: DrillEntry[] = useMemo(() => {
    if (!valueSupportsFieldDrillNav(valueAtFieldPath)) return []
    if (isPlainObject(valueAtFieldPath)) {
      return nonEmptyRootSubkeys(valueAtFieldPath)
        .filter((key) => !HIDDEN_ACTOR_DETAIL_FIELD_KEYS.has(key))
        .map((key) => ({ kind: 'key', key }))
    }
    if (Array.isArray(valueAtFieldPath)) {
      return valueAtFieldPath.map((item, index) => ({
        kind: 'index',
        index,
        label: tileLabelForArrayItem(item, index),
      }))
    }
    return []
  }, [valueAtFieldPath])

  const drillPageCount = Math.max(1, Math.ceil(drillEntries.length / DOMAIN_NAV_GRID_PAGE_SIZE))
  const safeDrillPage = Math.min(drillPage, drillPageCount - 1)
  const drillPageSlice = drillEntries.slice(
    safeDrillPage * DOMAIN_NAV_GRID_PAGE_SIZE,
    safeDrillPage * DOMAIN_NAV_GRID_PAGE_SIZE + DOMAIN_NAV_GRID_PAGE_SIZE,
  )

  const showDomainTiles = selectedDomainKey == null
  const showSubsectionTiles = selectedDomainKey != null && fieldPath.length === 0
  const showDrillTiles = selectedDomainKey != null && fieldPath.length > 0 && drillEntries.length > 0
  const showFieldPanel =
    selectedDomainKey != null &&
    fieldPath.length > 0 &&
    (!valueSupportsFieldDrillNav(valueAtFieldPath) || drillEntries.length === 0)

  const leafParentKey: string | undefined =
    fieldPath.length > 0 && typeof fieldPath[fieldPath.length - 1] === 'string'
      ? (fieldPath[fieldPath.length - 1] as string)
      : undefined

  const leafRootLabelOverride = useMemo(() => {
    if (fieldPath.length === 0) return undefined
    const last = fieldPath[fieldPath.length - 1]
    if (typeof last !== 'number') return undefined
    const arrKey = fieldPath[fieldPath.length - 2]
    if (typeof arrKey !== 'string') return undefined
    return `${actorFieldLabel(arrKey)} (${last + 1})`
  }, [fieldPath, actorFieldLabel])

  useLayoutEffect(() => {
    setDomainPage((p) => Math.min(p, Math.max(0, domainPageCount - 1)))
  }, [domainPageCount, a.id])

  useLayoutEffect(() => {
    setSubsectionPage((p) => Math.min(p, Math.max(0, subsectionPageCount - 1)))
  }, [subsectionPageCount, selectedDomainKey, a.id])

  useLayoutEffect(() => {
    setDrillPage((p) => Math.min(p, Math.max(0, drillPageCount - 1)))
  }, [drillPageCount, fieldPath])

  const openDomain = useCallback((key: ActorDetailSectionKey) => {
    setSelectedDomainKey(key)
    setFieldPath([])
    setSubsectionPage(0)
    setDrillPage(0)
  }, [])

  const goToAllDomains = useCallback(() => {
    setSelectedDomainKey(null)
    setFieldPath([])
    setDomainPage(0)
    setSubsectionPage(0)
    setDrillPage(0)
  }, [])

  const openSubsection = useCallback((key: string) => {
    setFieldPath([key])
    setDrillPage(0)
  }, [])

  const appendFieldPathSegment = useCallback((segment: FieldPathSegment) => {
    setFieldPath((p) => [...p, segment])
    setDrillPage(0)
  }, [])

  const goToFieldPath = useCallback((path: FieldPathSegment[]) => {
    setFieldPath(path)
    setDrillPage(0)
  }, [])

  const breadcrumbLabelForPathPrefix = useCallback(
    (pathPrefix: FieldPathSegment[]) => {
      if (pathPrefix.length === 0 || selectedSectionValue === undefined) return ''
      const last = pathPrefix[pathPrefix.length - 1]
      if (typeof last === 'string') return actorFieldLabel(last)
      const arr = getValueAtSectionPath(selectedSectionValue, pathPrefix.slice(0, -1))
      const idx = last as number
      if (Array.isArray(arr) && arr[idx] !== undefined) return tileLabelForArrayItem(arr[idx], idx)
      return `${idx + 1}`
    },
    [selectedSectionValue, actorFieldLabel],
  )

  return (
    <div className="record-detail actor-detail-page">
      <div className={hasAnySection ? 'record-detail-hero-layout record-detail-hero-layout--has-domains' : 'record-detail-hero-layout'}>
        <div className={hasAnySection ? 'record-detail-hero-primary-column actor-detail-hero' : 'record-detail-hero-leading actor-detail-hero'}>
          <Link to="/actors" className="record-detail-back-link">
            {t('actors.form.backToActors')}
          </Link>
          <div className="record-info-section record-detail-title-card">
            <h1>{title}</h1>
            {secondaryLine != null && secondaryLine !== '' && (
              <p className="record-detail-subline">{secondaryLine}</p>
            )}

            <div className="record-meta">
              <small>
                <strong>{t('recordForm.detail.created')}</strong> {new Date(a.created_at).toLocaleDateString()}
                {' · '}
                <strong>{t('recordForm.detail.updated')}</strong> {new Date(a.updated_at).toLocaleDateString()}
              </small>
            </div>

            {authStore.isAuthenticated && isMine && (
              <div className="actor-detail-actions">
                <Link to={`/actors/${a.id}/edit`} className="btn btn-primary">
                  {t('common.edit')}
                </Link>
              </div>
            )}
          </div>
        </div>

        {hasAnySection ? (
          <nav className="record-detail-domain-nav record-detail-domain-nav--split-root" aria-label={t('actors.detail.dataBySectionAria')}>
            {selectedDomainKey != null ? (
              <div
                className="record-detail-domain-nav__breadcrumb record-detail-top-breadcrumb"
                role="group"
                aria-label={t('actors.detail.breadcrumbNavAria')}
              >
                <button
                  type="button"
                  className="record-detail-domain-nav__crumb record-detail-domain-nav__crumb--link"
                  onClick={goToAllDomains}
                >
                  {t('actors.detail.allDomains')}
                </button>
                <span className="record-detail-domain-nav__crumb-sep" aria-hidden>
                  /
                </span>
                {fieldPath.length === 0 ? (
                  <span className="record-detail-domain-nav__crumb" aria-current="page">
                    {t(selectedDomainKey === 'person' ? 'actors.form.person' : 'actors.form.organization')}
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      className="record-detail-domain-nav__crumb record-detail-domain-nav__crumb--link"
                      onClick={() => goToFieldPath([])}
                    >
                      {t(selectedDomainKey === 'person' ? 'actors.form.person' : 'actors.form.organization')}
                    </button>
                    {fieldPath.map((_, i) => {
                      const prefix = fieldPath.slice(0, i + 1)
                      const labelForCrumb = breadcrumbLabelForPathPrefix(prefix)
                      const isLast = i === fieldPath.length - 1
                      return (
                        <Fragment key={`${i}-${labelForCrumb}`}>
                          <span className="record-detail-domain-nav__crumb-sep" aria-hidden>
                            /
                          </span>
                          {isLast ? (
                            <span className="record-detail-domain-nav__crumb" aria-current="page">
                              {labelForCrumb}
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="record-detail-domain-nav__crumb record-detail-domain-nav__crumb--link"
                              onClick={() => goToFieldPath(prefix)}
                            >
                              {labelForCrumb}
                            </button>
                          )}
                        </Fragment>
                      )
                    })}
                  </>
                )}
              </div>
            ) : null}

            <div className="record-detail-domain-nav__sync">
              {showDomainTiles ? (
                <>
                  {domainPageCount > 1 ? (
                    <div className="record-detail-domain-nav__pagination">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={safeDomainPage <= 0}
                        onClick={() => setDomainPage((p) => Math.max(0, p - 1))}
                      >
                        {t('actors.detail.paginationPrevious')}
                      </button>
                      <span className="record-detail-domain-nav__page-indicator">
                        {t('actors.detail.domainNavPageStatus', {
                          current: safeDomainPage + 1,
                          total: domainPageCount,
                        })}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={safeDomainPage >= domainPageCount - 1}
                        onClick={() => setDomainPage((p) => Math.min(domainPageCount - 1, p + 1))}
                      >
                        {t('actors.detail.paginationNext')}
                      </button>
                    </div>
                  ) : null}
                  <div className="record-detail-domain-nav__grid record-detail-domain-nav__grid--sync-fill">
                    {domainPageSlice.map(({ key, headingKey }) => (
                      <button key={key} type="button" className="record-detail-domain-nav__tile" onClick={() => openDomain(key)}>
                        <span className="record-detail-domain-nav__tile-label">{t(headingKey)}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {showSubsectionTiles ? (
                <>
                  {subsectionPageCount > 1 ? (
                    <div className="record-detail-domain-nav__pagination">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={safeSubsectionPage <= 0}
                        onClick={() => setSubsectionPage((p) => Math.max(0, p - 1))}
                      >
                        {t('actors.detail.paginationPrevious')}
                      </button>
                      <span className="record-detail-domain-nav__page-indicator">
                        {t('actors.detail.subsectionNavPageStatus', {
                          current: safeSubsectionPage + 1,
                          total: subsectionPageCount,
                        })}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={safeSubsectionPage >= subsectionPageCount - 1}
                        onClick={() => setSubsectionPage((p) => Math.min(subsectionPageCount - 1, p + 1))}
                      >
                        {t('actors.detail.paginationNext')}
                      </button>
                    </div>
                  ) : null}
                  <div className="record-detail-domain-nav__grid record-detail-domain-nav__grid--sync-fill record-detail-domain-nav__grid--subsections">
                    {subsectionPageSlice.map((subKey) => (
                      <button key={subKey} type="button" className="record-detail-domain-nav__tile" onClick={() => openSubsection(subKey)}>
                        <span className="record-detail-domain-nav__tile-label">{actorFieldLabel(subKey)}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}

              {showDrillTiles ? (
                <>
                  {drillPageCount > 1 ? (
                    <div className="record-detail-domain-nav__pagination">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={safeDrillPage <= 0}
                        onClick={() => setDrillPage((p) => Math.max(0, p - 1))}
                      >
                        {t('actors.detail.paginationPrevious')}
                      </button>
                      <span className="record-detail-domain-nav__page-indicator">
                        {t('actors.detail.drillNavPageStatus', { current: safeDrillPage + 1, total: drillPageCount })}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={safeDrillPage >= drillPageCount - 1}
                        onClick={() => setDrillPage((p) => Math.min(drillPageCount - 1, p + 1))}
                      >
                        {t('actors.detail.paginationNext')}
                      </button>
                    </div>
                  ) : null}
                  <div className="record-detail-domain-nav__grid record-detail-domain-nav__grid--sync-fill record-detail-domain-nav__grid--subsections">
                    {drillPageSlice.map((entry) =>
                      entry.kind === 'key' ? (
                        <button
                          key={`key-${entry.key}`}
                          type="button"
                          className="record-detail-domain-nav__tile"
                          onClick={() => appendFieldPathSegment(entry.key)}
                        >
                          <span className="record-detail-domain-nav__tile-label">{actorFieldLabel(entry.key)}</span>
                        </button>
                      ) : (
                        <button
                          key={`idx-${entry.index}`}
                          type="button"
                          className="record-detail-domain-nav__tile"
                          onClick={() => appendFieldPathSegment(entry.index)}
                        >
                          <span className="record-detail-domain-nav__tile-label">{entry.label}</span>
                        </button>
                      ),
                    )}
                  </div>
                </>
              ) : null}
            </div>

            <div className="record-detail-domain-nav__below">
              {showFieldPanel ? (
                <div className="record-detail-domain-nav__field-panel">
                  <NestedDomainFields
                    value={valueAtFieldPath}
                    parentFieldKey={leafParentKey}
                    rootLabelOverride={leafRootLabelOverride}
                    fieldLabelForKey={(key) => actorFieldLabel(key)}
                  />
                </div>
              ) : null}
            </div>
          </nav>
        ) : (
          <p className="record-section-empty actor-detail-empty-data">{t('recordForm.detail.noData')}</p>
        )}
      </div>
    </div>
  )
})

ActorDetailPage.displayName = 'ActorDetailPage'
