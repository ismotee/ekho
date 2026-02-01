/**
 * RecordDetail Component
 * 
 * Displays detailed information about a record.
 * 
 * Reference: docs/user-stories/03-records.md (US-014), docs/design/03-record-management-design.md
 */

import { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useRecordStore } from '../../stores/recordStore'
import { useAuthStore } from '../../stores/authStore'
import { useCollectionStore } from '../../stores/collectionStore'
import './Records.css'

export const RecordDetail = observer(() => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const recordStore = useRecordStore()
  const authStore = useAuthStore()
  const collectionStore = useCollectionStore()
  const record = recordStore.currentRecord
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    if (id) {
      const recordId = Number(id)
      // Clear previous record if it doesn't match the current ID
      if (recordStore.currentRecord?.id !== recordId) {
        recordStore.currentRecord = null
      }
      recordStore.fetchRecord(recordId)
    }
  }, [id])

  useEffect(() => {
    if (record?.collection) {
      collectionStore.fetchCollection(record.collection)
    }
  }, [record?.collection])

  const handleDelete = async () => {
    if (!record || !id) return
    
    try {
      await recordStore.deleteRecord(Number(id))
      // Navigate back to collection
      const collectionId = record.collection
      if (collectionId) {
        navigate(`/collections/${collectionId}`)
      } else {
        navigate('/collections')
      }
    } catch (error) {
      console.error('Failed to delete record:', error)
      // Error is handled in store, but we can show a message here if needed
    }
  }

  if (recordStore.loading) {
    return <div>Loading...</div>
  }

  // Only show record if it matches the current route ID
  const recordId = id ? Number(id) : null
  if (!record || record.id !== recordId) {
    return <div>Loading...</div>
  }

  const collection = collectionStore.currentCollection
  const isOwner = authStore.isAuthenticated && collection && authStore.user?.id === collection.owner.id
  const canEdit = isOwner && collection && !collection.is_closed

  return (
    <div className="record-detail">
      <Link to={collection ? `/collections/${collection.id}` : '/collections'} className="back-link">
        ← Back to {collection ? collection.name : 'Collections'}
      </Link>
      
      <div className="record-content">
        <div className="record-image-section">
          {record.image ? (
            <img src={record.image} alt={record.title} className="record-image" />
          ) : (
            <div className="record-placeholder-large">No Image</div>
          )}
        </div>
        
        <div className="record-info-section">
          <h1>{record.title}</h1>
          <p className="record-artist">Artist: {record.artist}</p>
          
          <div className="record-details">
            {record.year && <p><strong>Year:</strong> {record.year}</p>}
            {record.medium && <p><strong>Medium:</strong> {record.medium}</p>}
            {record.dimensions && <p><strong>Dimensions:</strong> {record.dimensions}</p>}
            {record.condition && <p><strong>Condition:</strong> {record.condition}</p>}
            {record.description && <p className="record-description"><strong>Description:</strong> {record.description}</p>}
            
            <div className="record-meta">
              <small><strong>Created:</strong> {new Date(record.created_at).toLocaleDateString()}</small>
            </div>
          </div>

          {canEdit && (
            <div className="record-actions">
              <button onClick={() => navigate(`/records/${record.id}/edit`)} className="btn btn-primary">
                Edit
              </button>
              <button onClick={() => setShowDeleteDialog(true)} className="btn btn-danger">
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {showDeleteDialog && (
        <div className="modal-overlay" onClick={() => setShowDeleteDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Record</h2>
            <p>Are you sure you want to delete "{record.title}"? This action cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteDialog(false)} className="btn btn-secondary" disabled={recordStore.loading}>
                Cancel
              </button>
              <button onClick={handleDelete} className="btn btn-danger" disabled={recordStore.loading}>
                {recordStore.loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

RecordDetail.displayName = 'RecordDetail'
