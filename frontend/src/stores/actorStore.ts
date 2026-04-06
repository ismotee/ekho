/**
 * MobX store for the shared Actor catalog (GET /api/actors/, CRUD, usage).
 */

import { makeAutoObservable, runInAction } from 'mobx'
import { api, ApiError } from '../services/api'
import type { Actor } from '../types/record/actor'

export interface CatalogActor {
  id: number
  owner: { id: number; username: string; email?: string } | null
  data: Actor
  created_at: string
  updated_at: string
}

export interface ActorUsageResponse {
  count: number
  records: { id: number; label: string }[]
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export class ActorStore {
  actors: CatalogActor[] = []
  currentActor: CatalogActor | null = null
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
  private fetchedAt = 0
  private readonly cacheMs = 60_000

  constructor() {
    makeAutoObservable(this)
  }

  actorById(id: number): CatalogActor | undefined {
    return this.actors.find((a) => a.id === id)
  }

  async fetchActors(params?: { page?: number; page_size?: number; force?: boolean }): Promise<void> {
    const force = params?.force === true
    if (!force && this.actors.length > 0 && Date.now() - this.fetchedAt < this.cacheMs) {
      return
    }

    this.loading = true
    this.error = null
    try {
      const response = await api.get<CatalogActor>('/actors/', {
        page: params?.page,
        page_size: params?.page_size ?? 100,
      })
      runInAction(() => {
        if (response.results) {
          this.actors = response.results
          this.pagination = {
            count: response.count ?? 0,
            next: response.next ?? null,
            previous: response.previous ?? null,
          }
        } else if (response.data) {
          this.actors = [response.data]
        }
        this.fetchedAt = Date.now()
        this.loading = false
        this.error = null
      })
    } catch (error) {
      runInAction(() => {
        this.loading = false
        const apiError = error as ApiError
        this.error = apiError.error || apiError.detail || 'Failed to fetch actors'
      })
      throw error
    }
  }

  async fetchActor(id: number): Promise<void> {
    this.loading = true
    this.error = null
    try {
      const response = await api.get<CatalogActor>(`/actors/${id}/`)
      runInAction(() => {
        this.currentActor = response.data ?? null
        if (response.data) {
          const idx = this.actors.findIndex((a) => a.id === response.data!.id)
          if (idx >= 0) {
            this.actors[idx] = response.data
          } else {
            this.actors.push(response.data)
          }
        }
        this.loading = false
        this.error = null
      })
    } catch (error) {
      runInAction(() => {
        this.loading = false
        const apiError = error as ApiError
        this.error = apiError.error || apiError.detail || 'Failed to fetch actor'
      })
      throw error
    }
  }

  async fetchUsage(id: number): Promise<ActorUsageResponse> {
    const response = await api.get<ActorUsageResponse>(`/actors/${id}/usage/`)
    const d = response.data
    if (!d) {
      return { count: 0, records: [] }
    }
    return d
  }

  async createActor(data: Actor): Promise<CatalogActor> {
    this.loading = true
    this.error = null
    try {
      const response = await api.post<CatalogActor>('/actors/', { data })
      runInAction(() => {
        if (response.data) {
          this.actors.unshift(response.data)
          this.fetchedAt = 0
        }
        this.loading = false
        this.error = null
      })
      if (!response.data) {
        throw new Error('No actor returned')
      }
      return response.data
    } catch (error) {
      runInAction(() => {
        this.loading = false
        const apiError = error as ApiError
        this.error = apiError.error || apiError.detail || 'Failed to create actor'
      })
      throw error
    }
  }

  async updateActor(id: number, data: Actor): Promise<CatalogActor> {
    this.loading = true
    this.error = null
    try {
      const response = await api.patch<CatalogActor>(`/actors/${id}/`, { data })
      runInAction(() => {
        if (response.data) {
          const idx = this.actors.findIndex((a) => a.id === id)
          if (idx >= 0) {
            this.actors[idx] = response.data
          }
          if (this.currentActor?.id === id) {
            this.currentActor = response.data
          }
        }
        this.loading = false
        this.error = null
      })
      if (!response.data) {
        throw new Error('No actor returned')
      }
      return response.data
    } catch (error) {
      runInAction(() => {
        this.loading = false
        const apiError = error as ApiError
        this.error = apiError.error || apiError.detail || 'Failed to update actor'
      })
      throw error
    }
  }

  async deleteActor(id: number): Promise<void> {
    this.loading = true
    this.error = null
    try {
      await api.delete(`/actors/${id}/`)
      runInAction(() => {
        this.actors = this.actors.filter((a) => a.id !== id)
        if (this.currentActor?.id === id) {
          this.currentActor = null
        }
        this.loading = false
        this.error = null
      })
    } catch (error) {
      runInAction(() => {
        this.loading = false
        const apiError = error as ApiError
        this.error = apiError.error || apiError.detail || 'Failed to delete actor'
      })
      throw error
    }
  }

  invalidateListCache(): void {
    this.fetchedAt = 0
  }
}

let actorStoreInstance: ActorStore | null = null

export const getActorStore = (): ActorStore => {
  if (!actorStoreInstance) {
    actorStoreInstance = new ActorStore()
  }
  return actorStoreInstance
}

export const useActorStore = (): ActorStore => getActorStore()
