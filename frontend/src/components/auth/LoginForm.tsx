/**
 * LoginForm Component
 * 
 * Form component for user login.
 * 
 * Reference: docs/user-stories/01-authentication.md (US-002), docs/design/01-authentication-design.md
 */

import { useState, FormEvent } from 'react'
import { observer } from 'mobx-react-lite'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import './Auth.css'

interface LoginFormProps {
  onLogin?: (credentials: { username: string; password: string }) => Promise<void>
}

export const LoginForm = observer(({ onLogin }: LoginFormProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const authStore = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>({})

  const validate = (): boolean => {
    const newErrors: typeof errors = {}
    
    if (!username.trim()) {
      newErrors.username = t('auth.errors.usernameRequired')
    }
    
    if (!password) {
      newErrors.password = t('auth.errors.passwordRequired')
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
      if (onLogin) {
        await onLogin({ username, password })
      } else {
        await authStore.login(username, password)
      }
      
      // Reset form
      setUsername('')
      setPassword('')
      
      // Navigate to collections
      navigate('/collections')
    } catch (error: any) {
      const errorMessage = error?.error || error?.detail || t('auth.errors.invalidCredentials')
      setErrors({ general: errorMessage })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form" noValidate>
      <h2>{t('auth.loginTitle')}</h2>
      
      {errors.general && (
        <div className="error-message" role="alert">
          {errors.general}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="username">{t('auth.username')}</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          aria-invalid={!!errors.username}
          aria-describedby={errors.username ? 'username-error' : undefined}
        />
        {errors.username && (
          <span id="username-error" className="field-error" role="alert">
            {errors.username}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="password">{t('auth.password')}</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && (
          <span id="password-error" className="field-error" role="alert">
            {errors.password}
          </span>
        )}
      </div>

      <button 
        type="submit" 
        className="btn btn-primary"
        disabled={authStore.loading}
      >
        {authStore.loading ? t('common.loading') : t('auth.loginSubmit')}
      </button>
    </form>
  )
})

LoginForm.displayName = 'LoginForm'
