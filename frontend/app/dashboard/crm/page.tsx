'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { api, formatCurrency } from '@/lib/api'
import { DashboardPurposeStrip } from '@/components/dashboard/DashboardPurposeStrip'

interface TopBebida { nome: string; qtd: number }
interface Cliente {
  nome: string
  telefone?: string
  visitas: number
  totalGasto: number
  ticketMedio: number
  ultimaVisita: string
  primeiraVisita: string
  topBebidas: TopBebida[]
}

interface CrmData { clientes: Cliente[]; total: number }

type TierKey = 'todos' | 'vip' | 'frequente' | 'regular' | 'novo'

function diasAtras(dateStr: string) {
  const dias = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (dias === 0) return 'Hoje'
  if (dias === 1) return 'Ontem'
  return `${dias}d atrás`
}

function badgeFidelidade(visitas: number) {
  if (visitas >= 10) return { label: 'VIP', color: '#d97706', bg: 'rgba(245,158,11,0.18)', ring: 'rgba(245,158,11,0.35)' }
  if (visitas >= 5) return { label: 'Frequente', color: '#2563eb', bg: 'rgba(37,99,235,0.12)', ring: 'rgba(37,99,235,0.28)' }
  if (visitas >= 2) return { label: 'Regular', color: '#0891b2', bg: 'rgba(8,145,178,0.12)', ring: 'rgba(8,145,178,0.25)' }
  return { label: 'Novo', color: '#059669', bg: 'rgba(5,150,105,0.12)', ring: 'rgba(5,150,105,0.28)' }
}

function tierMatch(c: Cliente, tier: TierKey) {
  const v = c.visitas
  if (tier === 'vip') return v >= 10
  if (tier === 'frequente') return v >= 5 && v < 10
  if (tier === 'regular') return v >= 2 && v < 5
  if (tier === 'novo') return v < 2
  return true
}

const TIERS: { key: TierKey; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'vip', label: 'VIP' },
  { key: 'frequente', label: 'Fiéis' },
  { key: 'regular', label: 'Regulares' },
  { key: 'novo', label: 'Novos' },
]

