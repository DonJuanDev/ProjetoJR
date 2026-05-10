'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { api, formatCurrency } from '@/lib/api'
import { DashboardPurposeStrip } from '@/components/dashboard/DashboardPurposeStrip'

interface Sugestao { tipo: string; icone: string; titulo: string; descricao: string; prioridade: 'alta' | 'media' | 'baixa' }
interface PorHora { hora: number; label: string; quantidade: number; total: number }
interface TopProduto { nome: string; categoria: string; total: number; quantidade: number }

interface AnalyticsData {
  topProdutos: TopProduto[]
  porHora: PorHora[]
  horarioPico: PorHora
  ticketMedio: number
  taxaConversao: number
  totalFaturado: number
  totalComandas: number
  totalPagas: number
  sugestoes: Sugestao[]
}

interface Comanda {
  id: string
  status: string
  total: number
  createdAt: string
  paidAt?: string
  pedidos: { itens: { quantidade: number; precoUnit: number; produto: { nome: string; categoria: string } }[] }[]
}

interface StatusAggregate {
  status: string
  quantidade: number
  total: number
}

interface StatusMapValue {
  quantidade: number
  total: number
}

const PRIORIDADE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  alta: { bg: 'var(--danger-subtle)', color: 'var(--danger-text)', label: 'Alta' },
  media: { bg: 'var(--warning-subtle)', color: 'var(--warning-text)', label: 'Média' },
  baixa: { bg: 'var(--success-subtle)', color: 'var(--success-text)', label: 'Baixa' },
}

const STATUS_LABEL: Record<string, string> = {
  ABERTA: 'Aberta',
  AGUARDANDO_PAGAMENTO: 'Aguardando',
  PAGA: 'Paga',
  BLOQUEADA: 'Bloqueada',
  CANCELADA: 'Cancelada',
}

const STATUS_COLOR: Record<string, string> = {
  ABERTA: 'var(--success-text)',
  AGUARDANDO_PAGAMENTO: 'var(--warning-text)',
  PAGA: 'var(--accent)',
  BLOQUEADA: 'var(--danger-text)',
  CANCELADA: 'var(--text-3)',
}

/** Hex stops for conic-gradient (vars not reliable inside gradient in all engines) */
const DONUT_HEX: Record<string, string> = {
  ABERTA: '#10b981',
  AGUARDANDO_PAGAMENTO: '#f59e0b',
  PAGA: '#2563eb',
  BLOQUEADA: '#ef4444',
  CANCELADA: '#94a3b8',
}

function buildDonutGradient(rows: StatusAggregate[], total: number): string | undefined {
  if (!total || rows.length === 0) return undefined
  let acc = 0
  const parts: string[] = []
  const sorted = [...rows].sort((a, b) => b.quantidade - a.quantidade)
  for (const r of sorted) {
    const pct = (r.quantidade / total) * 100
    if (pct <= 0) continue
    const start = acc
    acc += pct
    const col = DONUT_HEX[r.status] || '#64748b'
    parts.push(`${col} ${start.toFixed(2)}% ${acc.toFixed(2)}%`)
  }
  if (parts.length === 0) return undefined
  return `conic-gradient(${parts.join(', ')})`
}

