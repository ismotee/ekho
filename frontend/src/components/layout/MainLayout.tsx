/**
 * MainLayout Component
 * 
 * Main layout wrapper for the application.
 * 
 * Reference: docs/design/04-navigation-layout.md
 */

import { ReactNode } from 'react'
import { Navigation } from './Navigation'
import './Layout.css'

interface MainLayoutProps {
  children: ReactNode
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="main-layout">
      <Navigation />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

MainLayout.displayName = 'MainLayout'
