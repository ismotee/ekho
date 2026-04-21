/**
 * RecordsListPage tests (US-016)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecordsListPage } from '../../components/records/RecordsListPage'
import { useRecordStore } from '../../stores/recordStore'

const mockFetchAllRecords = vi.fn()
vi.mock('../../stores/recordStore', () => ({
  useRecordStore: vi.fn(() => ({
    records: [],
    loading: false,
    error: null,
    pagination: { count: 0, next: null, previous: null },
    fetchAllRecords: mockFetchAllRecords,
  })),
}))

describe('RecordsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRecordStore).mockReturnValue({
      records: [],
      loading: false,
      error: null,
      pagination: { count: 0, next: null, previous: null },
      fetchAllRecords: mockFetchAllRecords,
    } as any)
  })

  it('renders records list page without page heading', () => {
    render(<RecordsListPage />)
    expect(screen.queryByRole('heading', { name: /records/i })).not.toBeInTheDocument()
    expect(screen.getByText('No records found')).toBeInTheDocument()
  })

  it('calls fetchAllRecords with empty params on mount', () => {
    render(<RecordsListPage />)
    expect(mockFetchAllRecords).toHaveBeenCalledWith({})
  })

  it('shows loading status without page heading', () => {
    vi.mocked(useRecordStore).mockReturnValue({
      records: [],
      loading: true,
      error: null,
      pagination: { count: 0, next: null, previous: null },
      fetchAllRecords: mockFetchAllRecords,
    } as any)
    render(<RecordsListPage />)
    expect(screen.queryByRole('heading', { name: /records/i })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/loading/i)
  })
})
