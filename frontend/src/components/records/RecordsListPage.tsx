/**
 * RecordsListPage Component
 *
 * Global records list (all collections). Uses same L&F as CollectionList and RecordList.
 * Reference: docs/plans/records-view-plan1-phase1.md, US-016; Plan 2 filters US-017; Plan 3 search US-018
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useRecordStore } from '../../stores/recordStore'
import { RecordCard } from './RecordCard'
import { SearchInput } from '../shared/SearchInput'
import './Records.css'

/** Debounce delay (ms) before applying filter changes. */
const FILTER_DEBOUNCE_MS = 300

/** Debounce for search input (ms). */
const SEARCH_DEBOUNCE_MS = 300

export const RecordsListPage = observer(() => {
  const { t } = useTranslation()
  const recordStore = useRecordStore()
  const recordFilters = useMemo(
    () =>
      [
        {
          key: 'collection_name' as const,
          label: t('records.filters.collectionName'),
          placeholder: t('records.filters.collectionNamePlaceholder'),
          type: 'text' as const,
        },
        {
          key: 'owner' as const,
          label: t('records.filters.owner'),
          placeholder: t('records.filters.ownerPlaceholder'),
          type: 'text' as const,
        },
      ] as const,
    [t],
  )
  const [collectionName, setCollectionName] = useState('')
  const [owner, setOwner] = useState('')
  const [search, setSearch] = useState('')
  const isFirstFetch = useRef(true)

  const fetchWithFilters = useCallback(() => {
    const params: { page?: number; page_size?: number; search?: string; collection_name?: string; owner?: string } = {}
    if (search.trim()) params.search = search.trim()
    if (collectionName.trim()) params.collection_name = collectionName.trim()
    if (owner.trim()) params.owner = owner.trim()
    recordStore.fetchAllRecords(params)
  }, [search, collectionName, owner, recordStore])

  useEffect(() => {
    if (isFirstFetch.current) {
      isFirstFetch.current = false
      fetchWithFilters()
      return
    }
    const timeoutId = setTimeout(() => fetchWithFilters(), FILTER_DEBOUNCE_MS)
    return () => clearTimeout(timeoutId)
  }, [fetchWithFilters])

  const renderContent = () => {
    if (recordStore.error) {
      return <div className="error-message">{recordStore.error}</div>
    }
    if (recordStore.loading) {
      return (
        <div className="record-list-content-loading" role="status">
          {t('common.loading')}
        </div>
      )
    }
    if (recordStore.records.length === 0) {
      return <div className="empty-state">{t('records.empty')}</div>
    }
    return (
      <>
        <div className="record-list" role="list">
          <div className="record-grid">
            {recordStore.records.map((record) => (
              <RecordCard key={record.id} record={record} />
            ))}
          </div>
        </div>
        {recordStore.pagination && recordStore.pagination.count > 0 && (
          <div className="pagination">
            <span>{t('common.total', { count: recordStore.pagination.count })}</span>
            {recordStore.pagination.next && <span>{t('common.next')}</span>}
            {recordStore.pagination.previous && <span>{t('common.previous')}</span>}
          </div>
        )}
      </>
    )
  }

  return (
    <div className="record-list-page">
      <div className="record-list-layout">
        <aside className="record-list-filters" role="group" aria-label={t('records.filterGroupAria')}>
          {recordFilters.map((filter) => (
            <label key={filter.key} className="record-filter-label">
              <span className="record-filter-label-text">{filter.label}</span>
              <input
                type={filter.type}
                value={filter.key === 'collection_name' ? collectionName : owner}
                onChange={(e) => {
                  const value = e.target.value
                  if (filter.key === 'collection_name') setCollectionName(value)
                  else if (filter.key === 'owner') setOwner(value)
                }}
                placeholder={filter.placeholder}
                aria-label={filter.label}
                className="record-filter-input"
              />
            </label>
          ))}
        </aside>
        <div className="record-list-main">
          <h1 className="record-list-title">{t('records.title')}</h1>
          <div className="record-list-search">
            <SearchInput
              value={search}
              onSearch={setSearch}
              placeholder={t('records.searchPlaceholder')}
              debounceMs={SEARCH_DEBOUNCE_MS}
              ariaLabel={t('records.searchAria')}
            />
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  )
})

RecordsListPage.displayName = 'RecordsListPage'
