import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { ActorDetailPage } from '../../components/actors/ActorDetailPage'
import { useActorStore } from '../../stores/actorStore'
import { useAuthStore } from '../../stores/authStore'

vi.mock('../../stores/actorStore', () => ({
  useActorStore: vi.fn(),
}))

vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: '10' }),
  Link: ({ to, children, className }: { to: string; children: ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}))

describe('ActorDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders hybrid domain navigation and drills to field panel', async () => {
    const actor = {
      id: 10,
      owner: { id: 1, username: 'owner' },
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-02T00:00:00Z',
      data: {
        person: {
          first_names: [{ text: 'Ada' }],
        },
      },
    }
    vi.mocked(useActorStore).mockReturnValue({
      actors: [actor],
      currentActor: actor,
      loading: false,
      error: null,
      pagination: { count: 1, next: null, previous: null },
      fetchActors: vi.fn().mockResolvedValue(undefined),
      fetchActor: vi.fn().mockResolvedValue(undefined),
      fetchUsage: vi.fn().mockResolvedValue({ count: 0, records: [] }),
      createActor: vi.fn(),
      updateActor: vi.fn(),
      deleteActor: vi.fn(),
      actorById: vi.fn(() => actor),
      invalidateListCache: vi.fn(),
    } as never)
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, username: 'owner' },
    } as never)

    const user = userEvent.setup()
    render(<ActorDetailPage />)
    const domainNav = screen.getByRole('navigation', { name: /actor data by section/i })

    await user.click(within(domainNav).getByRole('button', { name: /^Person$/i }))
    await user.click(within(domainNav).getByRole('button', { name: /first names/i }))
    await user.click(within(domainNav).getByRole('button', { name: /^Ada$/ }))
    await user.click(within(domainNav).getByRole('button', { name: /^Text$/i }))

    await waitFor(() => {
      const fieldPanel = domainNav.querySelector('.record-detail-domain-nav__field-panel')
      expect(fieldPanel).not.toBeNull()
      expect(fieldPanel).toHaveTextContent('Ada')
    })
  })

  it('supports breadcrumb back to section level', async () => {
    const actor = {
      id: 10,
      owner: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-02T00:00:00Z',
      data: {
        person: {
          nationality: 'Finnish',
        },
      },
    }
    vi.mocked(useActorStore).mockReturnValue({
      actors: [actor],
      currentActor: actor,
      loading: false,
      error: null,
      pagination: { count: 1, next: null, previous: null },
      fetchActors: vi.fn().mockResolvedValue(undefined),
      fetchActor: vi.fn().mockResolvedValue(undefined),
      fetchUsage: vi.fn().mockResolvedValue({ count: 0, records: [] }),
      createActor: vi.fn(),
      updateActor: vi.fn(),
      deleteActor: vi.fn(),
      actorById: vi.fn(() => actor),
      invalidateListCache: vi.fn(),
    } as never)
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
      user: null,
    } as never)

    const user = userEvent.setup()
    render(<ActorDetailPage />)
    const domainNav = screen.getByRole('navigation', { name: /actor data by section/i })

    await user.click(within(domainNav).getByRole('button', { name: /^Person$/i }))
    await user.click(within(domainNav).getByRole('button', { name: /nationality/i }))
    await user.click(within(domainNav).getByRole('button', { name: /^Person$/i }))

    await waitFor(() => {
      expect(within(domainNav).getByRole('button', { name: /nationality/i })).toBeInTheDocument()
    })
  })
})
