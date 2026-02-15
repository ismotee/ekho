/**
 * RecordCard Component
 * 
 * Card component for displaying a single record.
 * 
 * Reference: docs/design/03-record-management-design.md
 */

import { Link } from 'react-router-dom'
import { Record } from '../../stores/recordStore'
import './Records.css'

interface RecordCardProps {
  record: Record
}

export const RecordCard = ({ record }: RecordCardProps) => {
  return (
    <Link to={`/records/${record.id}`} className="record-card">
      {record.image ? (
        <img src={record.image} alt={record.title} className="record-thumbnail" />
      ) : (
        <div className="record-placeholder">No Image</div>
      )}
      <div className="record-info">
        <h3>{record.title}</h3>
        <p>Artist: {record.artist}</p>
        {record.year && <p>Year: {record.year}</p>}
        {record.collection_name && (
          <p className="record-collection-context">Collection: {record.collection_name}</p>
        )}
      </div>
    </Link>
  )
}

RecordCard.displayName = 'RecordCard'
