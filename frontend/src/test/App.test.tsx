import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

describe('App', () => {
  it('renders the application', () => {
    render(<App />)
    expect(screen.getByText('Ekho Application')).toBeInTheDocument()
  })

  it('displays initial count', () => {
    render(<App />)
    expect(screen.getByText(/Count: 0/)).toBeInTheDocument()
  })

  it('increments count when button is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const incrementButton = screen.getByText('Increment')
    await user.click(incrementButton)
    
    expect(screen.getByText(/Count: 1/)).toBeInTheDocument()
  })
})
