'use client'

import { useEffect, useState, useRef } from 'react'
import { api, formatCurrency } from '@/lib/api'

interface Resultado {
  valida: boolean; status: string; mensagem: string
  comanda?: { id: string; codigo: string; total: number }
}

export default function SaidaPage() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [camMode, setCamMode] = useState(false)
  const scannerRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => {
    if (camMode) startScanner(); else stopScanner()
    return () => stopScanner()
  }, [camMode])

  async function startScanner() {
    try {
      const { Html5QrcodeScanner } = await import('html5-qrcode')
      if (scannerRef.current) return
      scannerRef.current = new Html5QrcodeScanner('qr-cam', { fps: 10, qrbox: 240, aspectRatio: 1 }, false)
      scannerRef.current.render((text: string) => { stopScanner(); setCamMode(false); const h = extract(text); setInput(h); validar(h) }, () => {})
    } catch {}
  }

  function stopScanner() {
    if (scannerRef.current) { scannerRef.current.clear().catch(() => {}); scannerRef.current = null }
  }

  function extract(text: string): string {
    try { const u = new URL(text); const p = u.pathname.split('/'); return p[p.length - 1] } catch { return text.trim() }
  }

  async function validar(hash?: string) {
    const h = extract(hash || input)
    if (!h) return
    setLoading(true); setResultado(null)
    try { setResultado(await api.get<Resultado>(`/comandas/validar/${h}`)) }
    catch (e: any) { setResultado({ valida: false, status: 'ERROR', mensagem: e.message }) }
    finally { setLoading(false) }
  }

  function reset() { setResultado(null); setInput(''); setTimeout(() => inputRef.current?.focus(), 100) }

  if (resultado) {
    const ok = resultado.valida
    return (
      <div className="max-w-lg mx-auto anim-scale">
        <div className="card overflow-hidden" style={{
          borderColor: ok ? 'var(--success-border)' : 'var(--danger-border)',
          boxShadow: ok ? '0 0 80px var(--success-glow)' : '0 0 80px var(--danger-glow)',
        }}>
          <div className="h-2" style={{ background: ok ? 'linear-gradient(90deg,var(--success),#06b6d4)' : 'linear-gradient(90deg,var(--danger),#be123c)' }} />
          <div className="p-10 text-center">
            <div className="w-28 h-28 rounded-3xl mx-auto mb-6 flex items-center justify-center text-6xl"
              style={{
                background: ok ? 'var(--success-subtle)' : 'var(--danger-subtle)',
                border: `2px solid ${ok ? 'var(--success-border)' : 'var(--danger-border)'}`,
                boxShadow: ok ? '0 0 60px var(--success-glow)' : '0 0 60px var(--danger-glow)',
              }}>
              {ok ? '✅' : '🚫'}
            </div>
            <h2 className="text-5xl font-black mb-3" style={{ color: ok ? 'var(--success-text)' : 'var(--danger-text)' }}>
              {ok ? 'LIBERADO' : 'BLOQUEADO'}
            </h2>
            <p className="text-base mb-6" style={{ color: 'var(--text-2)' }}>{resultado.mensagem}</p>
            {resultado.comanda && (
              <div className="inline-flex flex-col items-center gap-1.5 px-8 py-4 rounded-2xl mb-8"
                style={{ background: ok ? 'var(--success-subtle)' : 'var(--danger-subtle)', border: `1px solid ${ok ? 'var(--success-border)' : 'var(--danger-border)'}` }}>
                <span className="font-mono font-bold text-xl" style={{ color: 'var(--text-1)' }}>#{resultado.comanda.codigo}</span>
                <span className="text-3xl font-black" style={{ color: ok ? 'var(--success-text)' : 'var(--danger-text)' }}>
                  {formatCurrency(resultado.comanda.total)}
                </span>
              </div>
            )}
            <button onClick={reset} className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all active:scale-95"
              style={{ background: ok ? 'var(--success)' : 'var(--danger)', boxShadow: ok ? '0 8px 24px var(--success-glow)' : '0 8px 24px var(--danger-glow)' }}>
              Próxima Validação →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-6">
      <div className="dash-page-hero anim-up">
        <p className="dash-hero-kicker">Portaria</p>
        <h1 className="dash-hero-title">Saída segura</h1>
        <p className="section-sub mt-2">Valide pulseira ou QR em segundos</p>
      </div>

      <div className="flex gap-1 p-1 rounded-2xl anim-up stagger-1" style={{ background: 'var(--bg-input)' }}>
        {[{ k: false, label: '⌨️ Código Manual' }, { k: true, label: '📷 Câmera QR' }].map(opt => (
          <button key={String(opt.k)} onClick={() => setCamMode(opt.k)}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
            style={camMode === opt.k
              ? { background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 12px var(--accent-glow)' }
              : { color: 'var(--text-2)' }}>
            {opt.label}
          </button>
        ))}
      </div>

      {!camMode ? (
        <div className="card p-6 space-y-4 anim-up stagger-2">
          <div>
            <label className="input-label">Link ou Hash do QR Code</label>
            <input ref={inputRef} type="text" placeholder="Cole o link ou hash da comanda..."
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && validar()}
              className="input font-mono" />
          </div>
          <button onClick={() => validar()} disabled={!input.trim() || loading} className="btn-primary w-full justify-center">
            {loading
              ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Validando...</>
              : '🔍 Validar Comanda'}
          </button>
        </div>
      ) : (
        <div className="card p-4 anim-up stagger-2">
          <p className="text-sm text-center mb-4" style={{ color: 'var(--text-3)' }}>Aponte para o QR Code da pulseira</p>
          <div id="qr-cam" className="rounded-2xl overflow-hidden" />
        </div>
      )}

      <div className="card p-4 flex items-start gap-3 anim-up stagger-3">
        <span className="text-xl mt-0.5">💡</span>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>Atalho rápido</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
            Use um leitor de QR externo e cole o resultado aqui. Funciona com qualquer scanner Bluetooth.
          </p>
        </div>
      </div>
    </div>
  )
}
