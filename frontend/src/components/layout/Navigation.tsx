/**
 * Navigation Component
 * 
 * Main navigation bar for the application.
 * 
 * Reference: docs/design/04-navigation-layout.md
 */

import { observer } from 'mobx-react-lite'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../stores/authStore'
import { LogoutButton } from '../auth/LogoutButton'
import './Layout.css'

export const Navigation = observer(() => {
  const authStore = useAuthStore()
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const hideSectionLinks = pathname === '/'

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-left">
          <Link to="/" className="nav-logo">
            {t('app.brand')}
          </Link>
          {!hideSectionLinks ? (
            <>
              <Link to="/records" className="nav-link">
                {t('nav.records')}
              </Link>
              <Link to="/actors" className="nav-link">
                {t('nav.actors')}
              </Link>
            </>
          ) : null}
        </div>
        
        {authStore.isAuthenticated ? (
          <div className="nav-right">
            <span className="nav-username">{authStore.user?.username}</span>
            <LogoutButton />
          </div>
        ) : null}
      </div>
    </nav>
  )
})

Navigation.displayName = 'Navigation'
