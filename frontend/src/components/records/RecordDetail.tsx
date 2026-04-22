/**
 * RecordDetail Component
 *
 * Displays detailed information about a record.
 *
 * Reference: docs/user-stories/03-records.md (US-014), docs/design/03-record-management-design.md
 */

import {
  Fragment,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useMemo,
  useCallback,
  type KeyboardEvent,
} from 'react'
import { observer } from 'mobx-react-lite'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import type { i18n as I18nType, TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { useRecordStore } from '../../stores/recordStore'
import { useAuthStore } from '../../stores/authStore'
import { useCollectionStore } from '../../stores/collectionStore'
import { useActorStore } from '../../stores/actorStore'
import { api, ApiError } from '../../services/api'
import type { RecordDataDomainKey, RecordImage } from '../../types/record'
import {
  getRecordPrimaryLabel,
  getRecordSecondaryLine,
  getRecordThumbnailUrl,
} from '../../types/record'
import { NestedDomainFields } from './NestedDomainFields'
import { RecordImageMetadataPanel } from './RecordImageMetadataPanel'
import { parseSafeInternalReturnPath } from '../../lib/internalPath'
import { isLanguageMapObject, pickLanguageMapString } from '../../lib/languageMapDisplay'
import { recordDomainFieldLabelForKey } from '../../lib/recordFieldLabel'
import { objectProductionTimeForTitleCard } from '../../lib/temporalPayload'
import { objectProductionManufacturerForDisplay } from './actorMiniForm'
import './Records.css'

const DOMAIN_NAV_GRID_PAGE_SIZE = 12

type FieldPathSegment = string | number

function getValueAtSectionPath(sectionRoot: unknown, path: FieldPathSegment[]): unknown {
  let cur: unknown = sectionRoot
  for (const seg of path) {
    if (cur === null || cur === undefined) return undefined
    if (typeof seg === 'number') {
      if (!Array.isArray(cur)) return undefined
      cur = cur[seg]
    } else {
      if (!isPlainObject(cur)) return undefined
      cur = (cur as Record<string, unknown>)[seg]
    }
  }
  return cur
}

const ARRAY_TILE_LABEL_MAX = 72

/** First non-empty pref_label string in fi → en → und order (common-models style). */
function readablePrefLabelFromObject(obj: Record<string, unknown>): string | null {
  const pref = obj.pref_label
  if (!isPlainObject(pref)) return null
  const pl = pref as Record<string, unknown>
  for (const lang of ['fi', 'en', 'und'] as const) {
    const s = pl[lang]
    if (typeof s === 'string' && s.trim()) return s.trim()
  }
  return null
}

/** Plain string/number, language map `{fi,en}`, or object carrying `pref_label`. */
function displayTextFromScalarOrPrefLabelObject(v: unknown, languageTag: string): string | null {
  if (typeof v === 'string' && v.trim()) return v.trim()
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  if (isPlainObject(v)) {
    const rec = v as Record<string, unknown>
    if (isLanguageMapObject(rec)) {
      return pickLanguageMapString(rec, languageTag)
    }
    return readablePrefLabelFromObject(rec)
  }
  return null
}

function arrayItemTileLabel(
  item: unknown,
  index: number,
  t: TFunction,
  i18n: I18nType,
  arrayFieldKey?: string,
  arrayFieldParentKey?: string,
): string {
  const trunc = (s: string) => (s.length > ARRAY_TILE_LABEL_MAX ? `${s.slice(0, ARRAY_TILE_LABEL_MAX)}…` : s)
  if (arrayFieldKey === 'date' && arrayFieldParentKey === 'aquisition_details') {
    return t('recordForm.detail.arraySegmentLabel', {
      field: recordDomainFieldLabelForKey('date', 'aquisition_details', i18n, t),
      n: index + 1,
    })
  }
  if (arrayFieldKey === 'technical_attribute' && isPlainObject(item)) {
    const technicalName = displayTextFromScalarOrPrefLabelObject(
      (item as Record<string, unknown>).unit,
      i18n.language,
    )
    if (technicalName) return trunc(technicalName)
  }
  if (isPlainObject(item)) {
    const o = item as Record<string, unknown>
    if (arrayFieldKey === 'object_history') {
      const activityRaw = o.activity
      if (isPlainObject(activityRaw)) {
        const activityObj = activityRaw as Record<string, unknown>
        const activityType = displayTextFromScalarOrPrefLabelObject(activityObj.type, i18n.language)
        if (activityType) return trunc(activityType)
        if (typeof activityObj.note === 'string' && activityObj.note.trim()) return trunc(activityObj.note.trim())
      }
    }
    if (arrayFieldKey === 'object_production_information') {
      return t('recordForm.detail.arraySegmentLabel', {
        field: recordDomainFieldLabelForKey(
          'object_production_information',
          arrayFieldParentKey,
          i18n,
          t,
        ),
        n: index + 1,
      })
    }
    for (const k of ['name', 'title', 'label', 'value', 'type'] as const) {
      const text = displayTextFromScalarOrPrefLabelObject(o[k], i18n.language)
      if (text) return trunc(text)
    }
    const fromTopPref = readablePrefLabelFromObject(o)
    if (fromTopPref) return trunc(fromTopPref)
  }
  if (typeof item === 'string' && item.trim()) return trunc(item.trim())
  if (typeof item === 'number' && Number.isFinite(item)) return String(item)
  if (arrayFieldKey) {
    return t('recordForm.detail.arraySegmentLabel', {
      field: recordDomainFieldLabelForKey(arrayFieldKey, arrayFieldParentKey, i18n, t),
      n: index + 1,
    })
  }
  return t('recordForm.detail.arrayItemFallback', { n: index + 1 })
}

/**
 * Which top-level key `arrayItemTileLabel` uses first for a plain object item, or null if it falls back to
 * generic numbering. Used to hide a redundant drill tile when the breadcrumb already shows that value.
 */
function arrayItemTitleSourceKey(item: unknown, languageTag: string): string | null {
  if (!isPlainObject(item)) return null
  const o = item as Record<string, unknown>
  for (const k of ['name', 'title', 'label', 'value', 'type'] as const) {
    const text = displayTextFromScalarOrPrefLabelObject(o[k], languageTag)
    if (text) return k
  }
  if (readablePrefLabelFromObject(o)) return 'pref_label'
  return null
}

function breadcrumbLabelForPathPrefix(
  pathPrefix: FieldPathSegment[],
  sectionRoot: unknown,
  i18n: I18nType,
  t: TFunction,
  /** When the section root is a JSON array (e.g. `rights`), path `[0]` has no parent key — use domain key for labels. */
  domainJsonKeyForRootArray?: string,
): string {
  if (pathPrefix.length === 0) return ''
  const last = pathPrefix[pathPrefix.length - 1]
  if (typeof last === 'string') {
    const immediatePrev = pathPrefix.length >= 2 ? pathPrefix[pathPrefix.length - 2] : undefined
    const twoBack = pathPrefix.length >= 3 ? pathPrefix[pathPrefix.length - 3] : undefined
    const parentForLabelBase =
      typeof immediatePrev === 'string'
        ? immediatePrev
        : typeof immediatePrev === 'number' && typeof twoBack === 'string'
          ? twoBack
          : undefined
    const parentForLabel =
      parentForLabelBase ??
      (pathPrefix.length === 1 && domainJsonKeyForRootArray ? domainJsonKeyForRootArray : undefined)
    return recordDomainFieldLabelForKey(last, parentForLabel, i18n, t)
  }
  const arr = getValueAtSectionPath(sectionRoot, pathPrefix.slice(0, -1))
  const idx = last as number
  const arrayFieldKeyForCrumb =
    pathPrefix.length >= 2 && typeof pathPrefix[pathPrefix.length - 2] === 'string'
      ? (pathPrefix[pathPrefix.length - 2] as string)
      : undefined
  const arrayFieldParentForCrumb =
    pathPrefix.length >= 3 && typeof pathPrefix[pathPrefix.length - 3] === 'string'
      ? (pathPrefix[pathPrefix.length - 3] as string)
      : undefined
  const arrayFieldParentForCrumbWithDomainFallback =
    arrayFieldParentForCrumb ??
    (pathPrefix.length === 2 && domainJsonKeyForRootArray ? domainJsonKeyForRootArray : undefined)
  const arrayKeyForItem =
    arrayFieldKeyForCrumb ??
    (pathPrefix.length === 1 && domainJsonKeyForRootArray ? domainJsonKeyForRootArray : undefined)
  if (Array.isArray(arr) && arr[idx] !== undefined) {
    return arrayItemTileLabel(
      arr[idx],
      idx,
      t,
      i18n,
      arrayKeyForItem,
      arrayFieldParentForCrumbWithDomainFallback,
    )
  }
  if (arrayKeyForItem) {
    return t('recordForm.detail.arraySegmentLabel', {
      field: recordDomainFieldLabelForKey(
        arrayKeyForItem,
        arrayFieldParentForCrumbWithDomainFallback,
        i18n,
        t,
      ),
      n: idx + 1,
    })
  }
  return t('recordForm.detail.arrayItemFallback', { n: idx + 1 })
}

/** UI order: Identification → Acquisition → Description → History → Rights → Access → Location → Confidentiality */
const RECORD_DETAIL_SECTIONS: readonly {
  key: RecordDataDomainKey
  headingKey: string
}[] = [
  { key: 'identification_details', headingKey: 'recordForm.wizard.stepIdentification' },
  { key: 'aquisition_details', headingKey: 'recordForm.wizard.stepAcquisition' },
  { key: 'description', headingKey: 'recordForm.wizard.stepDescription' },
  { key: 'history', headingKey: 'recordForm.wizard.stepHistory' },
  { key: 'rights', headingKey: 'recordForm.wizard.stepRights' },
  { key: 'access', headingKey: 'recordForm.wizard.stepAccess' },
  { key: 'object_location', headingKey: 'recordForm.wizard.stepObjectLocation' },
  { key: 'confidentiality', headingKey: 'recordForm.wizard.stepConfidentiality' },
] as const

function isDomainSectionEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0) {
    return true
  }
  return false
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/** Root-level JSON keys for a domain, omitting undefined and empty subtrees (aligned with NestedDomainFields). */
function nonEmptyRootSubkeys(sectionValue: unknown): string[] {
  if (!isPlainObject(sectionValue)) return []
  return Object.entries(sectionValue)
    .filter(([, v]) => v !== undefined && !isDomainSectionEmpty(v))
    .map(([k]) => k)
}

