'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth'
import { useTheme } from '@/contexts/theme'
import { joinTenant, getSocket } from '@/lib/socket'
import { api } from '@/lib/api'

interface NavGroup { label: string; items: NavItem[] }
interface NavItem { href: string; icon: React.ReactNode; label: string; badge?: string }

function IconOverview() {
  return (
    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10-3a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" />
    </svg>
  )
}

function IconComandas()   { return <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> }
function IconAoVivo()     { return <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> }
function IconPedidos()    { return <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4v16m8-8H4" /></svg> }
function IconSaida()      { return <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg> }
function IconProdutos()   { return <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg> }
function IconRelatorio()  { return <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> }
function IconConfig()     { return <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> }
function IconCrm()        { return <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> }

function IconCalendar() {
  return (
    <svg className="w-4 h-4 shrink-0 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

const GROUPS: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard',         icon: <IconOverview />,  label: 'Visão geral' },
      { href: '/dashboard/crm',      icon: <IconCrm />,      label: 'CRM' },
      { href: '/dashboard/ao-vivo',  icon: <IconAoVivo />,   label: 'Ao Vivo',  badge: 'live' },
      { href: '/dashboard/comandas', icon: <IconComandas />, label: 'Comandas' },
    ],
  },
  {
    label: 'Operação',
    items: [
      { href: '/dashboard/pedidos',  icon: <IconPedidos />,  label: 'Lançar Pedido' },
      { href: '/dashboard/saida',    icon: <IconSaida />,    label: 'Saída / Portaria' },
      { href: '/dashboard/produtos', icon: <IconProdutos />, label: 'Cardápio' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { href: '/dashboard/relatorios',    icon: <IconRelatorio />, label: 'Inteligência' },
      { href: '/dashboard/configuracoes', icon: <IconConfig />,    label: 'Configurações' },
    ],
  },
]

const DASH_ROUTE_LABELS: { prefix: string; label: string }[] = [
  { prefix: '/dashboard/configuracoes', label: 'Configurações' },
  { prefix: '/dashboard/relatorios', label: 'Inteligência' },
  { prefix: '/dashboard/produtos', label: 'Cardápio' },
  { prefix: '/dashboard/saida', label: 'Saída / Portaria' },
  { prefix: '/dashboard/pedidos', label: 'Lançar pedido' },
  { prefix: '/dashboard/comandas', label: 'Comandas' },
  { prefix: '/dashboard/ao-vivo', label: 'Ao vivo' },
  { prefix: '/dashboard/crm', label: 'CRM' },
]

function dashSectionTitle(pathname: string) {
  if (pathname === '/dashboard' || pathname === '/dashboard/') return 'Visão geral'
  const sorted = [...DASH_ROUTE_LABELS].sort((a, b) => b.prefix.length - a.prefix.length)
  return sorted.find(r => pathname.startsWith(r.prefix))?.label ?? 'Painel'
}

function dashGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function SunIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
}

