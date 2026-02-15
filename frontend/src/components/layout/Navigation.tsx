/**
 * Navigation Component
 * 
 * Main navigation bar for the application.
 * 
 * Reference: docs/design/04-navigation-layout.md
 */

import { observer } from 'mobx-react-lite'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { LogoutButton } from '../auth/LogoutButton'
import './Layout.css'

export const Navigation = observer(() => {
  const authStore = useAuthStore()
  const navigate = useNavigate()

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-left">
          <Link to="/collections" className="nav-logo">
            Ekho
          </Link>
          <Link to="/collections" className="nav-link">
            Collections
          </Link>
          <Link to="/records" className="nav-link">
            Records
          </Link>
        </div>
        
        <div className="nav-right">
          {authStore.isAuthenticated ? (
            <>
              <span className="nav-username">{authStore.user?.username}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
})

Navigation.displayName = 'Navigation'
