import { api } from './api'

export interface AuthUser {
  id: string
  nome: string
  email: string
  role: string
  tenantId: string
  tenantSlug: string
}

export interface AuthState {
  access_token: string
  usuario: AuthUser
}

export async function login(email: string, senha: string, tenantSlug: string): Promise<AuthState> {
  const result = await api.post<AuthState>('/auth/login', {
    email: email.trim().toLowerCase(),
    senha,
    tenantSlug: tenantSlug.trim().toLowerCase(),
  })
  localStorage.setItem('gateway_token', result.access_token)
  localStorage.setItem('gateway_user', JSON.stringify(result.usuario))
  return result
}

export function logout() {
  localStorage.removeItem('gateway_token')
  localStorage.removeItem('gateway_user')
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('gateway_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function isLoggedIn(): boolean {
  return !!getUser()
}
