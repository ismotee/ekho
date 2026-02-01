/**
 * LogoutButton Component
 * 
 * Button component for user logout.
 * 
 * Reference: docs/user-stories/01-authentication.md (US-003)
 */

import { observer } from 'mobx-react-lite'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import './Auth.css'

export const LogoutButton = observer(() => {
  const navigate = useNavigate()
  const authStore = useAuthStore()

  const handleLogout = async () => {
    try {
      await authStore.logout()
      navigate('/collections')
    } catch (error) {
      // Error is handled in store
      console.error('Logout failed:', error)
    }
  }

  if (!authStore.isAuthenticated) {
    return null
  }

  return (
    <button 
      onClick={handleLogout}
      className="btn btn-secondary"
      disabled={authStore.loading}
      aria-label="Logout"
    >
      {authStore.loading ? 'Logging out...' : 'Logout'}
    </button>
  )
})

LogoutButton.displayName = 'LogoutButton'
