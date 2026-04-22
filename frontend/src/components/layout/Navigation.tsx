/**
 * Navigation Component
 *
 * Main navigation bar for the application.
 *
 * Reference: docs/design/04-navigation-layout.md
 *
 * NOTE: Auth-related UI (login, logout, username) is intentionally omitted
 * for this deployment (read-only kiosk view). Auth features remain in other git branches.
 */

import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import './Layout.css'

export const Navigation = () => {
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
      </div>
    </nav>
  )
}

Navigation.displayName = 'Navigation'
