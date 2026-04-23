/**
 * CollectionDetail Component
 * 
 * Displays detailed information about a collection.
 * 
 * Reference: docs/user-stories/02-collections.md (US-009), docs/design/02-collection-management-design.md
 */

import { useState, useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCollectionStore } from '../../stores/collectionStore'
import { useRecordStore } from '../../stores/recordStore'
import { useAuthStore } from '../../stores/authStore'
import { useActorStore } from '../../stores/actorStore'
import { recordActorFieldDisplayName } from '../records/actorMiniForm'
import { api, ApiError, type RecordImportMode } from '../../services/api'
import { CloseCollectionDialog } from './CloseCollectionDialog'
import { RecordList } from '../records/RecordList'
import './Collections.css'

function isValidEkhoImportPayload(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const o = value as Record<string, unknown>
  const ver = Number(o.ekho_export_version)
  if (ver !== 1 && ver !== 2) return false
  if (typeof o.collection !== 'object' || o.collection === null || Array.isArray(o.collection)) return false
  const col = o.collection as Record<string, unknown>
  if (col.stable_id == null || String(col.stable_id).trim() === '') return false
  if (typeof o.record !== 'object' || o.record === null || Array.isArray(o.record)) return false
  const rec = o.record as Record<string, unknown>
  const data = rec.data
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return false
  return true
}

