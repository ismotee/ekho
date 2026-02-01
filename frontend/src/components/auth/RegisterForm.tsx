/**
 * RegisterForm Component
 * 
 * Form component for user registration.
 * 
 * Reference: docs/user-stories/01-authentication.md (US-001), docs/design/01-authentication-design.md
 */

import { useState, FormEvent } from 'react'
import { observer } from 'mobx-react-lite'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import './Auth.css'

interface RegisterFormProps {
  onRegister?: (credentials: { username: string; password: string }) => Promise<void>
}

export const RegisterForm = observer(({ onRegister }: RegisterFormProps) => {
  const navigate = useNavigate()
  const authStore = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>({})

  const validate = (): boolean => {
    const newErrors: typeof errors = {}
    
    if (!username.trim()) {
      newErrors.username = 'Username is required'
    }
    
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrors({})

    if (!validate()) {
      return
    }

    try {
      if (onRegister) {
        await onRegister({ username, password })
      } else {
        await authStore.register(username, password)
      }
      
      // Reset form
      setUsername('')
      setPassword('')
      
      // Navigate to collections
      navigate('/collections')
    } catch (error: any) {
      const apiError = error as any
      const newErrors: typeof errors = {}
      
      if (apiError?.field_errors?.username) {
        newErrors.username = apiError.field_errors.username[0] || 'Username already exists'
      } else if (apiError?.field_errors?.password) {
        newErrors.password = apiError.field_errors.password[0] || 'Invalid password'
      } else {
        newErrors.general = apiError?.error || apiError?.detail || 'Registration failed'
      }
      
      setErrors(newErrors)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Register</h2>
      
      {errors.general && (
        <div className="error-message" role="alert">
          {errors.general}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="register-username">Username</label>
        <input
          id="register-username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          aria-invalid={!!errors.username}
          aria-describedby={errors.username ? 'register-username-error' : undefined}
        />
        {errors.username && (
          <span id="register-username-error" className="field-error" role="alert">
            {errors.username}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'register-password-error' : undefined}
        />
        {errors.password && (
          <span id="register-password-error" className="field-error" role="alert">
            {errors.password}
          </span>
        )}
      </div>

      <button 
        type="submit" 
        className="btn btn-primary"
        disabled={authStore.loading}
      >
        {authStore.loading ? 'Loading...' : 'Register'}
      </button>
    </form>
  )
})

RegisterForm.displayName = 'RegisterForm'
