/**
 * App Component
 *
 * Main application component with routing setup.
 *
 * Reference: docs/design/04-navigation-layout.md
 *
 * NOTE: The following features are intentionally disabled for this deployment
 * (Samsung tablet kiosk, read-only public view). They remain in other git branches.
 *   - /login, /register (auth)
 *   - /collections, /collections/:id (collection management)
 *   - /collections/new, /collections/:id/edit, /collections/:collectionId/records/new (protected)
 *   - /records/:id/edit (protected record editing)
 *   - /actors/new, /actors/:id/edit (protected actor editing)
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'
import { RecordDetail } from './components/records/RecordDetail'
import { RecordsListPage } from './components/records/RecordsListPage'
import { ActorListPage } from './components/actors/ActorListPage'
import { ActorDetailPage } from './components/actors/ActorDetailPage'
import { LandingPage } from './components/LandingPage'
import { KioskFullscreenGate } from './components/kiosk/KioskFullscreenGate'
import { useTranslation } from 'react-i18next'
import './App.css'

const NotFound = () => {
  const { t } = useTranslation()
  return <div className="empty-state">{t('app.notFound')}</div>
}

export const AppContent = () => {
  return (
    <MainLayout>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/records" element={<RecordsListPage />} />
        <Route path="/records/:id" element={<RecordDetail />} />
        <Route path="/actors" element={<ActorListPage />} />
        <Route path="/actors/:id" element={<ActorDetailPage />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MainLayout>
  )
}

const App = () => {
  return (
    <BrowserRouter>
      <KioskFullscreenGate />
      <AppContent />
    </BrowserRouter>
  )
}

export default App
