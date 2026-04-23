/**
 * RecordCard Component
 *
 * Card component for displaying a single record.
 *
 * Reference: docs/design/03-record-management-design.md
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Record } from '../../stores/recordStore'
import { getRecordCardSummary } from '../../types/record'
import './Records.css'

interface RecordCardProps {
  record: Record
}

export const RecordCard = ({ record }: RecordCardProps) => {
  const { t } = useTranslation()
  const {
    primaryLabel,
    secondaryLine,
    yearLine,
    thumbnailUrl,
    collectionName,
  } = getRecordCardSummary(record)
  const translatedPrimaryLabel =
    primaryLabel === 'Untitled record' ? t('records.card.untitled') : primaryLabel

  return (
    <Link to={`/records/${record.id}`} className="record-card">
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt=""
          className="record-thumbnail"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="record-placeholder">{t('records.card.noImage')}</div>
      )}
      <div className="record-info">
        <h3>{translatedPrimaryLabel}</h3>
        {secondaryLine && <p className="record-card-secondary">{secondaryLine}</p>}
        {yearLine && <p className="record-card-year">{t('records.card.year')}: {yearLine}</p>}
        {collectionName && (
          <p className="record-collection-context">
            {t('records.card.collection')}: {collectionName}
          </p>
        )}
      </div>
    </Link>
  )
}

RecordCard.displayName = 'RecordCard'
