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

  const fetch = useCallback(async () => {
    try { setData(await api.get<DashboardData>('/comandas/dashboard')) }
    catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetch()
    const s = getSocket()
    s.on('comanda:criada', fetch); s.on('pedido:adicionado', fetch); s.on('pagamento:confirmado', fetch)
    return () => { s.off('comanda:criada', fetch); s.off('pedido:adicionado', fetch); s.off('pagamento:confirmado', fetch) }
  }, [fetch])

  const abertas  = data?.comandas.filter(c => c.status === 'ABERTA') || []
  const recentes = data?.comandas.slice(0, 10) || []

  return (
    <div className="space-y-8 pb-6">
      <div className="dash-page-hero anim-up">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="dash-hero-kicker">Painel</p>
            <h1 className="dash-hero-title">Indicadores ao vivo</h1>
            <p className="section-sub mt-2">Resumo operacional instantâneo</p>
          </div>
          <button type="button" onClick={fetch} className="btn-ghost shrink-0 self-start sm:self-center rounded-full px-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Atualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      {loading
        ? <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_,i) => <div key={i} className="dash-stat-card h-[124px] animate-pulse bg-[var(--bg-input)] border-transparent" />)}
          </div>
        : <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Abertas agora" value={data?.abertas || 0} trend="ao vivo" />
            <StatCard label="Pagas hoje" value={data?.pagas || 0} />
            <StatCard label="Total faturado" value={formatCurrency(data?.totalFaturado || 0)} />
            <StatCard label="Total de comandas" value={(data?.abertas||0)+(data?.pagas||0)} />
          </div>
      }

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recentes */}
        <div className="lg:col-span-2 card overflow-hidden anim-up stagger-1">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)', background: 'linear-gradient(105deg, var(--accent-subtle), transparent 55%)' }}>
            <h2 className="font-bold" style={{ color: 'var(--text-1)' }}>Comandas recentes</h2>
            <Link href="/dashboard/comandas" className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
              Ver todas →
            </Link>
          </div>
          <div>
            {recentes.length === 0 && !loading && (
              <div className="text-center py-14" style={{ color: 'var(--text-3)' }}>
                <p className="text-3xl mb-2">🎟️</p><p className="text-sm">Nenhuma comanda ainda</p>
              </div>
            )}
            {recentes.map((c, i) => (
              <div key={c.id} className="table-row flex items-center px-5 py-3.5 gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-bold text-sm" style={{ color: 'var(--text-1)' }}>#{c.codigo}</span>
                    <span className={STATUS_CLS[c.status] || 'badge-aberta'}>{STATUS_LABEL[c.status]}</span>
                  </div>
                  {c.clienteNome && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-3)' }}>👤 {c.clienteNome}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>{formatCurrency(c.total)}</p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>{c.pedidos.length} ped.</p>
                </div>
                <p className="text-xs w-12 text-right flex-shrink-0" style={{ color: 'var(--text-3)' }}>
                  {new Date(c.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick actions */}
          <div className="card p-5 anim-up stagger-2">
            <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--text-1)' }}>Ações Rápidas</h3>
            <div className="space-y-2">
              {[
                { href: '/dashboard/comandas', label: 'Nova Comanda',   sub: 'Gerar QR Code',        color: '#7c3aed', icon: '➕' },
                { href: '/dashboard/pedidos',  label: 'Lançar Pedido',  sub: 'Adicionar itens',      color: '#3b82f6', icon: '📝' },
                { href: '/dashboard/ao-vivo',  label: 'Ver Ao Vivo',   sub: 'Pedidos em tempo real', color: '#10b981', icon: '⚡' },
                { href: '/dashboard/saida',    label: 'Validar Saída',  sub: 'Portaria',              color: '#f59e0b', icon: '🚪' },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all group card-hover"
                  style={{ border: '1px solid var(--border)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: `${item.color}18` }}>{item.icon}</div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{item.label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-3)' }}>{item.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Live abertas */}
          {abertas.length > 0 && (
            <div className="card p-5 anim-up stagger-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="dot-live" />
                <h3 className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>Abertas agora</h3>
                <span className="ml-auto text-xs font-black px-2 py-0.5 rounded-full text-white"
                  style={{ background: 'var(--success)' }}>{abertas.length}</span>
              </div>
              <div className="space-y-2">
                {abertas.slice(0, 5).map(c => (
                  <div key={c.id} className="flex items-center justify-between py-1.5">
                    <span className="font-mono text-sm" style={{ color: 'var(--text-2)' }}>#{c.codigo}</span>
                    <span className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>{formatCurrency(c.total)}</span>
                  </div>
                ))}
                {abertas.length > 5 && <p className="text-xs text-center pt-1" style={{ color: 'var(--text-3)' }}>+{abertas.length - 5} mais</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
