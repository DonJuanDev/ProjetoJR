'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { login as apiLogin, logout as apiLogout, getUser, type AuthUser } from '@/lib/auth'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (email: string, senha: string, tenantSlug: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setUser(getUser())
    setLoading(false)
  }, [])

  async function login(email: string, senha: string, tenantSlug: string) {
    const result = await apiLogin(email, senha, tenantSlug)
    setUser(result.usuario)
  }

  function logout() {
    apiLogout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
