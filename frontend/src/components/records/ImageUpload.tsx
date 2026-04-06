/**
 * ImageUpload Component
 * 
 * Component for uploading and previewing images.
 * 
 * Reference: docs/user-stories/03-records.md (US-015), docs/design/03-record-management-design.md
 */

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './Records.css'

interface ImageUploadProps {
  image: File | null
  onImageChange: (file: File | null) => void
  disabled?: boolean
  existingImageUrl?: string
  /** Visible label (defaults to “Image”). */
  label?: string
  /** id for the file input (defaults to “image-upload”). */
  inputId?: string
}

export const ImageUpload = ({
  image,
  onImageChange,
  disabled,
  existingImageUrl,
  label,
  inputId = 'image-upload',
}: ImageUploadProps) => {
  const { t } = useTranslation()
  const resolvedLabel = label ?? t('recordForm.imageUpload.defaultLabel')
  const [preview, setPreview] = useState<string | null>(existingImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!image) {
      setPreview(existingImageUrl ?? null)
    }
  }, [existingImageUrl, image])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(t('recordForm.imageUpload.selectImageFile'))
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert(t('recordForm.imageUpload.imageMaxSize'))
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
      <label htmlFor={inputId}>{resolvedLabel}</label>
      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif"
        onChange={handleFileChange}
        disabled={disabled}
      />
      
      {(preview || existingImageUrl) && (
        <div className="image-preview">
          <img src={preview || existingImageUrl} alt={t('recordForm.imageUpload.previewAlt')} />
          {!disabled && (
            <button type="button" onClick={handleRemove} className="btn btn-secondary btn-sm">
              {t('recordForm.imageUpload.remove')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

ImageUpload.displayName = 'ImageUpload'
