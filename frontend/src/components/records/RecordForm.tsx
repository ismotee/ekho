/**
 * RecordForm Component
 * 
 * Form for creating and editing records.
 * 
 * Reference: docs/user-stories/03-records.md (US-010, US-011, US-015), docs/design/03-record-management-design.md
 */

import { useState, FormEvent, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useNavigate, useParams } from 'react-router-dom'
import { useRecordStore } from '../../stores/recordStore'
import { useCollectionStore } from '../../stores/collectionStore'
import { Record } from '../../stores/recordStore'
import { ImageUpload } from './ImageUpload'
import './Records.css'

interface RecordFormProps {
  collectionId?: number
  record?: Record | null
  onSave?: (data: any) => Promise<void>
}

export const RecordForm = observer(({ collectionId: propsCollectionId, record: propsRecord, onSave }: RecordFormProps) => {
  const navigate = useNavigate()
  const { collectionId: urlCollectionId, id: recordId } = useParams<{ collectionId?: string; id?: string }>()
  const recordStore = useRecordStore()
  const collectionStore = useCollectionStore()
  const collectionId = propsCollectionId || (urlCollectionId ? Number(urlCollectionId) : undefined)
  
  // Determine if we're in edit mode
  const isEditMode = !!recordId || !!propsRecord
  
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [year, setYear] = useState('')
  const [medium, setMedium] = useState('')
  const [dimensions, setDimensions] = useState('')
  const [description, setDescription] = useState('')
  const [condition, setCondition] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | undefined>(undefined)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch record if in edit mode
  useEffect(() => {
    if (recordId) {
      recordStore.fetchRecord(Number(recordId))
    } else {
      // Clear current record when not in edit mode (create mode)
      recordStore.currentRecord = null
    }
  }, [recordId])

  // Update form fields when record is loaded (edit mode only)
  useEffect(() => {
    if (isEditMode) {
      const currentRecord = propsRecord || recordStore.currentRecord
      if (currentRecord) {
        setTitle(currentRecord.title || '')
        setArtist(currentRecord.artist || '')
        setYear(currentRecord.year?.toString() || '')
        setMedium(currentRecord.medium || '')
        setDimensions(currentRecord.dimensions || '')
        setDescription(currentRecord.description || '')
        setCondition(currentRecord.condition || '')
        setExistingImageUrl(currentRecord.image)
        // Get collection ID from record if not provided
        if (!collectionId && currentRecord.collection) {
          collectionStore.fetchCollection(currentRecord.collection)
        }
      }
    } else {
      // Reset all fields in create mode
      setTitle('')
      setArtist('')
      setYear('')
      setMedium('')
      setDimensions('')
      setDescription('')
      setCondition('')
      setImage(null)
      setExistingImageUrl(undefined)
      setErrors({})
    }
  }, [isEditMode, propsRecord, recordStore.currentRecord])

  useEffect(() => {
    if (collectionId) {
      collectionStore.fetchCollection(collectionId)
    } else if (recordStore.currentRecord?.collection) {
      collectionStore.fetchCollection(recordStore.currentRecord.collection)
    }
  }, [collectionId, recordStore.currentRecord?.collection])

  // Determine the actual collection ID and object
  const actualCollectionId = collectionId || recordStore.currentRecord?.collection
  const collection = collectionStore.currentCollection || 
    (actualCollectionId && collectionStore.collections.find(c => c.id === actualCollectionId)) ||
    null
  const isDisabled = collection?.is_closed || false

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!title.trim()) {
      newErrors.title = 'Title is required'
    } else if (title.length > 200) {
      newErrors.title = 'Title must be 200 characters or less'
    }
    
    if (!artist.trim()) {
      newErrors.artist = 'Artist is required'
    } else if (artist.length > 200) {
      newErrors.artist = 'Artist must be 200 characters or less'
    }
    
    if (year && (Number(year) < 1000 || Number(year) > 2100)) {
      newErrors.year = 'Year must be between 1000 and 2100'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (isDisabled) {
      return
    }

    // For create mode, collectionId is required
    if (!isEditMode && !actualCollectionId) {
      setErrors({ ...errors, general: 'Collection ID is required' })
      return
    }

    if (!validate()) {
      return
    }

    try {
      const data = {
        title,
        artist,
        year: year ? Number(year) : undefined,
        medium: medium || undefined,
        dimensions: dimensions || undefined,
        description: description || undefined,
        condition: condition || undefined,
        image: image || undefined,
      }

      if (onSave) {
        await onSave(data)
      } else if (isEditMode && recordId) {
        await recordStore.updateRecord(Number(recordId), data)
        // Navigate back to record detail
        navigate(`/records/${recordId}`)
      } else if (actualCollectionId) {
        await recordStore.createRecord(actualCollectionId, data)
        navigate(`/collections/${actualCollectionId}`)
      } else {
        throw new Error('Collection ID is required to create a record')
      }
    } catch (error: any) {
      const apiError = error as any
      const newErrors: Record<string, string> = {}
      
      if (apiError?.field_errors) {
        Object.entries(apiError.field_errors).forEach(([key, value]) => {
          newErrors[key] = Array.isArray(value) ? value[0] : String(value)
        })
      }
      
      setErrors(newErrors)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="record-form">
      <h2>{isEditMode ? 'Edit Record' : 'Create Record'}</h2>
      
      <div className="form-group">
        <label htmlFor="record-title">Title *</label>
        <input
          id="record-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          disabled={isDisabled}
          aria-invalid={!!errors.title}
        />
        {errors.title && <span className="field-error">{errors.title}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="record-artist">Artist *</label>
        <input
          id="record-artist"
          type="text"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          required
          maxLength={200}
          disabled={isDisabled}
          aria-invalid={!!errors.artist}
        />
        {errors.artist && <span className="field-error">{errors.artist}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="record-year">Year</label>
        <input
          id="record-year"
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          min={1000}
          max={2100}
          disabled={isDisabled}
          aria-invalid={!!errors.year}
        />
        {errors.year && <span className="field-error">{errors.year}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="record-medium">Medium</label>
        <input
          id="record-medium"
          type="text"
          value={medium}
          onChange={(e) => setMedium(e.target.value)}
          maxLength={100}
          disabled={isDisabled}
        />
      </div>

      <div className="form-group">
        <label htmlFor="record-dimensions">Dimensions</label>
        <input
          id="record-dimensions"
          type="text"
          value={dimensions}
          onChange={(e) => setDimensions(e.target.value)}
          maxLength={100}
          disabled={isDisabled}
        />
      </div>

      <div className="form-group">
        <label htmlFor="record-description">Description</label>
        <textarea
          id="record-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          disabled={isDisabled}
          rows={4}
        />
      </div>

      <div className="form-group">
        <label htmlFor="record-condition">Condition</label>
        <input
          id="record-condition"
          type="text"
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          maxLength={200}
          disabled={isDisabled}
        />
      </div>

      <ImageUpload
        image={image}
        onImageChange={setImage}
        disabled={isDisabled}
        existingImageUrl={existingImageUrl}
      />

      <div className="form-actions">
        <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isDisabled || recordStore.loading}>
          {recordStore.loading ? 'Loading...' : isEditMode ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
})

RecordForm.displayName = 'RecordForm'
