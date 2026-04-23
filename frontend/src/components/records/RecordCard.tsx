/**
 * RecordCard Component
 *
 * Card component for displaying a single record.
 *
 * Reference: docs/design/03-record-management-design.md
 */

import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Record } from '../../stores/recordStore'
import { getRecordCardSummary } from '../../types/record'
import './Records.css'

interface RecordCardProps {
  record: Record
}

export const RecordCard = ({ record }: RecordCardProps) => {
  const { t } = useTranslation()
  const location = useLocation()
  const from = `${location.pathname}${location.search}`
  const {
    primaryLabel,
    secondaryLine,
    thumbnailUrl,
  } = getRecordCardSummary(record)
  const translatedPrimaryLabel =
    primaryLabel === 'Untitled record' ? t('records.card.untitled') : primaryLabel

  return (
    <Link to={`/records/${record.id}`} state={{ from }} className="record-card">
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
      </div>
    </Link>
  )
}

RecordCard.displayName = 'RecordCard'
