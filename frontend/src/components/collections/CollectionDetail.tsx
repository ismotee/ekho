/**
 * CollectionDetail Component
 * 
 * Displays detailed information about a collection.
 * 
 * Reference: docs/user-stories/02-collections.md (US-009), docs/design/02-collection-management-design.md
 */

import { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useCollectionStore } from '../../stores/collectionStore'
import { useAuthStore } from '../../stores/authStore'
import { CloseCollectionDialog } from './CloseCollectionDialog'
import { RecordList } from '../records/RecordList'
import './Collections.css'

export const CollectionDetail = observer(() => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const collectionStore = useCollectionStore()
  const authStore = useAuthStore()
  const collection = collectionStore.currentCollection
  const [showCloseDialog, setShowCloseDialog] = useState(false)

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

  if (collectionStore.loading) {
    return <div>Loading...</div>
  }

  // Only show collection if it matches the current route ID
  const collectionId = id ? Number(id) : null
  if (!collection || collection.id !== collectionId) {
    return <div>Loading...</div>
  }

  const isOwner = authStore.isAuthenticated && authStore.user?.id === collection.owner.id
  const canEdit = isOwner && !collection.is_closed

  return (
    <div className="collection-detail">
      <Link to="/collections" className="back-link">← Back to Collections</Link>
      
      <div className="collection-header">
        <div className="collection-title-section">
          <h1>{collection.name}</h1>
          {collection.is_closed && <span className="badge">Closed</span>}
        </div>
        {canEdit && (
          <div className="collection-actions">
            <button onClick={() => navigate(`/collections/${collection.id}/edit`)} className="btn btn-primary">
              Edit
            </button>
            <button onClick={() => setShowCloseDialog(true)} className="btn btn-danger">
              Close Collection
            </button>
          </div>
        )}
      </div>
      
      <div className="collection-info">
        {collection.description && (
          <p><strong>Description:</strong> {collection.description}</p>
        )}
        <p><strong>Owner:</strong> {collection.owner.username}</p>
        <p><strong>Created:</strong> {new Date(collection.created_at).toLocaleDateString()}</p>
        {collection.record_count !== undefined && (
          <p><strong>Records:</strong> {collection.record_count}</p>
        )}
      </div>

      <div className="records-section">
        <div className="records-section-header">
          <h2>Records</h2>
          {canEdit && (
            <Link 
              to={`/collections/${collection.id}/records/new`} 
              className="btn btn-primary"
            >
              + Add Record
            </Link>
          )}
        </div>
        <RecordList collectionId={collection.id} />
      </div>

      {showCloseDialog && (
        <CloseCollectionDialog
          collection={collection}
          onClose={() => setShowCloseDialog(false)}
        />
      )}
    </div>
  )
})

CollectionDetail.displayName = 'CollectionDetail'
