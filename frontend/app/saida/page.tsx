'use client'

import { useEffect, useState, useRef } from 'react'
import { api, formatCurrency } from '@/lib/api'
import { login, logout, getUser, type AuthUser } from '@/lib/auth'

interface ValidacaoResult {
  valida: boolean
  status: string
  mensagem: string
  comanda?: {
    id: string
    codigo: string
    total: number
  }
}

type ScanMode = 'camera' | 'manual'

export default function SaidaPage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loginState, setLoginState] = useState({
    email: '',
    senha: '',
    tenantSlug: process.env.NEXT_PUBLIC_TENANT_SLUG || 'demo-club',
    loading: false,
    error: '',
  })
  const [result, setResult] = useState<ValidacaoResult | null>(null)
  const [scanMode, setScanMode] = useState<ScanMode>('manual')
  const [manualHash, setManualHash] = useState('')
  const [scanning, setScanning] = useState(false)
  const [validating, setValidating] = useState(false)
  const scannerRef = useRef<any>(null)
  const scannerDivId = 'qr-reader'

  useEffect(() => {
    setUser(getUser())
  }, [])

  useEffect(() => {
    if (scanMode === 'camera' && user) {
      startScanner()
    } else {
      stopScanner()
    }
    return () => stopScanner()
  }, [scanMode, user])

  async function startScanner() {
    try {
      const { Html5QrcodeScanner } = await import('html5-qrcode')
      if (scannerRef.current) return

      scannerRef.current = new Html5QrcodeScanner(
        scannerDivId,
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        false,
      )

      scannerRef.current.render(
        (decodedText: string) => handleScan(decodedText),
        (error: string) => {},
      )
    } catch (e) {
      console.error('Scanner error:', e)
    }
  }

  function stopScanner() {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {})
      scannerRef.current = null
    }
  }

  function extrairHash(text: string): string {
    try {
      const url = new URL(text)
      const parts = url.pathname.split('/')
      return parts[parts.length - 1]
    } catch {
      return text.trim()
    }
  }

  async function handleScan(text: string) {
    if (scanning) return
    setScanning(true)
    stopScanner()
    const hash = extrairHash(text)
    await validarHash(hash)
    setScanning(false)
  }

  async function validarManual() {
    if (!manualHash.trim()) return
    const hash = extrairHash(manualHash.trim())
    await validarHash(hash)
  }

  async function validarHash(hash: string) {
    setValidating(true)
    setResult(null)
    try {
      const data = await api.get<ValidacaoResult>(`/comandas/validar/${hash}`)
      setResult(data)
    } catch (e: any) {
      setResult({
        valida: false,
        status: 'ERROR',
        mensagem: e.message || 'Erro ao validar comanda',
      })
    } finally {
      setValidating(false)
    }
  }

  function resetar() {
    setResult(null)
    setManualHash('')
    if (scanMode === 'camera') {
      startScanner()
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginState((s) => ({ ...s, loading: true, error: '' }))
    try {
      const r = await login(loginState.email, loginState.senha, loginState.tenantSlug)
      setUser(r.usuario)
    } catch (err: any) {
      setLoginState((s) => ({ ...s, error: err.message, loading: false }))
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0f]">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-4xl mb-2">🚪</div>
            <h1 className="text-2xl font-black text-white">Validação de Saída</h1>
            <p className="text-gray-500 text-sm mt-1">Segurança / Controle</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="text"
              placeholder="Tenant"
              value={loginState.tenantSlug}
              onChange={(e) => setLoginState((s) => ({ ...s, tenantSlug: e.target.value }))}
              className="w-full bg-[#111118] border border-[#22222e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500"
            />
            <input
              type="email"
              placeholder="E-mail"
              value={loginState.email}
              onChange={(e) => setLoginState((s) => ({ ...s, email: e.target.value }))}
              className="w-full bg-[#111118] border border-[#22222e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500"
            />
            <input
              type="password"
              placeholder="Senha"
              value={loginState.senha}
              onChange={(e) => setLoginState((s) => ({ ...s, senha: e.target.value }))}
              className="w-full bg-[#111118] border border-[#22222e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500"
            />
            {loginState.error && (
              <p className="text-red-400 text-sm text-center">{loginState.error}</p>
            )}
            <button type="submit" disabled={loginState.loading} className="btn-primary">
              {loginState.loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <p className="text-center text-xs text-gray-600 mt-6">
            Demo: saida@demo.com / saida123
          </p>
        </div>
      </div>
    )
  }

  if (result) {
    const isValid = result.valida
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors ${
        isValid ? 'bg-emerald-950' : 'bg-red-950'
      }`}>
        <div className={`w-32 h-32 rounded-full flex items-center justify-center text-7xl mb-6 border-4 ${
          isValid
            ? 'bg-emerald-500/30 border-emerald-400 shadow-2xl shadow-emerald-500/50'
            : 'bg-red-500/30 border-red-400 shadow-2xl shadow-red-500/50'
        }`}>
          {isValid ? '✅' : '🚫'}
        </div>

        <h1 className={`text-4xl font-black mb-3 ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>
          {isValid ? 'LIBERADO' : 'BLOQUEADO'}
        </h1>

        <p className={`text-lg text-center mb-2 ${isValid ? 'text-emerald-200' : 'text-red-200'}`}>
          {result.mensagem}
        </p>

        {result.comanda && (
          <div className={`mt-4 p-4 rounded-2xl border text-center ${
            isValid
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <p className="text-white font-bold">#{result.comanda.codigo}</p>
            <p className={`text-2xl font-black ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(result.comanda.total)}
            </p>
          </div>
        )}

        <button
          onClick={resetar}
          className={`mt-8 w-full max-w-xs py-4 rounded-2xl font-bold text-lg active:scale-95 transition-all ${
            isValid
              ? 'bg-emerald-600 hover:bg-emerald-500'
              : 'bg-red-600 hover:bg-red-500'
          }`}
        >
          Próximo →
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] max-w-md mx-auto flex flex-col">
      <header className="flex items-center justify-between px-4 py-4 border-b border-[#22222e]">
        <div>
          <h1 className="text-lg font-bold text-white">🚪 Saída</h1>
          <p className="text-xs text-gray-500">{user.nome}</p>
        </div>
        <button onClick={() => { logout(); setUser(null) }} className="text-gray-500 text-xs">
          Sair
        </button>
      </header>

      <div className="flex-1 p-4 space-y-4">
        <div className="flex rounded-2xl overflow-hidden border border-[#22222e]">
          <button
            onClick={() => setScanMode('manual')}
            className={`flex-1 py-3 text-sm font-bold transition-all ${
              scanMode === 'manual'
                ? 'bg-violet-600 text-white'
                : 'bg-[#111118] text-gray-500'
            }`}
          >
            ⌨️ Manual
          </button>
          <button
            onClick={() => setScanMode('camera')}
            className={`flex-1 py-3 text-sm font-bold transition-all ${
              scanMode === 'camera'
                ? 'bg-violet-600 text-white'
                : 'bg-[#111118] text-gray-500'
            }`}
          >
            📷 Câmera
          </button>
        </div>

        {scanMode === 'manual' && (
          <div className="space-y-3">
            <p className="text-gray-400 text-sm text-center">
              Cole o link da comanda ou o hash do QR Code
            </p>
            <input
              type="text"
              placeholder="Hash ou URL da comanda..."
              value={manualHash}
              onChange={(e) => setManualHash(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && validarManual()}
              className="w-full bg-[#111118] border border-[#22222e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 font-mono text-sm"
            />
            <button
              onClick={validarManual}
              disabled={!manualHash.trim() || validating}
              className="btn-primary"
            >
              {validating ? '⌛ Validando...' : '🔍 Validar'}
            </button>
          </div>
        )}

        {scanMode === 'camera' && (
          <div className="space-y-3">
            <p className="text-gray-400 text-sm text-center">
              Aponte a câmera para o QR Code da pulseira
            </p>
            <div
              id={scannerDivId}
              className="rounded-2xl overflow-hidden border border-[#22222e]"
            />
            {scanning && (
              <div className="text-center py-4">
                <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Validando...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
