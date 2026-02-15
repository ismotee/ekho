/**
 * RecordStore
 * 
 * MobX store for managing art record data and operations.
 * Handles fetching, creating, updating, deleting records, and image uploads.
 * 
 * Reference: docs/architecture/system-architecture.md (State Management)
 */

import { makeAutoObservable, runInAction } from 'mobx'
import { api, ApiError } from '../services/api'

export interface Record {
  id: number
  title: string
  artist: string
  year?: number
  medium?: string
  dimensions?: string
  description?: string
  condition?: string
  image?: string
  collection: number
  collection_name?: string
  collection_owner_username?: string
  created_at: string
  updated_at: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export class RecordStore {
  records: Record[] = []
  currentRecord: Record | null = null
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

  async fetchRecords(collectionId: number, params?: {
    page?: number
    page_size?: number
  }): Promise<void> {
    if (!collectionId) {
      throw new Error('Collection ID is required')
    }

    this.loading = true
    this.error = null

    try {
      const response = await api.get<Record>('/records/', {
        collection: collectionId,
        ...params,
      })
      
      runInAction(() => {
        if (response.results) {
          this.records = response.results
          this.pagination = {
            count: response.count || 0,
            next: response.next || null,
            previous: response.previous || null,
          }
        } else if (response.data) {
          // Handle single record response
          this.records = [response.data]
        }
        this.loading = false
        this.error = null
      })
    } catch (error) {
      runInAction(() => {
        this.loading = false
        const apiError = error as ApiError
        this.error = apiError.error || apiError.detail || 'Failed to fetch records'
      })
      throw error
    }
  }

  async fetchAllRecords(params?: {
    page?: number
    page_size?: number
    collection_name?: string
    owner?: string
  }): Promise<void> {
    this.loading = true
    this.error = null

    try {
      const response = await api.get<Record>('/records/', { ...params })
      runInAction(() => {
        if (response.results) {
          this.records = response.results
          this.pagination = {
            count: response.count || 0,
            next: response.next || null,
            previous: response.previous || null,
          }
        } else {
          this.records = []
        }
        this.loading = false
        this.error = null
      })
    } catch (error) {
      runInAction(() => {
        this.loading = false
        const apiError = error as ApiError
        this.error = apiError.error || apiError.detail || 'Failed to fetch records'
      })
      throw error
    }
  }

  async fetchRecord(id: number): Promise<void> {
    this.loading = true
    this.error = null

    try {
      const response = await api.get<Record>(`/records/${id}/`)
      
      runInAction(() => {
        this.currentRecord = response.data || null
        // Update in records array if it exists
        if (response.data) {
          const index = this.records.findIndex(r => r.id === id)
          if (index >= 0) {
            this.records[index] = response.data
          } else {
            this.records.push(response.data)
          }
        }
        this.loading = false
        this.error = null
      })
    } catch (error) {
      runInAction(() => {
        this.loading = false
        const apiError = error as ApiError
        this.error = apiError.error || apiError.detail || 'Failed to fetch record'
      })
      throw error
    }
  }

  async createRecord(
    collectionId: number,
    data: {
      title: string
      artist: string
      year?: number
      medium?: string
      dimensions?: string
      description?: string
      condition?: string
      image?: File
    }
  ): Promise<Record> {
    this.loading = true
    this.error = null

    try {
      const formData = new FormData()
      formData.append('collection', String(collectionId))
      formData.append('title', data.title)
      formData.append('artist', data.artist)
      
      if (data.year !== undefined) {
        formData.append('year', String(data.year))
      }
      if (data.medium) {
        formData.append('medium', data.medium)
      }
      if (data.dimensions) {
        formData.append('dimensions', data.dimensions)
      }
      if (data.description) {
        formData.append('description', data.description)
      }
      if (data.condition) {
        formData.append('condition', data.condition)
      }
      if (data.image) {
        formData.append('image', data.image)
      }

      const response = await api.post<Record>('/records/', formData, true)
      
      if (!response.data) {
        throw new Error('No data returned from create record')
      }

      runInAction(() => {
        this.records.unshift(response.data!)
        this.loading = false
        this.error = null
      })

      return response.data
    } catch (error) {
      runInAction(() => {
        this.loading = false
        const apiError = error as ApiError
        this.error = apiError.error || apiError.detail || 'Failed to create record'
      })
      throw error
    }
  }

  async updateRecord(
    id: number,
    data: Partial<{
      title: string
      artist: string
      year: number
      medium: string
      dimensions: string
      description: string
      condition: string
      image: File
    }>
  ): Promise<Record> {
    this.loading = true
    this.error = null

    try {
      const hasFile = data.image instanceof File
      let response: { data?: Record }

      if (hasFile) {
        // Use FormData for file uploads
        const formData = new FormData()
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (value instanceof File) {
              formData.append(key, value)
            } else {
              formData.append(key, String(value))
            }
          }
        })
        response = await api.patch<Record>(`/records/${id}/`, formData, true)
      } else {
        // Use JSON for non-file updates
        response = await api.patch<Record>(`/records/${id}/`, data)
      }
      
      if (!response.data) {
        throw new Error('No data returned from update record')
      }

      runInAction(() => {
        const index = this.records.findIndex(r => r.id === id)
        if (index >= 0) {
          this.records[index] = response.data!
        }
        if (this.currentRecord?.id === id) {
          this.currentRecord = response.data!
        }
        this.loading = false
        this.error = null
      })

      return response.data
    } catch (error) {
      runInAction(() => {
        this.loading = false
        const apiError = error as ApiError
        this.error = apiError.error || apiError.detail || 'Failed to update record'
      })
      throw error
    }
  }

  async deleteRecord(id: number): Promise<void> {
    this.loading = true
    this.error = null

    try {
      await api.delete(`/records/${id}/`)
      
      runInAction(() => {
        this.records = this.records.filter(r => r.id !== id)
        if (this.currentRecord?.id === id) {
          this.currentRecord = null
        }
        this.loading = false
        this.error = null
      })
    } catch (error) {
      runInAction(() => {
        this.loading = false
        const apiError = error as ApiError
        this.error = apiError.error || apiError.detail || 'Failed to delete record'
      })
      throw error
    }
  }
}

// Singleton instance
let recordStoreInstance: RecordStore | null = null

export const getRecordStore = (): RecordStore => {
  if (!recordStoreInstance) {
    recordStoreInstance = new RecordStore()
  }
  return recordStoreInstance
}

// Hook for React components
export const useRecordStore = (): RecordStore => {
  return getRecordStore()
}
