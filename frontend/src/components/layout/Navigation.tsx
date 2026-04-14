/**
 * Navigation Component
 * 
 * Main navigation bar for the application.
 * 
 * Reference: docs/design/04-navigation-layout.md
 */

import { observer } from 'mobx-react-lite'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../../stores/authStore'
import { LogoutButton } from '../auth/LogoutButton'
import { ThemeToggle } from './ThemeToggle'
import { LanguageSwitcher } from './LanguageSwitcher'
import './Layout.css'

export const Navigation = observer(() => {
  const authStore = useAuthStore()
  const { t } = useTranslation()

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-left">
          <Link to="/records" className="nav-logo">
            {t('app.brand')}
          </Link>
          <Link to="/collections" className="nav-link">
            {t('nav.collections')}
          </Link>
          <Link to="/records" className="nav-link">
            {t('nav.records')}
          </Link>
          <Link to="/actors" className="nav-link">
            {t('nav.actors')}
          </Link>
        </div>
        
        <div className="nav-right">
          <LanguageSwitcher />
          <ThemeToggle />
          {authStore.isAuthenticated ? (
            <>
              <span className="nav-username">{authStore.user?.username}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">
                {t('nav.login')}
              </Link>
              <Link to="/register" className="btn btn-primary">
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
})

Navigation.displayName = 'Navigation'
