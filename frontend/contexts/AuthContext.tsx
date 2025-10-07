'use client'

import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { api } from '@/lib/api'
import Cookies from 'js-cookie'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; accessToken: string; refreshToken: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'TOKEN_REFRESHED'; payload: { accessToken: string } }

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,
}

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isLoading: false,
        isAuthenticated: true,
      }
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        isAuthenticated: false,
      }
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      }
    case 'TOKEN_REFRESHED':
      return {
        ...state,
        accessToken: action.payload.accessToken,
      }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    default:
      return state
  }
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => Promise<void>
  logoutAll: () => Promise<void>
  checkAuth: () => Promise<void>
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'LOGIN_START' })
      
      const response = await api.post('/auth/login', { email, password })
      const { user, accessToken, refreshToken: refreshTokenValue } = response.data
      
      // Store tokens in cookies
      Cookies.set('accessToken', accessToken, { expires: 1/96, secure: true, sameSite: 'strict' }) // 15 minutes
      Cookies.set('refreshToken', refreshTokenValue, { expires: 7, secure: true, sameSite: 'strict' }) // 7 days
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, accessToken, refreshToken: refreshTokenValue } })
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' })
      throw error
    }
  }

  const register = async (userData: any) => {
    try {
      dispatch({ type: 'LOGIN_START' })
      
      const response = await api.post('/auth/register', userData)
      const { user, accessToken, refreshToken: refreshTokenValue } = response.data
      
      // Store tokens in cookies
      Cookies.set('accessToken', accessToken, { expires: 1/96, secure: true, sameSite: 'strict' }) // 15 minutes
      Cookies.set('refreshToken', refreshTokenValue, { expires: 7, secure: true, sameSite: 'strict' }) // 7 days
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, accessToken, refreshToken: refreshTokenValue } })
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' })
      throw error
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      Cookies.remove('accessToken')
      Cookies.remove('refreshToken')
      dispatch({ type: 'LOGOUT' })
    }
  }

  const logoutAll = async () => {
    try {
      await api.post('/auth/logout-all')
    } catch (error) {
      console.error('Logout all error:', error)
    } finally {
      Cookies.remove('accessToken')
      Cookies.remove('refreshToken')
      dispatch({ type: 'LOGOUT' })
    }
  }

  const refreshTokenFunc = async () => {
    try {
      const refreshTokenValue = Cookies.get('refreshToken')
      if (!refreshTokenValue) {
        throw new Error('No refresh token')
      }

      const response = await api.post('/auth/refresh', { refreshToken: refreshTokenValue })
      const { accessToken } = response.data
      
      Cookies.set('accessToken', accessToken, { expires: 1/96, secure: true, sameSite: 'strict' })
      dispatch({ type: 'TOKEN_REFRESHED', payload: { accessToken } })
    } catch (error) {
      console.error('Token refresh error:', error)
      logout()
    }
  }

  const checkAuth = async () => {
    try {
      const accessToken = Cookies.get('accessToken')
      const refreshTokenValue = Cookies.get('refreshToken')
      
      if (!accessToken && !refreshTokenValue) {
        dispatch({ type: 'SET_LOADING', payload: false })
        return
      }

      // Try with access token first
      if (accessToken) {
        try {
          const response = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${accessToken}` }
          })
          
          const { user } = response.data
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user, accessToken, refreshToken: refreshTokenValue || '' } })
          return
        } catch (error) {
          // Access token might be expired, try refresh
        }
      }

      // Try to refresh token
      if (refreshTokenValue) {
        try {
          await refreshTokenFunc()
          // After refresh, try to get user again
          const newAccessToken = Cookies.get('accessToken')
          if (newAccessToken) {
            const response = await api.get('/auth/me', {
              headers: { Authorization: `Bearer ${newAccessToken}` }
            })
            
            const { user } = response.data
            dispatch({ type: 'LOGIN_SUCCESS', payload: { user, accessToken: newAccessToken, refreshToken: refreshTokenValue } })
            return
          }
        } catch (error) {
          // Refresh failed
        }
      }

      // All attempts failed
      Cookies.remove('accessToken')
      Cookies.remove('refreshToken')
      dispatch({ type: 'LOGIN_FAILURE' })
    } catch (error) {
      Cookies.remove('accessToken')
      Cookies.remove('refreshToken')
      dispatch({ type: 'LOGIN_FAILURE' })
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    logoutAll,
    checkAuth,
    refreshToken: refreshTokenFunc,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}