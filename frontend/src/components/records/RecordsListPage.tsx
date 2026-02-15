/**
 * RecordsListPage Component
 *
 * Global records list (all collections). Uses same L&F as CollectionList and RecordList.
 * Reference: docs/plans/records-view-plan1-phase1.md, US-016
 */

import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useRecordStore } from '../../stores/recordStore'
import { RecordCard } from './RecordCard'
import './Records.css'

export const RecordsListPage = observer(() => {
  const recordStore = useRecordStore()

  useEffect(() => {
    recordStore.fetchAllRecords({})
  }, [])

  if (recordStore.loading) {
    return <div role="status">Loading...</div>
  }

  if (recordStore.error) {
    return <div className="error-message">{recordStore.error}</div>
  }

  return (
    <div className="record-list-page">
      <div className="record-list-header">
        <h1>Records</h1>
      </div>

      {recordStore.records.length === 0 ? (
        <div className="empty-state">No records found</div>
      ) : (
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
              <span>Total: {recordStore.pagination.count}</span>
              {recordStore.pagination.next && <span>Next</span>}
              {recordStore.pagination.previous && <span>Previous</span>}
            </div>
          )}
        </>
      )}
    </div>
  )
})

RecordsListPage.displayName = 'RecordsListPage'
