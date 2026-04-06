/**
 * RecordStore
 *
 * MobX store for managing art record data and operations.
 * Domain payload is under `data`; optional `representative_image` for thumbnails.
 *
 * Reference: docs/data/record-models.md, docs/architecture/system-architecture.md
 */

import { makeAutoObservable, runInAction } from 'mobx'
import { api, ApiError } from '../services/api'
import type { Record, RecordPayload } from '../types/record'

export type { Record, RecordPayload } from '../types/record'

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

function serializeDataForMultipart(data: RecordPayload): string {
  return JSON.stringify(data ?? {})
}

export interface CreateRecordOptions {
  data?: RecordPayload
  representative_image?: File
}

export interface UpdateRecordOptions {
  data?: RecordPayload
  representative_image?: File
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
    search?: string
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
        if (response.data) {
          const index = this.records.findIndex((r) => r.id === id)
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
    options: CreateRecordOptions = {}
  ): Promise<Record> {
    this.loading = true
    this.error = null

    const data = options.data ?? {}
    const file = options.representative_image

    try {
      let response
      if (file) {
        const formData = new FormData()
        formData.append('collection', String(collectionId))
        formData.append('data', serializeDataForMultipart(data))
        formData.append('representative_image', file)
        response = await api.post<Record>('/records/', formData, true)
      } else {
        response = await api.post<Record>('/records/', {
          collection: collectionId,
          data,
        })
      }

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

  async updateRecord(id: number, options: UpdateRecordOptions = {}): Promise<Record> {
    this.loading = true
    this.error = null

    const { data, representative_image: file } = options
    const hasFile = file instanceof File

    try {
      let response
      if (hasFile) {
        const formData = new FormData()
        if (data !== undefined) {
          formData.append('data', serializeDataForMultipart(data))
        }
        formData.append('representative_image', file)
        response = await api.patch<Record>(`/records/${id}/`, formData, true)
      } else if (data !== undefined) {
        response = await api.patch<Record>(`/records/${id}/`, { data })
      } else {
        response = await api.patch<Record>(`/records/${id}/`, {})
      }

      if (!response.data) {
        throw new Error('No data returned from update record')
      }

      runInAction(() => {
        const index = this.records.findIndex((r) => r.id === id)
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
        this.records = this.records.filter((r) => r.id !== id)
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

let recordStoreInstance: RecordStore | null = null

export const getRecordStore = (): RecordStore => {
  if (!recordStoreInstance) {
    recordStoreInstance = new RecordStore()
  }
  return recordStoreInstance
}

export const useRecordStore = (): RecordStore => {
  return getRecordStore()
}
