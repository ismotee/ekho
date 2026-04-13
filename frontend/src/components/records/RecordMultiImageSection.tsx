/**
 * Multi-image staging (create/edit save) and server-backed list with role/context.
 */

import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRecordStore } from '../../stores/recordStore'
import type { RecordImage } from '../../types/record'
import {
  RECORD_IMAGE_CONTEXTS,
  RECORD_IMAGE_ROLES,
  type RecordImageContext,
  type RecordImageRole,
} from '../../types/record/imageVocabulary'
import { RecordImageMetadataPanel } from './RecordImageMetadataPanel'
import './Records.css'

export interface PendingRecordImage {
  localId: string
  file: File
  role: RecordImageRole
  context: RecordImageContext
  is_primary: boolean
}

function newLocalId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export interface RecordMultiImageSectionProps {
  disabled: boolean
  canManageImages: boolean
  recordId?: number
  serverImages: RecordImage[]
  pendingImages: PendingRecordImage[]
  onPendingChange: (next: PendingRecordImage[]) => void
}

export function RecordMultiImageSection({
  disabled,
  canManageImages,
  recordId,
  serverImages,
  pendingImages,
  onPendingChange,
}: RecordMultiImageSectionProps) {
  const { t } = useTranslation()
  const recordStore = useRecordStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [draftRole, setDraftRole] = useState<RecordImageRole>('thumbnail')
  const [draftContext, setDraftContext] = useState<RecordImageContext>('portfolio')
  const [draftPrimary, setDraftPrimary] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const addPendingFromFile = (file: File | null) => {
    if (!file || !canManageImages || disabled) return
    if (!file.type.startsWith('image/')) {
      window.alert(t('recordForm.imageUpload.selectImageFile'))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      window.alert(t('recordForm.imageUpload.imageMaxSize'))
      return
    }
    onPendingChange([
      ...pendingImages,
      {
        localId: newLocalId(),
        file,
        role: draftRole,
        context: draftContext,
        is_primary: draftPrimary,
      },
    ])
    setDraftPrimary(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const removePending = (localId: string) => {
    onPendingChange(pendingImages.filter((p) => p.localId !== localId))
  }

  const updatePending = (localId: string, patch: Partial<Omit<PendingRecordImage, 'localId' | 'file'>>) => {
    onPendingChange(
      pendingImages.map((p) => (p.localId === localId ? { ...p, ...patch } : p)),
    )
  }

  const handleDeleteServer = async (imageId: number) => {
    if (recordId == null || !canManageImages || disabled) return
    if (!window.confirm(t('recordForm.recordImages.deleteConfirm'))) return
    setDeletingId(imageId)
    try {
      await recordStore.deleteRecordImage(recordId, imageId)
      await recordStore.fetchRecord(recordId)
    } catch (e) {
      console.error(e)
      window.alert(t('recordForm.recordImages.deleteError'))
    } finally {
      setDeletingId(null)
    }
  }

  const isCreate = recordId == null

  return (
    <div className="record-multi-image-section">
      <h4 className="record-multi-image-heading">{t('recordForm.recordImages.heading')}</h4>
      <p className="record-form-section-hint">
        {isCreate ? t('recordForm.recordImages.hintCreate') : t('recordForm.recordImages.hintEdit')}
      </p>

      {!canManageImages && (
        <p className="record-form-section-hint" role="status">
          {t('recordForm.recordImages.ownerOnly')}
        </p>
      )}

      {serverImages.length > 0 && (
        <ul className="record-multi-image-server-list" aria-label={t('recordForm.recordImages.serverListAria')}>
          {serverImages.map((img) => (
            <li key={img.id} className="record-multi-image-server-card">
              <div className="record-multi-image-server-main">
                <a href={img.url} target="_blank" rel="noreferrer" className="record-multi-image-thumb-link">
                  <img src={img.url} alt="" className="record-multi-image-thumb" width={120} height={120} />
                </a>
                <div className="record-multi-image-server-body">
                  <p className="record-multi-image-role-line">
                    <span className="record-multi-image-badge">{t(`recordForm.recordImages.vocab.role.${img.role}`)}</span>
                    <span className="record-multi-image-badge record-multi-image-badge--muted">
                      {t(`recordForm.recordImages.vocab.context.${img.context}`)}
                    </span>
                  </p>
                  <RecordImageMetadataPanel image={img} />
                </div>
              </div>
              {canManageImages && !disabled && recordId != null && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => void handleDeleteServer(img.id)}
                  disabled={deletingId === img.id || recordStore.loading}
                >
                  {deletingId === img.id ? t('recordForm.recordImages.deleting') : t('recordForm.recordImages.delete')}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {serverImages.length === 0 && !isCreate && (
        <p className="record-multi-image-empty">{t('recordForm.recordImages.noImages')}</p>
      )}

      {canManageImages && !disabled && (
        <div className="record-multi-image-stager">
          <p className="record-multi-image-stager-title">{t('recordForm.recordImages.addBlockTitle')}</p>
          <div className="record-multi-image-stager-fields">
            <div className="form-group">
              <label htmlFor="record-image-draft-file">{t('recordForm.recordImages.fileLabel')}</label>
              <input
                id="record-image-draft-file"
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif"
                onChange={(e) => addPendingFromFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="record-image-draft-role">{t('recordForm.recordImages.roleLabel')}</label>
              <select
                id="record-image-draft-role"
                value={draftRole}
                onChange={(e) => setDraftRole(e.target.value as RecordImageRole)}
              >
                {RECORD_IMAGE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {t(`recordForm.recordImages.vocab.role.${r}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="record-image-draft-context">{t('recordForm.recordImages.contextLabel')}</label>
              <select
                id="record-image-draft-context"
                value={draftContext}
                onChange={(e) => setDraftContext(e.target.value as RecordImageContext)}
              >
                {RECORD_IMAGE_CONTEXTS.map((c) => (
                  <option key={c} value={c}>
                    {t(`recordForm.recordImages.vocab.context.${c}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group record-multi-image-primary-row">
              <label className="record-multi-image-checkbox-label">
                <input
                  type="checkbox"
                  checked={draftPrimary}
                  onChange={(e) => setDraftPrimary(e.target.checked)}
                />
                {t('recordForm.recordImages.primaryLabel')}
              </label>
            </div>
          </div>
        </div>
      )}

      {pendingImages.length > 0 && (
        <div className="record-multi-image-pending">
          <p className="record-multi-image-pending-title">{t('recordForm.recordImages.pendingTitle')}</p>
          <ul className="record-multi-image-pending-list">
            {pendingImages.map((p) => (
              <li key={p.localId} className="record-multi-image-pending-row">
                <span className="record-multi-image-pending-name" title={p.file.name}>
                  {p.file.name}
                </span>
                <select
                  aria-label={t('recordForm.recordImages.roleLabel')}
                  value={p.role}
                  onChange={(e) => updatePending(p.localId, { role: e.target.value as RecordImageRole })}
                  disabled={disabled}
                >
                  {RECORD_IMAGE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {t(`recordForm.recordImages.vocab.role.${r}`)}
                    </option>
                  ))}
                </select>
                <select
                  aria-label={t('recordForm.recordImages.contextLabel')}
                  value={p.context}
                  onChange={(e) => updatePending(p.localId, { context: e.target.value as RecordImageContext })}
                  disabled={disabled}
                >
                  {RECORD_IMAGE_CONTEXTS.map((c) => (
                    <option key={c} value={c}>
                      {t(`recordForm.recordImages.vocab.context.${c}`)}
                    </option>
                  ))}
                </select>
                <label className="record-multi-image-checkbox-label">
                  <input
                    type="checkbox"
                    checked={p.is_primary}
                    onChange={(e) => updatePending(p.localId, { is_primary: e.target.checked })}
                    disabled={disabled}
                  />
                  {t('recordForm.recordImages.primaryShort')}
                </label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => removePending(p.localId)}
                  disabled={disabled}
                >
                  {t('recordForm.recordImages.removePending')}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

RecordMultiImageSection.displayName = 'RecordMultiImageSection'
