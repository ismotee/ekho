/**
 * CloseCollectionDialog Component
 * 
 * Dialog for confirming collection closure.
 * 
 * Reference: docs/user-stories/02-collections.md (US-007), docs/design/02-collection-management-design.md
 */

import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useCollectionStore } from '../../stores/collectionStore'
import { Collection } from '../../stores/collectionStore'
import './Collections.css'

interface CloseCollectionDialogProps {
  collection: Collection
  onClose: () => void
}

export const CloseCollectionDialog = observer(({ collection, onClose }: CloseCollectionDialogProps) => {
  const { t } = useTranslation()
  const collectionStore = useCollectionStore()
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await collectionStore.closeCollection(collection.id)
      onClose()
      // Optionally refresh or navigate
    } catch (error) {
      console.error('Failed to close collection:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{t('collections.closeDialog.title')}</h2>
        <p>{t('collections.closeDialog.message', { name: collection.name })}</p>
        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-secondary" disabled={loading}>
            {t('collections.cancel')}
          </button>
          <button onClick={handleConfirm} className="btn btn-primary" disabled={loading}>
            {loading ? t('common.loading') : t('collections.closeDialog.confirm')}
          </button>
        </div>
      </div>
    </div>
  )
})

CloseCollectionDialog.displayName = 'CloseCollectionDialog'
