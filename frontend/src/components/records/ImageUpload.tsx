/**
 * ImageUpload Component
 * 
 * Component for uploading and previewing images.
 * 
 * Reference: docs/user-stories/03-records.md (US-015), docs/design/03-record-management-design.md
 */

import { useState, useRef } from 'react'
import './Records.css'

interface ImageUploadProps {
  image: File | null
  onImageChange: (file: File | null) => void
  disabled?: boolean
  existingImageUrl?: string
}

export const ImageUpload = ({ image, onImageChange, disabled, existingImageUrl }: ImageUploadProps) => {
  const [preview, setPreview] = useState<string | null>(existingImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB')
      return
    }

    onImageChange(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemove = () => {
    onImageChange(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="image-upload">
      <label htmlFor="image-upload">Image</label>
      <input
        id="image-upload"
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif"
        onChange={handleFileChange}
        disabled={disabled}
      />
      
      {(preview || existingImageUrl) && (
        <div className="image-preview">
          <img src={preview || existingImageUrl} alt="Preview" />
          {!disabled && (
            <button type="button" onClick={handleRemove} className="btn btn-secondary btn-sm">
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  )
}

ImageUpload.displayName = 'ImageUpload'
