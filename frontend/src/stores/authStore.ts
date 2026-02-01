/**
 * AuthStore
 * 
 * MobX store for managing user authentication state.
 * Handles login, logout, registration, and current user fetching.
 * 
 * Reference: docs/architecture/system-architecture.md (State Management)
 */

import { makeAutoObservable, runInAction } from 'mobx'
import { api, ApiError } from '../services/api'

export interface User {
  id: number
  username: string
  email?: string
}

export class AuthStore {
  user: User | null = null
  loading = false
  error: string | null = null

  constructor() {
    makeAutoObservable(this)
  }

  async login(username: string, password: string): Promise<void> {
    this.loading = true
    this.error = null

    try {
      const response = await api.post<User>('/auth/login/', { username, password })
      
      runInAction(() => {
        this.user = response.data || null
        this.loading = false
        this.error = null
      })
    } catch (error) {
      runInAction(() => {
        this.loading = false
        const apiError = error as ApiError
        this.error = apiError.error || apiError.detail || 'Login failed'
        this.user = null
      })
      throw error
    }
  }

  async logout(): Promise<void> {
    this.loading = true
    this.error = null

    try {
      await api.post('/auth/logout/')
      
      runInAction(() => {
        this.user = null
        this.loading = false
        this.error = null
      })
    } catch (error) {
      runInAction(() => {
        this.loading = false
        const apiError = error as ApiError
        this.error = apiError.error || apiError.detail || 'Logout failed'
      })
      // Clear user even if logout request fails
      this.user = null
    }
  }

  async register(username: string, password: string): Promise<void> {
    this.loading = true
    this.error = null

    try {
      const response = await api.post<User>('/auth/register/', { username, password })
      
      runInAction(() => {
        this.user = response.data || null
        this.loading = false
        this.error = null
      })
    } catch (error) {
      runInAction(() => {
        this.loading = false
        const apiError = error as ApiError
        this.error = apiError.error || apiError.detail || 'Registration failed'
        this.user = null
      })
      throw error
    }
  }

  async fetchCurrentUser(): Promise<void> {
    this.loading = true
    this.error = null

    try {
      const response = await api.get<User>('/auth/me/')
      
      runInAction(() => {
        this.user = response.data || null
        this.loading = false
        this.error = null
      })
    } catch (error) {
      runInAction(() => {
        this.loading = false
        const apiError = error as ApiError
        // If 401, user is not authenticated - clear user
        if (apiError.response?.status === 401) {
          this.user = null
        } else {
          this.error = apiError.error || apiError.detail || 'Failed to fetch user'
        }
      })
    }
  }

  get isAuthenticated(): boolean {
    return this.user !== null
  }
}

// Singleton instance
let authStoreInstance: AuthStore | null = null

export const getAuthStore = (): AuthStore => {
  if (!authStoreInstance) {
    authStoreInstance = new AuthStore()
  }
  return authStoreInstance
}

// Hook for React components
export const useAuthStore = (): AuthStore => {
  return getAuthStore()
}
