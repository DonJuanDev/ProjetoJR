'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, formatCurrency } from '@/lib/api'
import { getSocket } from '@/lib/socket'
import { QRCodeSVG } from 'qrcode.react'

interface Comanda {
  id: string; codigo: string; status: string; total: number
  clienteNome?: string; qrCodeHash: string; createdAt: string
  pedidos: { id: string; total: number }[]
  pagamentos: { status: string }[]
}

const STATUS_LABEL: Record<string,string> = {
  ABERTA:'Aberta', AGUARDANDO_PAGAMENTO:'Aguardando', PAGA:'Paga',
  BLOQUEADA:'Bloqueada', CANCELADA:'Cancelada'
}
const STATUS_CLS: Record<string,string> = {
  ABERTA:'badge-aberta', AGUARDANDO_PAGAMENTO:'badge-aguardando',
  PAGA:'badge-paga', BLOQUEADA:'badge-bloqueada', CANCELADA:'badge-cancelada'
}
const FILTERS = ['Todas','ABERTA','AGUARDANDO_PAGAMENTO','PAGA','BLOQUEADA']

export default function ComandasPage() {
  const [comandas, setComandas] = useState<Comanda[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Todas')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showQR, setShowQR] = useState<Comanda | null>(null)
  const [creating, setCreating] = useState(false)
  const [newNome, setNewNome] = useState('')
  const [newTelefone, setNewTelefone] = useState('')
  const [confirmAprovar, setConfirmAprovar] = useState<Comanda | null>(null)
  const [aprovando, setAprovando] = useState(false)

  const fetchComandas = useCallback(async () => {
    try { setComandas(await api.get<Comanda[]>('/comandas')) }
    catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchComandas()
    const s = getSocket()
    s.on('comanda:criada', fetchComandas)
    s.on('pedido:adicionado', fetchComandas)
    s.on('pagamento:confirmado', fetchComandas)
    return () => { s.off('comanda:criada'); s.off('pedido:adicionado'); s.off('pagamento:confirmado') }
  }, [fetchComandas])

  useEffect(() => {
    if (!showQR) return
    const atual = comandas.find((c) => c.id === showQR.id)
    if (atual) setShowQR(atual)
  }, [comandas, showQR?.id])

  async function aprovarPagamento(c: Comanda) {
    setAprovando(true)
    try {
      await api.post(`/comandas/${c.id}/aprovar`, {})
      setConfirmAprovar(null)
      fetchComandas()
    } catch (e: any) { alert(e.message) }
    finally { setAprovando(false) }
  }

  async function criarComanda() {
    setCreating(true)
    try {
      const c = await api.post<Comanda>('/comandas', { clienteNome: newNome || undefined, clienteTelefone: newTelefone || undefined })
      setComandas(p => [c, ...p])
      setNewNome(''); setNewTelefone(''); setShowCreate(false); setShowQR(c)
    } catch (e: any) { alert(e.message) } finally { setCreating(false) }
  }

  const filtered = comandas.filter(c => {
    const mf = filter === 'Todas' || c.status === filter
    const ms = !search || c.codigo.toLowerCase().includes(search.toLowerCase()) || (c.clienteNome?.toLowerCase().includes(search.toLowerCase()))
    return mf && ms
  })

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  return (
    <div className="space-y-6 pb-6">
      <div className="dash-page-hero anim-up">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="dash-hero-kicker">Operação</p>
            <h1 className="dash-hero-title">Comandas</h1>
            <p className="section-sub mt-2">{comandas.length} registros · filtros em tempo real</p>
          </div>
          <button type="button" onClick={() => setShowCreate(true)} className="btn-primary shrink-0 self-start sm:self-center">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Nova comanda
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 anim-up stagger-1 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color:'var(--text-3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
          </svg>
          <input type="search" placeholder="Código ou cliente…" value={search}
            onChange={e => setSearch(e.target.value)} className="input w-full rounded-full border-transparent py-3 pl-10" />
        </div>
        <div className="dash-chip-row overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className="dash-chip shrink-0"
              data-active={filter === f}>
              {f === 'Todas' ? 'Todas' : STATUS_LABEL[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden anim-up stagger-2">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)' }}>
                {['Código','Cliente','Status','Pedidos','Total','Horário','Ações'].map((h, i) => (
                  <th key={h} className={`th ${i >= 4 ? 'text-right' : 'text-left'} ${i === 6 ? 'text-center' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && [...Array(5)].map((_,i) => (
                <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                  {[...Array(7)].map((_,j) => (
                    <td key={j} className="table-cell">
                      <div className="h-4 rounded animate-pulse" style={{ background:'var(--bg-input)' }} />
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-16" style={{ color:'var(--text-3)' }}>
                  <p className="text-3xl mb-2">🎟️</p>
                  <p className="text-sm">Nenhuma comanda encontrada</p>
                </td></tr>
              )}
              {filtered.map(c => (
                <tr key={c.id} className="table-row">
                  <td className="table-cell">
                    <span className="font-mono font-bold" style={{ color:'var(--text-1)' }}>#{c.codigo}</span>
                  </td>
                  <td className="table-cell" style={{ color:'var(--text-2)', maxWidth:140 }}>
                    <span className="block truncate">{c.clienteNome || <span style={{ color:'var(--text-3)' }}>—</span>}</span>
                  </td>
                  <td className="table-cell">
                    <span className={STATUS_CLS[c.status] || 'badge-aberta'}>{STATUS_LABEL[c.status]}</span>
                  </td>
                  <td className="table-cell text-sm" style={{ color:'var(--text-3)' }}>{c.pedidos.length}</td>
                  <td className="table-cell text-right font-bold" style={{ color:'var(--text-1)' }}>{formatCurrency(c.total)}</td>
                  <td className="table-cell text-right text-xs" style={{ color:'var(--text-3)' }}>
                    {new Date(c.createdAt).toLocaleTimeString('pt-BR',{ hour:'2-digit', minute:'2-digit' })}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setShowQR(c)} className="icon-btn" title="Ver QR Code">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                        </svg>
                      </button>
                      <a href={`/cliente/${c.qrCodeHash}`} target="_blank" rel="noopener noreferrer" className="icon-btn" title="Abrir painel cliente">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                        </svg>
                      </a>
                      {c.status !== 'PAGA' && c.status !== 'CANCELADA' && (
                        <button onClick={() => setConfirmAprovar(c)}
                          className="icon-btn"
                          title="Aprovar pagamento manual"
                          style={{ color: 'var(--success-text)' }}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Nova Comanda */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal anim-scale" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold text-lg" style={{ color:'var(--text-1)' }}>Nova Comanda</h3>
              <p className="text-sm mt-0.5" style={{ color:'var(--text-3)' }}>Gera QR Code único automaticamente</p>
            </div>
            <div className="modal-body">
              <label className="input-label">Nome do Cliente (opcional)</label>
              <input type="text" placeholder="Ex: Mesa 5 / João Silva"
                value={newNome} onChange={e => setNewNome(e.target.value)}
                className="input mb-3" autoFocus />
              <label className="input-label">Telefone (opcional — para CRM)</label>
              <input type="tel" placeholder="Ex: 11999999999"
                value={newTelefone} onChange={e => setNewTelefone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && criarComanda()}
                className="input" />
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCreate(false)} className="btn-ghost flex-1">Cancelar</button>
              <button onClick={criarComanda} disabled={creating} className="btn-primary flex-1">
                {creating
                  ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>Criando...</>
                  : '✅ Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar aprovação manual */}
      {confirmAprovar && (
        <div className="modal-overlay" onClick={() => setConfirmAprovar(null)}>
          <div className="modal anim-scale max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-body text-center py-6 space-y-3">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl"
                style={{ background:'var(--success-bg)', border:'1px solid var(--success-border)' }}>✅</div>
              <h3 className="font-bold text-lg" style={{ color:'var(--text-1)' }}>Aprovar pagamento?</h3>
              <div className="rounded-xl p-3 space-y-1" style={{ background:'var(--bg-input)' }}>
                <p className="font-mono font-bold" style={{ color:'var(--accent)' }}>#{confirmAprovar.codigo}</p>
                {confirmAprovar.clienteNome && <p className="text-sm" style={{ color:'var(--text-2)' }}>👤 {confirmAprovar.clienteNome}</p>}
                <p className="text-xl font-black" style={{ color:'var(--text-1)' }}>{formatCurrency(confirmAprovar.total)}</p>
              </div>
              <p className="text-xs" style={{ color:'var(--text-3)' }}>
                Isso vai marcar a comanda como <strong>PAGA</strong> manualmente.<br/>
                Use apenas após confirmar o comprovante do cliente.
              </p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setConfirmAprovar(null)} className="btn-ghost flex-1">Cancelar</button>
              <button onClick={() => aprovarPagamento(confirmAprovar)} disabled={aprovando}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                style={{ background:'var(--success)', color:'#fff' }}>
                {aprovando
                  ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>Aprovando...</>
                  : '✅ Confirmar pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: QR Code */}
      {showQR && (
        <div className="modal-overlay" onClick={() => setShowQR(null)}>
          <div className="modal anim-scale" style={{ maxWidth:360 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg" style={{ color:'var(--text-1)' }}>QR Code — #{showQR.codigo}</h3>
                {showQR.clienteNome && <p className="text-sm" style={{ color:'var(--text-3)' }}>👤 {showQR.clienteNome}</p>}
              </div>
              <span className={STATUS_CLS[showQR.status]}>{STATUS_LABEL[showQR.status]}</span>
            </div>
            <div className="modal-body flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-2xl shadow-xl" style={{ boxShadow:'0 0 40px var(--accent-glow)' }}>
                <QRCodeSVG value={`${baseUrl}/cliente/${showQR.qrCodeHash}`} size={200} level="H" includeMargin={false} />
              </div>
              <div className="text-center">
                <p className="text-2xl font-black" style={{ color:'var(--text-1)' }}>{formatCurrency(showQR.total)}</p>
                <p className="text-xs mt-1 font-mono" style={{ color:'var(--text-3)' }}>{showQR.qrCodeHash.substring(0,20)}…</p>
              </div>
              <div className="flex gap-2 w-full">
                <a href={`/cliente/${showQR.qrCodeHash}`} target="_blank" rel="noopener noreferrer"
                  className="btn-ghost flex-1 justify-center">Abrir</a>
                <button onClick={() => navigator.clipboard.writeText(`${baseUrl}/cliente/${showQR.qrCodeHash}`)}
                  className="btn-primary flex-1">Copiar link</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
