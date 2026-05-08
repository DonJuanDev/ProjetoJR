'use client'

import { useEffect, useState } from 'react'
import { login, logout, getUser, type AuthUser } from '@/lib/auth'
import { PortariaScanExperience } from '@/components/portaria/PortariaScanExperience'

export default function SaidaPage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loginState, setLoginState] = useState({
    email: '',
    senha: '',
    tenantSlug: process.env.NEXT_PUBLIC_TENANT_SLUG || 'demo-club',
    loading: false,
    error: '',
  })

  useEffect(() => {
    setUser(getUser())
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginState((s) => ({ ...s, loading: true, error: '' }))
    try {
      const r = await login(loginState.email, loginState.senha, loginState.tenantSlug)
      setUser(r.usuario)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao entrar'
      setLoginState((s) => ({ ...s, error: msg }))
    } finally {
      setLoginState((s) => ({ ...s, loading: false }))
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0f]">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-4xl mb-2">🚪</div>
            <h1 className="text-2xl font-black text-white">Validação de Saída</h1>
            <p className="text-gray-500 text-sm mt-1">Segurança / Controle</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="text"
              placeholder="Tenant"
              value={loginState.tenantSlug}
              onChange={(e) => setLoginState((s) => ({ ...s, tenantSlug: e.target.value }))}
              className="w-full bg-[#111118] border border-[#22222e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500"
            />
            <input
              type="email"
              placeholder="E-mail"
              value={loginState.email}
              onChange={(e) => setLoginState((s) => ({ ...s, email: e.target.value }))}
              className="w-full bg-[#111118] border border-[#22222e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500"
            />
            <input
              type="password"
              placeholder="Senha"
              value={loginState.senha}
              onChange={(e) => setLoginState((s) => ({ ...s, senha: e.target.value }))}
              className="w-full bg-[#111118] border border-[#22222e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500"
            />
            {loginState.error && <p className="text-red-400 text-sm text-center">{loginState.error}</p>}
            <button type="submit" disabled={loginState.loading} className="btn-primary">
              {loginState.loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <p className="text-center text-xs text-gray-600 mt-6">Demo: saida@demo.com / saida123</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] max-w-md mx-auto flex flex-col">
      <header className="flex items-center justify-between px-4 py-4 border-b border-[#22222e] shrink-0">
        <div>
          <h1 className="text-lg font-bold text-white">🚪 Saída</h1>
          <p className="text-xs text-gray-500">{user.nome}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            logout()
            setUser(null)
          }}
          className="text-gray-500 text-xs"
        >
          Sair
        </button>
      </header>

      <PortariaScanExperience variant="standalone" />
    </div>
  )
}
