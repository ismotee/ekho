import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import App from '../App'

// Mock stores
vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    isAuthenticated: false,
    user: null,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    fetchCurrentUser: vi.fn().mockResolvedValue(undefined),
  })),
}))

vi.mock('../stores/collectionStore', () => ({
  useCollectionStore: () => ({
    collections: [],
    currentCollection: null,
    loading: false,
    error: null,
    pagination: null,
    fetchCollections: vi.fn(),
    fetchCollection: vi.fn(),
    createCollection: vi.fn(),
    updateCollection: vi.fn(),
    closeCollection: vi.fn(),
  }),
}))

vi.mock('../stores/recordStore', () => ({
  useRecordStore: () => ({
    records: [],
    currentRecord: null,
    loading: false,
    error: null,
    fetchRecords: vi.fn(),
    fetchRecord: vi.fn(),
    createRecord: vi.fn(),
    updateRecord: vi.fn(),
    deleteRecord: vi.fn(),
  }),
}))

// Mock API
vi.mock('../services/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the application', () => {
    render(<App />)
    // App should render navigation - check for Ekho logo or Collections link
    const ekhoLink = screen.getByText(/ekho/i)
    const collectionsLink = screen.getByRole('link', { name: /collections/i })
    expect(ekhoLink).toBeInTheDocument()
    expect(collectionsLink).toBeInTheDocument()
  })

  it('renders navigation', () => {
    render(<App />)
    // Navigation should be present - check for nav element
    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()
    expect(screen.getByText(/ekho/i)).toBeInTheDocument()
  })
})
