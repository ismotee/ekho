/**
 * RecordsListPage tests (US-016, US-017 – Plan 2 filters)
 *
 * TDD: These tests FAIL until RecordsListPage has filter UI and store passes
 * collection_name and owner to fetchAllRecords. Phase 3 implements to pass.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

describe('RecordsListPage – Filters (Plan 2, US-017)', () => {
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

  it('renders page title Records', () => {
    render(<RecordsListPage />)
    expect(screen.getByRole('heading', { name: /records/i })).toBeInTheDocument()
  })

  it('has collection name filter control', () => {
    render(<RecordsListPage />)
    const labelOrPlaceholder = screen.queryByLabelText(/collection name/i) ??
      screen.queryByPlaceholderText(/filter by collection name/i)
    expect(labelOrPlaceholder).toBeInTheDocument()
  })

  it('has collection owner filter control', () => {
    render(<RecordsListPage />)
    const labelOrPlaceholder = screen.queryByLabelText(/owner/i) ??
      screen.queryByPlaceholderText(/filter by owner/i)
    expect(labelOrPlaceholder).toBeInTheDocument()
  })

  it('keeps filter inputs mounted when loading (prevents focus loss on every keystroke)', () => {
    vi.mocked(useRecordStore).mockReturnValue({
      records: [],
      loading: true,
      error: null,
      pagination: { count: 0, next: null, previous: null },
      fetchAllRecords: mockFetchAllRecords,
    } as any)
    render(<RecordsListPage />)
    const collectionNameInput = screen.queryByLabelText(/collection name/i) ??
      screen.queryByPlaceholderText(/filter by collection name/i)
    const ownerInput = screen.queryByLabelText(/owner/i) ??
      screen.queryByPlaceholderText(/filter by owner/i)
    expect(collectionNameInput).toBeInTheDocument()
    expect(ownerInput).toBeInTheDocument()
  })

  it('calls fetchAllRecords with collection_name when user sets collection name filter', async () => {
    const user = userEvent.setup()
    render(<RecordsListPage />)
    const collectionNameInput = screen.queryByLabelText(/collection name/i) ??
      screen.queryByPlaceholderText(/filter by collection name/i)
    expect(collectionNameInput).toBeInTheDocument()
    await act(async () => {
      await user.type(collectionNameInput!, 'My Gallery')
    })
    await waitFor(() => {
      expect(mockFetchAllRecords).toHaveBeenCalledWith(
        expect.objectContaining({ collection_name: 'My Gallery' })
      )
    })
  })

  it('calls fetchAllRecords with owner when user sets owner filter', async () => {
    const user = userEvent.setup()
    render(<RecordsListPage />)
    const ownerInput = screen.queryByLabelText(/owner/i) ??
      screen.queryByPlaceholderText(/filter by owner/i)
    expect(ownerInput).toBeInTheDocument()
    await act(async () => {
      await user.type(ownerInput!, 'johndoe')
    })
    await waitFor(() => {
      expect(mockFetchAllRecords).toHaveBeenCalledWith(
        expect.objectContaining({ owner: 'johndoe' })
      )
    })
  })

  it('calls fetchAllRecords with both collection_name and owner when both filters set', async () => {
    const user = userEvent.setup()
    render(<RecordsListPage />)
    const collectionNameInput = screen.queryByLabelText(/collection name/i) ??
      screen.queryByPlaceholderText(/filter by collection name/i)
    const ownerInput = screen.queryByLabelText(/owner/i) ??
      screen.queryByPlaceholderText(/filter by owner/i)
    expect(collectionNameInput).toBeInTheDocument()
    expect(ownerInput).toBeInTheDocument()
    await act(async () => {
      await user.type(collectionNameInput!, 'Art')
      await user.type(ownerInput!, 'alice')
    })
    await waitFor(() => {
      expect(mockFetchAllRecords).toHaveBeenCalledWith(
        expect.objectContaining({
          collection_name: 'Art',
          owner: 'alice',
        })
      )
    })
  })
})

describe('RecordsListPage – Search (Plan 3, US-018)', () => {
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

  it('has search input on records page', () => {
    render(<RecordsListPage />)
    const searchInput = screen.queryByRole('searchbox') ?? screen.queryByPlaceholderText(/search records/i)
    expect(searchInput).toBeInTheDocument()
  })

  it('calls fetchAllRecords with search param when user types in search', async () => {
    const user = userEvent.setup()
    render(<RecordsListPage />)
    const searchInput = screen.queryByRole('searchbox') ?? screen.queryByPlaceholderText(/search/i)
    expect(searchInput).toBeInTheDocument()
    await act(async () => {
      await user.type(searchInput!, 'sunset')
    })
    await waitFor(() => {
      expect(mockFetchAllRecords).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'sunset' })
      )
    })
  })

  it('calls fetchAllRecords with search combined with filters', async () => {
    const user = userEvent.setup()
    render(<RecordsListPage />)
    const searchInput = screen.queryByRole('searchbox') ?? screen.queryByPlaceholderText(/search/i)
    const collectionNameInput = screen.queryByLabelText(/collection name/i) ??
      screen.queryByPlaceholderText(/filter by collection name/i)
    await act(async () => {
      await user.type(collectionNameInput!, 'Gallery')
      await user.type(searchInput!, 'art')
    })
    await waitFor(() => {
      expect(mockFetchAllRecords).toHaveBeenCalledWith(
        expect.objectContaining({
          collection_name: 'Gallery',
          search: 'art',
        })
      )
    })
  })
})