/**
 * Sole non-empty root field is `pref_label` — show value on the parent level (field panel) instead of drill tiles.
 */
function isPrefLabelOnlySectionValue(sectionValue: unknown): boolean {
  const keys = nonEmptyRootSubkeys(sectionValue)
  return keys.length === 1 && keys[0] === 'pref_label'
}

/** Tile navigation: objects with visible keys, or non-empty arrays (but not plain lang maps like {fi,en}). */
function valueSupportsFieldDrillNav(value: unknown): boolean {
  if (isPlainObject(value) && isLanguageMapObject(value as Record<string, unknown>)) return false
  if (isPlainObject(value)) {
    if (isPrefLabelOnlySectionValue(value)) return false
    return nonEmptyRootSubkeys(value).length > 0
  }
  if (Array.isArray(value)) return value.length > 0
  return false
}

/** All non-suppressed images, ordered for detail hero carousel (sort order, then primary, then id). */
function carouselDisplayImages(images: RecordImage[] | undefined): RecordImage[] {
  const list = images?.filter((img) => img.status !== 'suppressed') ?? []
  return [...list].sort((a, b) => {
    const so = a.sort_order - b.sort_order
    if (so !== 0) return so
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1
    return a.id - b.id
  })
}

function primaryCarouselIndex(images: RecordImage[]): number {
  if (images.length === 0) return 0
  const i = images.findIndex((img) => img.is_primary)
  return i >= 0 ? i : 0
}

