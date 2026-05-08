'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, formatCurrency } from '@/lib/api'
import { getSocket } from '@/lib/socket'

interface Produto { id: string; nome: string; preco: number; categoria: string }
interface Comanda { id: string; codigo: string; status: string; total: number; clienteNome?: string }

export default function PedidosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [comandas, setComandas] = useState<Comanda[]>([])
  const [selectedComanda, setSelectedComanda] = useState('')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [obs, setObs] = useState('')
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [search, setSearch] = useState('')

  const fetchData = useCallback(async () => {
    const [p, c] = await Promise.all([
      api.get<Produto[]>('/produtos'),
      api.get<Comanda[]>('/comandas'),
    ])
    setProdutos(p)
    setComandas(c.filter(x => x.status === 'ABERTA' || x.status === 'AGUARDANDO_PAGAMENTO'))
  }, [])

  useEffect(() => {
    fetchData()
    const s = getSocket(); s.on('comanda:criada', fetchData)
    return () => { s.off('comanda:criada') }
  }, [fetchData])

  function alter(id: string, delta: number) {
    setCart(prev => {
      const n = Math.max(0, (prev[id] || 0) + delta)
      if (n === 0) { const { [id]: _, ...r } = prev; return r }
      return { ...prev, [id]: n }
    })
  }

  async function enviar() {
    if (!selectedComanda || Object.keys(cart).length === 0) return
    setSending(true)
    try {
      await api.post('/pedidos', {
        comandaId: selectedComanda,
        itens: Object.entries(cart).map(([produtoId, quantidade]) => ({ produtoId, quantidade })),
        obs: obs || undefined,
      })
      setCart({}); setObs(''); setSuccess(true)
      setTimeout(() => setSuccess(false), 3500)
      fetchData()
    } catch (e: any) { alert(e.message) } finally { setSending(false) }
  }

  const totalCart = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = produtos.find(x => x.id === id); return sum + (p ? p.preco * qty : 0)
  }, 0)
  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0)
  const comanda = comandas.find(c => c.id === selectedComanda)

  const porCategoria = produtos
    .filter(p => !search || p.nome.toLowerCase().includes(search.toLowerCase()) || p.categoria.toLowerCase().includes(search.toLowerCase()))
    .reduce<Record<string, Produto[]>>((acc, p) => {
      if (!acc[p.categoria]) acc[p.categoria] = []
      acc[p.categoria].push(p); return acc
    }, {})

  return (
    <div className="anim-up pb-6">
      <div className="dash-page-hero mb-6">
        <p className="dash-hero-kicker">Balcão</p>
        <h1 className="dash-hero-title">Lançar pedido</h1>
        <p className="section-sub mt-2">Selecione a comanda e monte o pedido com agilidade</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: produto selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Comanda picker */}
          <div className="card p-4 anim-up stagger-1">
            <label className="input-label mb-3">Comanda</label>
            {comandas.length === 0 ? (
              <div className="text-center py-4 text-sm" style={{ color:'var(--text-3)' }}>Nenhuma comanda aberta</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto">
                {comandas.map(c => (
                  <button key={c.id} onClick={() => setSelectedComanda(c.id)}
                    className="p-3 rounded-xl border text-left transition-all"
                    style={selectedComanda === c.id
                      ? { background:'var(--accent-subtle)', borderColor:'var(--accent-border)', color:'var(--text-1)' }
                      : { background:'var(--bg-input)', borderColor:'var(--border)', color:'var(--text-2)' }}>
                    <p className="font-mono font-bold text-sm">#{c.codigo}</p>
                    {c.clienteNome && <p className="text-xs truncate opacity-60 mt-0.5">{c.clienteNome}</p>}
                    <p className="text-xs font-bold mt-1" style={{ color:'var(--accent)' }}>{formatCurrency(c.total)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <div className="relative anim-up stagger-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color:'var(--text-3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
            </svg>
            <input type="text" placeholder="Buscar produto ou categoria..." value={search}
              onChange={e => setSearch(e.target.value)} className="input pl-10" />
          </div>

          {/* Products */}
          <div className="space-y-3 anim-up stagger-2">
            {Object.entries(porCategoria).map(([cat, prods]) => (
              <div key={cat} className="card overflow-hidden">
                <div className="px-4 py-2.5" style={{ borderBottom:'1px solid var(--border)', background:'var(--bg-input)' }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color:'var(--text-3)' }}>{cat}</h3>
                </div>
                <div>
                  {prods.map(p => {
                    const qty = cart[p.id] || 0
                    return (
                      <div key={p.id} className="flex items-center justify-between px-4 py-3 transition-colors"
                        style={{ borderBottom:'1px solid var(--border)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-subtle)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color:'var(--text-1)' }}>{p.nome}</p>
                          <p className="text-xs font-bold mt-0.5" style={{ color:'var(--accent)' }}>{formatCurrency(p.preco)}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {qty > 0 && (
                            <span className="text-xs" style={{ color:'var(--text-3)' }}>{formatCurrency(p.preco * qty)}</span>
                          )}
                          <div className="flex items-center gap-2">
                            <button onClick={() => alter(p.id, -1)} disabled={qty === 0}
                              className="w-8 h-8 rounded-lg font-bold text-lg flex items-center justify-center transition-all active:scale-90"
                              style={qty > 0
                                ? { background:'var(--danger-subtle)', color:'var(--danger-text)', border:'1px solid var(--danger-border)' }
                                : { background:'var(--bg-input)', color:'var(--text-3)', cursor:'default' }}>
                              −
                            </button>
                            <span className="w-6 text-center font-bold text-sm" style={{ color: qty > 0 ? 'var(--text-1)' : 'var(--text-3)' }}>{qty}</span>
                            <button onClick={() => alter(p.id, 1)}
                              className="w-8 h-8 rounded-lg font-bold text-lg flex items-center justify-center transition-all active:scale-90"
                              style={{ background:'var(--accent)', color:'#fff' }}>
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: order summary */}
        <div>
          <div className="card p-5 sticky top-8 anim-up stagger-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color:'var(--text-1)' }}>Resumo</h3>
              {cartCount > 0 && (
                <span className="text-xs font-black px-2 py-0.5 rounded-full"
                  style={{ background:'var(--accent-subtle)', color:'var(--accent)', border:'1px solid var(--accent-border)' }}>
                  {cartCount} item(s)
                </span>
              )}
            </div>

            {/* Comanda selected */}
            {comanda ? (
              <div className="p-3 rounded-xl mb-4" style={{ background:'var(--accent-subtle)', border:'1px solid var(--accent-border)' }}>
                <p className="text-xs font-medium" style={{ color:'var(--accent)' }}>Comanda selecionada</p>
                <p className="font-mono font-black" style={{ color:'var(--text-1)' }}>#{comanda.codigo}</p>
                {comanda.clienteNome && <p className="text-xs" style={{ color:'var(--text-2)' }}>{comanda.clienteNome}</p>}
                <p className="text-xs mt-1" style={{ color:'var(--text-3)' }}>Acumulado: {formatCurrency(comanda.total)}</p>
              </div>
            ) : (
              <div className="p-3 rounded-xl mb-4 text-center text-xs" style={{ background:'var(--bg-input)', border:'1px solid var(--border)', color:'var(--text-3)' }}>
                Selecione uma comanda
              </div>
            )}

            {/* Items */}
            {Object.keys(cart).length > 0 ? (
              <div className="space-y-2 mb-4 max-h-56 overflow-y-auto">
                {Object.entries(cart).map(([id, qty]) => {
                  const p = produtos.find(x => x.id === id); if (!p) return null
                  return (
                    <div key={id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0" style={{ background:'var(--bg-input)', color:'var(--text-2)' }}>{qty}×</span>
                        <span className="text-xs truncate" style={{ color:'var(--text-1)' }}>{p.nome}</span>
                      </div>
                      <span className="text-xs font-bold flex-shrink-0 ml-2" style={{ color:'var(--text-1)' }}>{formatCurrency(p.preco * qty)}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-6 text-center mb-4" style={{ color:'var(--text-3)' }}>
                <p className="text-2xl mb-1">🛒</p>
                <p className="text-sm">Nenhum item</p>
              </div>
            )}

            {/* Obs */}
            <input type="text" placeholder="Observação (opcional)" value={obs}
              onChange={e => setObs(e.target.value)} className="input text-xs mb-4" />

            {/* Total */}
            <div className="flex justify-between items-baseline py-3 mb-4" style={{ borderTop:'1px solid var(--border)' }}>
              <span className="text-sm" style={{ color:'var(--text-2)' }}>Total do pedido</span>
              <span className="text-2xl font-black" style={{ color:'var(--text-1)' }}>{formatCurrency(totalCart)}</span>
            </div>

            {success ? (
              <div className="p-4 rounded-xl text-center font-semibold text-sm anim-scale"
                style={{ background:'var(--success-subtle)', border:'1px solid var(--success-border)', color:'var(--success-text)' }}>
                ✅ Pedido lançado com sucesso!
              </div>
            ) : (
              <button onClick={enviar} disabled={!selectedComanda || Object.keys(cart).length === 0 || sending}
                className="btn-success">
                {sending
                  ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>Enviando...</>
                  : `✅ Lançar • ${formatCurrency(totalCart)}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
