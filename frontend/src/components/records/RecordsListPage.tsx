/**

 * RecordsListPage Component

 *

 * Global records list (all collections). Uses same L&F as CollectionList and RecordList.

 * Reference: docs/plans/records-view-plan1-phase1.md, US-016; Plan 2 filters US-017; Plan 3 search US-018

 */



import { useEffect } from 'react'

import { observer } from 'mobx-react-lite'

import { useTranslation } from 'react-i18next'

import { useRecordStore } from '../../stores/recordStore'

import { RecordCard } from './RecordCard'

import './Records.css'



export const RecordsListPage = observer(() => {

  const { t } = useTranslation()

  const recordStore = useRecordStore()



  useEffect(() => {

    void recordStore.fetchAllRecords({})

  }, [recordStore])



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

        {recordStore.pagination &&

          (recordStore.pagination.next || recordStore.pagination.previous) && (

            <div className="pagination">

              {recordStore.pagination.next && <span>{t('common.next')}</span>}

              {recordStore.pagination.previous && <span>{t('common.previous')}</span>}

            </div>

          )}

      </>

    )

  }



  return (

    <div className="record-list-page records-list-page">

      <div className="record-list-main">

        {renderContent()}

      </div>

    </div>

  )

})



RecordsListPage.displayName = 'RecordsListPage'