export const RecordDetail = observer(() => {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const recordStore = useRecordStore()
  const authStore = useAuthStore()
  const collectionStore = useCollectionStore()
  const actorStore = useActorStore()
  const record = recordStore.currentRecord
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [selectedDomainKey, setSelectedDomainKey] = useState<RecordDataDomainKey | null>(null)
  /** Path within the selected domain JSON; [] = subsection (top field) list. */
  const [fieldPath, setFieldPath] = useState<FieldPathSegment[]>([])
  const [domainPage, setDomainPage] = useState(0)
  const [subsectionPage, setSubsectionPage] = useState(0)
  const [drillPage, setDrillPage] = useState(0)
  /** Hero carousel: technical metadata for the current slide. */
  const [heroDetailsOpen, setHeroDetailsOpen] = useState(false)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [breadcrumbMiddleExpanded, setBreadcrumbMiddleExpanded] = useState(false)
  /** Full-size image overlay (natural pixel dimensions, scroll if larger than viewport). */
  const [imageLightbox, setImageLightbox] = useState<{ src: string; alt: string } | null>(null)
  const prevRouteIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!id) return
    const recordId = Number(id)
    if (recordStore.currentRecord?.id !== recordId) {
      recordStore.clearCurrentRecord()
    }
    recordStore.fetchRecord(recordId)
    prevRouteIdRef.current = id
  }, [id])

  useLayoutEffect(() => {
    if (!record?.id) return
    setSelectedDomainKey(null)
    setFieldPath([])
    setDomainPage(0)
    setSubsectionPage(0)
    setDrillPage(0)
  }, [record?.id])

  useEffect(() => {
    setBreadcrumbMiddleExpanded(false)
  }, [fieldPath, selectedDomainKey])

  useEffect(() => {
    if (!imageLightbox) return
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setImageLightbox(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [imageLightbox])

  useEffect(() => {
    if (!imageLightbox) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [imageLightbox])

  useEffect(() => {
    if (record?.collection) {
      collectionStore.fetchCollection(record.collection)
    }
  }, [record?.collection])

  useEffect(() => {
    actorStore.fetchActors({ page_size: 200 }).catch(() => {})
  }, [actorStore])

  const resolveActorCatalog = useCallback(
    (actorId: number) => actorStore.actorById(actorId)?.data,
    [actorStore],
  )

  const manufacturerLine = useMemo(
    () =>
      objectProductionManufacturerForDisplay(
        record?.data?.history?.object_production_information,
        resolveActorCatalog,
      ),
    [record?.data?.history?.object_production_information, resolveActorCatalog, record?.id],
  )

  const productionTimeLine = useMemo(
    () => objectProductionTimeForTitleCard(record?.data?.history?.object_production_information),
    [record?.data?.history?.object_production_information, record?.id],
  )

  const sortedCarouselImages = useMemo(
    () => carouselDisplayImages(record?.images),
    [record?.id, record?.images],
  )

  useLayoutEffect(() => {
    if (!record?.id) return
    const sorted = carouselDisplayImages(record.images)
    setCarouselIndex(primaryCarouselIndex(sorted))
    setHeroDetailsOpen(false)
  }, [record?.id, record?.images])

  const goCarouselPrev = useCallback(() => {
    setHeroDetailsOpen(false)
    setCarouselIndex((i) => {
      if (sortedCarouselImages.length === 0) return 0
      const max = sortedCarouselImages.length - 1
      const cur = Math.min(Math.max(0, i), max)
      return Math.max(0, cur - 1)
    })
  }, [sortedCarouselImages])

  const goCarouselNext = useCallback(() => {
    setHeroDetailsOpen(false)
    setCarouselIndex((i) => {
      if (sortedCarouselImages.length === 0) return 0
      const max = sortedCarouselImages.length - 1
      const cur = Math.min(Math.max(0, i), max)
      return Math.min(max, cur + 1)
    })
  }, [sortedCarouselImages])

  const goCarouselTo = useCallback((idx: number) => {
    if (sortedCarouselImages.length === 0) return
    const max = sortedCarouselImages.length - 1
    setHeroDetailsOpen(false)
    setCarouselIndex(Math.min(Math.max(0, idx), max))
  }, [sortedCarouselImages])

  const handleCarouselKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (sortedCarouselImages.length <= 1) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goCarouselPrev()
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goCarouselNext()
      }
    },
    [sortedCarouselImages, goCarouselPrev, goCarouselNext],
  )

  /** Domain data for memos/effects; must not follow early returns (Rules of Hooks). */
  const domainData = record?.data ?? {}
  const nonEmptyDomainSections = useMemo(() => {
    return RECORD_DETAIL_SECTIONS.filter(({ key }) => !isDomainSectionEmpty(domainData[key]))
  }, [record?.id, record?.data])

  const domainPageCount = Math.max(1, Math.ceil(nonEmptyDomainSections.length / DOMAIN_NAV_GRID_PAGE_SIZE))

  const selectedSectionValueForNav =
    selectedDomainKey != null ? (domainData[selectedDomainKey] as unknown) : undefined
  const subsectionKeys = useMemo(
    () => nonEmptyRootSubkeys(selectedSectionValueForNav),
    [selectedSectionValueForNav],
  )
  /** Domains whose root is a JSON array (e.g. `rights`, `object_location`) have no object keys — navigate by index. */
  const rootArraySection = Array.isArray(selectedSectionValueForNav) ? selectedSectionValueForNav : null
  const isRootArrayDomain =
    rootArraySection != null &&
    rootArraySection.length > 0 &&
    subsectionKeys.length === 0
  const subsectionNavLength = isRootArrayDomain ? rootArraySection.length : subsectionKeys.length
  const subsectionPageCount = Math.max(1, Math.ceil(subsectionNavLength / DOMAIN_NAV_GRID_PAGE_SIZE))

  const goToAllDomains = useCallback(() => {
    setSelectedDomainKey(null)
    setFieldPath([])
    setSubsectionPage(0)
    setDomainPage(0)
    setDrillPage(0)
  }, [])

  const openDomainLevel2 = useCallback((key: RecordDataDomainKey) => {
    setSelectedDomainKey(key)
    setFieldPath([])
    setSubsectionPage(0)
    setDrillPage(0)
  }, [])

  const openTopSubsectionField = useCallback((subKey: string) => {
    setFieldPath([subKey])
    setDrillPage(0)
  }, [])

  const appendFieldPathSegment = useCallback((segment: FieldPathSegment) => {
    setFieldPath((p) => [...p, segment])
    setDrillPage(0)
  }, [])

  const goToSubsectionsForDomain = useCallback(() => {
    if (selectedDomainKey == null) return
    setFieldPath([])
    setDrillPage(0)
  }, [selectedDomainKey])

  const goToFieldPath = useCallback((path: FieldPathSegment[]) => {
    setFieldPath(path)
    setDrillPage(0)
  }, [])

  useLayoutEffect(() => {
    setDomainPage((p) => Math.min(p, Math.max(0, domainPageCount - 1)))
  }, [domainPageCount, record?.id])

  useLayoutEffect(() => {
    setSubsectionPage((p) => Math.min(p, Math.max(0, subsectionPageCount - 1)))
  }, [subsectionPageCount, selectedDomainKey, record?.id])

  const safeSubsectionPageForSlice = Math.min(subsectionPage, Math.max(0, subsectionPageCount - 1))
  const rootArrayPageSlice = useMemo(() => {
    if (!isRootArrayDomain || rootArraySection == null) return []
    const start = safeSubsectionPageForSlice * DOMAIN_NAV_GRID_PAGE_SIZE
    return rootArraySection.slice(start, start + DOMAIN_NAV_GRID_PAGE_SIZE).map((item, offset) => {
      const index = start + offset
      return {
        index,
        label: arrayItemTileLabel(
          item,
          index,
          t,
          i18n,
          selectedDomainKey ?? undefined,
          undefined,
        ),
      }
    })
  }, [
    isRootArrayDomain,
    rootArraySection,
    safeSubsectionPageForSlice,
    t,
    i18n,
    selectedDomainKey,
  ])

  const valueAtFieldPath = useMemo(
    () =>
      selectedSectionValueForNav !== undefined
        ? getValueAtSectionPath(selectedSectionValueForNav, fieldPath)
        : undefined,
    [selectedSectionValueForNav, fieldPath],
  )

  const showDomainTiles = selectedDomainKey == null
  const showSubsectionTiles = selectedDomainKey != null && fieldPath.length === 0
  const showDrillTiles =
    selectedDomainKey != null && fieldPath.length > 0 && valueSupportsFieldDrillNav(valueAtFieldPath)
  const showFieldPanel =
    selectedDomainKey != null && fieldPath.length > 0 && !valueSupportsFieldDrillNav(valueAtFieldPath)

  type DrillEntry =
    | { kind: 'key'; key: string }
    | { kind: 'index'; index: number; label: string }

  const drillEntries: DrillEntry[] = useMemo(() => {
    if (!showDrillTiles) return []
    const v = valueAtFieldPath
    if (isPlainObject(v)) {
      let keys = nonEmptyRootSubkeys(v)
      const pathEndsAtArrayIndex =
        fieldPath.length > 0 && typeof fieldPath[fieldPath.length - 1] === 'number'
      const arrayKeyForIndexedObject =
        pathEndsAtArrayIndex && fieldPath.length >= 2 && typeof fieldPath[fieldPath.length - 2] === 'string'
          ? (fieldPath[fieldPath.length - 2] as string)
          : undefined
      if (pathEndsAtArrayIndex && arrayKeyForIndexedObject === 'technical_attribute' && keys.includes('unit')) {
        const withoutUnit = keys.filter((k) => k !== 'unit')
        if (withoutUnit.length > 0) keys = withoutUnit
      }
      if (pathEndsAtArrayIndex) {
        const sourceKey = arrayItemTitleSourceKey(v, i18n.language)
        if (sourceKey !== null && keys.includes(sourceKey)) {
          const without = keys.filter((k) => k !== sourceKey)
          if (without.length > 0) keys = without
        }
      }
      return keys.map((key) => ({ kind: 'key' as const, key }))
    }
    if (Array.isArray(v)) {
      const arrayFieldKey: string | undefined =
        fieldPath.length > 0 && typeof fieldPath[fieldPath.length - 1] === 'string'
          ? (fieldPath[fieldPath.length - 1] as string)
          : undefined
      const arrayFieldParentKey: string | undefined =
        fieldPath.length >= 2 && typeof fieldPath[fieldPath.length - 2] === 'string'
          ? (fieldPath[fieldPath.length - 2] as string)
          : undefined
      const arrayFieldParentKeyWithDomainFallback: string | undefined =
        arrayFieldParentKey ?? (fieldPath.length === 1 ? (selectedDomainKey ?? undefined) : undefined)
      return v.map((item, index) => ({
        kind: 'index' as const,
        index,
        label: arrayItemTileLabel(
          item,
          index,
          t,
          i18n,
          arrayFieldKey,
          arrayFieldParentKeyWithDomainFallback,
        ),
      }))
    }
    return []
  }, [showDrillTiles, valueAtFieldPath, fieldPath, t, i18n, i18n.language, selectedDomainKey])

  const drillPageCount = Math.max(1, Math.ceil(drillEntries.length / DOMAIN_NAV_GRID_PAGE_SIZE))
  const safeDrillPage = Math.min(drillPage, drillPageCount - 1)
  const drillPageSlice = drillEntries.slice(
    safeDrillPage * DOMAIN_NAV_GRID_PAGE_SIZE,
    safeDrillPage * DOMAIN_NAV_GRID_PAGE_SIZE + DOMAIN_NAV_GRID_PAGE_SIZE,
  )

  useLayoutEffect(() => {
    setDrillPage(0)
  }, [fieldPath])

  useLayoutEffect(() => {
    setDrillPage((p) => Math.min(p, Math.max(0, drillPageCount - 1)))
  }, [drillPageCount])

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
    return `${recordDomainFieldLabelForKey(arrKey, undefined, i18n, t)} (${last + 1})`
  }, [fieldPath, i18n, t])

  const handleExport = async () => {
    if (!record) return
    setExporting(true)
    setExportError(null)
    try {
      const { blob, filename } = await api.exportRecord(record.id)
      const name = filename?.replace(/^["']|["']$/g, '') || `ekho-record-${record.id}.json`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      const e = err as ApiError
      setExportError(e.error || e.detail || t('recordForm.detail.exportError'))
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async () => {
    if (!record || !id) return

    try {
      await recordStore.deleteRecord(Number(id))
      const collectionId = record.collection
      if (collectionId) {
        navigate(`/collections/${collectionId}`)
      } else {
        navigate('/collections')
      }
    } catch (error) {
      console.error('Failed to delete record:', error)
    }
  }

  if (recordStore.loading) {
    return <div>{t('common.loading')}</div>
  }

  const recordId = id ? Number(id) : null
  if (!record || record.id !== recordId) {
    return <div>{t('common.loading')}</div>
  }

  const data = record.data ?? {}
  const primary = getRecordPrimaryLabel(data)
  const secondaryLine = getRecordSecondaryLine(data)
  const fallbackImageUrl = getRecordThumbnailUrl(record)

  const collection = collectionStore.currentCollection
  const isOwner = authStore.isAuthenticated && collection && authStore.user?.id === collection.owner.id
  const canEdit = isOwner && collection && !collection.is_closed

  const nCarousel = sortedCarouselImages.length
  const safeCarouselIndex = nCarousel === 0 ? 0 : Math.min(Math.max(0, carouselIndex), nCarousel - 1)
  const currentCarouselImage = nCarousel > 0 ? sortedCarouselImages[safeCarouselIndex] : undefined
  const heroDetailsPanelId =
    currentCarouselImage != null
      ? `record-detail-hero-carousel-details-${currentCarouselImage.id}`
      : 'record-detail-hero-carousel-details'

  const backTargetName = collection ? collection.name : t('nav.collections')
  const fromPath = parseSafeInternalReturnPath((location.state as { from?: string } | null)?.from)
  const backHref = fromPath ?? (collection ? `/collections/${collection.id}` : '/records')
  const backLinkLabel = fromPath
    ? t('recordForm.detail.backPrevious')
    : t('recordForm.detail.backTo', { name: backTargetName })

  const hasDomainBlocks = RECORD_DETAIL_SECTIONS.some(({ key }) => !isDomainSectionEmpty(data[key]))

  const safeDomainPage = Math.min(domainPage, domainPageCount - 1)
  const domainPageSlice = nonEmptyDomainSections.slice(
    safeDomainPage * DOMAIN_NAV_GRID_PAGE_SIZE,
    safeDomainPage * DOMAIN_NAV_GRID_PAGE_SIZE + DOMAIN_NAV_GRID_PAGE_SIZE,
  )

  const selectedSectionConfig =
    selectedDomainKey != null
      ? RECORD_DETAIL_SECTIONS.find((s) => s.key === selectedDomainKey)
      : undefined
  const safeSubsectionPage = Math.min(subsectionPage, subsectionPageCount - 1)
  const subsectionPageSlice = subsectionKeys.slice(
    safeSubsectionPage * DOMAIN_NAV_GRID_PAGE_SIZE,
    safeSubsectionPage * DOMAIN_NAV_GRID_PAGE_SIZE + DOMAIN_NAV_GRID_PAGE_SIZE,
  )

  /**
   * When `fieldPath` has this many segments or more, use ellipsis mode.
   * Collapsed (after section): … / third-to-last / second-to-last / last — earlier
   * segments fold into the ellipsis. Below this count the full path shows.
   */
  const BREADCRUMB_ELLIPSIS_MIN_SEGMENTS = 4

  const renderBreadcrumbFieldSegment = (i: number, isLast: boolean) => {
    const prefix = fieldPath.slice(0, i + 1)
    const label = breadcrumbLabelForPathPrefix(
      prefix,
      selectedSectionValueForNav,
      i18n,
      t,
      selectedDomainKey ?? undefined,
    )
    const crumbKey = prefix.map((s) => (typeof s === 'number' ? `i${s}` : s)).join('/')
    return (
      <Fragment key={crumbKey}>
        <span className="record-detail-domain-nav__crumb-sep" aria-hidden>
          /
        </span>
        {isLast ? (
          <span className="record-detail-domain-nav__crumb" aria-current="page">
            {label}
          </span>
        ) : (
          <button
            type="button"
            className="record-detail-domain-nav__crumb record-detail-domain-nav__crumb--link"
            onClick={() => goToFieldPath(prefix)}
            aria-label={label}
          >
            {label}
          </button>
        )}
      </Fragment>
    )
  }

  const breadcrumbContent =
    selectedDomainKey != null && selectedSectionConfig != null ? (
      <>
        <button
          type="button"
          className="record-detail-domain-nav__crumb record-detail-domain-nav__crumb--link"
          onClick={goToAllDomains}
          aria-label={t('recordForm.detail.breadcrumbAllDomainsAria')}
        >
          {t('recordForm.detail.allDomains')}
        </button>
        <span className="record-detail-domain-nav__crumb-sep" aria-hidden>
          /
        </span>
        {fieldPath.length === 0 ? (
          <span className="record-detail-domain-nav__crumb" aria-current="page">
            {t(selectedSectionConfig.headingKey)}
          </span>
        ) : (
          <>
            <button
              type="button"
              className="record-detail-domain-nav__crumb record-detail-domain-nav__crumb--link"
              onClick={goToSubsectionsForDomain}
              aria-label={t('recordForm.detail.breadcrumbDomainFieldsAria', {
                sectionName: t(selectedSectionConfig.headingKey),
              })}
            >
              {t(selectedSectionConfig.headingKey)}
            </button>
            {fieldPath.length < BREADCRUMB_ELLIPSIS_MIN_SEGMENTS
              ? fieldPath.map((_, i) =>
                  renderBreadcrumbFieldSegment(i, i === fieldPath.length - 1),
                )
              : !breadcrumbMiddleExpanded
                ? (
                    <>
                      <span className="record-detail-domain-nav__crumb-sep" aria-hidden>
                        /
                      </span>
                      <button
                        type="button"
                        className="record-detail-domain-nav__crumb record-detail-domain-nav__crumb--ellipsis"
                        onClick={() => setBreadcrumbMiddleExpanded(true)}
                        aria-expanded="false"
                        aria-label={t('recordForm.detail.breadcrumbExpandMiddleAria')}
                      >
                        {t('recordForm.detail.breadcrumbEllipsis')}
                      </button>
                      {renderBreadcrumbFieldSegment(fieldPath.length - 3, false)}
                      {renderBreadcrumbFieldSegment(fieldPath.length - 2, false)}
                      {renderBreadcrumbFieldSegment(fieldPath.length - 1, true)}
                    </>
                  )
                : fieldPath.map((_, i) =>
                    renderBreadcrumbFieldSegment(i, i === fieldPath.length - 1),
                  )}
          </>
        )}
      </>
    ) : null

  return (
    <div className="record-detail">
      <div
        className={
          hasDomainBlocks
            ? 'record-detail-hero-layout record-detail-hero-layout--has-domains'
            : 'record-detail-hero-layout'
        }
      >
        {hasDomainBlocks ? (
          <>
            <div className="record-detail-hero-primary-column">
            <Link to={backHref} className="record-detail-back-link">
              {backLinkLabel}
            </Link>
            <div className="record-info-section record-detail-title-card">
              <h1>{primary}</h1>
              {manufacturerLine.trim() !== '' && (
                <p className="record-detail-subline record-detail-title-card__manufacturer">
                  {t('recordForm.detail.titleCardManufacturerLine', { name: manufacturerLine.trim() })}
                </p>
              )}
              {productionTimeLine.trim() !== '' && (
                <p className="record-detail-subline record-detail-title-card__production-time">
                  {t('recordForm.detail.titleCardProductionTimeLine', { time: productionTimeLine.trim() })}
                </p>
              )}
              {secondaryLine != null && secondaryLine !== '' && (
                <p className="record-detail-subline">{secondaryLine}</p>
              )}

              {canEdit && (
                <div className="record-actions">
                  <button
                    type="button"
                    onClick={() => navigate(`/records/${record.id}/edit`, { state: location.state })}
                    className="btn btn-primary"
                  >
                    {t('common.edit')}
                  </button>
                  <button
                    type="button"
                    onClick={handleExport}
                    className="btn btn-secondary"
                    disabled={exporting}
                  >
                    {exporting ? t('recordForm.detail.exporting') : t('recordForm.detail.export')}
                  </button>
                  <button type="button" onClick={() => setShowDeleteDialog(true)} className="btn btn-danger">
                    {t('recordForm.detail.delete')}
                  </button>
                </div>
              )}
              {exportError && (
                <p className="record-export-error" role="alert">
                  {exportError}
                </p>
              )}
            </div>

            <div className="record-image-section">
            {nCarousel > 0 && currentCarouselImage ? (
              <div
                className="record-detail-hero-carousel"
                role="region"
                aria-label={t('recordForm.recordImages.detailCarouselAria')}
                tabIndex={0}
                onKeyDown={handleCarouselKeyDown}
              >
                <div className="record-detail-hero-carousel-footer">
                  <button
                    type="button"
                    className="record-detail-hero-carousel-details-toggle"
                    aria-expanded={heroDetailsOpen}
                    aria-controls={heroDetailsPanelId}
                    onClick={() => setHeroDetailsOpen((o) => !o)}
                  >
                    {heroDetailsOpen
                      ? t('recordForm.recordImages.galleryHideDetails')
                      : t('recordForm.recordImages.galleryShowDetails')}
                  </button>
                </div>
                <div
                  className={
                    heroDetailsOpen
                      ? 'record-detail-hero-carousel-main record-detail-hero-carousel-main--details'
                      : 'record-detail-hero-carousel-main'
                  }
                >
                  {heroDetailsOpen ? (
                    <div
                      id={heroDetailsPanelId}
                      className="record-detail-hero-carousel-details"
                      role="region"
                    >
                      <RecordImageMetadataPanel image={currentCarouselImage} />
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="record-detail-hero-carousel-main-zoom"
                      onClick={() =>
                        setImageLightbox({
                          src: currentCarouselImage.url,
                          alt: t('recordForm.recordImages.detailCarouselImageAlt', {
                            title: primary,
                            current: safeCarouselIndex + 1,
                            total: nCarousel,
                          }),
                        })
                      }
                    >
                      <img
                        src={currentCarouselImage.url}
                        alt={t('recordForm.recordImages.detailCarouselImageAlt', {
                          title: primary,
                          current: safeCarouselIndex + 1,
                          total: nCarousel,
                        })}
                        className="record-detail-hero-carousel-img"
                        loading={safeCarouselIndex === 0 ? 'eager' : 'lazy'}
                      />
                    </button>
                  )}
                </div>
                {nCarousel > 1 ? (
                  <div
                    className="record-detail-hero-carousel-thumbs"
                    role="group"
                    aria-label={t('recordForm.recordImages.galleryHeading')}
                  >
                    {sortedCarouselImages.map((img, idx) => (
                      <button
                        key={img.id}
                        type="button"
                        aria-current={idx === safeCarouselIndex ? 'true' : undefined}
                        className={
                          idx === safeCarouselIndex
                            ? 'record-detail-hero-carousel-thumb record-detail-hero-carousel-thumb--selected'
                            : 'record-detail-hero-carousel-thumb'
                        }
                        onClick={() => goCarouselTo(idx)}
                        aria-label={t('recordForm.recordImages.detailCarouselSelectImage', {
                          current: idx + 1,
                          total: nCarousel,
                        })}
                      >
                        <img src={img.url} alt="" className="record-detail-hero-carousel-thumb-img" loading="lazy" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : fallbackImageUrl ? (
              <button
                type="button"
                className="record-image-zoom-trigger"
                onClick={() => setImageLightbox({ src: fallbackImageUrl, alt: primary })}
              >
                <img src={fallbackImageUrl} alt={primary} className="record-image" />
              </button>
            ) : (
              <div className="record-placeholder-large">{t('recordForm.detail.noImage')}</div>
            )}
          </div>
        </div>

        <nav
          className="record-detail-domain-nav record-detail-domain-nav--split-root"
          aria-label={t('recordForm.detail.dataByDomainAria')}
        >
          {breadcrumbContent ? (
            <div
              className="record-detail-domain-nav__breadcrumb record-detail-top-breadcrumb"
              role="group"
              aria-label={t('recordForm.detail.breadcrumbNavAria')}
            >
              {breadcrumbContent}
            </div>
          ) : null}
          <div className="record-detail-domain-nav__sync">
            {showDomainTiles && (
              <>
                {domainPageCount > 1 ? (
                  <div className="record-detail-domain-nav__pagination">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={safeDomainPage <= 0}
                      aria-disabled={safeDomainPage <= 0}
                      aria-label={t('recordForm.detail.domainNavPreviousPage')}
                      onClick={() => {
                        setDomainPage((p) => Math.max(0, p - 1))
                      }}
                    >
                      {t('recordForm.detail.paginationPrevious')}
                    </button>
                    <span className="record-detail-domain-nav__page-indicator">
                      {t('recordForm.detail.domainNavPageStatus', {
                        current: safeDomainPage + 1,
                        total: domainPageCount,
                      })}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={safeDomainPage >= domainPageCount - 1}
                      aria-disabled={safeDomainPage >= domainPageCount - 1}
                      aria-label={t('recordForm.detail.domainNavNextPage')}
                      onClick={() => {
                        setDomainPage((p) => Math.min(domainPageCount - 1, p + 1))
                      }}
                    >
                      {t('recordForm.detail.paginationNext')}
                    </button>
                  </div>
                ) : null}
                <div className="record-detail-domain-nav__grid record-detail-domain-nav__grid--sync-fill">
                  {domainPageSlice.map(({ key, headingKey }) => (
                    <button
                      key={key}
                      type="button"
                      className="record-detail-domain-nav__tile"
                      onClick={() => openDomainLevel2(key)}
                    >
                      <span className="record-detail-domain-nav__tile-label">{t(headingKey)}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {showSubsectionTiles && selectedSectionConfig != null ? (
              <>
                {subsectionPageCount > 1 ? (
                  <div className="record-detail-domain-nav__pagination">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={safeSubsectionPage <= 0}
                      aria-disabled={safeSubsectionPage <= 0}
                      aria-label={t('recordForm.detail.subsectionNavPreviousPage')}
                      onClick={() => setSubsectionPage((p) => Math.max(0, p - 1))}
                    >
                      {t('recordForm.detail.paginationPrevious')}
                    </button>
                    <span className="record-detail-domain-nav__page-indicator">
                      {t('recordForm.detail.subsectionNavPageStatus', {
                        current: safeSubsectionPage + 1,
                        total: subsectionPageCount,
                      })}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={safeSubsectionPage >= subsectionPageCount - 1}
                      aria-disabled={safeSubsectionPage >= subsectionPageCount - 1}
                      aria-label={t('recordForm.detail.subsectionNavNextPage')}
                      onClick={() =>
                        setSubsectionPage((p) => Math.min(subsectionPageCount - 1, p + 1))
                      }
                    >
                      {t('recordForm.detail.paginationNext')}
                    </button>
                  </div>
                ) : null}
                <div className="record-detail-domain-nav__grid record-detail-domain-nav__grid--sync-fill record-detail-domain-nav__grid--subsections">
                  {isRootArrayDomain
                    ? rootArrayPageSlice.map(({ index, label }) => (
                        <button
                          key={`root-arr-${index}`}
                          type="button"
                          className="record-detail-domain-nav__tile"
                          onClick={() => appendFieldPathSegment(index)}
                        >
                          <span className="record-detail-domain-nav__tile-label">{label}</span>
                        </button>
                      ))
                    : subsectionPageSlice.map((subKey) => (
                        <button
                          key={subKey}
                          type="button"
                          className="record-detail-domain-nav__tile"
                          onClick={() => openTopSubsectionField(subKey)}
                        >
                          <span className="record-detail-domain-nav__tile-label">
                            {recordDomainFieldLabelForKey(subKey, selectedDomainKey ?? undefined, i18n, t)}
                          </span>
                        </button>
                      ))}
                </div>
              </>
            ) : null}

            {showDrillTiles && selectedSectionConfig != null ? (
              <>
                {drillPageCount > 1 ? (
                  <div className="record-detail-domain-nav__pagination">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={safeDrillPage <= 0}
                      aria-disabled={safeDrillPage <= 0}
                      aria-label={t('recordForm.detail.drillNavPreviousPage')}
                      onClick={() => setDrillPage((p) => Math.max(0, p - 1))}
                    >
                      {t('recordForm.detail.paginationPrevious')}
                    </button>
                    <span className="record-detail-domain-nav__page-indicator">
                      {t('recordForm.detail.drillNavPageStatus', {
                        current: safeDrillPage + 1,
                        total: drillPageCount,
                      })}
                    </span>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={safeDrillPage >= drillPageCount - 1}
                      aria-disabled={safeDrillPage >= drillPageCount - 1}
                      aria-label={t('recordForm.detail.drillNavNextPage')}
                      onClick={() => setDrillPage((p) => Math.min(drillPageCount - 1, p + 1))}
                    >
                      {t('recordForm.detail.paginationNext')}
                    </button>
                  </div>
                ) : null}
                <div className="record-detail-domain-nav__grid record-detail-domain-nav__grid--sync-fill record-detail-domain-nav__grid--subsections">
                  {(() => {
                    const drillParentKey: string | undefined = (() => {
                      if (fieldPath.length === 0) return undefined
                      const last = fieldPath[fieldPath.length - 1]
                      if (typeof last === 'string') return last
                      if (typeof last === 'number' && fieldPath.length === 1 && selectedDomainKey != null) {
                        return selectedDomainKey
                      }
                      if (typeof last === 'number' && fieldPath.length >= 2) {
                        const prev = fieldPath[fieldPath.length - 2]
                        if (typeof prev === 'string') return prev
                      }
                      return undefined
                    })()
                    return drillPageSlice.map((entry) =>
                      entry.kind === 'key' ? (
                        <button
                          key={`k-${entry.key}`}
                          type="button"
                          className="record-detail-domain-nav__tile"
                          onClick={() => appendFieldPathSegment(entry.key)}
                        >
                          <span className="record-detail-domain-nav__tile-label">
                            {recordDomainFieldLabelForKey(entry.key, drillParentKey, i18n, t)}
                          </span>
                        </button>
                      ) : (
                        <button
                          key={`i-${entry.index}`}
                          type="button"
                          className="record-detail-domain-nav__tile"
                          onClick={() => appendFieldPathSegment(entry.index)}
                        >
                          <span className="record-detail-domain-nav__tile-label">{entry.label}</span>
                        </button>
                      )
                    )
                  })()}
                </div>
              </>
            ) : null}
          </div>
          <div className="record-detail-domain-nav__below">
            {showFieldPanel && selectedSectionConfig != null ? (
              <div className="record-detail-domain-nav__field-panel">
                <NestedDomainFields
                  value={valueAtFieldPath}
                  parentFieldKey={leafParentKey}
                  rootLabelOverride={leafRootLabelOverride}
                />
              </div>
            ) : null}
          </div>
        </nav>
      </>
    ) : (
      <div className="record-detail-hero-leading">
        <Link to={backHref} className="record-detail-back-link">
          {backLinkLabel}
        </Link>
        <div className="record-info-section record-detail-title-card">
          <h1>{primary}</h1>
          {manufacturerLine.trim() !== '' && (
            <p className="record-detail-subline record-detail-title-card__manufacturer">
              {t('recordForm.detail.titleCardManufacturerLine', { name: manufacturerLine.trim() })}
            </p>
          )}
          {productionTimeLine.trim() !== '' && (
            <p className="record-detail-subline record-detail-title-card__production-time">
              {t('recordForm.detail.titleCardProductionTimeLine', { time: productionTimeLine.trim() })}
            </p>
          )}
          {secondaryLine != null && secondaryLine !== '' && (
            <p className="record-detail-subline">{secondaryLine}</p>
          )}

          {canEdit && (
            <div className="record-actions">
              <button
                type="button"
                onClick={() => navigate(`/records/${record.id}/edit`, { state: location.state })}
                className="btn btn-primary"
              >
                {t('common.edit')}
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="btn btn-secondary"
                disabled={exporting}
              >
                {exporting ? t('recordForm.detail.exporting') : t('recordForm.detail.export')}
              </button>
              <button type="button" onClick={() => setShowDeleteDialog(true)} className="btn btn-danger">
                {t('recordForm.detail.delete')}
              </button>
            </div>
          )}
          {exportError && (
            <p className="record-export-error" role="alert">
              {exportError}
            </p>
          )}
        </div>

        <div className="record-image-section">
          {nCarousel > 0 && currentCarouselImage ? (
            <div
              className="record-detail-hero-carousel"
              role="region"
              aria-label={t('recordForm.recordImages.detailCarouselAria')}
              tabIndex={0}
              onKeyDown={handleCarouselKeyDown}
            >
              <div className="record-detail-hero-carousel-footer">
                <button
                  type="button"
                  className="record-detail-hero-carousel-details-toggle"
                  aria-expanded={heroDetailsOpen}
                  aria-controls={heroDetailsPanelId}
                  onClick={() => setHeroDetailsOpen((o) => !o)}
                >
                  {heroDetailsOpen
                    ? t('recordForm.recordImages.galleryHideDetails')
                    : t('recordForm.recordImages.galleryShowDetails')}
                </button>
              </div>
              <div
                className={
                  heroDetailsOpen
                    ? 'record-detail-hero-carousel-main record-detail-hero-carousel-main--details'
                    : 'record-detail-hero-carousel-main'
                }
              >
                {heroDetailsOpen ? (
                  <div
                    id={heroDetailsPanelId}
                    className="record-detail-hero-carousel-details"
                    role="region"
                  >
                    <RecordImageMetadataPanel image={currentCarouselImage} />
                  </div>
                ) : (
                  <button
                    type="button"
                    className="record-detail-hero-carousel-main-zoom"
                    onClick={() =>
                      setImageLightbox({
                        src: currentCarouselImage.url,
                        alt: t('recordForm.recordImages.detailCarouselImageAlt', {
                          title: primary,
                          current: safeCarouselIndex + 1,
                          total: nCarousel,
                        }),
                      })
                    }
                  >
                    <img
                      src={currentCarouselImage.url}
                      alt={t('recordForm.recordImages.detailCarouselImageAlt', {
                        title: primary,
                        current: safeCarouselIndex + 1,
                        total: nCarousel,
                      })}
                      className="record-detail-hero-carousel-img"
                      loading={safeCarouselIndex === 0 ? 'eager' : 'lazy'}
                    />
                  </button>
                )}
              </div>
              {nCarousel > 1 ? (
                <div
                  className="record-detail-hero-carousel-thumbs"
                  role="group"
                  aria-label={t('recordForm.recordImages.galleryHeading')}
                >
                  {sortedCarouselImages.map((img, idx) => (
                    <button
                      key={img.id}
                      type="button"
                      aria-current={idx === safeCarouselIndex ? 'true' : undefined}
                      className={
                        idx === safeCarouselIndex
                          ? 'record-detail-hero-carousel-thumb record-detail-hero-carousel-thumb--selected'
                          : 'record-detail-hero-carousel-thumb'
                      }
                      onClick={() => goCarouselTo(idx)}
                      aria-label={t('recordForm.recordImages.detailCarouselSelectImage', {
                        current: idx + 1,
                        total: nCarousel,
                      })}
                    >
                      <img src={img.url} alt="" className="record-detail-hero-carousel-thumb-img" loading="lazy" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : fallbackImageUrl ? (
            <button
              type="button"
              className="record-image-zoom-trigger"
              onClick={() => setImageLightbox({ src: fallbackImageUrl, alt: primary })}
            >
              <img src={fallbackImageUrl} alt={primary} className="record-image" />
            </button>
          ) : (
            <div className="record-placeholder-large">{t('recordForm.detail.noImage')}</div>
          )}
        </div>
      </div>
    )}
      </div>

      {showDeleteDialog && (
        <div className="modal-overlay" onClick={() => setShowDeleteDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{t('recordForm.detail.deleteTitle')}</h2>
            <p>{t('recordForm.detail.deleteConfirm', { name: primary })}</p>
            <div className="modal-actions">
              <button type="button" onClick={() => setShowDeleteDialog(false)} className="btn btn-secondary" disabled={recordStore.loading}>
                {t('recordForm.wizard.cancel')}
              </button>
              <button type="button" onClick={handleDelete} className="btn btn-danger" disabled={recordStore.loading}>
                {recordStore.loading ? t('recordForm.detail.deleting') : t('recordForm.detail.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {imageLightbox ? (
        <div
          className="record-detail-image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={t('recordForm.recordImages.imageLightboxDialogAria')}
          onClick={() => setImageLightbox(null)}
        >
          <button
            type="button"
            className="record-detail-image-lightbox-close"
            onClick={(e) => {
              e.stopPropagation()
              setImageLightbox(null)
            }}
            aria-label={t('recordForm.recordImages.imageLightboxClose')}
          >
            ×
          </button>
          <div
            className="record-detail-image-lightbox-inner"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageLightbox.src}
              alt={imageLightbox.alt}
              className="record-detail-image-lightbox-img"
            />
          </div>
        </div>
      ) : null}
    </div>
  )
})

RecordDetail.displayName = 'RecordDetail'
