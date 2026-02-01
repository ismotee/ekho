/**
 * API Service
 * 
 * Centralized API client for communicating with the backend.
 * Handles request/response interceptors, error handling, and session management.
 * 
 * Reference: docs/api-specification.md
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface ApiError {
  error?: string
  detail?: string
  field_errors?: Record<string, string[]>
  response?: {
    status: number
    data?: any
  }
}

export interface ApiResponse<T = any> {
  data?: T
  count?: number
  next?: string | null
  previous?: string | null
  results?: T[]
}

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private getCsrfToken(): string | null {
    // Django sets CSRF token in cookie named 'csrftoken'
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const trimmed = cookie.trim()
      if (trimmed.startsWith('csrftoken=')) {
        return trimmed.substring('csrftoken='.length)
      }
    }
    return null
  }

  private async ensureCsrfToken(): Promise<string | null> {
    // First try to get from cookie
    let token = this.getCsrfToken()
    
    // If no token, fetch it
    if (!token) {
      try {
        const response = await fetch(`${this.baseURL}/auth/csrf/`, {
          method: 'GET',
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          token = data.csrfToken || null
          // Also try to get from cookie after the request
          if (!token) {
            token = this.getCsrfToken()
          }
        }
      } catch (error) {
        console.warn('Failed to fetch CSRF token:', error)
      }
    }
    
    return token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    // Get CSRF token for state-changing methods
    const method = options.method || 'GET'
    const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())
    
    // Ensure we have CSRF token before making state-changing requests
    let csrfToken: string | null = null
    if (needsCsrf) {
      csrfToken = await this.ensureCsrfToken()
    }
    
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    }
    
    // Only set Content-Type for JSON requests (not FormData)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }
    
    // Add CSRF token header if available (Django expects X-CSRFToken)
    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken
    }
    
    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Include cookies for session auth
    }

    try {
      const response = await fetch(url, config)
      
      // Handle 204 No Content
      if (response.status === 204) {
        return {} as ApiResponse<T>
      }

      const data = await response.json()

      if (!response.ok) {
        const error: ApiError = {
          error: data.error || data.detail || 'An error occurred',
          detail: data.detail,
          field_errors: data.field_errors,
          response: {
            status: response.status,
            data,
          },
        }
        throw error
      }

      // Handle paginated responses
      if (data.count !== undefined && data.results !== undefined) {
        return data as ApiResponse<T>
      }

      // Handle direct data responses
      return { data } as ApiResponse<T>
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error) {
        throw error
      }
      
      // Network or other errors
      throw {
        error: 'Network error',
        detail: error instanceof Error ? error.message : 'Unknown error',
      } as ApiError
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        url += `?${queryString}`
      }
    }
    return this.request<T>(url, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any, isFormData = false): Promise<ApiResponse<T>> {
    const options: RequestInit = {
      method: 'POST',
    }

    if (data) {
      if (isFormData) {
        options.body = data
        // Don't set Content-Type for FormData, browser will set it with boundary
        options.headers = {}
      } else {
        options.body = JSON.stringify(data)
      }
    }

    return this.request<T>(endpoint, options)
  }

  async put<T>(endpoint: string, data?: any, isFormData = false): Promise<ApiResponse<T>> {
    const options: RequestInit = {
      method: 'PUT',
    }

    if (data) {
      if (isFormData) {
        options.body = data
        options.headers = {}
      } else {
        options.body = JSON.stringify(data)
      }
    }

    return this.request<T>(endpoint, options)
  }

  async patch<T>(endpoint: string, data?: any, isFormData = false): Promise<ApiResponse<T>> {
    const options: RequestInit = {
      method: 'PATCH',
    }

    if (data) {
      if (isFormData) {
        options.body = data
        options.headers = {}
      } else {
        options.body = JSON.stringify(data)
      }
    }

    return this.request<T>(endpoint, options)
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const api = new ApiClient(API_BASE_URL)
