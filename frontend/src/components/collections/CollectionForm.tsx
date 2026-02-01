/**
 * CollectionForm Component
 * 
 * Form for creating and editing collections.
 * 
 * Reference: docs/user-stories/02-collections.md (US-005, US-006), docs/design/02-collection-management-design.md
 */

import { useState, FormEvent, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useNavigate, useParams } from 'react-router-dom'
import { useCollectionStore } from '../../stores/collectionStore'
import { Collection } from '../../stores/collectionStore'
import './Collections.css'

interface CollectionFormProps {
  collection?: Collection | null
  onSave?: (data: { name: string; description?: string }) => Promise<void>
}

export const CollectionForm = observer(({ collection: propsCollection, onSave }: CollectionFormProps) => {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const collectionStore = useCollectionStore()
  const collection = propsCollection || (id ? collectionStore.currentCollection : null)
  const [name, setName] = useState(collection?.name || '')
  const [description, setDescription] = useState(collection?.description || '')
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({})
  const isEditMode = !!id || !!collection

  useEffect(() => {
    if (id && !collection) {
      collectionStore.fetchCollection(Number(id))
    }
  }, [id])

  useEffect(() => {
    if (collection) {
      setName(collection.name)
      setDescription(collection.description || '')
    }
  }, [collection])

  const isDisabled = collection?.is_closed || false

  const validate = (): boolean => {
    const newErrors: typeof errors = {}
    
    if (!name.trim()) {
      newErrors.name = 'Name is required'
    } else if (name.length > 200) {
      newErrors.name = 'Name must be 200 characters or less'
    }
    
    if (description && description.length > 1000) {
      newErrors.description = 'Description must be 1000 characters or less'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (isDisabled) {
      return
    }

    if (!validate()) {
      return
    }

    try {
      if (onSave) {
        await onSave({ name, description })
      } else if (isEditMode && collection && id) {
        await collectionStore.updateCollection(Number(id), { name, description })
      } else {
        await collectionStore.createCollection({ name, description })
      }
      
      navigate('/collections')
    } catch (error: any) {
      const apiError = error as any
      const newErrors: typeof errors = {}
      
      if (apiError?.field_errors?.name) {
        newErrors.name = apiError.field_errors.name[0]
      }
      if (apiError?.field_errors?.description) {
        newErrors.description = apiError.field_errors.description[0]
      }
      
      setErrors(newErrors)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="collection-form" noValidate>
      <h2>{isEditMode ? 'Edit Collection' : 'Create Collection'}</h2>
      
      <div className="form-group">
        <label htmlFor="collection-name">Name *</label>
        <input
          id="collection-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={200}
          disabled={isDisabled}
          aria-invalid={!!errors.name}
        />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="collection-description">Description</label>
        <textarea
          id="collection-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          disabled={isDisabled}
          rows={4}
          aria-invalid={!!errors.description}
        />
        {errors.description && <span className="field-error">{errors.description}</span>}
      </div>

      <div className="form-actions">
        <button type="button" onClick={() => navigate('/collections')} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isDisabled || collectionStore.loading}>
          {collectionStore.loading ? 'Loading...' : isEditMode ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
})

CollectionForm.displayName = 'CollectionForm'
