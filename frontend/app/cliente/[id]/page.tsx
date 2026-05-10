'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { api, formatCurrency } from '@/lib/api'
import { joinComanda, getSocket } from '@/lib/socket'
import { QRCodeSVG } from 'qrcode.react'

interface Produto { nome: string; preco: number }
interface ItemPedido { id: string; quantidade: number; precoUnit: number; subtotal: number; produto: Produto }
interface Pedido { id: string; status: string; total: number; obs?: string; createdAt: string; itens: ItemPedido[] }
interface Pagamento { id: string; status: string; metodo?: string; valor: number; pixQrCode?: string; pixQrCodeBase64?: string }
interface DivisaoConta { id: string; nome: string; valor: number; status: string; pixQrCode?: string; pixQrCodeBase64?: string; pixExpiracao?: string }
interface Comanda {
  id: string
  codigo: string
  status: string
  total: number
  saldoCredito?: number
  clienteNome?: string
  pedidos: Pedido[]
  pagamentos: Pagamento[]
  tenant: { nome: string; logoImage?: string; pixManualAtivo?: boolean; pixManualChave?: string; pixManualDescricao?: string; pixManualQrCodeImage?: string }
}

export default function ClientePage() {
  const { id: qrHash } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const [comanda, setComanda] = useState<Comanda | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payStep, setPayStep] = useState<'idle' | 'choose' | 'pix' | 'card' | 'pix-manual' | 'dividir' | 'divisoes'>('idle')
  const [payData, setPayData] = useState<any>(null)
  const [paying, setPaying] = useState(false)
  const [rechargeVal, setRechargeVal] = useState('')
  const [email, setEmail] = useState('')
  const [copied, setCopied] = useState(false)
  const [copiedPix, setCopiedPix] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const retorno = searchParams.get('pagamento')

  // Estado para dividir conta
  const [numPessoas, setNumPessoas] = useState(2)
  const [partesCustom, setPartesCustom] = useState<{ nome: string; valor: string }[]>([])
  const [modoCustom, setModoCustom] = useState(false)
  const [divisoes, setDivisoes] = useState<DivisaoConta[]>([])
  const [pagandoParte, setPagandoParte] = useState<string | null>(null)
  const [partesPix, setPartesPix] = useState<Record<string, any>>({})

  const fetchComanda = useCallback(async () => {
    try {
      const data = await api.get<Comanda>(`/comandas/qr/${qrHash}`)
      setComanda(data)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [qrHash])

  useEffect(() => { fetchComanda() }, [fetchComanda])

  useEffect(() => {
    if (!comanda) return
    joinComanda(comanda.id)
    const s = getSocket()
    s.on('comanda:atualizada', (d: any) => {
      if (d?.comanda) setComanda(d.comanda)
      else fetchComanda()
    })
    s.on('pagamento:confirmado', (d: any) => {
      fetchComanda()
      if (d.status === 'PAGA') { setPayStep('idle'); setDivisoes([]) }
      else if (d.divisaoId) {
        setDivisoes(prev => prev.map(div => div.id === d.divisaoId ? { ...div, status: 'PAGO' } : div))
      }
    })
    return () => { s.off('comanda:atualizada'); s.off('pagamento:confirmado') }
  }, [comanda?.id, fetchComanda])

  async function recarregarCarteiraPix() {
    const v = parseFloat(String(rechargeVal).replace(',', '.'))
    if (!comanda || !(v >= 1)) {
      alert('Informe um valor de recarga mínimo de R$ 1,00.')
      return
    }
    setPaying(true)
    try {
      const data = await api.post<any>('/pagamentos/recarga-carteira-pix', {
        qrHash,
        valor: v,
        email: email || undefined,
      })
      setPayData(data)
      setPayStep('pix')
    } catch (e: any) {
      alert(e.message)
    } finally {
      setPaying(false)
    }
  }

  async function pagar(metodo: 'pix' | 'card') {
    if (!comanda) return
    setPaying(true)
    try {
      const data = await api.post<any>('/pagamentos/criar', { qrHash, metodo, email: email || undefined })
      setPayData(data)
      setPayStep(metodo)
    } catch (e: any) { alert(e.message) }
    finally { setPaying(false) }
  }

  function iniciarDividir() {
    const total = comanda?.total || 0
    setNumPessoas(2)
    const valorIgual = (total / 2).toFixed(2)
    setPartesCustom([
      { nome: 'Pessoa 1', valor: valorIgual },
      { nome: 'Pessoa 2', valor: valorIgual },
    ])
    setModoCustom(false)
    setPayStep('dividir')
  }

  function atualizarNumPessoas(n: number) {
    setNumPessoas(n)
    const total = comanda?.total || 0
    const valorIgual = (total / n).toFixed(2)
    setPartesCustom(Array.from({ length: n }, (_, i) => ({ nome: `Pessoa ${i + 1}`, valor: valorIgual })))
  }

  async function confirmarDivisao() {
    if (!comanda) return
    const partes = partesCustom.map(p => ({ nome: p.nome, valor: parseFloat(p.valor) }))
    const soma = partes.reduce((s, p) => s + p.valor, 0)
    if (Math.abs(soma - comanda.total) > 0.02) {
      alert(`A soma das partes (${formatCurrency(soma)}) deve ser igual ao total (${formatCurrency(comanda.total)})`)
      return
    }
    setPaying(true)
    try {
      const res = await api.post<{ divisoes: DivisaoConta[] }>('/pagamentos/dividir', { qrHash, partes })
      setDivisoes(res.divisoes)
      setPayStep('divisoes')
    } catch (e: any) { alert(e.message) }
    finally { setPaying(false) }
  }

  async function pagarParte(divisao: DivisaoConta) {
    if (divisao.status === 'PAGO') return
    setPagandoParte(divisao.id)
    try {
      const res = await api.post<any>('/pagamentos/pagar-divisao', { divisaoId: divisao.id, email: email || undefined })
      setPartesPix(prev => ({ ...prev, [divisao.id]: res }))
      setDivisoes(prev => prev.map(d => d.id === divisao.id ? { ...d, ...res, status: 'AGUARDANDO' } : d))
    } catch (e: any) { alert(e.message) }
    finally { setPagandoParte(null) }
  }

  async function copiarPix() {
    await navigator.clipboard.writeText(payData.qrCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function copiarPartePix(idx: number, code: string) {
    await navigator.clipboard.writeText(code)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#060610] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-white/30 text-sm">Carregando comanda...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#060610] flex items-center justify-center p-6">
      <div className="text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-white mb-2">Comanda não encontrada</h2>
        <p className="text-white/30 text-sm">{error}</p>
      </div>
    </div>
  )

  if (comanda?.status === 'PAGA') return (
    <div className="min-h-screen bg-[#060610] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 rounded-3xl bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center text-5xl mb-6"
        style={{ boxShadow: '0 0 60px rgba(16,185,129,0.2)' }}>✅</div>
      <h1 className="text-3xl font-black text-emerald-400 mb-1">Tudo certo!</h1>
      <p className="text-white/40 mb-4">Comanda #{comanda.codigo} paga</p>
      <p className="text-3xl font-black text-white mb-8">{formatCurrency(comanda.total)}</p>
      {(Number(comanda.saldoCredito) || 0) > 0 && (
        <p className="text-amber-400/90 text-sm mb-6">
          Saldo carteira pré-paga: <strong>{formatCurrency(comanda.saldoCredito ?? 0)}</strong>
        </p>
      )}
      <p className="text-white/25 text-sm">Apresente sua pulseira na saída 🎉</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#060610] flex flex-col max-w-sm mx-auto">
      {/* Header */}
      <div className="px-5 pt-8 pb-5 border-b border-white/[0.05]">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {comanda?.tenant.logoImage && (
              <img src={comanda.tenant.logoImage} alt="Logo" className="w-6 h-6 object-contain rounded" />
            )}
            <span className="text-white/25 text-xs font-medium">{comanda?.tenant.nome}</span>
          </div>
          <StatusBadge status={comanda?.status || ''} />
        </div>
        <h1 className="text-xl font-black text-white">Comanda <span className="text-violet-400">#{comanda?.codigo}</span></h1>
        {comanda?.clienteNome && <p className="text-white/40 text-sm mt-0.5">👤 {comanda.clienteNome}</p>}

        {retorno === 'sucesso' && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">✅ Pagamento aprovado!</div>
        )}
        {retorno === 'falha' && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">❌ Pagamento não aprovado.</div>
        )}
      </div>

      {/* Pedidos */}
      <div className="flex-1 px-5 py-4 space-y-3 overflow-auto">
        {comanda?.pedidos.length === 0 ? (
          <div className="text-center py-12 text-white/20">
            <p className="text-4xl mb-2">🍺</p>
            <p className="text-sm">Nenhum pedido ainda...</p>
          </div>
        ) : (
          comanda?.pedidos.map((pedido) => (
            <div key={pedido.id} className="glass-card p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-white/25 text-xs">
                  {new Date(pedido.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-emerald-400 text-xs font-bold">{formatCurrency(pedido.total)}</span>
              </div>
              <div className="space-y-2">
                {pedido.itens.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-violet-500/15 text-violet-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {item.quantidade}
                      </span>
                      <span className="text-white/80 text-sm">{item.produto.nome}</span>
                    </div>
                    <span className="text-white/40 text-sm">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              {pedido.obs && <p className="mt-2.5 text-xs text-white/25 italic">📝 {pedido.obs}</p>}
            </div>
          ))
        )}
      </div>

      {/* Footer / Payment */}
      <div className="sticky bottom-0 bg-gradient-to-t from-[#060610] via-[#060610]/95 to-transparent pt-6 px-5 pb-8 space-y-3">
        {/* Total */}
        <div className="flex items-baseline justify-between">
          <span className="text-white/40 font-medium">Total consumo</span>
          <span className="text-3xl font-black text-white">{formatCurrency(comanda?.total || 0)}</span>
        </div>

        {/* Carteira pré-paga */}
        {!['PAGA', 'CANCELADA', 'BLOQUEADA'].includes(String(comanda?.status)) && (
          <div className="rounded-2xl bg-amber-500/[0.07] border border-amber-500/20 p-3 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-amber-200/70">Carteira pré-paga</span>
              <span className="font-black text-amber-400">{formatCurrency(comanda?.saldoCredito ?? 0)}</span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                step="1"
                placeholder="Valor R$"
                value={rechargeVal}
                onChange={(e) => setRechargeVal(e.target.value)}
                className="input flex-1 text-sm min-w-0"
              />
              <button
                type="button"
                onClick={recarregarCarteiraPix}
                disabled={paying}
                className="py-2.5 px-3 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-500 active:scale-95 transition-all whitespace-nowrap disabled:opacity-40"
              >
                {paying ? '…' : 'PIX'}
              </button>
            </div>
            <p className="text-[10px] text-white/25 leading-tight">Use o saldo no bar com o staff (débito na hora do pedido).</p>
          </div>
        )}

        {payStep === 'idle' && (
          <div className="space-y-2">
            <button
              onClick={() => setPayStep('choose')}
              disabled={!comanda?.total || Number(comanda.total) === 0}
              className="w-full py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 active:scale-95 transition-all disabled:opacity-30 shadow-xl shadow-violet-500/25"
            >
              💳 Pagar agora
            </button>
            {Number(comanda?.total) > 0 && (
              <button
                onClick={iniciarDividir}
                className="w-full py-3.5 rounded-2xl font-bold text-sm bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.09] active:scale-95 transition-all"
              >
                👥 Dividir conta
              </button>
            )}
          </div>
        )}

        {payStep === 'choose' && (
          <div className="space-y-2">
            <p className="text-center text-white/40 text-sm">Escolha a forma de pagamento</p>

            {/* Pix — manual OU automático, nunca os dois */}
            {comanda?.tenant.pixManualAtivo && (comanda.tenant.pixManualChave || comanda.tenant.pixManualQrCodeImage) ? (
              <button onClick={() => setPayStep('pix-manual')}
                className="w-full py-4 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all shadow-lg shadow-emerald-500/20">
                ⚡ Pagar com Pix
              </button>
            ) : (
              <>
                <input
                  type="email"
                  placeholder="Seu e-mail (opcional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input text-sm"
                />
                <button onClick={() => pagar('pix')} disabled={paying}
                  className="w-full py-4 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                  {paying ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : null}
                  ⚡ Pagar com Pix
                </button>
              </>
            )}

            <button onClick={() => pagar('card')} disabled={paying}
              className="w-full py-3.5 rounded-2xl font-bold bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.09] active:scale-95 transition-all">
              💳 Cartão de Crédito
            </button>
            <button onClick={() => setPayStep('idle')} className="w-full py-2.5 text-white/30 text-sm hover:text-white/50 transition-colors">
              Cancelar
            </button>
          </div>
        )}

        {payStep === 'pix' && payData && (
          <div className="space-y-3 text-center">
            <p className="text-emerald-400 font-bold">
              {payData.tipo === 'recarga_pix' ? '⚡ PIX — recarga da carteira' : '⚡ Pix Gerado!'}
            </p>
            {payData.qrCodeBase64 && (
              <div className="flex justify-center">
                <div className="p-3 bg-white rounded-2xl">
                  <img src={`data:image/png;base64,${payData.qrCodeBase64}`} alt="Pix QR" className="w-44 h-44" />
                </div>
              </div>
            )}
            {payData.expiracao && (
              <p className="text-white/30 text-xs">
                Expira às {new Date(payData.expiracao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            <button onClick={copiarPix}
              className="w-full py-3.5 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all">
              {copied ? '✅ Código copiado!' : '📋 Copiar código Pix'}
            </button>
            <button onClick={() => setPayStep('choose')} className="w-full py-2 text-white/30 text-sm">Voltar</button>
          </div>
        )}

        {payStep === 'card' && payData && <CardRedirect data={payData} />}

        {/* ── PIX MANUAL ── */}
        {payStep === 'pix-manual' && comanda?.tenant.pixManualAtivo && (
          <div className="space-y-4 text-center">
            <div>
              <p className="text-teal-400 font-bold text-base mb-0.5">🏦 Pix Manual</p>
              {comanda.tenant.pixManualDescricao && (
                <p className="text-white/40 text-xs">{comanda.tenant.pixManualDescricao}</p>
              )}
            </div>

            {/* QR Code — imagem uploaded ou gerado da chave */}
            <div className="flex justify-center">
              {comanda.tenant.pixManualQrCodeImage ? (
                <div className="p-3 bg-white rounded-2xl shadow-xl shadow-teal-500/20">
                  <img
                    src={comanda.tenant.pixManualQrCodeImage}
                    alt="QR Code Pix"
                    className="w-52 h-52 object-contain"
                  />
                </div>
              ) : (
                <div className="p-4 bg-white rounded-2xl shadow-xl shadow-teal-500/20">
                  <QRCodeSVG
                    value={comanda.tenant.pixManualChave!}
                    size={200}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              )}
            </div>

            <p className="text-white/30 text-xs">
              Escaneie o QR code no app do seu banco
            </p>

            {/* Valor de referência */}
            <div className="rounded-2xl px-4 py-2 border border-teal-500/20 bg-teal-500/10">
              <p className="text-white/40 text-xs">Valor a pagar</p>
              <p className="text-white font-black text-2xl">{formatCurrency(comanda.total)}</p>
            </div>

            {/* Chave copiável — só mostra se tiver chave cadastrada */}
            {comanda.tenant.pixManualChave && (
              <>
                <div className="text-left rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2">
                  <p className="text-white/30 text-[10px] mb-1">Ou copie a chave:</p>
                  <p className="text-white/70 font-mono text-xs break-all">{comanda.tenant.pixManualChave}</p>
                </div>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(comanda.tenant.pixManualChave!)
                    setCopiedPix(true)
                    setTimeout(() => setCopiedPix(false), 2500)
                  }}
                  className="w-full py-3.5 rounded-2xl font-bold bg-teal-600 hover:bg-teal-500 active:scale-95 transition-all">
                  {copiedPix ? '✅ Chave copiada!' : '📋 Copiar chave Pix'}
                </button>
              </>
            )}

            <p className="text-white/20 text-xs">
              Após pagar, mostre o comprovante ao atendente.<br/>
              Ele vai aprovar seu pagamento.
            </p>

            <button onClick={() => setPayStep('choose')} className="w-full py-2 text-white/30 text-sm">← Voltar</button>
          </div>
        )}

        {/* ── DIVIDIR CONTA ── */}
        {payStep === 'dividir' && (
          <div className="space-y-3">
            <p className="text-center text-white/60 text-sm font-semibold">👥 Dividir conta</p>
            <p className="text-center text-white/30 text-xs">Total: {formatCurrency(comanda?.total || 0)}</p>

            {/* Quantidade de pessoas */}
            <div className="flex items-center justify-center gap-3">
              {[2,3,4,5,6].map(n => (
                <button key={n} onClick={() => atualizarNumPessoas(n)}
                  className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${numPessoas === n ? 'bg-violet-600 text-white' : 'bg-white/10 text-white/50'}`}>
                  {n}
                </button>
              ))}
            </div>

            {/* Nomes e valores */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {partesCustom.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={p.nome}
                    onChange={e => setPartesCustom(prev => prev.map((x, j) => j === i ? { ...x, nome: e.target.value } : x))}
                    className="input flex-1 text-sm"
                    placeholder={`Pessoa ${i + 1}`}
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={p.valor}
                    onChange={e => setPartesCustom(prev => prev.map((x, j) => j === i ? { ...x, valor: e.target.value } : x))}
                    className="input w-24 text-sm text-right"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-white/30">Soma das partes</span>
              <span className={Math.abs(partesCustom.reduce((s,p) => s + parseFloat(p.valor||'0'), 0) - (comanda?.total||0)) < 0.02 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                {formatCurrency(partesCustom.reduce((s,p) => s + parseFloat(p.valor||'0'), 0))}
              </span>
            </div>

            <button onClick={confirmarDivisao} disabled={paying}
              className="w-full py-4 rounded-2xl font-bold bg-violet-600 hover:bg-violet-500 active:scale-95 transition-all flex items-center justify-center gap-2">
              {paying ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : '✂️ Confirmar divisão'}
            </button>
            <button onClick={() => setPayStep('idle')} className="w-full py-2 text-white/30 text-sm">Cancelar</button>
          </div>
        )}

        {/* ── PARTES INDIVIDUAIS ── */}
        {payStep === 'divisoes' && (
          <div className="space-y-3">
            <p className="text-center text-white/60 text-sm font-semibold">💳 Pagamento dividido</p>
            <div className="space-y-2">
              {divisoes.map((d, i) => {
                const pixData = partesPix[d.id]
                const isPago = d.status === 'PAGO'
                const isAguardando = d.status === 'AGUARDANDO'
                return (
                  <div key={d.id} className={`rounded-2xl p-3 border transition-all ${isPago ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-white/10 bg-white/[0.04]'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/80 font-semibold text-sm">{d.nome}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-black text-sm">{formatCurrency(d.valor)}</span>
                        {isPago && <span className="text-emerald-400 text-xs font-bold">✅ Pago</span>}
                      </div>
                    </div>

                    {!isPago && !pixData && (
                      <button onClick={() => pagarParte(d)} disabled={pagandoParte === d.id}
                        className="w-full py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2">
                        {pagandoParte === d.id ? <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : '⚡ Gerar Pix'}
                      </button>
                    )}

                    {pixData && !isPago && (
                      <div className="space-y-2">
                        {pixData.qrCodeBase64 && (
                          <div className="flex justify-center">
                            <div className="p-2 bg-white rounded-xl">
                              <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="Pix" className="w-32 h-32" />
                            </div>
                          </div>
                        )}
                        <button onClick={() => copiarPartePix(i, pixData.qrCode)}
                          className="w-full py-2 rounded-xl text-xs font-bold bg-emerald-600/80 hover:bg-emerald-500/80 transition-all">
                          {copiedIdx === i ? '✅ Copiado!' : '📋 Copiar Pix'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <button onClick={() => setPayStep('idle')} className="w-full py-2 text-white/30 text-sm">← Voltar</button>
          </div>
        )}
      </div>
    </div>
  )
}

function CardRedirect({ data }: { data: any }) {
  useEffect(() => {
    const url = process.env.NODE_ENV === 'production' ? data.checkoutUrl : data.sandboxUrl
    if (url) setTimeout(() => { window.location.href = url }, 1500)
  }, [data])
  return (
    <div className="text-center py-4">
      <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mx-auto mb-3" />
      <p className="text-violet-400 font-medium text-sm">Redirecionando para o pagamento...</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    ABERTA: { cls: 'badge-aberta', label: 'Aberta' },
    AGUARDANDO_PAGAMENTO: { cls: 'badge-aguardando', label: 'Aguardando' },
    PAGA: { cls: 'badge-paga', label: 'Paga' },
    BLOQUEADA: { cls: 'badge-bloqueada', label: 'Bloqueada' },
  }
  const s = map[status] || map.ABERTA
  return <span className={s.cls}>{s.label}</span>
}
