/**
 * CollectionList Component
 * 
 * Displays a list of collections.
 * 
 * Reference: docs/user-stories/02-collections.md (US-008), docs/design/02-collection-management-design.md
 */

import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useCollectionStore } from '../../stores/collectionStore'
import { useAuthStore } from '../../stores/authStore'
import { CollectionCard } from './CollectionCard'
import './Collections.css'

interface CollectionListProps {
  collections?: any[]
  loading?: boolean
  error?: string | null
  pagination?: any
}

export const CollectionList = observer((props: CollectionListProps) => {
  const { t } = useTranslation()
  const collectionStore = useCollectionStore()
  const authStore = useAuthStore()
  const [showAllCollections, setShowAllCollections] = useState(false)
  const [hideClosedCollections, setHideClosedCollections] = useState(true)
  const collections = props.collections ?? collectionStore.collections
  const loading = props.loading ?? collectionStore.loading
  const error = props.error ?? collectionStore.error
  const pagination = props.pagination ?? collectionStore.pagination

  useEffect(() => {
    // Only fetch if not using props collections
    if (props.collections) {
      return
    }

    // If authenticated, show only own collections by default
    const params: any = {}
    if (authStore.isAuthenticated && !showAllCollections && authStore.user) {
      params.owner = authStore.user.username
    }
    if (hideClosedCollections) {
      params.is_closed = false
    }
    
    collectionStore.fetchCollections(params)
  }, [authStore.isAuthenticated, authStore.user?.username, showAllCollections, hideClosedCollections, props.collections])

  if (loading) {
    return <div role="status">{t('common.loading')}</div>
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  return (
    <div className="collection-list-page">
      <div className="collection-list-header">
        <div className="collection-list-title-section">
          <h1>{t('collections.title')}</h1>
          <div className="collection-filters">
            {authStore.isAuthenticated && (
              <label className="filter-toggle">
                <input
                  type="checkbox"
                  checked={showAllCollections}
                  onChange={(e) => setShowAllCollections(e.target.checked)}
                />
                <span>{t('collections.showAll')}</span>
              </label>
            )}
            <label className="filter-toggle">
              <input
                type="checkbox"
                checked={hideClosedCollections}
                onChange={(e) => setHideClosedCollections(e.target.checked)}
              />
              <span>{t('collections.hideClosed')}</span>
            </label>
          </div>
        </div>
        {authStore.isAuthenticated && (
          <Link to="/collections/new" className="btn btn-primary">
            {t('collections.create')}
          </Link>
        )}
      </div>

      {collections.length === 0 ? (
        <div className="empty-state">
          <p>{t('collections.empty')}</p>
          {authStore.isAuthenticated && (
            <Link to="/collections/new" className="btn btn-primary">
              {t('collections.createFirst')}
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="collection-list" role="list">
            <div className="collection-grid">
              {collections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))}
            </div>
          </div>
          
          {pagination && pagination.count > 0 && (
            <div className="pagination">
              <span>{t('common.total', { count: pagination.count })}</span>
              {pagination.next && <button type="button">{t('common.next')}</button>}
              {pagination.previous && <button type="button">{t('common.previous')}</button>}
            </div>
          )}
        </>
      )}
    </div>
  )
})

CollectionList.displayName = 'CollectionList'
