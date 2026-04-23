/**
 * RecordDetail Component
 *
 * Displays detailed information about a record.
 *
 * Reference: docs/user-stories/03-records.md (US-014), docs/design/03-record-management-design.md
 */

import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useParams, Link, useNavigate } from 'react-router-dom'
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
  getRecordCardYearLine,
  getRecordThumbnailUrl,
} from '../../types/record'
import { NestedDomainFields } from './NestedDomainFields'
import { RecordImageMetadataPanel } from './RecordImageMetadataPanel'
import './Records.css'

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

/** First domain that has data is open by default; others closed. */
function openSectionsForRecord(data: Record<string, unknown>): Record<RecordDataDomainKey, boolean> {
  const o = {} as Record<RecordDataDomainKey, boolean>
  const firstWithData = RECORD_DETAIL_SECTIONS.find(({ key }) => !isDomainSectionEmpty(data[key]))?.key
  RECORD_DETAIL_SECTIONS.forEach(({ key }) => {
    o[key] = key === firstWithData
  })
  return o
}

/** Detail gallery: show only presentation-oriented images (pienkuva / portfolio in UI vocab). */
function isRecordDetailGalleryImage(img: RecordImage): boolean {
  return img.role === 'thumbnail' || img.context === 'portfolio'
}

export const RecordDetail = observer(() => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const recordStore = useRecordStore()
  const authStore = useAuthStore()
  const collectionStore = useCollectionStore()
  const actorStore = useActorStore()
  const record = recordStore.currentRecord
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [visibilitySaving, setVisibilitySaving] = useState(false)
  const [visibilityError, setVisibilityError] = useState<string | null>(null)
  const [openSections, setOpenSections] = useState<Record<RecordDataDomainKey, boolean>>(() =>
    openSectionsForRecord({}),
  )
  /** Record detail gallery: technical metadata shown after thumbnail click. */
  const [detailImageId, setDetailImageId] = useState<number | null>(null)
  const prevRouteIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!id) return
    const recordId = Number(id)
    if (recordStore.currentRecord?.id !== recordId) {
      recordStore.currentRecord = null
    }
    recordStore.fetchRecord(recordId)
    prevRouteIdRef.current = id
  }, [id])

  useLayoutEffect(() => {
    if (!record?.id) return
    setOpenSections(openSectionsForRecord((record.data ?? {}) as Record<string, unknown>))
  }, [record?.id])

  useEffect(() => {
    setDetailImageId(null)
  }, [record?.id])

  useEffect(() => {
    if (record?.collection) {
      collectionStore.fetchCollection(record.collection)
    }
  }, [record?.collection])

  useEffect(() => {
    actorStore.fetchActors({ page_size: 200 }).catch(() => {})
  }, [actorStore])

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

  const handleToggleVisibility = async () => {
    if (!record) return
    setVisibilitySaving(true)
    setVisibilityError(null)
    try {
      await recordStore.updateRecord(record.id, { is_listed: !record.is_listed })
    } catch (error) {
      const e = error as ApiError
      setVisibilityError(e.error || e.detail || t('records.visibility.toggleError'))
    } finally {
      setVisibilitySaving(false)
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
  const yearLine = getRecordCardYearLine(data)
  const imageUrl = getRecordThumbnailUrl(record)

  const collection = collectionStore.currentCollection
  const isOwner = authStore.isAuthenticated && collection && authStore.user?.id === collection.owner.id
  const canEdit = isOwner && collection && !collection.is_closed

  const galleryImages = (record.images ?? []).filter(isRecordDetailGalleryImage)

  const backTargetName = collection ? collection.name : t('nav.collections')

  return (
    <div className="record-detail">
      <Link to={collection ? `/collections/${collection.id}` : '/collections'} className="back-link">
        {t('recordForm.detail.backTo', { name: backTargetName })}
      </Link>

      <div className="record-content record-detail-hero">
        <div className="record-image-section">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={primary}
              className="record-image"
              decoding="async"
              fetchPriority="high"
            />
          ) : (
            <div className="record-placeholder-large">{t('recordForm.detail.noImage')}</div>
          )}
        </div>

        <div className="record-info-section">
          <h1>{primary}</h1>
          {!record.is_listed && (
            <p className="record-visibility-status" role="status">
              {t('records.visibility.hiddenOwnerNotice')}
            </p>
          )}
          {secondaryLine != null && secondaryLine !== '' && (
            <p className="record-detail-subline">{secondaryLine}</p>
          )}
          {yearLine != null && yearLine !== '' && (
            <p className="record-detail-year-line">{yearLine}</p>
          )}

          <div className="record-meta">
            <small>
              <strong>{t('recordForm.detail.created')}</strong> {new Date(record.created_at).toLocaleDateString()}
              {' · '}
              <strong>{t('recordForm.detail.updated')}</strong> {new Date(record.updated_at).toLocaleDateString()}
            </small>
          </div>

          {canEdit && (
            <div className="record-actions">
              <button type="button" onClick={() => navigate(`/records/${record.id}/edit`)} className="btn btn-primary">
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
              <button
                type="button"
                onClick={handleToggleVisibility}
                className="btn btn-secondary"
                disabled={visibilitySaving}
              >
                {visibilitySaving
                  ? t('records.visibility.saving')
                  : record.is_listed
                    ? t('records.visibility.hide')
                    : t('records.visibility.show')}
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
          {visibilityError && (
            <p className="record-export-error" role="alert">
              {visibilityError}
            </p>
          )}
        </div>
      </div>

      {galleryImages.length > 0 && (
        <section className="record-detail-images" aria-label={t('recordForm.recordImages.galleryHeading')}>
          <h2 className="record-detail-images-heading">{t('recordForm.recordImages.galleryHeading')}</h2>
          <ul className="record-detail-images-grid">
            {galleryImages.map((img) => {
              const detailsOpen = detailImageId === img.id
              const detailsPanelId = `record-detail-image-details-${img.id}`
              return (
                <li key={img.id} className="record-detail-images-card">
                  <button
                    type="button"
                    className="record-detail-images-thumb-wrap"
                    aria-expanded={detailsOpen}
                    aria-controls={detailsPanelId}
                    aria-label={
                      detailsOpen
                        ? t('recordForm.recordImages.galleryHideDetails')
                        : t('recordForm.recordImages.galleryShowDetails')
                    }
                    onClick={() => setDetailImageId((prev) => (prev === img.id ? null : img.id))}
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="record-detail-images-thumb"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                  {detailsOpen && (
                    <div id={detailsPanelId} className="record-detail-images-meta">
                      <p className="record-detail-images-badges">
                        <span className="record-multi-image-badge">
                          {t(`recordForm.recordImages.vocab.role.${img.role}`)}
                        </span>
                        <span className="record-multi-image-badge record-multi-image-badge--muted">
                          {t(`recordForm.recordImages.vocab.context.${img.context}`)}
                        </span>
                      </p>
                      <RecordImageMetadataPanel image={img} />
                      <p className="record-detail-images-fullsize">
                        <a href={img.url} target="_blank" rel="noreferrer">
                          {t('recordForm.recordImages.galleryOpenFullSize')}
                        </a>
                      </p>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {RECORD_DETAIL_SECTIONS.some(({ key }) => !isDomainSectionEmpty(data[key])) && (
        <section className="record-domain-sections" aria-label={t('recordForm.detail.dataByDomainAria')}>
          <h2 className="record-domain-sections-heading">{t('recordForm.detail.dataHeading')}</h2>
          {RECORD_DETAIL_SECTIONS.map(({ key, headingKey }) => {
            const sectionValue = data[key]
            if (isDomainSectionEmpty(sectionValue)) return null
            return (
              <details
                key={key}
                id={`record-section-${key}`}
                className="record-detail-accordion"
                open={openSections[key]}
                onToggle={(e) => {
                  const nextOpen = e.currentTarget.open
                  setOpenSections((prev) => ({ ...prev, [key]: nextOpen }))
                }}
              >
                <summary className="record-detail-accordion-summary">
                  <span className="record-detail-accordion-chevron" aria-hidden />
                  <span className="record-detail-accordion-title">{t(headingKey)}</span>
                </summary>
                <div className="record-detail-accordion-panel">
                  <div className="record-detail-accordion-body">
                    <NestedDomainFields value={sectionValue} />
                  </div>
                </div>
              </details>
            )
          })}
        </section>
      )}

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
    </div>
  )
})

RecordDetail.displayName = 'RecordDetail'