export const CollectionDetail = observer(() => {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? i18n.language
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const collectionStore = useCollectionStore()
  const recordStore = useRecordStore()
  const authStore = useAuthStore()
  const actorStore = useActorStore()
  const collection = collectionStore.currentCollection
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(null)
  const [importSubmitting, setImportSubmitting] = useState(false)
  const [importModalError, setImportModalError] = useState<string | null>(null)
  const [filePickError, setFilePickError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      const collectionId = Number(id)
      // Clear previous collection if it doesn't match the current ID
      if (collectionStore.currentCollection?.id !== collectionId) {
        collectionStore.currentCollection = null
      }
      collectionStore.fetchCollection(collectionId)
    }
  }, [id])

  useEffect(() => {
    actorStore.fetchActors({ page_size: 200 }).catch(() => {})
  }, [actorStore])

  if (collectionStore.loading) {
    return <div>{t('common.loading')}</div>
  }

  // Only show collection if it matches the current route ID
  const collectionId = id ? Number(id) : null
  if (!collection || collection.id !== collectionId) {
    return <div>{t('common.loading')}</div>
  }

  const isOwner = authStore.isAuthenticated && authStore.user?.id === collection.owner.id
  const canEdit = isOwner && !collection.is_closed

  const owningOrgLabel = recordActorFieldDisplayName(
    collection.owning_organization ?? undefined,
    (aid) => actorStore.actorById(aid)?.data
  ).trim()

  const closeImportModal = () => {
    setShowImportModal(false)
    setPendingPayload(null)
    setImportModalError(null)
  }

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    setFilePickError(null)
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = reader.result as string
        const parsed: unknown = JSON.parse(text)
        if (!isValidEkhoImportPayload(parsed)) {
          setFilePickError(t('collections.importInvalidFile'))
          return
        }
        setPendingPayload(parsed)
        setImportModalError(null)
        setShowImportModal(true)
      } catch {
        setFilePickError(t('collections.importParseError'))
      }
    }
    reader.onerror = () => {
      setFilePickError(t('collections.importParseError'))
    }
    reader.readAsText(file)
  }

  const runImport = async (mode: RecordImportMode) => {
    if (!pendingPayload) return
    setImportSubmitting(true)
    setImportModalError(null)
    try {
      const body: Record<string, unknown> = {
        ...pendingPayload,
        mode,
        current_collection_id: collection.id,
      }
      const res = await api.importRecord(body)
      const ids = res.data?.record_ids
      await collectionStore.fetchCollection(collection.id)
      await recordStore.fetchRecords(collection.id)
      closeImportModal()
      if (ids?.length) {
        const targetId = mode === 'deposition' && ids.length >= 2 ? ids[1] : ids[0]
        navigate(`/records/${targetId}`, {
          state: { from: `${location.pathname}${location.search}` },
        })
      }
    } catch (err) {
      const e = err as ApiError
      setImportModalError(e.error || e.detail || t('collections.importFailed'))
    } finally {
      setImportSubmitting(false)
    }
  }

  return (
    <div className="collection-detail">
      <Link to="/collections" className="back-link">{t('collections.detail.backToList')}</Link>
      
      <div className="collection-header">
        <div className="collection-title-section">
          <h1>{collection.name}</h1>
          {collection.is_closed && <span className="badge">{t('collections.closed')}</span>}
        </div>
        {canEdit && (
          <div className="collection-actions">
            <button onClick={() => navigate(`/collections/${collection.id}/edit`)} className="btn btn-primary">
              {t('common.edit')}
            </button>
            <button onClick={() => setShowCloseDialog(true)} className="btn btn-danger">
              {t('collections.detail.closeCollection')}
            </button>
          </div>
        )}
      </div>
      
      <div className="collection-info">
        {collection.description && (
          <p>
            <strong>{t('collections.descriptionLabel')}:</strong> {collection.description}
          </p>
        )}
        {collection.responsible_department?.trim() ? (
          <p>
            <strong>{t('collections.responsibleDepartment')}:</strong>{' '}
            {collection.responsible_department.trim()}
          </p>
        ) : null}
        {owningOrgLabel ? (
          <p>
            <strong>{t('collections.owningOrganization')}:</strong> {owningOrgLabel}
          </p>
        ) : null}
        <p>{t('collections.listCardOwner', { username: collection.owner.username })}</p>
        <p>
          {t('collections.listCardCreated', {
            date: new Date(collection.created_at).toLocaleDateString(locale),
          })}
        </p>
        {collection.record_count !== undefined && (
          <p>{t('collections.detail.recordCount', { count: collection.record_count })}</p>
        )}
      </div>

      <div className="records-section">
        <div className="records-section-header">
          <h2>{t('records.title')}</h2>
          {canEdit && (
            <div className="records-section-actions">
              <Link 
                to={`/collections/${collection.id}/records/new`} 
                className="btn btn-primary"
              >
                {t('collections.detail.addRecord')}
              </Link>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                {t('collections.importRecord')}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                style={{ display: 'none' }}
                tabIndex={-1}
                onChange={handleImportFileChange}
              />
            </div>
          )}
        </div>
        {filePickError && (
          <p className="import-file-error" role="alert">
            {filePickError}
          </p>
        )}
        <RecordList collectionId={collection.id} />
      </div>

      {showCloseDialog && (
        <CloseCollectionDialog
          collection={collection}
          onClose={() => setShowCloseDialog(false)}
        />
      )}

      {showImportModal && pendingPayload && (
        <div className="modal-overlay" onClick={importSubmitting ? undefined : closeImportModal}>
          <div
            className="modal-content modal-content--import"
            role="dialog"
            aria-modal="true"
            aria-labelledby="import-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="import-modal-title">{t('collections.importModalTitle')}</h2>
            <p className="import-modal-intro">{t('collections.importModalIntro')}</p>
            {importModalError && (
              <p className="import-file-error" role="alert">
                {importModalError}
              </p>
            )}
            <div className="import-mode-buttons">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={importSubmitting}
                onClick={() => runImport('acquisition')}
              >
                {importSubmitting ? t('collections.importing') : t('collections.importModeAcquisition')}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={importSubmitting}
                onClick={() => runImport('deposition')}
              >
                {importSubmitting ? t('collections.importing') : t('collections.importModeDeposition')}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={importSubmitting}
                onClick={() => runImport('original_only')}
              >
                {importSubmitting ? t('collections.importing') : t('collections.importModeOriginalOnly')}
              </button>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                onClick={closeImportModal}
                className="btn btn-secondary"
                disabled={importSubmitting}
              >
                {t('recordForm.wizard.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

CollectionDetail.displayName = 'CollectionDetail'
