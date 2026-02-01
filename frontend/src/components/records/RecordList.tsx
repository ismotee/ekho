/**
 * RecordList Component
 * 
 * Displays a list of records for a collection.
 * 
 * Reference: docs/user-stories/03-records.md (US-013), docs/design/03-record-management-design.md
 */

import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useRecordStore } from '../../stores/recordStore'
import { RecordCard } from './RecordCard'
import './Records.css'

interface RecordListProps {
  collectionId: number
  records?: any[]
  loading?: boolean
  error?: string | null
}

export const RecordList = observer(({ collectionId, records: propsRecords, loading: propsLoading, error: propsError }: RecordListProps) => {
  const recordStore = useRecordStore()
  const records = propsRecords ?? recordStore.records
  const loading = propsLoading ?? recordStore.loading
  const error = propsError ?? recordStore.error

  useEffect(() => {
    if (!propsRecords && collectionId) {
      recordStore.fetchRecords(collectionId)
    }
  }, [collectionId])

  if (loading) {
    return <div role="status">Loading...</div>
  }

  if (error) {
    return <div className="error-message">{error}</div>
  }

  if (records.length === 0) {
    return <div className="empty-state">No records found</div>
  }

  return (
    <div className="record-list" role="list">
      <div className="record-grid">
        {records.map((record) => (
          <RecordCard key={record.id} record={record} />
        ))}
      </div>
    </div>
  )
})

RecordList.displayName = 'RecordList'
