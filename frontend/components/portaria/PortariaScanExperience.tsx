'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { formatCurrency } from '@/lib/api'
import { validarPortaria, type PortariaValidacaoResult } from '@/lib/portaria'

type Variant = 'dashboard' | 'standalone'

export function PortariaScanExperience({ variant }: { variant: Variant }) {
  const regionIdRef = useRef<string>(
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? `portaria-qr-${crypto.randomUUID()}`
      : `portaria-qr-${Math.random().toString(36).slice(2)}`,
  )
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => Promise<void> } | null>(null)
  const lastDecodeMs = useRef(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [input, setInput] = useState('')
  const [camMode, setCamMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [camError, setCamError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<PortariaValidacaoResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const stopCam = useCallback(async () => {
    const q = scannerRef.current as any
    scannerRef.current = null
    if (!q) return
    try {
      await q.stop()
    } catch {
      /* já parado */
    }
    try {
      await q.clear()
    } catch {
      /* */
    }
  }, [])

  const validar = useCallback(async (raw: string) => {
    const t = raw.trim()
    if (t.length < 2) return
    setLoading(true)
    setCamError(null)
    setResultado(null)
    try {
      const r = await validarPortaria(t)
      setResultado(r)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao validar'
      setResultado({ valida: false, status: 'ERROR', mensagem: msg })
    } finally {
      setLoading(false)
    }
  }, [])

  const startCam = useCallback(async () => {
    await stopCam()
    const id = regionIdRef.current
    if (!document.getElementById(id)) return
    setCamError(null)
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const qr = new Html5Qrcode(id, /* verbose */ false)
      scannerRef.current = qr as any
      await qr.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: (vw, vh) => {
            const m = Math.min(vw, vh)
            const s = Math.min(Math.floor(m * 0.72), 320)
            return { width: s, height: s }
          },
          aspectRatio: 1,
        },
        async (decodedText: string) => {
          const now = Date.now()
          if (now - lastDecodeMs.current < 800) return
          lastDecodeMs.current = now
          await stopCam()
          setCamMode(false)
          setInput(decodedText)
          await validar(decodedText)
        },
        () => {},
      )
    } catch (e: unknown) {
      const name = e && typeof e === 'object' && 'name' in e ? String((e as Error).name) : ''
      const msg = e instanceof Error ? e.message : ''
      const denied =
        name === 'NotAllowedError' ||
        /permission/i.test(msg) ||
        /NotAllowedError/i.test(msg)
      setCamError(
        denied
          ? 'Câmera bloqueada. Permita o acesso nas configurações do navegador, ou use código manual / foto do QR.'
          : 'Não foi possível usar a câmera neste dispositivo. Use código manual ou envie uma foto do QR.',
      )
      setCamMode(false)
      await stopCam()
    }
  }, [stopCam, validar])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!camMode) {
      void stopCam()
      return
    }
    const t = window.setTimeout(() => void startCam(), 150)
    return () => {
      clearTimeout(t)
      void stopCam()
    }
  }, [camMode, startCam, stopCam])

  useEffect(() => {
    return () => {
      void stopCam()
    }
  }, [stopCam])

  const fileSinkId = `${regionIdRef.current}-fs`

  async function onPickFile(f: FileList | null) {
    const file = f?.[0]
    if (!file) return
    setCamError(null)
    setLoading(true)
    setResultado(null)
    await stopCam()
    try {
      if (!document.getElementById(fileSinkId)) {
        setCamError('Recarregue a página e tente novamente.')
        return
      }
      const { Html5Qrcode } = await import('html5-qrcode')
      const qr = new Html5Qrcode(fileSinkId, false)
      try {
        const text = await qr.scanFile(file, false)
        setInput(text)
        await validar(text)
      } finally {
        try {
          await Promise.resolve(qr.clear())
        } catch {
          /* */
        }
      }
    } catch {
      setCamError('Não encontramos um QR Code nesta imagem. Tente outra foto ou digite o código.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setResultado(null)
    setInput('')
    setCamError(null)
    window.setTimeout(() => inputRef.current?.focus(), 100)
  }

  const isDash = variant === 'dashboard'

  if (resultado) {
    const ok = resultado.valida
    if (isDash) {
      return (
        <div className="max-w-lg mx-auto anim-scale">
          <div
            className="card overflow-hidden"
            style={{
              borderColor: ok ? 'var(--success-border)' : 'var(--danger-border)',
              boxShadow: ok ? '0 0 80px var(--success-glow)' : '0 0 80px var(--danger-glow)',
            }}
          >
            <div
              className="h-2"
              style={{
                background: ok
                  ? 'linear-gradient(90deg,var(--success),#06b6d4)'
                  : 'linear-gradient(90deg,var(--danger),#be123c)',
              }}
            />
            <div className="p-10 text-center">
              <div
                className="w-28 h-28 rounded-3xl mx-auto mb-6 flex items-center justify-center text-6xl"
                style={{
                  background: ok ? 'var(--success-subtle)' : 'var(--danger-subtle)',
                  border: `2px solid ${ok ? 'var(--success-border)' : 'var(--danger-border)'}`,
                  boxShadow: ok ? '0 0 60px var(--success-glow)' : '0 0 60px var(--danger-glow)',
                }}
              >
                {ok ? '✅' : '🚫'}
              </div>
              <h2
                className="text-5xl font-black mb-3"
                style={{ color: ok ? 'var(--success-text)' : 'var(--danger-text)' }}
              >
                {ok ? 'LIBERADO' : 'BLOQUEADO'}
              </h2>
              <p className="text-base mb-6" style={{ color: 'var(--text-2)' }}>
                {resultado.mensagem}
              </p>
              {resultado.comanda && (
                <div
                  className="inline-flex flex-col items-center gap-1.5 px-8 py-4 rounded-2xl mb-8"
                  style={{
                    background: ok ? 'var(--success-subtle)' : 'var(--danger-subtle)',
                    border: `1px solid ${ok ? 'var(--success-border)' : 'var(--danger-border)'}`,
                  }}
                >
                  <span className="font-mono font-bold text-xl" style={{ color: 'var(--text-1)' }}>
                    #{resultado.comanda.codigo}
                  </span>
                  <span
                    className="text-3xl font-black"
                    style={{ color: ok ? 'var(--success-text)' : 'var(--danger-text)' }}
                  >
                    {formatCurrency(resultado.comanda.total)}
                  </span>
                </div>
              )}
              <button
                onClick={reset}
                className="w-full py-4 rounded-2xl font-bold text-lg text-white transition-all active:scale-95"
                style={{
                  background: ok ? 'var(--success)' : 'var(--danger)',
                  boxShadow: ok ? '0 8px 24px var(--success-glow)' : '0 8px 24px var(--danger-glow)',
                }}
              >
                Próxima Validação →
              </button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors ${
          ok ? 'bg-emerald-950' : 'bg-red-950'
        }`}
      >
        <div
          className={`w-32 h-32 rounded-full flex items-center justify-center text-7xl mb-6 border-4 ${
            ok
              ? 'bg-emerald-500/30 border-emerald-400 shadow-2xl shadow-emerald-500/50'
              : 'bg-red-500/30 border-red-400 shadow-2xl shadow-red-500/50'
          }`}
        >
          {ok ? '✅' : '🚫'}
        </div>
        <h1 className={`text-4xl font-black mb-3 ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
          {ok ? 'LIBERADO' : 'BLOQUEADO'}
        </h1>
        <p className={`text-lg text-center mb-2 ${ok ? 'text-emerald-200' : 'text-red-200'}`}>
          {resultado.mensagem}
        </p>
        {resultado.comanda && (
          <div
            className={`mt-4 p-4 rounded-2xl border text-center ${
              ok ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            <p className="text-white font-bold">#{resultado.comanda.codigo}</p>
            <p className={`text-2xl font-black ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(resultado.comanda.total)}
            </p>
          </div>
        )}
        <button
          onClick={reset}
          className={`mt-8 w-full max-w-xs py-4 rounded-2xl font-bold text-lg active:scale-95 transition-all ${
            ok ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
          }`}
        >
          Próximo →
        </button>
      </div>
    )
  }

  if (isDash) {
    return (
      <>
        <div id={fileSinkId} className="fixed left-0 top-0 -z-10 h-px w-px overflow-hidden opacity-0" aria-hidden />
        <div className="max-w-lg mx-auto space-y-6 pb-6">
        <div className="dash-page-hero anim-up">
          <p className="dash-hero-kicker">Portaria</p>
          <h1 className="dash-hero-title">Saída segura</h1>
          <p className="section-sub mt-2">
            Código da pulseira (#XXXXXX), link da comanda ou QR da página do cliente
          </p>
        </div>

        <div
          className="flex gap-1 p-1 rounded-2xl anim-up stagger-1"
          style={{ background: 'var(--bg-input)' }}
        >
          {[
            { k: false, label: '⌨️ Manual / código' },
            { k: true, label: '📷 Câmera' },
          ].map((opt) => (
            <button
              key={String(opt.k)}
              type="button"
              onClick={() => {
                setCamMode(opt.k)
                setCamError(null)
              }}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
              style={
                camMode === opt.k
                  ? { background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 12px var(--accent-glow)' }
                  : { color: 'var(--text-2)' }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>

        {!camMode ? (
          <div className="card p-6 space-y-4 anim-up stagger-2">
            <div>
              <label className="input-label">Código, link ou texto do scanner</label>
              <input
                ref={inputRef}
                type="text"
                placeholder="Ex: ABC12X ou cole https://…/cliente/…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void validar(input)}
                className="input font-mono"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <button
              type="button"
              onClick={() => void validar(input)}
              disabled={input.trim().length < 2 || loading}
              className="btn-primary w-full justify-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Validando...
                </>
              ) : (
                '🔍 Validar comanda'
              )}
            </button>

            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => {
                  void onPickFile(e.target.files)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: 'var(--bg-input)',
                  color: 'var(--text-2)',
                  border: '1px solid var(--border)',
                }}
              >
                🖼️ Ler QR de uma foto (screenshot / galeria)
              </button>
            </div>

            {camError && (
              <p className="text-sm rounded-xl px-3 py-2" style={{ background: 'var(--danger-subtle)', color: 'var(--danger-text)' }}>
                {camError}
              </p>
            )}
          </div>
        ) : (
          <div className="card p-4 anim-up stagger-2 space-y-3">
            <p className="text-sm text-center" style={{ color: 'var(--text-3)' }}>
              Aponte para o QR da página do cliente (menu digital). Boa luz ajuda o foco.
            </p>
            <div
              id={regionIdRef.current}
              className="rounded-2xl overflow-hidden min-h-[280px] bg-black/40"
            />
            {camError && (
              <p className="text-sm rounded-xl px-3 py-2" style={{ background: 'var(--danger-subtle)', color: 'var(--danger-text)' }}>
                {camError}
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setCamMode(false)
                void stopCam()
              }}
              className="w-full py-3 rounded-xl font-semibold text-sm"
              style={{ background: 'var(--bg-input)', color: 'var(--text-2)' }}
            >
              Voltar ao modo manual
            </button>
          </div>
        )}

        <div className="card p-4 flex items-start gap-3 anim-up stagger-3">
          <span className="text-xl mt-0.5">💡</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
              Scanner Bluetooth / leitor de código
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
              Foque o campo manual e escaneie: o texto vai direto. Aceita código da pulseira ou URL completa.
            </p>
          </div>
        </div>
        </div>
      </>
    )
  }

  /* standalone */
  return (
    <>
      <div id={fileSinkId} className="fixed left-0 top-0 -z-10 h-px w-px overflow-hidden opacity-0" aria-hidden />
      <div className="flex-1 p-4 space-y-4">
      <div className="flex rounded-2xl overflow-hidden border border-[#22222e]">
        <button
          type="button"
          onClick={() => {
            setCamMode(false)
            setCamError(null)
          }}
          className={`flex-1 py-3 text-sm font-bold transition-all ${
            !camMode ? 'bg-violet-600 text-white' : 'bg-[#111118] text-gray-500'
          }`}
        >
          ⌨️ Manual
        </button>
        <button
          type="button"
          onClick={() => {
            setCamMode(true)
            setCamError(null)
          }}
          className={`flex-1 py-3 text-sm font-bold transition-all ${
            camMode ? 'bg-violet-600 text-white' : 'bg-[#111118] text-gray-500'
          }`}
        >
          📷 Câmera
        </button>
      </div>

      {!camMode ? (
        <div className="space-y-3">
          <p className="text-gray-400 text-sm text-center">
            Código da pulseira (#XXXXXX), link da comanda ou texto colado do scanner
          </p>
          <input
            ref={inputRef}
            type="text"
            placeholder="ABC12X ou https://…/cliente/…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void validar(input)}
            className="w-full bg-[#111118] border border-[#22222e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 font-mono text-sm"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="button"
            onClick={() => void validar(input)}
            disabled={input.trim().length < 2 || loading}
            className="btn-primary"
          >
            {loading ? '⌛ Validando...' : '🔍 Validar'}
          </button>

          <label className="block">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                void onPickFile(e.target.files)
                e.target.value = ''
              }}
            />
            <span className="flex w-full cursor-pointer justify-center py-3 rounded-xl border border-[#22222e] bg-[#111118] text-gray-300 text-sm font-semibold">
              🖼️ Foto do QR (galeria)
            </span>
          </label>

          {camError && <p className="text-red-400 text-sm text-center">{camError}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-gray-400 text-sm text-center">Use a câmera traseira em boa iluminação</p>
          <div id={regionIdRef.current} className="rounded-2xl overflow-hidden border border-[#22222e] min-h-[280px] bg-black/50" />
          {camError && <p className="text-red-400 text-sm text-center">{camError}</p>}
          <button
            type="button"
            onClick={() => {
              setCamMode(false)
              void stopCam()
            }}
            className="w-full py-3 rounded-xl bg-[#111118] text-gray-400 text-sm font-semibold border border-[#22222e]"
          >
            Voltar ao manual
          </button>
        </div>
      )}
      </div>
    </>
  )
}
