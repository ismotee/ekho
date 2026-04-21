import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppContent } from '../App'

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

vi.mock('../stores/actorStore', () => ({
  useActorStore: () => ({
    actors: [],
    currentActor: null,
    loading: false,
    error: null,
    pagination: { count: 0, next: null, previous: null },
    fetchActors: vi.fn().mockResolvedValue(undefined),
    fetchActor: vi.fn(),
    fetchUsage: vi.fn(),
    createActor: vi.fn(),
    updateActor: vi.fn(),
    deleteActor: vi.fn(),
    actorById: () => undefined,
    invalidateListCache: vi.fn(),
  }),
}))

vi.mock('../stores/recordStore', () => ({
  useRecordStore: () => ({
    records: [],
    currentRecord: null,
    loading: false,
    error: null,
    pagination: { count: 0, next: null, previous: null },
    fetchRecords: vi.fn(),
    fetchAllRecords: vi.fn(),
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
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppContent />
      </MemoryRouter>
    )
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /^Laukkanen Collection$/i })
    ).toHaveAttribute('href', '/')
    const toRecords = screen.getByRole('link', { name: /go to collection/i })
    expect(toRecords).toHaveAttribute('href', '/records')
  })

  it('renders navigation', () => {
    render(
      <MemoryRouter initialEntries={['/collections']}>
        <AppContent />
      </MemoryRouter>
    )
    const nav = screen.getByRole('navigation')
    expect(nav).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /^Laukkanen Collection$/i })
    ).toHaveAttribute('href', '/')
  })

  it('renders Records link in navigation (US-016)', () => {
    render(
      <MemoryRouter initialEntries={['/collections']}>
        <AppContent />
      </MemoryRouter>
    )
    const recordsLink = screen.getByRole('link', { name: /records/i })
    expect(recordsLink).toBeInTheDocument()
    expect(recordsLink).toHaveAttribute('href', '/records')
  })

  it('renders records list page at /records route (US-016)', () => {
    render(
      <MemoryRouter initialEntries={['/records']}>
        <AppContent />
      </MemoryRouter>
    )
    expect(screen.getByText('No records found')).toBeInTheDocument()
  })
})
