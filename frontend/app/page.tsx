'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/lib/auth'

/* =========================================================
   LANDING PAGE — JR Solution / Gateway
   Pronta pra venda. Mobile-first, animada, completa.
   Personalize WHATSAPP_NUMBER e WHATSAPP_MSG abaixo.
   ========================================================= */
const WHATSAPP_NUMBER = '5511999999999' // <- TROQUE pelo seu número (formato 55 + DDD + número)
const WHATSAPP_MSG    = 'Olá! Vi a apresentação do Gateway e quero entender melhor pra minha casa.'
const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MSG)}`

export default function LandingPage() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    if (getUser()) router.replace('/dashboard')
  }, [router])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Reveal-on-scroll for elements with .reveal
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.15 }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className="min-h-screen page-bg overflow-x-hidden" style={{ color: 'var(--text-1)' }}>
      <TopNav scrolled={scrolled} mobileNavOpen={mobileNavOpen} setMobileNavOpen={setMobileNavOpen} />
      <Hero />
      <LogosTicker />
      <ProblemaSection />
      <ComoFunciona />
      <PainelShowcase />
      <FeaturesGrid />
      <ParaQuem />
      <AntesDepois />
      <NumerosImpacto />
      <Pricing />
      <Depoimentos />
      <FAQ />
      <Garantias />
      <CtaFinal />
      <Footer />
      <WhatsAppFloat />
    </div>
  )
}

/* ========================================================= NAV */
function TopNav({
  scrolled, mobileNavOpen, setMobileNavOpen,
}: { scrolled: boolean; mobileNavOpen: boolean; setMobileNavOpen: (v: boolean) => void }) {
  const links = [
    { href: '#como-funciona', label: 'Como funciona' },
    { href: '#features', label: 'Recursos' },
    { href: '#painel', label: 'Painéis' },
    { href: '#precos', label: 'Preços' },
    { href: '#faq', label: 'FAQ' },
  ]
  return (
    <header
      className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(6,6,16,0.78)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg anim-glow"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
            ⚡
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-black">Gateway</div>
            <div className="text-[10px] text-3 -mt-0.5 tracking-widest uppercase">JR Solution</div>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-7">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-sm text-2 hover:text-1 transition">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link href="/login" className="btn-ghost">Entrar</Link>
          <a href={whatsappLink} target="_blank" rel="noreferrer" className="btn-primary">
            Falar agora
          </a>
        </div>

        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="md:hidden icon-btn"
          aria-label="Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={mobileNavOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>
      </div>

      {mobileNavOpen && (
        <div className="md:hidden border-t border-base anim-down" style={{ background: 'rgba(6,6,16,0.96)' }}>
          <div className="px-5 py-4 flex flex-col gap-3">
            {links.map(l => (
              <a key={l.href} href={l.href} onClick={() => setMobileNavOpen(false)}
                className="text-sm text-2 py-2">{l.label}</a>
            ))}
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="btn-ghost flex-1">Entrar</Link>
              <a href={whatsappLink} target="_blank" rel="noreferrer" className="btn-primary flex-1">Falar</a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

/* ========================================================= HERO */
function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute -top-24 -left-20 w-[600px] h-[500px] hero-glow-1 anim-floaty-slow pointer-events-none" />
      <div className="absolute top-40 right-0 w-[520px] h-[460px] hero-glow-2 anim-floaty pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-[500px] h-[400px] hero-glow-3 pointer-events-none" />

      {/* Grid texture */}
      <div className="absolute inset-0 bg-grid opacity-[0.35] pointer-events-none"
        style={{ maskImage: 'radial-gradient(ellipse at center top, black 30%, transparent 70%)' }} />

      <div className="relative max-w-7xl mx-auto px-5 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        {/* Left: text */}
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 anim-rise"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
            <span className="dot-live" /> Sistema 100% online — testado em produção
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-black tracking-tight leading-[1.05] anim-rise" style={{ animationDelay: '0.05s' }}>
            Sua casa noturna<br />
            <span className="gradient-text-vivid">sem fila no caixa.</span>
          </h1>

          <p className="text-base sm:text-lg text-2 mt-6 max-w-xl mx-auto lg:mx-0 anim-rise" style={{ animationDelay: '0.12s' }}>
            Comandas digitais com QR Code, pagamento por <b className="text-1">Pix em 8 segundos</b> e
            saída validada na portaria. Seu cliente paga sozinho — você fatura mais sem contratar mais gente.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-8 anim-rise" style={{ animationDelay: '0.2s' }}>
            <a href={whatsappLink} target="_blank" rel="noreferrer"
              className="btn-primary-lg sm:w-auto sm:px-7"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
              <WhatsappIcon className="w-5 h-5" />
              Quero uma demonstração
            </a>
            <a href="#painel" className="btn-ghost sm:w-auto sm:px-6 sm:py-3.5">
              Ver o sistema funcionando
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>

          <div className="mt-8 flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-2 anim-rise" style={{ animationDelay: '0.28s' }}>
            <span className="flex items-center gap-2"><Check /> Setup em 24h</span>
            <span className="flex items-center gap-2"><Check /> Sem fidelidade</span>
            <span className="flex items-center gap-2"><Check /> Suporte humano no WhatsApp</span>
          </div>
        </div>

        {/* Right: phone mockup */}
        <div className="relative flex justify-center lg:justify-end anim-rise" style={{ animationDelay: '0.35s' }}>
          <FloatingDecor />
          <PhoneMockup />
        </div>
      </div>
    </section>
  )
}

function FloatingDecor() {
  return (
    <>
      <div className="absolute -top-6 -left-2 lg:-left-10 glass rounded-2xl px-4 py-3 anim-floaty-slow z-10"
        style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--success-subtle)', color: 'var(--success-text)' }}>✓</div>
          <div className="leading-tight">
            <div className="text-[11px] text-3 uppercase tracking-wider">Pagamento Pix</div>
            <div className="text-sm font-bold">R$ 247,80 confirmado</div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-2 -right-2 lg:-right-6 glass rounded-2xl px-4 py-3 anim-floaty z-10"
        style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>📊</div>
          <div className="leading-tight">
            <div className="text-[11px] text-3 uppercase tracking-wider">Faturamento ao vivo</div>
            <div className="text-sm font-bold">+ R$ 18.420 hoje</div>
          </div>
        </div>
      </div>
    </>
  )
}

function PhoneMockup() {
  return (
    <div className="phone-frame anim-floaty">
      <div className="phone-screen">
        <div className="phone-notch" />
        {/* Status bar */}
        <div className="flex justify-between items-center px-7 pt-3 text-[11px] text-2">
          <span>23:47</span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 rounded-sm bg-current opacity-70" />
            <span className="w-3 h-2 rounded-sm bg-current opacity-70" />
            <span className="w-3 h-2 rounded-sm bg-current" />
            <span className="ml-1">100%</span>
          </span>
        </div>

        {/* Header */}
        <div className="px-5 pt-6 pb-4 text-center">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-bold"
            style={{ background: 'var(--success-subtle)', color: 'var(--success-text)', border: '1px solid var(--success-border)' }}>
            <span className="dot-live" /> COMANDA ABERTA
          </div>
          <h3 className="text-2xl font-black mt-3">Mesa 12 · Camarote</h3>
          <p className="text-[11px] text-3 uppercase tracking-widest mt-1">Comanda #A4F2</p>
        </div>

        {/* Itens */}
        <div className="px-4 mt-2 space-y-2">
          {[
            { n: '2x Heineken Long Neck', v: 'R$ 36,00', emoji: '🍺' },
            { n: '1x Caipirinha de Limão',  v: 'R$ 22,00', emoji: '🍹' },
            { n: '1x Combo Petisco',         v: 'R$ 48,00', emoji: '🍟' },
          ].map((it, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{it.emoji}</span>
                <span className="text-[12px] font-medium">{it.n}</span>
              </div>
              <span className="text-[12px] font-bold">{it.v}</span>
            </div>
          ))}
          <div className="flex items-center justify-center text-[10px] text-3 py-1">
            <span className="dot-live mr-2" /> atualiza em tempo real
          </div>
        </div>

        {/* Total + CTA */}
        <div className="absolute inset-x-0 bottom-0 px-4 pb-5 pt-4"
          style={{ background: 'linear-gradient(to top, #060610 60%, transparent)' }}>
          <div className="flex items-end justify-between mb-3 px-1">
            <span className="text-[11px] text-3 uppercase tracking-widest">Total</span>
            <span className="text-2xl font-black">R$ 106,00</span>
          </div>
          <button className="w-full py-3.5 rounded-2xl font-bold text-sm text-white anim-glow"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
            Pagar com Pix · 8 seg
          </button>
        </div>
      </div>
    </div>
  )
}

/* ========================================================= LOGOS / SOCIAL PROOF */
function LogosTicker() {
  const items = [
    'Bares e pubs', 'Casas noturnas', 'Festas universitárias',
    'Eventos corporativos', 'Festivais', 'Cervejarias artesanais',
    'Lounges e rooftops', 'Karaokês', 'Hostels', 'Brewpubs',
  ]
  return (
    <section className="py-10 border-y border-base"
      style={{ background: 'rgba(255,255,255,0.015)' }}>
      <p className="text-center text-xs uppercase tracking-widest text-3 mb-5">
        Pensado para quem fatura à noite
      </p>
      <div className="overflow-hidden">
        <div className="marquee-track">
          {[...items, ...items].map((t, i) => (
            <span key={i} className="text-2 font-semibold whitespace-nowrap flex items-center gap-3">
              <span className="text-1 opacity-30">●</span>
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ========================================================= PROBLEMA */
function ProblemaSection() {
  const dores = [
    { icon: '⏰', title: 'Fila no caixa',         desc: 'Cliente desiste de pedir pra não perder o ambiente.' },
    { icon: '📝', title: 'Comanda de papel',      desc: 'Some, rasga, é fraudada — e ninguém sabe quem pediu o quê.' },
    { icon: '🚪', title: 'Saída sem controle',    desc: 'Cliente sai sem pagar e a perda fica no prejuízo do dia.' },
    { icon: '😵', title: 'Garçom sobrecarregado', desc: 'Anota errado, esquece pedido, atende menos mesas.' },
  ]
  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="text-center max-w-2xl mx-auto reveal">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--danger-text)' }}>
            O Problema
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mt-3">
            Toda noite você perde dinheiro<br />
            <span className="text-2">e nem percebe.</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-14">
          {dores.map((d, i) => (
            <div key={i} className="card p-6 reveal" style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="text-3xl mb-3">{d.icon}</div>
              <h3 className="font-black text-lg">{d.title}</h3>
              <p className="text-sm text-2 mt-1.5 leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ========================================================= COMO FUNCIONA */
function ComoFunciona() {
  const steps = [
    {
      n: '01',
      title: 'Cliente escaneia o QR Code',
      desc: 'No camarote, na pulseira ou na mesa. Abre o cardápio direto no celular dele — sem app, sem cadastro.',
      icon: <QrIcon />,
    },
    {
      n: '02',
      title: 'Pede pelo celular ou pelo garçom',
      desc: 'Você decide: autoatendimento, garçom no tablet, ou os dois. Os pedidos chegam no painel da cozinha em tempo real.',
      icon: <ChatIcon />,
    },
    {
      n: '03',
      title: 'Paga em Pix antes de sair',
      desc: 'Antes de ir embora, paga sozinho pelo celular. A portaria escaneia e libera só quem está em dia.',
      icon: <ShieldIcon />,
    },
  ]

  return (
    <section id="como-funciona" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="text-center max-w-2xl mx-auto reveal">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
            Como funciona
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mt-3">
            3 passos. Zero papel.<br />
            <span className="gradient-text-vivid">Faturamento que sobe.</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-5 mt-16">
          {steps.map((s, i) => (
            <div key={i} className="relative reveal" style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="card p-7 h-full relative overflow-hidden card-hover">
                <div className="absolute -top-4 -right-2 text-[80px] font-black opacity-[0.06] leading-none">
                  {s.n}
                </div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                  {s.icon}
                </div>
                <h3 className="font-black text-xl">{s.title}</h3>
                <p className="text-sm text-2 mt-2 leading-relaxed">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-2 z-10 text-2"
                  style={{ transform: 'translateY(-50%)' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ========================================================= PAINEIS SHOWCASE */
function PainelShowcase() {
  const tabs = [
    { id: 'cliente', label: 'Painel do Cliente',  desc: 'O cliente vê a comanda dele em tempo real e paga pelo celular sem instalar nada.' },
    { id: 'staff',   label: 'Painel do Garçom',   desc: 'Lança itens em segundos. Vê todas as mesas, sabe quem pagou e quem está aberto.' },
    { id: 'admin',   label: 'Painel do Dono',     desc: 'Faturamento ao vivo, top produtos, ticket médio e horário de pico. Sem planilha.' },
    { id: 'saida',   label: 'Validação de Saída', desc: 'Segurança escaneia o QR. Verde = pago. Vermelho = pendência. Sem vacilo.' },
  ]
  const [active, setActive] = useState('cliente')

  return (
    <section id="painel" className="py-24 relative" style={{ background: 'rgba(255,255,255,0.015)' }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="text-center max-w-2xl mx-auto reveal">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
            Os Painéis
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mt-3">
            Um sistema. Quatro pontos de vista.
          </h2>
          <p className="text-2 mt-4 max-w-xl mx-auto">
            Cada pessoa no seu time vê só o que precisa. Tudo conversa em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mt-10 reveal">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                background:    active === t.id ? 'var(--accent)' : 'var(--bg-card)',
                color:         active === t.id ? '#fff' : 'var(--text-2)',
                border:        active === t.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                boxShadow:     active === t.id ? '0 6px 24px var(--accent-glow)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-10 reveal">
          <div className="card p-3 sm:p-5 lg:p-8 relative overflow-hidden glow-border">
            <div className="absolute top-0 left-0 w-72 h-72 hero-glow-1 opacity-50 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-72 h-72 hero-glow-2 opacity-50 pointer-events-none" />

            <div className="relative">
              {active === 'cliente' && <MockCliente />}
              {active === 'staff'   && <MockStaff />}
              {active === 'admin'   && <MockAdmin />}
              {active === 'saida'   && <MockSaida />}
            </div>

            <p className="text-center text-sm text-2 mt-6 max-w-xl mx-auto relative">
              {tabs.find(t => t.id === active)?.desc}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* --- mocks de cada painel --- */
function MockBrowser({ children, url }: { children: React.ReactNode; url: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border)', background: '#0a0a14' }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)', background: '#060610' }}>
        <span className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
        <div className="flex-1 mx-3 px-3 py-1 rounded-md text-[10px] text-3 truncate"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
          🔒 {url}
        </div>
      </div>
      <div className="p-4 sm:p-6">{children}</div>
    </div>
  )
}

function MockCliente() {
  return (
    <MockBrowser url="gateway.app/cliente/A4F2X9">
      <div className="grid sm:grid-cols-[1fr_auto] gap-6 items-center">
        <div>
          <div className="badge badge-aberta">● COMANDA ABERTA</div>
          <h3 className="text-2xl font-black mt-2">Mesa 07 · Pista</h3>
          <p className="text-3 text-xs uppercase tracking-widest">Comanda #B91Z</p>
          <div className="mt-5 space-y-2">
            {[
              { n: '3x Long Neck',     v: 'R$ 54,00' },
              { n: '2x Vodka Energético', v: 'R$ 80,00' },
              { n: '1x Hambúrguer Especial', v: 'R$ 38,00' },
            ].map((it, i) => (
              <div key={i} className="flex justify-between p-3 rounded-xl text-sm"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                <span>{it.n}</span><span className="font-bold">{it.v}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-end justify-between">
            <span className="text-3 text-xs uppercase tracking-widest">Total</span>
            <span className="text-3xl font-black">R$ 172,00</span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3 sm:w-48">
          <div className="relative w-40 h-40 rounded-2xl bg-white p-2.5 anim-glow">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {Array.from({ length: 100 }).map((_, i) => {
                const x = (i % 10) * 10, y = Math.floor(i / 10) * 10
                const fill = ((i * 17) % 7) > 3
                return fill ? <rect key={i} x={x} y={y} width={9} height={9} fill="#000" /> : null
              })}
              <rect x="5" y="5"   width="22" height="22" fill="#fff" stroke="#000" strokeWidth="3" />
              <rect x="73" y="5"  width="22" height="22" fill="#fff" stroke="#000" strokeWidth="3" />
              <rect x="5" y="73"  width="22" height="22" fill="#fff" stroke="#000" strokeWidth="3" />
              <rect x="11" y="11" width="10" height="10" fill="#000" />
              <rect x="79" y="11" width="10" height="10" fill="#000" />
              <rect x="11" y="79" width="10" height="10" fill="#000" />
            </svg>
            <div className="qr-scanline" />
          </div>
          <button className="w-full py-3 rounded-xl font-bold text-sm text-white"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>
            Pagar Pix · 8s
          </button>
        </div>
      </div>
    </MockBrowser>
  )
}

function MockStaff() {
  const comandas = [
    { mesa: 'Mesa 03 · Bar',      total: 'R$ 88,50',  status: 'Aberta',  cor: 'badge-aberta' },
    { mesa: 'Mesa 12 · Camarote', total: 'R$ 412,00', status: 'Aguard.', cor: 'badge-aguardando' },
    { mesa: 'Mesa 21 · Pista',    total: 'R$ 156,00', status: 'Aberta',  cor: 'badge-aberta' },
    { mesa: 'Mesa 04 · Varanda',  total: 'R$ 244,90', status: 'Paga',    cor: 'badge-paga' },
    { mesa: 'Pulseira #91A',      total: 'R$ 58,00',  status: 'Aberta',  cor: 'badge-aberta' },
    { mesa: 'Mesa 16 · Pista',    total: 'R$ 0,00',   status: 'Aberta',  cor: 'badge-aberta' },
  ]
  return (
    <MockBrowser url="gateway.app/staff">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-black text-lg">Comandas Ativas</h3>
          <p className="text-xs text-3">22 abertas · R$ 4.892 em circulação</p>
        </div>
        <button className="btn-primary">+ Nova comanda</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {comandas.map((c, i) => (
          <div key={i} className="card p-4 card-hover">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold text-sm">{c.mesa}</div>
                <div className="text-3 text-[11px] mt-0.5">há 23 min</div>
              </div>
              <span className={c.cor}>{c.status}</span>
            </div>
            <div className="mt-3 text-xl font-black">{c.total}</div>
          </div>
        ))}
      </div>
    </MockBrowser>
  )
}

function MockAdmin() {
  const stats = [
    { label: 'Faturamento hoje',  val: 'R$ 18.420', delta: '+24%', up: true },
    { label: 'Comandas ativas',   val: '47',        delta: '+12',  up: true },
    { label: 'Ticket médio',      val: 'R$ 132',    delta: '+8%',  up: true },
    { label: 'Tempo médio Pix',   val: '8,2s',      delta: '-1,3s', up: true },
  ]
  const top = [
    { n: 'Long Neck Heineken',     q: 142, v: 'R$ 2.556' },
    { n: 'Combo Vodka Energético', q: 87,  v: 'R$ 3.480' },
    { n: 'Caipirinha de Limão',    q: 64,  v: 'R$ 1.408' },
    { n: 'Combo Petisco',          q: 41,  v: 'R$ 1.968' },
  ]
  return (
    <MockBrowser url="gateway.app/dashboard/relatorios">
      <div className="grid sm:grid-cols-4 gap-3 mb-5">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="text-3 text-[11px] uppercase tracking-wider">{s.label}</div>
            <div className="text-2xl font-black mt-1">{s.val}</div>
            <div className="text-xs font-bold mt-1" style={{ color: 'var(--success-text)' }}>↑ {s.delta}</div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm">Faturamento por hora</h4>
            <span className="text-[11px] text-3">hoje</span>
          </div>
          <FakeChart />
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-sm">Top produtos</h4>
            <span className="text-[11px] text-3">essa semana</span>
          </div>
          <div className="space-y-2.5">
            {top.map((p, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{p.n}</span>
                  <span className="text-3">{p.q} un · <b className="text-1">{p.v}</b></span>
                </div>
                <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full rounded-full"
                    style={{ width: `${100 - i * 18}%`, background: 'linear-gradient(90deg,#7c3aed,#a855f7)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MockBrowser>
  )
}

function FakeChart() {
  const bars = [12, 18, 24, 30, 42, 58, 72, 88, 95, 84, 70, 52, 38, 28]
  return (
    <div className="flex items-end gap-1.5 h-32">
      {bars.map((h, i) => (
        <div key={i} className="flex-1 rounded-t-md"
          style={{
            height: `${h}%`,
            background: i === 8
              ? 'linear-gradient(to top, #7c3aed, #a855f7)'
              : 'linear-gradient(to top, rgba(124,58,237,0.45), rgba(124,58,237,0.18))',
          }} />
      ))}
    </div>
  )
}

function MockSaida() {
  return (
    <MockBrowser url="gateway.app/saida">
      <div className="grid sm:grid-cols-2 gap-5 items-center">
        <div className="card p-6"
          style={{ background: 'var(--success-subtle)', borderColor: 'var(--success-border)' }}>
          <div className="text-6xl mb-2">✅</div>
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--success-text)' }}>
            Liberado
          </div>
          <h3 className="text-2xl font-black mt-1">Comanda #A4F2 paga</h3>
          <div className="mt-4 text-sm text-2 space-y-1">
            <div className="flex justify-between"><span>Total</span><b className="text-1">R$ 247,80</b></div>
            <div className="flex justify-between"><span>Forma</span><b className="text-1">Pix</b></div>
            <div className="flex justify-between"><span>Pago às</span><b className="text-1">23h47</b></div>
          </div>
        </div>

        <div className="card p-6"
          style={{ background: 'var(--danger-subtle)', borderColor: 'var(--danger-border)' }}>
          <div className="text-6xl mb-2">🚫</div>
          <div className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--danger-text)' }}>
            Bloqueado
          </div>
          <h3 className="text-2xl font-black mt-1">Comanda em aberto</h3>
          <div className="mt-4 text-sm text-2 space-y-1">
            <div className="flex justify-between"><span>Pendente</span><b style={{ color: 'var(--danger-text)' }}>R$ 156,00</b></div>
            <div className="flex justify-between"><span>Itens</span><b className="text-1">8 produtos</b></div>
            <div className="flex justify-between"><span>Cliente</span><b className="text-1">não pagou</b></div>
          </div>
        </div>
      </div>
    </MockBrowser>
  )
}

/* ========================================================= FEATURES */
function FeaturesGrid() {
  const features = [
    { icon: <QrIcon />,        title: 'QR Code criptografado',   desc: 'Hash HMAC-SHA256 único por comanda. Impossível clonar ou reutilizar.' },
    { icon: <PixIcon />,       title: 'Pix em 8 segundos',       desc: 'Integração direta com Mercado Pago. Pagamento confirmado por webhook.' },
    { icon: <BoltIcon />,      title: 'Tempo real',              desc: 'WebSocket entre caixa, garçom, cliente e portaria. Tudo sincronizado.' },
    { icon: <ChartIcon />,     title: 'Relatórios completos',    desc: 'Faturamento, ticket médio, top produtos, horário de pico, comparativo de eventos.' },
    { icon: <ShieldIcon />,    title: 'Anti-fraude',             desc: 'QR reutilizado é detectado automaticamente. Saída sem pagamento bloqueada.' },
    { icon: <DevicesIcon />,   title: 'PWA mobile-first',        desc: 'Funciona como app no celular. Otimizado pra ambiente escuro de balada.' },
    { icon: <UsersIcon />,     title: 'Multi-tenant',            desc: 'Mais de uma casa? Cada uma tem seus dados, usuários e Mercado Pago próprio.' },
    { icon: <CardIcon />,      title: 'Cartão também',           desc: 'Pix preferencial, mas aceita débito e crédito quando o cliente quiser.' },
    { icon: <DivisaoIcon />,   title: 'Divisão de conta',        desc: 'A comanda divide automática entre os amigos. Cada um paga seu Pix.' },
  ]
  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="text-center max-w-2xl mx-auto reveal">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
            Recursos
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mt-3">
            Tudo que sua casa precisa.<br />
            <span className="gradient-text-vivid">Nada que ela não precise.</span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-14">
          {features.map((f, i) => (
            <div key={i} className="card card-hover p-6 reveal" style={{ transitionDelay: `${(i % 3) * 80}ms` }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                {f.icon}
              </div>
              <h3 className="font-black text-lg">{f.title}</h3>
              <p className="text-sm text-2 mt-1.5 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ========================================================= PARA QUEM */
function ParaQuem() {
  const cards = [
    {
      icon: '🍻', title: 'Bares e pubs',
      bullets: ['Mesas numeradas', 'Cardápio com foto', 'Divisão de conta', 'Comanda da galera junta'],
      gradient: 'from-purple-500/20 to-pink-500/10',
    },
    {
      icon: '🎉', title: 'Casas noturnas',
      bullets: ['Pulseira ou cartão com QR', 'Camarote, pista e VIP', 'Fila zero no caixa', 'Saída validada'],
      gradient: 'from-violet-500/25 to-blue-500/10',
    },
    {
      icon: '🎪', title: 'Eventos e festivais',
      bullets: ['Cashless temporário', 'Onboarding em 24h', 'Múltiplos pontos de venda', 'Relatório por dia'],
      gradient: 'from-pink-500/20 to-orange-500/10',
    },
  ]
  return (
    <section className="py-24 relative" style={{ background: 'rgba(255,255,255,0.015)' }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="text-center max-w-2xl mx-auto reveal">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
            Para quem é
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mt-3">
            Feito pra quem fatura à noite.
          </h2>
        </div>
        <div className="grid lg:grid-cols-3 gap-5 mt-14">
          {cards.map((c, i) => (
            <div key={i} className={`card card-hover p-7 reveal bg-gradient-to-br ${c.gradient}`}
              style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="text-5xl mb-4">{c.icon}</div>
              <h3 className="text-2xl font-black">{c.title}</h3>
              <ul className="mt-5 space-y-2.5">
                {c.bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm text-2">
                    <Check /> <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ========================================================= ANTES/DEPOIS */
function AntesDepois() {
  const rows = [
    { label: 'Fila no caixa',           antes: 'Sempre tem',         depois: 'Zero — paga sozinho' },
    { label: 'Comanda perdida',          antes: 'Prejuízo da noite',  depois: 'Impossível — é digital' },
    { label: 'Cliente sai sem pagar',    antes: 'Acontece',           depois: 'Bloqueado na portaria' },
    { label: 'Garçom errar pedido',      antes: 'Toda hora',          depois: 'Item escolhido pelo próprio cliente' },
    { label: 'Saber o que mais vendeu',  antes: 'Só no fim do mês',   depois: 'Em tempo real, no celular' },
    { label: 'Receber o dinheiro',       antes: 'D+1 / D+30',         depois: 'Pix cai na hora' },
    { label: 'Treinar funcionário novo', antes: '1 semana',           depois: '15 minutos' },
  ]
  return (
    <section className="py-24 relative">
      <div className="max-w-5xl mx-auto px-5 lg:px-8">
        <div className="text-center max-w-2xl mx-auto reveal">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
            Comparativo
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mt-3">
            Sem Gateway × Com Gateway
          </h2>
        </div>

        <div className="card overflow-hidden mt-12 reveal">
          <div className="grid grid-cols-3 text-xs sm:text-sm font-bold uppercase tracking-widest"
            style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
            <div className="p-4 text-3"></div>
            <div className="p-4" style={{ color: 'var(--danger-text)' }}>Sem Gateway</div>
            <div className="p-4" style={{ color: 'var(--success-text)' }}>Com Gateway</div>
          </div>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-3 text-sm" style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div className="p-4 font-medium text-2">{r.label}</div>
              <div className="p-4 flex items-center gap-2 text-2">
                <span style={{ color: 'var(--danger-text)' }}>✗</span> {r.antes}
              </div>
              <div className="p-4 flex items-center gap-2 font-semibold">
                <span style={{ color: 'var(--success-text)' }}>✓</span> {r.depois}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ========================================================= NÚMEROS DE IMPACTO */
function NumerosImpacto() {
  const nums = [
    { val: '+38%', label: 'no faturamento médio', desc: 'cliente pede mais quando não enfrenta fila' },
    { val: '–73%', label: 'tempo no caixa',        desc: 'Pix em 8s vs cartão em 30s+' },
    { val: '0',    label: 'comandas perdidas',     desc: 'tudo digital, com hash anti-fraude' },
    { val: '24h',  label: 'pra entrar no ar',      desc: 'cadastro, treinamento e setup completo' },
  ]
  return (
    <section className="py-24 relative" style={{ background: 'rgba(255,255,255,0.015)' }}>
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none"
        style={{ maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)' }} />
      <div className="max-w-7xl mx-auto px-5 lg:px-8 relative">
        <div className="text-center max-w-2xl mx-auto reveal">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black">
            Os números falam<br />
            <span className="gradient-text-vivid">por nós.</span>
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-14">
          {nums.map((n, i) => (
            <div key={i} className="stat-ring rounded-3xl p-7 text-center reveal" style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="text-5xl sm:text-6xl font-black gradient-text-vivid">{n.val}</div>
              <div className="text-sm font-bold mt-2 text-1">{n.label}</div>
              <div className="text-xs text-3 mt-1.5">{n.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ========================================================= PRICING */
function Pricing() {
  const plans = [
    {
      name: 'Start',
      price: '199',
      desc: 'Pra quem está começando ou faz eventos esporádicos.',
      features: ['Até 1.000 comandas/mês', '1 ponto de venda', 'Pix + cartão Mercado Pago', 'Painel admin completo', 'Suporte WhatsApp'],
      cta: 'Começar com Start',
      featured: false,
    },
    {
      name: 'Pro',
      price: '399',
      badge: 'Mais escolhido',
      desc: 'A escolha ideal pra bares e casas com movimento constante.',
      features: ['Comandas ilimitadas', 'Até 5 pontos de venda', 'Saída validada na portaria', 'Relatórios avançados', 'Divisão de conta', 'Suporte prioritário 24h'],
      cta: 'Quero o Pro',
      featured: true,
    },
    {
      name: 'Eventos',
      price: 'sob medida',
      desc: 'Festivais, shows e operações temporárias de grande porte.',
      features: ['Tudo do Pro', 'Multi-tenant com sub-eventos', 'Pulseira/cartão cashless', 'SLA dedicado', 'Equipe de suporte presencial', 'Custom branding'],
      cta: 'Falar com vendas',
      featured: false,
    },
  ]
  return (
    <section id="precos" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="text-center max-w-2xl mx-auto reveal">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
            Planos
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mt-3">
            Preço justo. Sem letras miúdas.
          </h2>
          <p className="text-2 mt-4 max-w-xl mx-auto">
            Sem fidelidade. Sem taxa de setup escondida. Cancele quando quiser.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-5 mt-14">
          {plans.map((p, i) => (
            <div key={i}
              className={`card p-7 relative reveal ${p.featured ? 'pricing-card-featured' : ''}`}
              style={{ transitionDelay: `${i * 100}ms` }}>
              {p.badge && (
                <div className="absolute -top-3 left-7 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)' }}>
                  {p.badge}
                </div>
              )}
              <div className="text-xs uppercase tracking-widest text-3 font-bold">{p.name}</div>
              <div className="mt-4 flex items-end gap-1">
                {p.price === 'sob medida' ? (
                  <div className="text-3xl font-black">Sob medida</div>
                ) : (
                  <>
                    <span className="text-2xl text-2 mb-1">R$</span>
                    <span className="text-6xl font-black leading-none">{p.price}</span>
                    <span className="text-sm text-3 ml-1.5 mb-2">/mês</span>
                  </>
                )}
              </div>
              <p className="text-sm text-2 mt-3 leading-relaxed">{p.desc}</p>
              <ul className="mt-6 space-y-2.5">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-sm">
                    <Check /> <span>{f}</span>
                  </li>
                ))}
              </ul>
              <a href={whatsappLink} target="_blank" rel="noreferrer"
                className={p.featured ? 'btn-primary-lg mt-7' : 'btn-ghost mt-7'}
                style={p.featured ? { background: 'linear-gradient(135deg,#7c3aed,#a855f7)' } : { width: '100%', justifyContent: 'center', padding: '0.875rem 1.5rem', fontSize: '1rem' }}>
                {p.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-3 mt-10 reveal">
          Taxa de cartão pelo Mercado Pago (não somos nós que cobramos). Pix sem taxa adicional.
        </p>
      </div>
    </section>
  )
}

/* ========================================================= DEPOIMENTOS */
function Depoimentos() {
  const items = [
    {
      quote: 'Na primeira sexta-feira já fizemos 22% a mais de faturamento. O cliente pede mais quando não precisa esperar.',
      name: 'Rafa Mendes', role: 'Sócio · Pub Underground', avatar: 'RM',
    },
    {
      quote: 'Acabou a história de comanda perdida. E a fila do caixa às 4h da manhã virou passado.',
      name: 'Camila Torres', role: 'Gerente · Club Lumière', avatar: 'CT',
    },
    {
      quote: 'Setup em uma tarde. Próxima festa, zero papel. O suporte respondeu até de madrugada quando precisei.',
      name: 'Diego Almeida', role: 'Produtor · Festival Onda', avatar: 'DA',
    },
  ]
  return (
    <section className="py-24 relative" style={{ background: 'rgba(255,255,255,0.015)' }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="text-center max-w-2xl mx-auto reveal">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
            Depoimentos
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mt-3">
            Quem usa, recomenda.
          </h2>
        </div>
        <div className="grid lg:grid-cols-3 gap-5 mt-14">
          {items.map((d, i) => (
            <div key={i} className="card p-7 reveal" style={{ transitionDelay: `${i * 100}ms` }}>
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <span key={j} style={{ color: '#fbbf24' }}>★</span>
                ))}
              </div>
              <p className="text-sm leading-relaxed text-1">"{d.quote}"</p>
              <div className="mt-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#ec4899)', color: '#fff' }}>
                  {d.avatar}
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-bold">{d.name}</div>
                  <div className="text-xs text-3">{d.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ========================================================= FAQ */
function FAQ() {
  const faqs = [
    {
      q: 'E se cair no sábado à noite?',
      a: 'Servidores com 99,9% de uptime monitorados 24/7. Suporte humano direto no WhatsApp em até 5 minutos para clientes Pro. Plano de contingência documentado: comandas em papel pré-numeradas que sincronizam quando o sistema voltar — você nunca para.',
    },
    {
      q: 'Preciso de internet o tempo todo?',
      a: 'Sim, o sistema é online por questão de segurança e tempo real. Recomendamos uma conexão principal + 4G de backup. Custo do backup: cerca de R$50/mês com plano de dados.',
    },
    {
      q: 'Funciona com a maquininha que eu já tenho?',
      a: 'Pix é o método principal e cai direto na sua conta Mercado Pago. Cartão também funciona via Mercado Pago. Se você quiser usar outra adquirente (Stone, Cielo, etc.), conversamos no plano Eventos.',
    },
    {
      q: 'O dinheiro cai aonde?',
      a: 'Direto na sua conta Mercado Pago. Pix instantâneo. Você transfere pra sua conta bancária quando quiser, sem custo de TED.',
    },
    {
      q: 'Quanto tempo pra começar?',
      a: 'Setup completo em até 24h: cadastro do estabelecimento, do cardápio, treinamento da equipe e impressão dos QR Codes. Sua próxima festa já roda no Gateway.',
    },
    {
      q: 'E os meus garçons? Vão ficar sem trabalho?',
      a: 'Pelo contrário. Eles param de correr atrás de comanda perdida e atendem mais mesas. O cliente pede pelo celular ou pelo garçom — você escolhe o modo.',
    },
    {
      q: 'Tem fidelidade?',
      a: 'Não. Cancele quando quiser, sem multa. A gente confia que o resultado segura você.',
    },
    {
      q: 'Preciso comprar tablet, impressora, alguma coisa?',
      a: 'Não obrigatório. O sistema roda em qualquer celular ou tablet que você já tem. Se preferir uma impressora térmica pra cozinha, indicamos modelos a partir de R$300.',
    },
  ]
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" className="py-24 relative">
      <div className="max-w-3xl mx-auto px-5 lg:px-8">
        <div className="text-center max-w-2xl mx-auto reveal">
          <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--accent)' }}>
            Perguntas frequentes
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mt-3">
            Tirando suas dúvidas.
          </h2>
        </div>
        <div className="mt-12 space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="card overflow-hidden reveal" style={{ transitionDelay: `${(i % 3) * 60}ms` }}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full px-5 sm:px-6 py-4 flex items-center justify-between text-left gap-4">
                <span className="font-bold text-sm sm:text-base">{f.q}</span>
                <span className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-transform"
                  style={{
                    background: 'var(--accent-subtle)',
                    color: 'var(--accent)',
                    transform: open === i ? 'rotate(45deg)' : 'rotate(0)',
                  }}>
                  +
                </span>
              </button>
              {open === i && (
                <div className="px-5 sm:px-6 pb-5 text-sm text-2 leading-relaxed anim-down">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ========================================================= GARANTIAS */
function Garantias() {
  const items = [
    { icon: '🛡️', title: '99,9% de uptime',     desc: 'Servidores monitorados 24/7 com Uptime Robot' },
    { icon: '💬', title: 'Suporte humano',       desc: 'WhatsApp direto. Resposta em minutos, não dias.' },
    { icon: '🔄', title: 'Plano de contingência',desc: 'Comandas em papel pré-numeradas que sincronizam depois' },
    { icon: '🔐', title: 'Dados criptografados', desc: 'JWT, HMAC-SHA256, Helmet, rate limit, CORS por origem' },
  ]
  return (
    <section className="py-20 relative" style={{ background: 'rgba(255,255,255,0.015)' }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="text-center max-w-2xl mx-auto reveal">
          <h2 className="text-2xl sm:text-3xl font-black">
            E se der problema na hora H?
          </h2>
          <p className="text-2 mt-3">A gente já pensou nisso por você.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          {items.map((it, i) => (
            <div key={i} className="card p-5 reveal" style={{ transitionDelay: `${i * 70}ms` }}>
              <div className="text-3xl mb-3">{it.icon}</div>
              <div className="font-black text-sm">{it.title}</div>
              <div className="text-xs text-2 mt-1.5 leading-relaxed">{it.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ========================================================= CTA FINAL */
function CtaFinal() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[700px] h-[500px] hero-glow-1" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] hero-glow-2" />
      </div>
      <div className="relative max-w-4xl mx-auto px-5 lg:px-8 text-center reveal">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight">
          Sua próxima sexta<br />
          <span className="gradient-text-vivid">pode ser sem fila.</span>
        </h2>
        <p className="text-lg text-2 mt-6 max-w-xl mx-auto">
          Agende uma demonstração de 15 minutos. A gente te mostra o sistema rodando
          com os dados da sua casa em tempo real.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
          <a href={whatsappLink} target="_blank" rel="noreferrer"
            className="btn-primary-lg sm:w-auto sm:px-8"
            style={{ background: 'linear-gradient(135deg,#25d366,#128c7e)' }}>
            <WhatsappIcon className="w-5 h-5" />
            Falar no WhatsApp agora
          </a>
          <Link href="/login" className="btn-ghost sm:w-auto sm:px-7 sm:py-3.5">
            Já sou cliente · Entrar
          </Link>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-3">
          <span className="flex items-center gap-1.5"><Check small /> Demonstração gratuita</span>
          <span className="flex items-center gap-1.5"><Check small /> Sem cartão de crédito</span>
          <span className="flex items-center gap-1.5"><Check small /> Resposta em até 1h</span>
        </div>
      </div>
    </section>
  )
}

/* ========================================================= FOOTER */
function Footer() {
  return (
    <footer className="border-t border-base pt-12 pb-8" style={{ background: 'rgba(0,0,0,0.3)' }}>
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>⚡</div>
              <div className="leading-tight">
                <div className="text-base font-black">Gateway</div>
                <div className="text-[10px] text-3 -mt-0.5 tracking-widest uppercase">JR Solution</div>
              </div>
            </div>
            <p className="text-xs text-3 leading-relaxed">
              Comandas digitais com Pix em segundos para casas noturnas, bares e eventos.
            </p>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-3 mb-3">Produto</div>
            <ul className="space-y-2 text-sm text-2">
              <li><a href="#como-funciona" className="hover:text-1">Como funciona</a></li>
              <li><a href="#features"        className="hover:text-1">Recursos</a></li>
              <li><a href="#painel"          className="hover:text-1">Painéis</a></li>
              <li><a href="#precos"          className="hover:text-1">Preços</a></li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-3 mb-3">Suporte</div>
            <ul className="space-y-2 text-sm text-2">
              <li><a href="#faq" className="hover:text-1">FAQ</a></li>
              <li><a href={whatsappLink} target="_blank" rel="noreferrer" className="hover:text-1">WhatsApp</a></li>
              <li><Link href="/login" className="hover:text-1">Área do cliente</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-3 mb-3">Fale com a gente</div>
            <a href={whatsappLink} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold mb-3"
              style={{ color: 'var(--accent)' }}>
              <WhatsappIcon className="w-4 h-4" /> Atendimento WhatsApp
            </a>
            <p className="text-xs text-3">Respondemos de segunda a domingo, das 10h às 02h.</p>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-base flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-3">© 2026 JR Solution · Gateway. Todos os direitos reservados.</p>
          <p className="text-xs text-3">Feito no Brasil 🇧🇷 com Pix nativo.</p>
        </div>
      </div>
    </footer>
  )
}

/* ========================================================= WHATSAPP FLOAT */
function WhatsAppFloat() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-50 transition-all duration-300"
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.85)',
        pointerEvents: show ? 'auto' : 'none',
      }}
    >
      <div className="relative">
        <span className="absolute inset-0 rounded-full"
          style={{ background: '#25d366', animation: 'pulseRing 1.8s ease infinite' }} />
        <div className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl"
          style={{ background: 'linear-gradient(135deg,#25d366,#128c7e)' }}>
          <WhatsappIcon className="w-7 h-7 text-white" />
        </div>
      </div>
    </a>
  )
}

/* ========================================================= ICONS */
function Check({ small }: { small?: boolean } = {}) {
  return (
    <span className={`inline-flex items-center justify-center rounded-full flex-shrink-0 ${small ? 'w-3.5 h-3.5' : 'w-4 h-4'}`}
      style={{ background: 'var(--success-subtle)', color: 'var(--success-text)', border: '1px solid var(--success-border)' }}>
      <svg className={small ? 'w-2 h-2' : 'w-2.5 h-2.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
      </svg>
    </span>
  )
}

function WhatsappIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.595 5.39l-.999 3.648 3.893-1.337zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.296-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
    </svg>
  )
}

function QrIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" />
    </svg>
  )
}
function ChatIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}
function ShieldIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}
function PixIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}
function BoltIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}
function ChartIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}
function DevicesIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  )
}
function UsersIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
}
function CardIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )
}
function DivisaoIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  )
}
