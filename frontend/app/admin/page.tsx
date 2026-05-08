'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, formatCurrency } from '@/lib/api'
import { login, logout, getUser, type AuthUser } from '@/lib/auth'
import { joinTenant, getSocket } from '@/lib/socket'

interface DashboardData {
  abertas: number
  pagas: number
  totalFaturado: number
  comandas: ComandaItem[]
}

interface ComandaItem {
  id: string
  codigo: string
  status: string
  total: number
  clienteNome?: string
  createdAt: string
  pedidos: { id: string }[]
  pagamentos: { status: string }[]
}

export default function AdminPage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loginState, setLoginState] = useState({
    email: '',
    senha: '',
    tenantSlug: process.env.NEXT_PUBLIC_TENANT_SLUG || 'demo-club',
    loading: false,
    error: '',
  })
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'ABERTA' | 'PAGA' | 'AGUARDANDO_PAGAMENTO'>('all')

  useEffect(() => {
    setUser(getUser())
  }, [])

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const d = await api.get<DashboardData>('/comandas/dashboard')
      setData(d)
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) return
    fetchDashboard()
    joinTenant(user.tenantId)
    const socket = getSocket()
    socket.on('comanda:criada', fetchDashboard)
    socket.on('pedido:adicionado', fetchDashboard)
    socket.on('pagamento:confirmado', fetchDashboard)
    return () => {
      socket.off('comanda:criada', fetchDashboard)
      socket.off('pedido:adicionado', fetchDashboard)
      socket.off('pagamento:confirmado', fetchDashboard)
    }
  }, [user, fetchDashboard])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginState((s) => ({ ...s, loading: true, error: '' }))
    try {
      const r = await login(loginState.email, loginState.senha, loginState.tenantSlug)
      setUser(r.usuario)
    } catch (err: any) {
      setLoginState((s) => ({ ...s, error: err.message, loading: false }))
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0f]">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-4xl mb-2">📊</div>
            <h1 className="text-2xl font-black text-white">Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Área administrativa</p>
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
            {loginState.error && (
              <p className="text-red-400 text-sm text-center">{loginState.error}</p>
            )}
            <button type="submit" disabled={loginState.loading} className="btn-primary">
              {loginState.loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <p className="text-center text-xs text-gray-600 mt-6">
            Demo: admin@demo.com / admin123
          </p>
        </div>
      </div>
    )
  }

  const filteredComandas = (data?.comandas || []).filter((c) =>
    filter === 'all' ? true : c.status === filter,
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f] max-w-md mx-auto">
      <header className="flex items-center justify-between px-4 py-4 border-b border-[#22222e] sticky top-0 bg-[#0a0a0f] z-10">
        <div>
          <h1 className="text-lg font-bold text-white">📊 Dashboard</h1>
          <p className="text-xs text-gray-500">{user.nome} • Admin</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDashboard}
            className="text-gray-400 text-sm px-3 py-2 rounded-lg bg-[#111118] border border-[#22222e]"
          >
            🔄
          </button>
          <button onClick={() => { logout(); setUser(null) }} className="text-gray-500 text-xs">
            Sair
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {loading && !data && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <MetricCard label="Abertas" value={data.abertas} color="emerald" icon="🟢" />
              <MetricCard label="Pagas" value={data.pagas} color="violet" icon="✅" />
              <MetricCard
                label="Faturado"
                value={formatCurrency(data.totalFaturado)}
                color="amber"
                icon="💰"
                small
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {(['all', 'ABERTA', 'AGUARDANDO_PAGAMENTO', 'PAGA'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    filter === f
                      ? 'bg-violet-600 text-white'
                      : 'bg-[#111118] border border-[#22222e] text-gray-400'
                  }`}
                >
                  {f === 'all' ? 'Todas' : f === 'AGUARDANDO_PAGAMENTO' ? 'Aguardando' : f.charAt(0) + f.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {filteredComandas.length === 0 && (
                <div className="text-center py-8 text-gray-600">Nenhuma comanda</div>
              )}
              {filteredComandas.map((c) => (
                <ComandaRow key={c.id} comanda={c} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function MetricCard({
  label, value, color, icon, small,
}: {
  label: string
  value: string | number
  color: string
  icon: string
  small?: boolean
}) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400',
    violet: 'text-violet-400',
    amber: 'text-amber-400',
  }
  return (
    <div className="bg-[#111118] border border-[#22222e] rounded-2xl p-3 text-center">
      <div className="text-xl mb-1">{icon}</div>
      <div className={`font-black ${small ? 'text-base' : 'text-2xl'} ${colorMap[color]}`}>
        {value}
      </div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}

function ComandaRow({ comanda }: { comanda: ComandaItem }) {
  const statusMap: Record<string, { cls: string; label: string }> = {
    ABERTA: { cls: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', label: 'Aberta' },
    AGUARDANDO_PAGAMENTO: { cls: 'bg-amber-500/20 text-amber-400 border border-amber-500/30', label: 'Aguardando' },
    PAGA: { cls: 'bg-violet-500/20 text-violet-400 border border-violet-500/30', label: 'Paga' },
    BLOQUEADA: { cls: 'bg-red-500/20 text-red-400 border border-red-500/30', label: 'Bloqueada' },
    CANCELADA: { cls: 'bg-gray-500/20 text-gray-400 border border-gray-500/30', label: 'Cancelada' },
  }
  const s = statusMap[comanda.status] || statusMap.ABERTA
  const time = new Date(comanda.createdAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="bg-[#111118] border border-[#22222e] rounded-xl p-3 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-white text-sm">#{comanda.codigo}</span>
          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
            {s.label}
          </span>
        </div>
        {comanda.clienteNome && (
          <p className="text-xs text-gray-500 mt-0.5">👤 {comanda.clienteNome}</p>
        )}
        <p className="text-xs text-gray-600 mt-0.5">{time} • {comanda.pedidos.length} pedidos</p>
      </div>
      <span className="font-black text-white">{formatCurrency(comanda.total)}</span>
    </div>
  )
}