export default function RelatoriosPage() {
  const [analytics, setAnalytics] = useState(null as AnalyticsData | null)
  const [statusData, setStatusData] = useState([] as StatusAggregate[])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [resumo, todasComandas] = await Promise.all([
        api.get('/analytics/resumo'),
        api.get('/comandas'),
      ])
      setAnalytics(resumo as AnalyticsData)

      const statusMap: { [k: string]: StatusMapValue } = {}
      const comandasList = todasComandas as Comanda[]
      comandasList.forEach(c => {
        statusMap[c.status] = statusMap[c.status] || { quantidade: 0, total: 0 }
        statusMap[c.status].quantidade++
        statusMap[c.status].total += c.total
      })
      setStatusData(Object.entries(statusMap).map(([status, v]) => ({ status, ...v })))
    } catch {
      /* silent */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const maxHora = Math.max(...(analytics?.porHora.map(h => h.quantidade) || [1]), 1)
  const maxProd = Math.max(...(analytics?.topProdutos.map(p => p.total) || [1]), 1)
  const totalComandasStatus = statusData.reduce((s, x) => s + x.quantidade, 0)

  const donutBg = useMemo(
    () => buildDonutGradient(statusData, totalComandasStatus),
    [statusData, totalComandasStatus]
  )

  if (loading) {
    return (
      <div className="space-y-5 pb-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="dash-skeleton-card h-[118px]" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="dash-skeleton-card h-72" />
          <div className="dash-skeleton-card h-72" />
        </div>
        <div className="dash-skeleton-card h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      <DashboardPurposeStrip
        variant="inteligencia-relatorios"
        title="Faturamento e padrões ao longo do tempo"
        description="Tickets, picos por horário, distribuição por status de comanda e produtos mais vendidos. Pensado para fechamento e gestão — não é atualização sala a sala como o Ao vivo."
        footerLink={{ href: '/dashboard/crm', label: 'Explorar clientes no CRM →' }}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between anim-up">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
            Indicadores consolidados
          </h2>
          <p className="mt-1 text-xs sm:text-sm" style={{ color: 'var(--text-2)' }}>
            Visão gerencial do período processado pela API de analytics.
          </p>
        </div>
        <button type="button" onClick={fetchData} className="btn-ghost shrink-0 self-start sm:self-auto inline-flex items-center gap-2 text-sm">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Atualizar dados
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5 anim-up stagger-1">
        {[
          { label: 'Faturamento', value: formatCurrency(analytics?.totalFaturado || 0), icon: '💰', color: '#ea580c' },
          { label: 'Ticket médio', value: formatCurrency(analytics?.ticketMedio || 0), icon: '🎫', color: '#2563eb' },
          { label: 'Comandas pagas', value: analytics?.totalPagas ?? 0, icon: '✅', color: '#059669' },
          { label: 'Volume total', value: analytics?.totalComandas ?? 0, icon: '🎟️', color: '#0891b2' },
          { label: 'Conversão', value: `${(analytics?.taxaConversao || 0).toFixed(0)}%`, icon: '📈', color: '#db2777' },
        ].map(k => (
          <div key={k.label} className="dash-stat-card relative overflow-hidden">
            <div className="dash-stat-blob dash-stat-blob--tint" style={{ background: k.color }} aria-hidden />
            <div className="relative z-[1] max-w-[calc(100%-3.75rem)]">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl text-lg" style={{ background: `${k.color}22` }}>
                {k.icon}
              </div>
              <p className="dash-stat-value !mt-0 !text-[1.2rem] sm:!text-[1.35rem]" style={{ color: k.color }}>
                {k.value}
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>
                {k.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Sugestões */}
      {analytics?.sugestoes && analytics.sugestoes.length > 0 && (
        <section className="anim-up stagger-2">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold sm:text-xl" style={{ color: 'var(--text-1)' }}>
              Insights automáticos
            </h2>
            <span
              className="rounded-full px-3 py-1 text-[11px] font-bold"
              style={{
                background: 'var(--accent-subtle)',
                color: 'var(--accent)',
                border: '1px solid var(--accent-border)',
              }}
            >
              {analytics.sugestoes.length} oportunidades
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {analytics.sugestoes.map((s, i) => {
              const style = PRIORIDADE_STYLE[s.prioridade] || PRIORIDADE_STYLE.media
              return (
                <div key={i} className="dash-insight-spotlight">
                  <div className="relative z-[1] flex gap-3">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-sm"
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}
                    >
                      {s.icone}
                    </div>
                    <div className="min-w-0">
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: style.bg, color: style.color }}
                      >
                        Prioridade {style.label}
                      </span>
                      <p className="mt-2 font-bold leading-snug" style={{ color: 'var(--text-1)' }}>
                        {s.titulo}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                        {s.descricao}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
          Ritmo e mix operacional
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
        {/* Horário — barras verticais */}
        <div className="card overflow-hidden p-5 anim-up stagger-3">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>
                Ritmo da noite
              </h3>
              <p className="mt-1 text-xs font-medium" style={{ color: 'var(--text-3)' }}>
                Pedidos por faixa — compare picos com equipagem e promoções
              </p>
            </div>
            {analytics?.horarioPico && analytics.horarioPico.quantidade > 0 && (
              <span
                className="rounded-full px-3 py-1.5 text-[11px] font-bold"
                style={{
                  background: 'var(--warning-subtle)',
                  color: 'var(--warning-text)',
                  border: '1px solid var(--warning-border)',
                }}
              >
                Pico {analytics.horarioPico.label}
              </span>
            )}
          </div>
          {!analytics?.porHora.length ? (
            <p className="py-12 text-center text-sm" style={{ color: 'var(--text-3)' }}>
              Ainda sem histórico suficiente para o gráfico
            </p>
          ) : (
            <div className="dash-hour-bars">
              {analytics.porHora.map(h => {
                const isPico = h.hora === analytics.horarioPico?.hora && h.quantidade > 0
                const hPx = Math.max(6, (h.quantidade / maxHora) * 112)
                return (
                  <div key={h.hora} className="dash-hour-col" data-peak={isPico}>
                    <div className="dash-hour-col-track">
                      <div className="dash-hour-col-bar" style={{ height: `${hPx}px` }} />
                    </div>
                    <span className="text-[11px] font-black tabular-nums" style={{ color: isPico ? 'var(--warning-text)' : 'var(--text-2)' }}>
                      {h.quantidade}
                    </span>
                    <span className="max-w-[100%] truncate text-center text-[9px] font-bold leading-tight" style={{ color: 'var(--text-3)' }}>
                      {h.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Status donut + legenda */}
        <div className="card overflow-hidden p-5 anim-up stagger-3">
          <h3 className="mb-1 text-base font-bold" style={{ color: 'var(--text-1)' }}>
            Mix de status
          </h3>
          <p className="mb-6 text-xs font-medium" style={{ color: 'var(--text-3)' }}>
            Distribuição operacional das comandas
          </p>
          {statusData.length === 0 || !donutBg ? (
            <p className="py-12 text-center text-sm" style={{ color: 'var(--text-3)' }}>
              Sem comandas para analisar
            </p>
          ) : (
            <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-center sm:gap-10">
              <div className="dash-donut-wrap shrink-0">
                <div className="dash-donut-ring shadow-inner" style={{ background: donutBg }} />
                <div className="dash-donut-hole">
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
                    Total
                  </span>
                  <span className="text-2xl font-black tabular-nums" style={{ color: 'var(--text-1)' }}>
                    {totalComandasStatus}
                  </span>
                </div>
              </div>
              <ul className="w-full max-w-xs space-y-3">
                {statusData
                  .sort((a, b) => b.quantidade - a.quantidade)
                  .map(s => {
                    const pct = totalComandasStatus ? (s.quantidade / totalComandasStatus) * 100 : 0
                    const hex = DONUT_HEX[s.status] || '#64748b'
                    return (
                      <li key={s.status} className="flex items-center gap-3">
                        <span className="h-3 w-3 shrink-0 rounded-full shadow-sm" style={{ background: hex }} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-bold" style={{ color: STATUS_COLOR[s.status] || 'var(--text-1)' }}>
                              {STATUS_LABEL[s.status] || s.status}
                            </span>
                            <span className="shrink-0 text-xs font-black tabular-nums" style={{ color: 'var(--text-2)' }}>
                              {pct.toFixed(0)}%
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[11px]" style={{ color: 'var(--text-3)' }}>
                            <span>{s.quantidade} comandas</span>
                            <span className="font-bold">{formatCurrency(s.total)}</span>
                          </div>
                        </div>
                      </li>
                    )
                  })}
              </ul>
            </div>
          )}
        </div>

        {/* Leaderboard produtos */}
        <div className="dash-leader-wrap anim-up stagger-4 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: 'var(--border)' }}>
            <div>
              <h3 className="font-bold" style={{ color: 'var(--text-1)' }}>
                Ranking de produtos
              </h3>
              <p className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>
                O que mais sai no seu balcão
              </p>
            </div>
          </div>
          {!analytics?.topProdutos.length ? (
            <p className="py-14 text-center text-sm" style={{ color: 'var(--text-3)' }}>
              Cadastre vendas para ver o ranking
            </p>
          ) : (
            analytics.topProdutos.map((p, i) => (
              <div key={p.nome} className="dash-leader-row">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black"
                  style={{
                    background: i === 0 ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : i === 1 ? 'linear-gradient(135deg,#e5e7eb,#9ca3af)' : i === 2 ? 'linear-gradient(135deg,#fdba74,#ea580c)' : 'var(--bg-input)',
                    color: i < 3 ? '#fff' : 'var(--text-3)',
                    border: i >= 3 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold" style={{ color: 'var(--text-1)' }}>
                    {p.nome}
                  </p>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>
                    {p.categoria}
                  </p>
                  <div className="dash-mini-bar mt-2 max-w-md">
                    <span style={{ width: `${(p.total / maxProd) * 100}%` }} />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-black tabular-nums" style={{ color: 'var(--text-1)' }}>
                    {formatCurrency(p.total)}
                  </p>
                  <p className="text-[11px] font-bold" style={{ color: 'var(--accent)' }}>
                    {p.quantidade} unid.
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
