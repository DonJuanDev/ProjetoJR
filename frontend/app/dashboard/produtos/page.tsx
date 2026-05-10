'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, formatCurrency } from '@/lib/api'

interface Produto { id: string; nome: string; preco: number; categoria: string; descricao?: string; ativo: boolean }

const CATEGORIAS = ['Bebidas','Drinks','Destilados','Sem Álcool','Comida','Outros']
const CAT_ICON: Record<string,string> = { Bebidas:'🍺', Drinks:'🍹', Destilados:'🥃', 'Sem Álcool':'💧', Comida:'🍟', Outros:'✨' }

const formVazio = { nome:'', preco:'', categoria:'Bebidas', descricao:'' }

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Produto | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(formVazio)
  const [filterCat, setFilterCat] = useState('Todas')
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<Produto | null>(null)

  const fetchProdutos = useCallback(async () => {
    try { setProdutos(await api.get<Produto[]>('/produtos/todos')) }
    catch { setProdutos(await api.get<Produto[]>('/produtos')) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchProdutos() }, [fetchProdutos])

  function abrirNovo() {
    setEditando(null)
    setForm(formVazio)
    setShowForm(true)
  }

  function abrirEditar(p: Produto) {
    setEditando(p)
    setForm({ nome: p.nome, preco: String(p.preco), categoria: p.categoria, descricao: p.descricao || '' })
    setShowForm(true)
  }

  async function salvar() {
    if (!form.nome.trim() || !form.preco) return
    setSaving(true)
    try {
      const payload = { nome: form.nome.trim(), preco: parseFloat(form.preco), categoria: form.categoria, descricao: form.descricao || undefined }
      if (editando) {
        await api.patch(`/produtos/${editando.id}`, payload)
      } else {
        await api.post('/produtos', payload)
      }
      setShowForm(false)
      fetchProdutos()
    } catch (e: any) { alert(e.message) } finally { setSaving(false) }
  }

  async function toggleAtivo(p: Produto) {
    try {
      await api.patch(`/produtos/${p.id}`, { ativo: !p.ativo })
      fetchProdutos()
    } catch (e: any) { alert(e.message) }
  }

  async function confirmarRemover(p: Produto) {
    try {
      await api.delete(`/produtos/${p.id}`)
      setConfirmDelete(null)
      fetchProdutos()
    } catch (e: any) { alert(e.message) }
  }

  const ativos = produtos.filter(p => p.ativo)
  const inativos = produtos.filter(p => !p.ativo)
  const categorias = ['Todas', ...Array.from(new Set(ativos.map(p => p.categoria)))]
  const filtered = ativos.filter(p =>
    (filterCat === 'Todas' || p.categoria === filterCat) &&
    (!search || p.nome.toLowerCase().includes(search.toLowerCase()))
  )
  const porCategoria = filtered.reduce<Record<string,Produto[]>>((acc,p) => {
    if (!acc[p.categoria]) acc[p.categoria] = []; acc[p.categoria].push(p); return acc
  }, {})

  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between anim-up">
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>
          {ativos.length} ativo(s){inativos.length > 0 ? ` · ${inativos.length} pausado(s)` : ''}
        </p>
        <button type="button" onClick={abrirNovo} className="btn-primary shrink-0 self-start sm:self-center inline-flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
          Novo produto
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 anim-up stagger-1">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color:'var(--text-3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
          </svg>
          <input type="search" placeholder="Buscar produto..." value={search}
            onChange={e => setSearch(e.target.value)} className="input w-full rounded-full border-transparent py-3 pl-10" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {categorias.map(c => (
            <button key={c} type="button" onClick={() => setFilterCat(c)} className="dash-chip shrink-0" data-active={filterCat === c}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de produtos */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {[...Array(8)].map((_,i) => <div key={i} className="card h-28 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-6 anim-up stagger-2">
          {Object.entries(porCategoria).map(([cat, prods]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{CAT_ICON[cat] || '✨'}</span>
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color:'var(--text-3)' }}>{cat}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:'var(--bg-input)', color:'var(--text-3)' }}>{prods.length}</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {prods.map((p, i) => (
                  <div key={p.id} className="card card-hover p-4 transition-all group" style={{ animationDelay:`${i*30}ms` }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
                        style={{ background:'var(--accent-subtle)', border:'1px solid var(--accent-border)' }}>
                        {CAT_ICON[p.categoria] || '🍺'}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => abrirEditar(p)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ background:'var(--bg-input)', color:'var(--text-2)' }}
                          title="Editar">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                          </svg>
                        </button>
                        <button onClick={() => setConfirmDelete(p)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ background:'var(--danger-bg)', color:'var(--danger-text)' }}
                          title="Desativar">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm font-semibold leading-tight mb-0.5" style={{ color:'var(--text-1)' }}>{p.nome}</p>
                    {p.descricao && <p className="text-xs mb-1 truncate" style={{ color:'var(--text-3)' }}>{p.descricao}</p>}
                    <p className="text-lg font-black" style={{ color:'var(--accent)' }}>{formatCurrency(p.preco)}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="card p-16 text-center" style={{ color:'var(--text-3)' }}>
              <p className="text-4xl mb-3">🍺</p>
              <p className="text-sm font-semibold" style={{ color:'var(--text-2)' }}>Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      )}

      {/* Produtos inativos */}
      {inativos.length > 0 && (
        <div className="anim-up stagger-3">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color:'var(--text-3)' }}>Inativos</h3>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background:'var(--bg-input)', color:'var(--text-3)' }}>{inativos.length}</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {inativos.filter(p => !search || p.nome.toLowerCase().includes(search.toLowerCase())).map(p => (
              <div key={p.id} className="card p-4 opacity-50 group hover:opacity-80 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl grayscale"
                    style={{ background:'var(--bg-input)' }}>
                    {CAT_ICON[p.categoria] || '✨'}
                  </div>
                  <button onClick={() => toggleAtivo(p)}
                    className="text-xs px-2 py-1 rounded-lg font-semibold opacity-0 group-hover:opacity-100 transition-all"
                    style={{ background:'var(--success-bg)', color:'var(--success-text)' }}>
                    Reativar
                  </button>
                </div>
                <p className="text-sm font-semibold leading-tight line-through" style={{ color:'var(--text-3)' }}>{p.nome}</p>
                <p className="text-sm font-bold mt-0.5" style={{ color:'var(--text-3)' }}>{formatCurrency(p.preco)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal criar/editar */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal anim-scale" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-bold text-lg" style={{ color:'var(--text-1)' }}>
                {editando ? '✏️ Editar Produto' : '➕ Novo Produto'}
              </h3>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label className="input-label">Nome</label>
                <input type="text" placeholder="Ex: Cerveja Long Neck"
                  value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  className="input" autoFocus />
              </div>
              <div>
                <label className="input-label">Preço (R$)</label>
                <input type="number" step="0.01" min="0" placeholder="0,00"
                  value={form.preco} onChange={e => setForm(f => ({ ...f, preco: e.target.value }))}
                  className="input" />
              </div>
              <div>
                <label className="input-label">Descrição (opcional)</label>
                <input type="text" placeholder="Ex: 355ml gelada"
                  value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  className="input" />
              </div>
              <div>
                <label className="input-label">Categoria</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {CATEGORIAS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, categoria: c }))}
                      className="py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1"
                      style={form.categoria === c
                        ? { background:'var(--accent)', color:'#fff', boxShadow:'0 4px 12px var(--accent-glow)' }
                        : { background:'var(--bg-input)', border:'1px solid var(--border)', color:'var(--text-2)' }}>
                      <span>{CAT_ICON[c]}</span> {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancelar</button>
              <button onClick={salvar} disabled={saving || !form.nome.trim() || !form.preco} className="btn-primary flex-1">
                {saving
                  ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>Salvando...</>
                  : editando ? '✅ Salvar alterações' : '✅ Criar produto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar desativação */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal anim-scale max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-body text-center py-6">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="font-bold text-lg mb-1" style={{ color:'var(--text-1)' }}>Desativar produto?</h3>
              <p className="text-sm mb-1" style={{ color:'var(--text-2)' }}>{confirmDelete.nome}</p>
              <p className="text-xs" style={{ color:'var(--text-3)' }}>O produto ficará invisível no cardápio, mas pode ser reativado depois.</p>
            </div>
            <div className="modal-footer">
              <button onClick={() => setConfirmDelete(null)} className="btn-ghost flex-1">Cancelar</button>
              <button onClick={() => confirmarRemover(confirmDelete)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all"
                style={{ background:'var(--danger)', color:'#fff' }}>
                Desativar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
