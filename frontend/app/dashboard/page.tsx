'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { api, formatCurrency } from '@/lib/api'
import { getSocket } from '@/lib/socket'

interface DashboardData {
  abertas: number; pagas: number; totalFaturado: number
  comandas: ComandaItem[]
}
interface ComandaItem {
  id: string; codigo: string; status: string; total: number
  clienteNome?: string; createdAt: string; pedidos: { id: string }[]; qrCodeHash: string
}

const STATUS_LABEL: Record<string,string> = {
  ABERTA:'Aberta', AGUARDANDO_PAGAMENTO:'Aguardando', PAGA:'Paga', BLOQUEADA:'Bloqueada', CANCELADA:'Cancelada'
}
const STATUS_CLS: Record<string,string> = {
  ABERTA:'badge-aberta', AGUARDANDO_PAGAMENTO:'badge-aguardando', PAGA:'badge-paga', BLOQUEADA:'badge-bloqueada'
}

function StatCard({ label, value, trend }: {
  label: string; value: string | number; trend?: string
}) {
  return (
    <div className="dash-stat-card anim-up relative">
      <div className="dash-stat-blob" aria-hidden />
      <div className="relative z-[1] max-w-[calc(100%-3.75rem)]">
        <p className="dash-stat-label">{label}</p>
        <p className="dash-stat-value">{value}</p>
        {trend && (
          <span className="inline-flex mt-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent-border)]">
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadDashboard = useCallback(async () => {
    try {
      setData(await api.get<DashboardData>('/comandas/dashboard'))
    }
    catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => {
    loadDashboard()
    const s = getSocket()
    s.on('comanda:criada', loadDashboard)
    s.on('pedido:adicionado', loadDashboard)
    s.on('pagamento:confirmado', loadDashboard)
    return () => {
      s.off('comanda:criada', loadDashboard)
      s.off('pedido:adicionado', loadDashboard)
      s.off('pagamento:confirmado', loadDashboard)
    }
  }, [loadDashboard])

  const rawComandas = data?.comandas
  const comandas = Array.isArray(rawComandas) ? rawComandas : []
  const recentes = comandas.slice(0, 10)

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 anim-up">
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>Últimos números da operação neste espaço.</p>
        <button type="button" onClick={loadDashboard} className="btn-ghost shrink-0 self-start sm:self-auto rounded-xl px-4 py-2 text-sm inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Atualizar
        </button>
      </div>

      {/* Stats */}
      {loading
        ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_,i) => <div key={i} className="dash-stat-card h-[124px] animate-pulse bg-[var(--bg-input)] border-transparent" />)}
          </div>
        : <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Comandas abertas" value={data?.abertas || 0} />
            <StatCard label="Comandas pagas (hist.)" value={data?.pagas || 0} />
            <StatCard label="Total faturado" value={formatCurrency(data?.totalFaturado || 0)} />
            <StatCard label="Cadastradas" value={(data?.abertas || 0) + (data?.pagas || 0)} />
          </div>
      }

      <div className="card overflow-hidden anim-up stagger-1">
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="font-bold" style={{ color: 'var(--text-1)' }}>Comandas recentes</h2>
          <Link href="/dashboard/comandas" className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
            Ver todas →
          </Link>
        </div>
        <div>
          {recentes.length === 0 && !loading && (
            <div className="text-center py-14" style={{ color: 'var(--text-3)' }}>
              <p className="text-3xl mb-2">🎟️</p>
              <p className="text-sm">Nenhuma comanda ainda.</p>
            </div>
          )}
          {recentes.map((c) => (
            <div key={c.id} className="table-row flex items-center px-5 py-3.5 gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono font-bold text-sm" style={{ color: 'var(--text-1)' }}>#{c.codigo}</span>
                  <span className={STATUS_CLS[c.status] || 'badge-aberta'}>{STATUS_LABEL[c.status]}</span>
                </div>
                {c.clienteNome && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-3)' }}>{c.clienteNome}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>{formatCurrency(c.total)}</p>
                <p className="text-xs" style={{ color: 'var(--text-3)' }}>{c.pedidos?.length ?? 0} ped.</p>
              </div>
              <p className="text-xs w-12 text-right flex-shrink-0" style={{ color: 'var(--text-3)' }}>
                {new Date(c.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