export default function CrmPage() {
  const [data, setData] = useState<CrmData | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Cliente | null>(null)
  const [sortBy, setSortBy] = useState<'gasto' | 'visitas' | 'recente'>('gasto')
  const [tier, setTier] = useState<TierKey>('todos')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.get<CrmData>('/analytics/crm'))
    } catch {
      /* handled empty */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalGasto = data?.clientes.reduce((s, c) => s + c.totalGasto, 0) || 0
  const mediaVisitas = data?.clientes.length ? data.clientes.reduce((s, c) => s + c.visitas, 0) / data.clientes.length : 0
  const vips = data?.clientes.filter(c => c.visitas >= 10).length || 0

  const clientes = useMemo(() => {
    const list = data?.clientes || []
    return list
      .filter(c => tierMatch(c, tier))
      .filter(
        c =>
          !search ||
          c.nome.toLowerCase().includes(search.toLowerCase()) ||
          c.telefone?.includes(search)
      )
      .sort((a, b) => {
        if (sortBy === 'gasto') return b.totalGasto - a.totalGasto
        if (sortBy === 'visitas') return b.visitas - a.visitas
        return new Date(b.ultimaVisita).getTime() - new Date(a.ultimaVisita).getTime()
      })
  }, [data, tier, search, sortBy])

  useEffect(() => {
    if (!selected) return
    const still = clientes.some(c => c.nome === selected.nome && (c.telefone || '') === (selected.telefone || ''))
    if (!still) setSelected(null)
  }, [clientes, selected])

  const maxBebida = selected?.topBebidas.length
    ? Math.max(...selected.topBebidas.map(b => b.qtd), 1)
    : 1

  const topSpend = useMemo(() => {
    if (!data?.clientes.length) return null
    return [...data.clientes].sort((a, b) => b.totalGasto - a.totalGasto)[0]
  }, [data])

  return (
    <div className="space-y-6 pb-8">
      <DashboardPurposeStrip
        variant="inteligencia-crm"
        title="Visitas, gasto e hábitos por cliente identificado"
        description="Útil para fidelidade e relacionamento. Não lista mesas abertas — isso é Operação → Ao vivo. Indicadores gerais da casa ficam em Relatórios."
        footerLink={{ href: '/dashboard/ao-vivo', label: 'Ir para o salão ao vivo →' }}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between anim-up">
        <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
          Resumo da base
        </h2>
        <button type="button" onClick={fetchData} className="btn-ghost shrink-0 self-start sm:self-auto inline-flex items-center gap-2 text-sm">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Atualizar
        </button>
      </div>
      {topSpend && data && data.clientes.length > 0 && (
        <div
          className="dash-glass-inline flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 text-sm anim-up"
          style={{ borderColor: 'var(--border)' }}
        >
          <span style={{ color: 'var(--text-3)' }}>Destaque em gasto</span>
          <span className="font-bold" style={{ color: 'var(--text-1)' }}>
            {topSpend.nome}
          </span>
          <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
            {formatCurrency(topSpend.totalGasto)}
          </span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 anim-up stagger-1">
        {[
          { label: 'Clientes identificados', value: data?.total ?? '—', icon: '👥', color: '#2563eb' },
          { label: 'Receita atribuída', value: loading ? '…' : formatCurrency(totalGasto), icon: '💎', color: '#ea580c' },
          { label: 'Média de visitas', value: loading ? '…' : mediaVisitas.toFixed(1), icon: '💫', color: '#0891b2' },
          { label: 'Clientes VIP', value: vips, icon: '👑', color: '#ca8a04' },
        ].map(k => (
          <div key={k.label} className="dash-stat-card relative overflow-hidden">
            <div className="dash-stat-blob dash-stat-blob--tint" style={{ background: k.color }} aria-hidden />
            <div className="relative z-[1] max-w-[calc(100%-3.75rem)]">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl text-lg" style={{ background: `${k.color}22` }}>
                {k.icon}
              </div>
              <p className="dash-stat-value !mt-0 !text-[1.35rem]" style={{ color: k.color }}>
                {k.value}
              </p>
              <p className="mt-1 text-[11px] font-semibold leading-snug" style={{ color: 'var(--text-3)' }}>
                {k.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {!loading && (!data?.clientes.length) && (
        <div className="dash-insight-spotlight anim-up p-10 text-center">
          <div className="relative z-[1]">
            <p className="mb-3 text-5xl">✨</p>
            <p className="mb-2 text-lg font-bold" style={{ color: 'var(--text-1)' }}>
              Seu CRM está pronto para brilhar
            </p>
            <p className="mx-auto max-w-md text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
              Ainda não há clientes identificados. Ao criar comandas, preencha <strong>nome</strong> e, se possível,{' '}
              <strong>telefone</strong> — o Gateway agrupa histórico e preferências automaticamente.
            </p>
          </div>
        </div>
      )}

      {data && data.clientes.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3 anim-up stagger-2">
          <div className="space-y-4 lg:col-span-2">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
                Lista de clientes
              </h2>
              <p className="mt-1 text-xs" style={{ color: 'var(--text-2)' }}>
                Filtros e ordenação só afetam as linhas abaixo — não mexem em comandas nem em relatório financeiro.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="dash-chip-row">
                {TIERS.map(t => (
                  <button key={t.key} type="button" className="dash-chip" data-active={tier === t.key} onClick={() => setTier(t.key)}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="dash-chip-row">
                {(
                  [
                    { key: 'gasto' as const, label: 'Maior gasto' },
                    { key: 'visitas' as const, label: 'Visitas' },
                    { key: 'recente' as const, label: 'Recentes' },
                  ] as const
                ).map(o => (
                  <button key={o.key} type="button" className="dash-chip" data-active={sortBy === o.key} onClick={() => setSortBy(o.key)}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <svg
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: 'var(--text-3)' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
              </svg>
              <input
                type="search"
                placeholder="Buscar por nome ou telefone…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input w-full rounded-full border-transparent py-3.5 pl-11 shadow-sm"
                style={{ background: 'var(--bg-input)' }}
              />
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="dash-skeleton-card h-[88px]" />
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {clientes.map((c, i) => {
                  const badge = badgeFidelidade(c.visitas)
                  const isSelected = selected?.nome === c.nome && (selected?.telefone || '') === (c.telefone || '')
                  return (
                    <button
                      key={`${c.nome}-${c.telefone ?? i}`}
                      type="button"
                      onClick={() => setSelected(isSelected ? null : c)}
                      className="dash-client-shell p-4"
                      data-selected={isSelected}
                      style={{ animationDelay: `${i * 25}ms` }}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-black"
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            boxShadow: `0 0 0 2px ${badge.ring}`,
                          }}
                        >
                          {c.nome[0].toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-semibold" style={{ color: 'var(--text-1)' }}>
                              {c.nome}
                            </p>
                            <span
                              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                              style={{ background: badge.bg, color: badge.color }}
                            >
                              {badge.label}
                            </span>
                          </div>
                          {c.telefone && (
                            <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--text-3)' }}>
                              {c.telefone}
                            </p>
                          )}
                          <p className="mt-1 text-[11px] font-medium" style={{ color: 'var(--text-3)' }}>
                            {c.visitas} {c.visitas === 1 ? 'visita' : 'visitas'} · última {diasAtras(c.ultimaVisita)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-base font-black tracking-tight" style={{ color: 'var(--accent)' }}>
                            {formatCurrency(c.totalGasto)}
                          </p>
                          <p className="text-[11px] font-semibold" style={{ color: 'var(--text-3)' }}>
                            ticket {formatCurrency(c.ticketMedio)}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="dash-detail-sticky space-y-4">
            {selected ? (
              <>
                <div className="dash-detail-card overflow-hidden">
                  <div
                    className="h-1.5 w-full"
                    style={{
                      background: `linear-gradient(90deg, ${badgeFidelidade(selected.visitas).color}, var(--accent))`,
                    }}
                  />
                  <div className="p-5">
                    <div className="mb-5 flex items-start gap-3">
                      <div
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl font-black"
                        style={{
                          background: badgeFidelidade(selected.visitas).bg,
                          color: badgeFidelidade(selected.visitas).color,
                        }}
                      >
                        {selected.nome[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-bold leading-tight" style={{ color: 'var(--text-1)' }}>
                          {selected.nome}
                        </p>
                        {selected.telefone && (
                          <p className="mt-1 text-sm" style={{ color: 'var(--text-3)' }}>
                            {selected.telefone}
                          </p>
                        )}
                        <p className="mt-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                          Perfil completo
                        </p>
                      </div>
                    </div>

                    <div className="dash-metric-grid">
                      {[
                        { label: 'Total gasto', value: formatCurrency(selected.totalGasto) },
                        { label: 'Visitas', value: `${selected.visitas}×` },
                        { label: 'Ticket médio', value: formatCurrency(selected.ticketMedio) },
                        { label: 'Última visita', value: diasAtras(selected.ultimaVisita) },
                      ].map(row => (
                        <div key={row.label} className="dash-metric-tile">
                          <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
                            {row.label}
                          </p>
                          <p className="mt-1 text-sm font-black" style={{ color: 'var(--text-1)' }}>
                            {row.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 space-y-2 rounded-xl border px-3 py-3 text-xs" style={{ borderColor: 'var(--border)', background: 'var(--bg-input)' }}>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-3)' }}>Primeira visita</span>
                        <span className="font-bold" style={{ color: 'var(--text-1)' }}>
                          {new Date(selected.primeiraVisita).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--text-3)' }}>Última visita</span>
                        <span className="font-bold" style={{ color: 'var(--text-1)' }}>
                          {new Date(selected.ultimaVisita).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {selected.topBebidas.length > 0 && (
                  <div className="dash-detail-card p-5">
                    <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--text-3)' }}>
                      Preferências na mesa
                    </p>
                    <div className="space-y-3">
                      {selected.topBebidas.map((b, idx) => (
                        <div key={b.nome}>
                          <div className="mb-1 flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 truncate font-medium" style={{ color: 'var(--text-1)' }}>
                              <span className="text-base">{['🥇', '🥈', '🥉'][idx] ?? '▸'}</span>
                              <span className="truncate">{b.nome}</span>
                            </span>
                            <span className="shrink-0 text-xs font-black tabular-nums" style={{ color: 'var(--accent)' }}>
                              {b.qtd} pedidos
                            </span>
                          </div>
                          <div className="dash-mini-bar">
                            <span style={{ width: `${(b.qtd / maxBebida) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="dash-detail-card flex flex-col items-center justify-center px-6 py-14 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl" style={{ background: 'var(--accent-subtle)' }}>
                  👆
                </div>
                <p className="font-bold" style={{ color: 'var(--text-1)' }}>
                  Escolha um cliente
                </p>
                <p className="mt-2 max-w-[240px] text-sm leading-relaxed" style={{ color: 'var(--text-3)' }}>
                  Toque em uma linha à esquerda para ver gastos, visitas e drinks favoritos num painel digno de briefing.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
