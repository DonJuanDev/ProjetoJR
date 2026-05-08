'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth'
import { useTheme } from '@/contexts/theme'
import { getUser } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { theme, toggle, isDark } = useTheme()
  const [form, setForm] = useState({
    tenantSlug: process.env.NEXT_PUBLIC_TENANT_SLUG || 'demo-club',
    email: '',
    senha: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (getUser()) router.replace('/dashboard')
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(form.email, form.senha, form.tenantSlug)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Credenciais inválidas')
    } finally {
      setLoading(false)
    }
  }

  const field = (key: keyof typeof form, opts: { type?: string; placeholder: string; label: string }) => (
    <div>
      <label className="input-label">{opts.label}</label>
      <input
        type={opts.type || 'text'}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={opts.placeholder}
        className="input"
        autoComplete={opts.type === 'password' ? 'current-password' : 'off'}
      />
    </div>
  )

  return (
    <div className="min-h-screen page-bg bg-grid flex items-center justify-center p-4 relative overflow-hidden transition-all duration-300">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, var(--accent-subtle) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, var(--accent-subtle) 0%, transparent 70%)' }} />

      {/* Theme toggle top-right */}
      <button onClick={toggle} className="fixed top-5 right-5 icon-btn border" style={{ borderColor: 'var(--border)' }}>
        {isDark ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      <div className="w-full max-w-sm anim-up relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-5 text-3xl"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 0 48px var(--accent-glow)' }}>
            ⚡
          </div>
          <h1 className="text-4xl font-black tracking-tight" style={{ color: 'var(--text-1)' }}>
            JR <span className="gradient-text">Solution</span>
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-3)' }}>Painel Administrativo</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <p className="text-sm font-semibold mb-6" style={{ color: 'var(--text-2)' }}>
            Acesse sua conta
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {field('tenantSlug', { label: 'Estabelecimento', placeholder: 'demo-club' })}
            {field('email', { type: 'email', label: 'E-mail', placeholder: 'admin@email.com' })}
            {field('senha', { type: 'password', label: 'Senha', placeholder: '••••••••' })}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-sm anim-scale"
                style={{ background: 'var(--danger-subtle)', border: '1px solid var(--danger-border)', color: 'var(--danger-text)' }}>
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary-lg mt-2">
              {loading
                ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Entrando...</>
                : 'Entrar no Painel'}
            </button>
          </form>

          <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-center text-xs mb-3" style={{ color: 'var(--text-3)' }}>
              ACESSO DEMO
            </p>
            <button
              onClick={() => setForm(f => ({ ...f, email: 'admin@demo.com', senha: 'admin123' }))}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
            >
              👑 Entrar como Admin Demo
            </button>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-3)' }}>
          JR Solution © 2026
        </p>
      </div>
    </div>
  )
}
