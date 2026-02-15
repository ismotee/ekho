/**
 * SearchInput tests (Plan 3, US-018 – reusable search component)
 *
 * Reference: docs/plans/records-view-plan3-search-phase1.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchInput } from '../../components/shared/SearchInput'

describe('SearchInput (Plan 3, US-018)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with placeholder', () => {
    render(<SearchInput placeholder="Search records…" value="" onSearch={() => {}} />)
    expect(screen.getByPlaceholderText('Search records…')).toBeInTheDocument()
  })

  it('renders with value', () => {
    render(<SearchInput placeholder="Search" value="hello" onSearch={() => {}} />)
    expect(screen.getByDisplayValue('hello')).toBeInTheDocument()
  })

  it('calls onSearch when user types', async () => {
    const onSearch = vi.fn()
    const user = userEvent.setup()
    render(<SearchInput placeholder="Search" value="" onSearch={onSearch} />)
    const input = screen.getByPlaceholderText('Search')
    await act(async () => { await user.type(input, 'x') })
    expect(onSearch).toHaveBeenCalledWith('x')
  })

  it('has accessible label or aria-label', () => {
    render(
      <SearchInput
        placeholder="Search records…"
        value=""
        onSearch={() => {}}
        ariaLabel="Search records"
      />
    )
    expect(screen.getByRole('searchbox', { name: /search records/i })).toBeInTheDocument()
  })

  it('supports optional debounce (onSearch called after delay)', async () => {
    const onSearch = vi.fn()
    const user = userEvent.setup()
    render(
      <SearchInput placeholder="Search" value="" onSearch={onSearch} debounceMs={300} />
    )
    const input = screen.getByPlaceholderText('Search')
    await act(async () => { await user.type(input, 'ab') })
    expect(onSearch).not.toHaveBeenCalled()
    await waitFor(() => expect(onSearch).toHaveBeenCalled(), { timeout: 500 })
  })
})
