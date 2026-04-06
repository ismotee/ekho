/**
 * ProtectedRoute Component
 * 
 * Route wrapper that requires authentication.
 * Redirects to login if user is not authenticated.
 * 
 * Reference: docs/user-stories/01-authentication.md
 */

import { ReactNode, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'

interface ProtectedRouteProps {
  children: ReactNode
}

export const ProtectedRoute = observer(({ children }: ProtectedRouteProps) => {
  const { t } = useTranslation()
  const authStore = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    // Try to fetch current user on mount if not already loaded
    if (!authStore.user && !authStore.loading) {
      authStore.fetchCurrentUser()
    }
  }, [authStore])

  if (authStore.loading) {
    return <div>{t('common.loading')}</div>
  }

  if (!authStore.isAuthenticated) {
    // Redirect to login with return path
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
})

ProtectedRoute.displayName = 'ProtectedRoute'
