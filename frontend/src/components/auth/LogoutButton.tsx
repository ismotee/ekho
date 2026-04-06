/**
 * LogoutButton Component
 * 
 * Button component for user logout.
 * 
 * Reference: docs/user-stories/01-authentication.md (US-003)
 */

import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import './Auth.css'

export const LogoutButton = observer(() => {
  const { t } = useTranslation()
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
      aria-label={t('auth.logout')}
    >
      {authStore.loading ? t('auth.loggingOut') : t('auth.logout')}
    </button>
  )
})

LogoutButton.displayName = 'LogoutButton'
