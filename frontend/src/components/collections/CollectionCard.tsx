/**
 * CollectionCard Component
 * 
 * Card component for displaying a single collection.
 * 
 * Reference: docs/design/02-collection-management-design.md
 */

import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Collection } from '../../stores/collectionStore'
import './Collections.css'

interface CollectionCardProps {
  collection: Collection
}

export const CollectionCard = ({ collection }: CollectionCardProps) => {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? i18n.language
  const createdLabel = t('collections.listCardCreated', {
    date: new Date(collection.created_at).toLocaleDateString(locale),
  })

  return (
    <Link to={`/collections/${collection.id}`} className="collection-card">
      <h3>{collection.name}</h3>
      {collection.record_count !== undefined && (
        <p className="collection-card-count">
          {t('collections.listCardRecordCount', { count: collection.record_count })}
        </p>
      )}
      {collection.description && <p>{collection.description}</p>}
      <div className="collection-meta">
        <span>{t('collections.listCardOwner', { username: collection.owner.username })}</span>
        {collection.is_closed && (
          <span className="badge" role="status">{t('collections.closed')}</span>
        )}
      </div>
      <div className="collection-dates">
        <small>{createdLabel}</small>
      </div>
    </Link>
  )
}

CollectionCard.displayName = 'CollectionCard'
