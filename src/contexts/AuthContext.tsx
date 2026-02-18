import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { api, setAccessToken, clearAccessToken } from '@/lib/api'

export interface AppUser {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  role: string
  isSuperAdmin: boolean
}

interface AuthContextValue {
  user: AppUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (inviteToken: string, fullName: string, password: string, email?: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch user profile from /api/me
  const fetchUser = useCallback(async () => {
    try {
      const data = await api.get<AppUser>('/api/me')
      setUser(data)
    } catch {
      setUser(null)
      clearAccessToken()
    }
  }, [])

  // On mount: try silent refresh
  useEffect(() => {
    ;(async () => {
      try {
        const data = await api.post<{ accessToken: string }>('/api/auth/refresh')
        if (data?.accessToken) {
          setAccessToken(data.accessToken)
          await fetchUser()
        }
      } catch {
        // Not authenticated — that's fine
      } finally {
        setIsLoading(false)
      }
    })()
  }, [fetchUser])

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ accessToken: string }>('/api/auth/login', { email, password })
    setAccessToken(data.accessToken)
    const me = await api.get<AppUser>('/api/me')
    setUser(me)
  }, [])

  const register = useCallback(async (inviteToken: string, fullName: string, password: string, email?: string) => {
    const data = await api.post<{ accessToken: string }>('/api/auth/register', {
      inviteToken,
      fullName,
      password,
      confirmPassword: password,
      email: email || '',
    })
    setAccessToken(data.accessToken)
    const me = await api.get<AppUser>('/api/me')
    setUser(me)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout')
    } catch {
      // Ignore errors during logout
    }
    clearAccessToken()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
