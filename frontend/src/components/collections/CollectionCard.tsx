/**
 * CollectionCard Component
 * 
 * Card component for displaying a single collection.
 * 
 * Reference: docs/design/02-collection-management-design.md
 */

import { Link } from 'react-router-dom'
import { Collection } from '../../stores/collectionStore'
import './Collections.css'

interface CollectionCardProps {
  collection: Collection
}

export const CollectionCard = ({ collection }: CollectionCardProps) => {
  return (
    <Link to={`/collections/${collection.id}`} className="collection-card">
      <h3>{collection.name}</h3>
      {collection.description && <p>{collection.description}</p>}
      <div className="collection-meta">
        <span>Owner: {collection.owner.username}</span>
        {collection.record_count !== undefined && (
          <span>Records: {collection.record_count}</span>
        )}
        {collection.is_closed && (
          <span className="badge" role="status">Closed</span>
        )}
      </div>
      <div className="collection-dates">
        <small>Created: {new Date(collection.created_at).toLocaleDateString()}</small>
      </div>
    </Link>
  )
}

CollectionCard.displayName = 'CollectionCard'
