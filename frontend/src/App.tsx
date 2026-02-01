/**
 * App Component
 * 
 * Main application component with routing setup.
 * 
 * Reference: docs/design/04-navigation-layout.md
 */

import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { MainLayout } from './components/layout/MainLayout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { LoginForm } from './components/auth/LoginForm'
import { RegisterForm } from './components/auth/RegisterForm'
import { CollectionList } from './components/collections/CollectionList'
import { CollectionDetail } from './components/collections/CollectionDetail'
import { CollectionForm } from './components/collections/CollectionForm'
import { RecordDetail } from './components/records/RecordDetail'
import { RecordForm } from './components/records/RecordForm'
import { useAuthStore } from './stores/authStore'
import './App.css'

const AppContent = observer(() => {
  const authStore = useAuthStore()

  // Fetch current user on app load to restore authentication state
  useEffect(() => {
    authStore.fetchCurrentUser()
  }, [authStore])

  return (
    <MainLayout>
      <Routes>
          {/* Public routes */}
          <Route path="/" element={<Navigate to="/collections" replace />} />
          <Route path="/collections" element={<CollectionList />} />
          <Route path="/collections/:id" element={<CollectionDetail />} />
          <Route path="/records/:id" element={<RecordDetail />} />
          
          {/* Auth routes */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          
          {/* Protected routes */}
          <Route
            path="/collections/new"
            element={
              <ProtectedRoute>
                <CollectionForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/collections/:id/edit"
            element={
              <ProtectedRoute>
                <CollectionForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/collections/:collectionId/records/new"
            element={
              <ProtectedRoute>
                <RecordForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/records/:id/edit"
            element={
              <ProtectedRoute>
                <RecordForm />
              </ProtectedRoute>
            }
          />
          
        {/* 404 */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </MainLayout>
  )
})

const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
