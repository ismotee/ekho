/**
 * CollectionStore
 * 
 * MobX store for managing collection data and operations.
 * Handles fetching, creating, updating, and closing collections.
 * 
 * Reference: docs/architecture/system-architecture.md (State Management)
 */

import { makeAutoObservable, runInAction } from 'mobx'
import { api, ApiError } from '../services/api'

export interface CollectionOwner {
  id: number
  username: string
}

export interface Collection {
  id: number
  name: string
  description?: string
  owner: CollectionOwner
  is_closed: boolean
  created_at: string
  updated_at: string
  record_count?: number
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export class CollectionStore {
  collections: Collection[] = []
  currentCollection: Collection | null = null
  loading = false
  error: string | null = null
  pagination: {
    count: number
    next: string | null
    previous: string | null
  } = {
    count: 0,
    next: null,
    previous: null,
  }

  constructor() {
    makeAutoObservable(this)
  }

  async fetchCollections(params?: {
    page?: number
    page_size?: number
    owner?: string
    is_closed?: boolean
  }): Promise<void> {
    this.loading = true
    this.error = null

    try {
      const response = await api.get<Collection>('/collections/', params)
      
      runInAction(() => {
        if (response.results) {
          this.collections = response.results
          this.pagination = {
            count: response.count || 0,
            next: response.next || null,
            previous: response.previous || null,
          }
        } else if (response.data) {
          // Handle single collection response
          this.collections = [response.data]
        }
        this.loading = false
        this.error = null
      })
    } catch (error) {
      runInAction(() => {
        this.loading = false
        const apiError = error as ApiError
        this.error = apiError.error || apiError.detail || 'Failed to fetch collections'
      })
      throw error
    }
  }

  async fetchCollection(id: number): Promise<void> {
    this.loading = true
    this.error = null

    try {
      const response = await api.get<Collection>(`/collections/${id}/`)
      
      runInAction(() => {
        this.currentCollection = response.data || null
        // Update in collections array if it exists
        if (response.data) {
          const index = this.collections.findIndex(c => c.id === id)
          if (index >= 0) {
            this.collections[index] = response.data
          } else {
            this.collections.push(response.data)
          }
        }
        this.loading = false
        this.error = null
      })
    } catch (error) {
      runInAction(() => {
        this.loading = false
        const apiError = error as ApiError
        this.error = apiError.error || apiError.detail || 'Failed to fetch collection'
      })
      throw error
    }
  }

  async createCollection(data: { name: string; description?: string }): Promise<Collection> {
    this.loading = true
    this.error = null

    try {
      const response = await api.post<Collection>('/collections/', data)
      
      if (!response.data) {
        throw new Error('No data returned from create collection')
      }

      runInAction(() => {
        this.collections.unshift(response.data!)
        this.loading = false
        this.error = null
      })

      return response.data
    } catch (error) {
      runInAction(() => {
        this.loading = false
        const apiError = error as ApiError
        this.error = apiError.error || apiError.detail || 'Failed to create collection'
      })
      throw error
    }
  }

  async updateCollection(id: number, data: Partial<{ name: string; description: string }>): Promise<Collection> {
    this.loading = true
    this.error = null

    try {
      const response = await api.patch<Collection>(`/collections/${id}/`, data)
      
      if (!response.data) {
        throw new Error('No data returned from update collection')
      }

      runInAction(() => {
        const index = this.collections.findIndex(c => c.id === id)
        if (index >= 0) {
          this.collections[index] = response.data!
        }
        if (this.currentCollection?.id === id) {
          this.currentCollection = response.data!
        }
        this.loading = false
        this.error = null
      })

      return response.data
    } catch (error) {
      runInAction(() => {
        this.loading = false
        const apiError = error as ApiError
        this.error = apiError.error || apiError.detail || 'Failed to update collection'
      })
      throw error
    }
  }

  async closeCollection(id: number): Promise<Collection> {
    this.loading = true
    this.error = null

    try {
      const response = await api.patch<Collection>(`/collections/${id}/`, { is_closed: true })
      
      if (!response.data) {
        throw new Error('No data returned from close collection')
      }

      runInAction(() => {
        const index = this.collections.findIndex(c => c.id === id)
        if (index >= 0) {
          this.collections[index] = response.data!
        }
        if (this.currentCollection?.id === id) {
          this.currentCollection = response.data!
        }
        this.loading = false
        this.error = null
      })

      return response.data
    } catch (error) {
      runInAction(() => {
        this.loading = false
        const apiError = error as ApiError
        this.error = apiError.error || apiError.detail || 'Failed to close collection'
      })
      throw error
    }
  }
}

// Singleton instance
let collectionStoreInstance: CollectionStore | null = null

export const getCollectionStore = (): CollectionStore => {
  if (!collectionStoreInstance) {
    collectionStoreInstance = new CollectionStore()
  }
  return collectionStoreInstance
}

// Hook for React components
export const useCollectionStore = (): CollectionStore => {
  return getCollectionStore()
}
