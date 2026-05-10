'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, formatCurrency } from '@/lib/api'
import { getSocket } from '@/lib/socket'

interface ItemPedido { id: string; quantidade: number; subtotal: number; produto: { nome: string; preco: number } }
interface Pedido { id: string; status: string; total: number; obs?: string; createdAt: string; itens: ItemPedido[] }
interface Comanda { id: string; codigo: string; status: string; total: number; clienteNome?: string; createdAt: string; pedidos: Pedido[] }

export default function AoVivoPage() {
  const [comandas, setComandas] = useState<Comanda[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const fetch = useCallback(async () => {
    try {
      const data = await api.get<Comanda[]>('/comandas')
      setComandas(data.filter(c => c.status === 'ABERTA' || c.status === 'AGUARDANDO_PAGAMENTO'))
      setLastUpdate(new Date())
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetch()
    const interval = setInterval(fetch, 30000)
    const s = getSocket()
    s.on('pedido:adicionado', (data: any) => {
      fetch()
    })
    s.on('pagamento:confirmado', fetch)
    s.on('comanda:criada', fetch)
    return () => {
      clearInterval(interval)
      s.off('pedido:adicionado'); s.off('pagamento:confirmado'); s.off('comanda:criada')
    }
  }, [fetch])

  const totalAberto = comandas.reduce((s, c) => s + c.total, 0)
  const totalPedidos = comandas.reduce((s, c) => s + c.pedidos.length, 0)

  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between anim-up">
        <div className="flex items-center gap-3 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-35" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <p className="text-sm truncate" style={{ color: 'var(--text-2)' }}>
            <span className="text-[var(--text-3)]">Atualizado</span>{' '}
            {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            {' · '}
            {comandas.length} mesa(s) · {totalPedidos} pedido(s)
          </p>
        </div>
        <button type="button" onClick={fetch} className="btn-ghost shrink-0 inline-flex items-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Atualizar
        </button>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 anim-up stagger-1">
        {[
          { label: 'Comandas abertas', value: comandas.length, icon: '🎟️', color: '#2563eb' },
          { label: 'Pedidos ativos', value: totalPedidos, icon: '📝', color: '#0891b2' },
          { label: 'Total em aberto', value: formatCurrency(totalAberto), icon: '💰', color: '#ea580c' },
        ].map(s => (
          <div key={s.label} className="dash-stat-card relative text-center">
            <div className="dash-stat-blob dash-stat-blob--tint" style={{ background: s.color }} aria-hidden />
            <div className="relative z-[1] mx-auto max-w-[calc(100%-3.75rem)] px-1">
              <p className="text-2xl">{s.icon}</p>
              <p className="mt-2 text-xl font-black tabular-nums" style={{ color: s.color }}>
                {s.value}
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_,i) => <div key={i} className="card h-48 animate-pulse" />)}
        </div>
      ) : comandas.length === 0 ? (
        <div className="card p-16 text-center anim-up">
          <p className="text-5xl mb-4">🎉</p>
          <p className="font-bold text-lg" style={{ color: 'var(--text-1)' }}>Nenhuma comanda aberta</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Tudo tranquilo por aqui!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {comandas.map((c, idx) => (
            <ComandaCard key={c.id} comanda={c} index={idx} />
          ))}
        </div>
      )}
    </div>
  )
}

function ComandaCard({ comanda, index }: { comanda: Comanda; index: number }) {
  const minutosAberta = Math.floor((Date.now() - new Date(comanda.createdAt).getTime()) / 60000)
  const isOld = minutosAberta > 120
  const isWaiting = comanda.status === 'AGUARDANDO_PAGAMENTO'

  return (
    <div className={`card overflow-hidden anim-up`} style={{
      animationDelay: `${index * 40}ms`,
      borderColor: isWaiting ? 'var(--warning-border)' : isOld ? 'var(--danger-border)' : 'var(--border)',
    }}>
      {/* Status bar */}
      <div className="h-1" style={{
        background: isWaiting
          ? 'linear-gradient(90deg, #f59e0b, #d97706)'
          : isOld
          ? 'linear-gradient(90deg, #ef4444, #dc2626)'
          : 'linear-gradient(90deg, var(--accent), rgba(37,99,235,0.65))'
      }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-lg" style={{ color: 'var(--text-1)' }}>#{comanda.codigo}</span>
              {isWaiting && <span className="badge-aguardando">Pagando</span>}
            </div>
            {comanda.clienteNome && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>👤 {comanda.clienteNome}</p>
            )}
          </div>
          <div className="text-right">
            <p className="font-black text-lg" style={{ color: 'var(--text-1)' }}>{formatCurrency(comanda.total)}</p>
            <p className="text-xs" style={{ color: isOld ? 'var(--danger-text)' : 'var(--text-3)' }}>
              {minutosAberta < 60 ? `${minutosAberta}min` : `${Math.floor(minutosAberta/60)}h${minutosAberta%60}m`}
            </p>
          </div>
        </div>

        {/* Pedidos */}
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {comanda.pedidos.length === 0 ? (
            <p className="text-xs text-center py-3" style={{ color: 'var(--text-3)' }}>Sem pedidos ainda</p>
          ) : (
            comanda.pedidos.slice(-3).map(p => (
              <div key={p.id} className="rounded-xl p-2.5" style={{ background: 'var(--bg-input)' }}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-2)' }}>
                    {new Date(p.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{formatCurrency(p.total)}</span>
                </div>
                {p.itens.slice(0, 2).map(item => (
                  <div key={item.id} className="flex items-center gap-1.5">
                    <span className="text-xs font-bold" style={{ color: 'var(--text-3)' }}>{item.quantidade}×</span>
                    <span className="text-xs truncate" style={{ color: 'var(--text-2)' }}>{item.produto.nome}</span>
                  </div>
                ))}
                {p.itens.length > 2 && (
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>+{p.itens.length - 2} itens</p>
                )}
                {p.obs && <p className="text-xs italic mt-1" style={{ color: 'var(--text-3)' }}>"{p.obs}"</p>}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <span className="text-xs" style={{ color: 'var(--text-3)' }}>
            {comanda.pedidos.length} pedido(s)
          </span>
          <a href={`/cliente/${(comanda as any).qrCodeHash}`} target="_blank" rel="noopener noreferrer"
            className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
            Ver comanda →
          </a>
        </div>
      </div>
    </div>
  )
}
