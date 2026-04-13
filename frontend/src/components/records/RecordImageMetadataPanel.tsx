import { useTranslation } from 'react-i18next'
import type { RecordImage } from '../../types/record'
import { formatBytes } from '../../lib/formatBytes'

function shortChecksum(hex: string): string {
  if (!hex || hex.length < 10) return hex || '—'
  return `${hex.slice(0, 8)}…${hex.slice(-6)}`
}

export interface RecordImageMetadataPanelProps {
  image: RecordImage
  /** When false, checksum is omitted (e.g. compact list). */
  showChecksum?: boolean
}

/**
 * Read-only server autofill: dimensions, format, MIME, size, checksum, workflow fields.
 */
export function RecordImageMetadataPanel({ image, showChecksum = true }: RecordImageMetadataPanelProps) {
  const { t } = useTranslation()

  const rows: { key: string; value: string }[] = [
    { key: 'dimensions', value: `${image.width} × ${image.height}` },
    { key: 'byte_size', value: formatBytes(image.byte_size) },
    { key: 'mime_type', value: image.mime_type || '—' },
    { key: 'format', value: image.format ?? '—' },
    { key: 'status', value: t(`recordForm.recordImages.statusValues.${image.status}`, image.status) },
    { key: 'sort_order', value: String(image.sort_order) },
    {
      key: 'is_primary',
      value: image.is_primary ? t('recordForm.recordImages.yes') : t('recordForm.recordImages.no'),
    },
  ]

  if (showChecksum) {
    rows.push({ key: 'checksum_sha256', value: shortChecksum(image.checksum_sha256) })
  }

  return (
    <dl className="record-image-metadata">
      {rows.map(({ key, value }) => (
        <div key={key} className="record-image-metadata-row">
          <dt>{t(`recordForm.recordImages.fields.${key}`)}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

RecordImageMetadataPanel.displayName = 'RecordImageMetadataPanel'
