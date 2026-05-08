'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api, formatCurrency } from '@/lib/api'
import { login, logout, getUser, type AuthUser } from '@/lib/auth'
import { joinTenant, getSocket } from '@/lib/socket'
import { QRCodeSVG } from 'qrcode.react'

interface Produto {
  id: string
  nome: string
  preco: number
  categoria: string
}

interface ItemPedido {
  id: string
  quantidade: number
  precoUnit: number
  subtotal: number
  produto: Produto
}

interface Comanda {
  id: string
  codigo: string
  status: string
  total: number
  clienteNome?: string
  qrCodeHash: string
  pedidos: { id: string; itens: ItemPedido[]; total: number; status: string }[]
  createdAt: string
}

type View = 'comandas' | 'novo-pedido' | 'nova-comanda' | 'ver-qr'

export default function StaffPage() {
  const router = useRouter()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loginState, setLoginState] = useState({ email: '', senha: '', tenantSlug: process.env.NEXT_PUBLIC_TENANT_SLUG || 'demo-club', loading: false, error: '' })
  const [view, setView] = useState<View>('comandas')
  const [comandas, setComandas] = useState<Comanda[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [selectedComanda, setSelectedComanda] = useState<Comanda | null>(null)
  const [cart, setCart] = useState<Record<string, number>>({})
  const [obs, setObs] = useState('')
  const [sending, setSending] = useState(false)
  const [novaComandaNome, setNovaComandaNome] = useState('')
  const [criandoComanda, setCriandoComanda] = useState(false)
  const [novaComanda, setNovaComanda] = useState<Comanda | null>(null)

  useEffect(() => {
    const u = getUser()
    setUser(u)
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const [c, p] = await Promise.all([
        api.get<Comanda[]>('/comandas'),
        api.get<Produto[]>('/produtos'),
      ])
      setComandas(c.filter((x) => x.status === 'ABERTA' || x.status === 'AGUARDANDO_PAGAMENTO'))
      setProdutos(p)
    } catch {}
  }, [])

  useEffect(() => {
    if (!user) return
    fetchData()
    joinTenant(user.tenantId)
    const socket = getSocket()
    socket.on('comanda:criada', fetchData)
    socket.on('pedido:adicionado', fetchData)
    return () => {
      socket.off('comanda:criada', fetchData)
      socket.off('pedido:adicionado', fetchData)
    }
  }, [user, fetchData])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginState((s) => ({ ...s, loading: true, error: '' }))
    try {
      const result = await login(loginState.email, loginState.senha, loginState.tenantSlug)
      setUser(result.usuario)
    } catch (err: any) {
      setLoginState((s) => ({ ...s, error: err.message, loading: false }))
    }
  }

  async function criarComanda() {
    setCriandoComanda(true)
    try {
      const c = await api.post<Comanda>('/comandas', { clienteNome: novaComandaNome || undefined })
      setNovaComanda(c)
      setNovaComandaNome('')
      setView('ver-qr')
      fetchData()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setCriandoComanda(false)
    }
  }

  function abrirNovoPedido(comanda: Comanda) {
    setSelectedComanda(comanda)
    setCart({})
    setObs('')
    setView('novo-pedido')
  }

  function alterarQtd(produtoId: string, delta: number) {
    setCart((prev) => {
      const atual = prev[produtoId] || 0
      const novo = Math.max(0, atual + delta)
      if (novo === 0) {
        const { [produtoId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [produtoId]: novo }
    })
  }

  async function enviarPedido() {
    if (!selectedComanda || Object.keys(cart).length === 0) return
    setSending(true)
    try {
      const itens = Object.entries(cart).map(([produtoId, quantidade]) => ({
        produtoId,
        quantidade,
      }))
      await api.post('/pedidos', { comandaId: selectedComanda.id, itens, obs: obs || undefined })
      setCart({})
      setObs('')
      setView('comandas')
      fetchData()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSending(false)
    }
  }

  const totalCart = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = produtos.find((x) => x.id === id)
    return sum + (p ? Number(p.preco) * qty : 0)
  }, 0)

  const produtosPorCategoria = produtos.reduce<Record<string, Produto[]>>((acc, p) => {
    if (!acc[p.categoria]) acc[p.categoria] = []
    acc[p.categoria].push(p)
    return acc
  }, {})

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0f]">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-4xl mb-2">🍻</div>
            <h1 className="text-2xl font-black text-white">Área da Equipe</h1>
            <p className="text-gray-500 text-sm mt-1">Entre com suas credenciais</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="text"
              placeholder="Tenant (ex: demo-club)"
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
            Demo: staff@demo.com / staff123
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] max-w-md mx-auto flex flex-col">
      <header className="flex items-center justify-between px-4 py-4 border-b border-[#22222e]">
        <div>
          <h1 className="text-lg font-bold text-white">
            {view === 'comandas' && '🍻 Comandas'}
            {view === 'nova-comanda' && '➕ Nova Comanda'}
            {view === 'novo-pedido' && `📝 Pedido - #${selectedComanda?.codigo}`}
            {view === 'ver-qr' && '📱 QR Code'}
          </h1>
          <p className="text-xs text-gray-500">{user.nome}</p>
        </div>
        <div className="flex gap-2">
          {view !== 'comandas' && (
            <button onClick={() => setView('comandas')} className="text-gray-400 text-sm px-3 py-2">
              ← Voltar
            </button>
          )}
          {view === 'comandas' && (
            <button onClick={() => { logout(); setUser(null) }} className="text-gray-500 text-xs px-3 py-2">
              Sair
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        {view === 'comandas' && (
          <div className="p-4 space-y-3">
            <button onClick={() => setView('nova-comanda')} className="btn-primary">
              ➕ Nova Comanda
            </button>

            {comandas.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <p className="text-4xl mb-2">🎟️</p>
                <p>Nenhuma comanda aberta</p>
              </div>
            ) : (
              comandas.map((c) => (
                <div key={c.id} className="bg-[#111118] border border-[#22222e] rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">#{c.codigo}</span>
                        <StatusBadge status={c.status} />
                      </div>
                      {c.clienteNome && (
                        <p className="text-gray-500 text-xs mt-1">👤 {c.clienteNome}</p>
                      )}
                    </div>
                    <span className="text-lg font-black text-white">{formatCurrency(c.total)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    {c.pedidos.length} pedido(s)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => abrirNovoPedido(c)}
                      className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold text-sm active:scale-95 transition-all"
                    >
                      + Pedido
                    </button>
                    <button
                      onClick={() => { setNovaComanda(c); setView('ver-qr') }}
                      className="py-3 px-4 rounded-xl bg-[#22222e] hover:bg-[#2d2d3d] font-bold text-sm active:scale-95 transition-all"
                    >
                      QR
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {view === 'nova-comanda' && (
          <div className="p-4 space-y-4">
            <input
              type="text"
              placeholder="Nome do cliente (opcional)"
              value={novaComandaNome}
              onChange={(e) => setNovaComandaNome(e.target.value)}
              className="w-full bg-[#111118] border border-[#22222e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500"
            />
            <button onClick={criarComanda} disabled={criandoComanda} className="btn-primary">
              {criandoComanda ? '⌛ Criando...' : '✅ Criar Comanda'}
            </button>
          </div>
        )}

        {view === 'ver-qr' && novaComanda && (
          <div className="p-4 text-center space-y-4">
            <p className="text-gray-400">Escaneie para abrir a comanda</p>
            <p className="text-2xl font-black text-white">#{novaComanda.codigo}</p>
            {novaComanda.clienteNome && (
              <p className="text-gray-400 text-sm">👤 {novaComanda.clienteNome}</p>
            )}
            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-2xl">
                <QRCodeSVG
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/cliente/${novaComanda.qrCodeHash}`}
                  size={220}
                  level="H"
                />
              </div>
            </div>
            <p className="text-xs text-gray-600 break-all">
              /cliente/{novaComanda.qrCodeHash}
            </p>
            <button onClick={() => setView('comandas')} className="btn-primary mt-4">
              Voltar para Comandas
            </button>
          </div>
        )}

        {view === 'novo-pedido' && (
          <div className="p-4 space-y-4">
            {Object.entries(produtosPorCategoria).map(([categoria, prods]) => (
              <div key={categoria}>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {categoria}
                </h3>
                <div className="space-y-2">
                  {prods.map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-[#111118] border border-[#22222e] rounded-xl px-4 py-3">
                      <div>
                        <p className="text-white font-medium text-sm">{p.nome}</p>
                        <p className="text-violet-400 text-xs font-bold">{formatCurrency(p.preco)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => alterarQtd(p.id, -1)}
                          className="w-8 h-8 rounded-lg bg-[#22222e] hover:bg-red-500/20 text-white font-bold flex items-center justify-center active:scale-95 transition-all"
                        >
                          −
                        </button>
                        <span className="text-white font-bold w-5 text-center">
                          {cart[p.id] || 0}
                        </span>
                        <button
                          onClick={() => alterarQtd(p.id, 1)}
                          className="w-8 h-8 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold flex items-center justify-center active:scale-95 transition-all"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <input
              type="text"
              placeholder="Observação (opcional)"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              className="w-full bg-[#111118] border border-[#22222e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 text-sm"
            />

            <div className="h-24" />
          </div>
        )}
      </div>

      {view === 'novo-pedido' && (
        <div className="sticky bottom-0 p-4 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f] to-transparent pt-8">
          <div className="flex justify-between mb-3">
            <span className="text-gray-400">Total do pedido</span>
            <span className="text-white font-black text-lg">{formatCurrency(totalCart)}</span>
          </div>
          <button
            onClick={enviarPedido}
            disabled={Object.keys(cart).length === 0 || sending}
            className="btn-primary"
          >
            {sending ? '⌛ Enviando...' : `✅ Lançar Pedido (${formatCurrency(totalCart)})`}
          </button>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    ABERTA: { cls: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', label: 'Aberta' },
    AGUARDANDO_PAGAMENTO: { cls: 'bg-amber-500/20 text-amber-400 border border-amber-500/30', label: 'Aguardando' },
    PAGA: { cls: 'bg-violet-500/20 text-violet-400 border border-violet-500/30', label: 'Paga' },
  }
  const s = map[status] || map.ABERTA
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
}