function MoonIcon() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, logout } = useAuth()
  const { isDark, toggle } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [liveCount, setLiveCount] = useState(0)
  const [, setNotifications] = useState<string[]>([])
  const [logoImage, setLogoImage] = useState<string | null>(null)
  const [tenantNome, setTenantNome] = useState('JR Solution')
  const [monthCursor, setMonthCursor] = useState(() => new Date())
  const [topSearch, setTopSearch] = useState('')

  const shellClass = `dashboard-app-shell ${isDark ? 'dashboard-app-shell--dark' : 'dashboard-app-shell--light'}`

  useEffect(() => {
    if (!loading && !user) { router.replace('/login'); return }
    if (!loading && user && user.role !== 'ADMIN' && user.role !== 'GERENTE') {
      logout()
      router.replace('/login')
    }
    if (!loading && user) {
      api.get<{ nome?: string; logoImage?: string }>('/tenants/me').then(t => {
        setLogoImage(t.logoImage || null)
        if (t.nome) setTenantNome(t.nome)
      }).catch(() => {})
    }
  }, [user, loading, router, logout])

  useEffect(() => {
    if (!user) return
    joinTenant(user.tenantId)
    const socket = getSocket()
    socket.on('comanda:criada', () => {
      setNotifications(n => [`Nova comanda criada`, ...n.slice(0, 4)])
    })
    socket.on('pedido:adicionado', () => {
      setLiveCount(n => n + 1)
      setTimeout(() => setLiveCount(n => Math.max(0, n - 1)), 5000)
    })
    socket.on('pagamento:confirmado', () => {
      setNotifications(n => [`✅ Pagamento confirmado!`, ...n.slice(0, 4)])
    })
    return () => { socket.off('comanda:criada'); socket.off('pedido:adicionado'); socket.off('pagamento:confirmado') }
  }, [user])

  if (loading || !user) {
    return (
      <div className={`${shellClass} min-h-screen page-bg flex items-center justify-center`}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard' || pathname === '/dashboard/'
      : pathname.startsWith(href)

  const monthLabel = monthCursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  function shiftMonth(delta: number) {
    setMonthCursor(d => new Date(d.getFullYear(), d.getMonth() + delta, 1))
  }

  return (
    <div className={`flex min-h-screen page-bg ${shellClass}`}>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="px-5 py-5 sidebar-brand-zone">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="flex flex-1 min-w-0 items-center gap-3 rounded-xl outline-none transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 overflow-hidden"
                style={{
                  background: logoImage ? '#ffffff' : 'rgba(255,255,255,0.22)',
                  boxShadow: logoImage ? '0 6px 20px rgba(0,0,0,0.12)' : 'none',
                  border: logoImage ? 'none' : '1px solid rgba(255,255,255,0.28)',
                }}
              >
                {logoImage
                  ? <img src={logoImage} alt="" className="w-full h-full object-contain p-1" />
                  : <span className="drop-shadow-sm">⚡</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="dash-brand-title font-bold text-[15px] leading-tight truncate">{tenantNome}</p>
                <p className="dash-brand-kicker text-[10px] font-bold uppercase tracking-[0.18em] mt-1">Painel</p>
                <p className="dash-brand-slug text-[11px] truncate mt-0.5 opacity-90">{user.tenantSlug}</p>
              </div>
            </Link>
            <button type="button" onClick={toggle} className="icon-btn flex-shrink-0 rounded-xl" title={isDark ? 'Tema claro' : 'Tema escuro'}>
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
          {GROUPS.map(group => (
            <div key={group.label}>
              <p className="dash-sidebar-nav-label px-3 mb-2 text-[10px] font-bold uppercase tracking-widest">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map(item => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`rounded-2xl ${active ? 'nav-item-active' : 'nav-item'}`}
                    >
                      <span className="flex-shrink-0 w-5 flex items-center justify-center [&_svg]:stroke-[2]">{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {item.badge === 'live' && liveCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white bg-red-500 shadow-sm">
                          {liveCount}
                        </span>
                      )}
                      {item.badge === 'live' && liveCount === 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                          <span className="dot-live bg-emerald-400 after:!bg-emerald-400" style={{ width: 6, height: 6 }} />
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="px-3 pb-5 pt-2 dash-sidebar-user">
          <div className="flex items-center gap-3 p-3 rounded-2xl dash-sidebar-user-panel">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 text-white border border-white/25"
              style={{ background: 'rgba(255,255,255,0.22)' }}
            >
              {user.nome[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="dash-sidebar-user-name text-xs font-bold truncate">{user.nome}</p>
              <p className="dash-sidebar-user-role text-[10px] font-semibold truncate">{user.role}</p>
            </div>
            <button type="button" onClick={() => { logout(); router.push('/login') }} className="icon-btn shrink-0 rounded-xl" title="Sair">
              <IconSaida />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="lg:hidden dash-mobile-header flex items-center justify-between px-4 py-3.5 sticky top-0 z-10">
          <button type="button" onClick={() => setMobileOpen(true)} className="icon-btn rounded-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-sm dash-mobile-title truncate max-w-[50%]">{tenantNome}</span>
          <button type="button" onClick={toggle} className="icon-btn rounded-xl">{isDark ? <SunIcon /> : <MoonIcon />}</button>
        </header>

        <main className="flex-1 p-5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <header className="dashboard-topbar">
            <div className="min-w-0">
              <p className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>{dashGreeting()}</p>
              <p className="text-xl sm:text-2xl font-extrabold tracking-tight mt-0.5 truncate" style={{ color: 'var(--text-1)' }}>
                {tenantNome}
              </p>
              <p className="text-sm mt-0.5 font-medium" style={{ color: 'var(--text-2)' }}>{dashSectionTitle(pathname)}</p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 flex-1">
              <div className="dash-month-nav">
                <button type="button" className="dash-month-btn" onClick={() => shiftMonth(-1)} aria-label="Mês anterior">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <IconCalendar />
                <span className="dash-month-label">{monthLabel}</span>
                <button type="button" className="dash-month-btn" onClick={() => shiftMonth(1)} aria-label="Próximo mês">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="dashboard-search-wrap">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--text-3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
                </svg>
                <input
                  type="search"
                  className="dashboard-search-pill"
                  placeholder="Buscar…"
                  value={topSearch}
                  onChange={e => setTopSearch(e.target.value)}
                  aria-label="Buscar no painel"
                />
              </div>

              <button
                type="button"
                className="btn-dash-logout shrink-0"
                onClick={() => { logout(); router.push('/login') }}
              >
                <IconSaida />
                Sair
              </button>
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  )
}
