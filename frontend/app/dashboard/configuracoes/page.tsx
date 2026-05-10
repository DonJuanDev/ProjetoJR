'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/auth'
import { useTheme } from '@/contexts/theme'
interface TenantInfo {
  id: string; nome: string; slug: string; plano: string; ativo: boolean; mpPublicKey?: string
  logoImage?: string
  pixManualAtivo?: boolean; pixManualChave?: string; pixManualDescricao?: string; pixManualQrCodeImage?: string
}

type Section = 'geral' | 'pagamentos' | 'usuarios' | 'seguranca'

export default function ConfiguracoesPage() {
  const { user } = useAuth()
  const { theme, toggle, isDark } = useTheme()
  const [section, setSection] = useState<Section>('geral')
  const [tenant, setTenant] = useState<TenantInfo | null>(null)
  const [mpForm, setMpForm] = useState({ mpAccessToken: '', mpPublicKey: '', mpWebhookSecret: '' })
  const [savingMp, setSavingMp] = useState(false)
  const [mpSaved, setMpSaved] = useState(false)
  const [logoImage, setLogoImage] = useState('')
  const [savingLogo, setSavingLogo] = useState(false)
  const [logoSaved, setLogoSaved] = useState(false)
  const [nomeForm, setNomeForm] = useState('')
  const [savingNome, setSavingNome] = useState(false)
  const [nomeSaved, setNomeSaved] = useState(false)
  const [pixForm, setPixForm] = useState({ chave: '', descricao: '', ativo: false, qrCodeImage: '' })
  const [savingPix, setSavingPix] = useState(false)
  const [pixSaved, setPixSaved] = useState(false)
  const [novoUsuario, setNovoUsuario] = useState({ nome: '', email: '', senha: '', role: 'STAFF' })
  const [criandoUser, setCriandoUser] = useState(false)
  const [userCreated, setUserCreated] = useState(false)

  useEffect(() => {
    api.get<TenantInfo>('/tenants/me').then(t => {
      setTenant(t)
      if (t.mpPublicKey) setMpForm(f => ({ ...f, mpPublicKey: t.mpPublicKey || '' }))
      setLogoImage(t.logoImage || '')
      setNomeForm(t.nome || '')
      setPixForm({ chave: t.pixManualChave || '', descricao: t.pixManualDescricao || '', ativo: t.pixManualAtivo || false, qrCodeImage: t.pixManualQrCodeImage || '' })
    }).catch(() => {})
  }, [])

  async function salvarMp() {
    setSavingMp(true)
    try {
      await api.put('/tenants/mp-credentials', mpForm)
      setMpSaved(true)
      setTimeout(() => setMpSaved(false), 3000)
    } catch (e: any) { alert(e.message) }
    finally { setSavingMp(false) }
  }

  async function salvarNome() {
    if (!nomeForm.trim()) return
    setSavingNome(true)
    try {
      await api.put('/tenants/info', { nome: nomeForm.trim() })
      setNomeSaved(true)
      setTimeout(() => setNomeSaved(false), 3000)
    } catch (e: any) { alert(e.message) }
    finally { setSavingNome(false) }
  }

  async function salvarLogo(imagem: string | null) {
    setSavingLogo(true)
    try {
      await api.put('/tenants/logo', { logoImage: imagem || undefined })
      setLogoImage(imagem || '')
      setLogoSaved(true)
      setTimeout(() => setLogoSaved(false), 3000)
    } catch (e: any) { alert(e.message) }
    finally { setSavingLogo(false) }
  }

  async function salvarPix() {
    setSavingPix(true)
    try {
      await api.put('/tenants/pix-manual', {
        ativo: pixForm.ativo,
        chave: pixForm.chave || undefined,
        descricao: pixForm.descricao || undefined,
        qrCodeImage: pixForm.qrCodeImage || undefined,
      })
      setPixSaved(true)
      setTimeout(() => setPixSaved(false), 3000)
    } catch (e: any) { alert(e.message) }
    finally { setSavingPix(false) }
  }

  async function criarUsuario() {
    if (!novoUsuario.email || !novoUsuario.senha || !novoUsuario.nome) return
    setCriandoUser(true)
    try {
      // POST /api/usuarios (endpoint a adicionar, usar tenants como workaround)
      alert('Funcionalidade de criação de usuário: implemente POST /api/usuarios no backend conforme necessário.')
      setUserCreated(true)
      setTimeout(() => setUserCreated(false), 3000)
    } catch (e: any) { alert(e.message) }
    finally { setCriandoUser(false) }
  }

  const TABS: { key: Section; label: string }[] = [
    { key: 'geral', label: 'Geral' },
    { key: 'pagamentos', label: 'Pagamentos' },
    { key: 'usuarios', label: 'Usuários' },
    { key: 'seguranca', label: 'Aparência' },
  ]

  return (
    <div className="space-y-5 max-w-3xl pb-8">
      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl anim-up stagger-1" style={{ background: 'var(--bg-input)' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setSection(t.key)}
            className="flex-1 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all sm:text-sm"
            style={section === t.key
              ? { background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 12px var(--accent-glow)' }
              : { color: 'var(--text-2)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Geral */}
      {section === 'geral' && (
        <div className="space-y-4 anim-up">
        <div className="card p-6 space-y-5">
          <h2 className="font-bold" style={{ color: 'var(--text-1)' }}>Logo do Estabelecimento</h2>

          <div className="flex items-center gap-5">
            {/* Preview da logo */}
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden border-2 transition-all"
              style={{ borderColor: logoImage ? 'var(--accent-border)' : 'var(--border)', background: 'var(--bg-input)' }}>
              {logoImage
                ? <img src={logoImage} alt="Logo" className="w-full h-full object-contain p-1" />
                : <span className="text-3xl">🏪</span>
              }
            </div>

            <div className="flex-1 space-y-2">
              <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>
                {logoImage ? 'Logo carregada' : 'Nenhuma logo configurada'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                Aparece no painel, na comanda do cliente e nas telas do sistema.<br/>
                PNG, JPG ou SVG · Recomendado: fundo transparente (PNG)
              </p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  disabled={savingLogo}
                  className="btn-primary text-sm py-2 px-4">
                  {savingLogo ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin"/>Salvando...</> : '📷 Enviar logo'}
                </button>
                {logoImage && (
                  <button
                    onClick={() => salvarLogo(null)}
                    disabled={savingLogo}
                    className="text-sm py-2 px-4 rounded-xl transition-all"
                    style={{ background: 'var(--danger-subtle)', color: 'var(--danger-text)' }}>
                    🗑️ Remover
                  </button>
                )}
              </div>
              {logoSaved && (
                <p className="text-xs font-semibold" style={{ color: 'var(--success-text)' }}>✅ Logo salva!</p>
              )}
            </div>
          </div>

          <input
            id="logo-upload"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (!file) return
              if (file.size > 3 * 1024 * 1024) { alert('Imagem muito grande. Máximo 3MB.'); return }
              const reader = new FileReader()
              reader.onload = ev => salvarLogo(ev.target?.result as string)
              reader.readAsDataURL(file)
              e.target.value = ''
            }}
          />
        </div>

        <div className="card p-6 space-y-5">
          <h2 className="font-bold" style={{ color: 'var(--text-1)' }}>Informações do Estabelecimento</h2>

          {/* Nome editável */}
          <div>
            <label className="input-label">Nome da loja</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={nomeForm}
                onChange={e => setNomeForm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && salvarNome()}
                placeholder="Nome do seu estabelecimento"
                className="input flex-1"
              />
              <button
                onClick={salvarNome}
                disabled={savingNome || !nomeForm.trim() || nomeForm.trim() === tenant?.nome}
                className="btn-primary px-4 flex-shrink-0">
                {savingNome
                  ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"/>
                  : '💾'}
              </button>
            </div>
            {nomeSaved && <p className="text-xs mt-1.5 font-semibold" style={{ color: 'var(--success-text)' }}>✅ Nome salvo!</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <InfoField label="Slug" value={tenant?.slug || '—'} mono />
            <InfoField label="Plano" value={tenant?.plano || 'basic'} badge />
            <InfoField label="Status" value={tenant?.ativo ? 'Ativo' : 'Inativo'} badge color={tenant?.ativo ? 'success' : 'danger'} />
          </div>

          <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-1)' }}>Seu usuário</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <InfoField label="Nome" value={user?.nome || '—'} />
              <InfoField label="Email" value={user?.email || '—'} mono />
              <InfoField label="Perfil" value={user?.role || '—'} badge />
              <InfoField label="Tenant ID" value={user?.tenantId?.substring(0, 16) + '...' || '—'} mono />
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Mercado Pago */}
      {section === 'pagamentos' && (
        <div className="space-y-4 anim-up">
          <div className="card p-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: 'var(--accent-subtle)', border: '1px solid var(--accent-border)' }}>💳</div>
              <div>
                <h2 className="font-bold" style={{ color: 'var(--text-1)' }}>Mercado Pago</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
                  Configure as credenciais para receber pagamentos via Pix e Cartão.{' '}
                  <a href="https://www.mercadopago.com.br/developers" target="_blank" rel="noopener noreferrer"
                    className="font-semibold" style={{ color: 'var(--accent)' }}>
                    Obtenha suas credenciais →
                  </a>
                </p>
              </div>
            </div>

            <div className="rounded-2xl p-4 space-y-1 text-xs" style={{ background: 'var(--warning-subtle)', border: '1px solid var(--warning-border)', color: 'var(--warning-text)' }}>
              <p className="font-bold">⚠️ Sobre credenciais</p>
              <p>Use tokens de <strong>TESTE</strong> (prefixo TEST-) para desenvolvimento. Tokens de produção cobram pagamentos reais.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="input-label">Access Token</label>
                <input type="password" placeholder="TEST-xxxx ou APP_USR-xxxx" value={mpForm.mpAccessToken}
                  onChange={e => setMpForm(f => ({ ...f, mpAccessToken: e.target.value }))} className="input font-mono text-xs" />
              </div>
              <div>
                <label className="input-label">Public Key</label>
                <input type="text" placeholder="TEST-xxxx ou APP_USR-xxxx" value={mpForm.mpPublicKey}
                  onChange={e => setMpForm(f => ({ ...f, mpPublicKey: e.target.value }))} className="input font-mono text-xs" />
              </div>
              <div>
                <label className="input-label">Webhook Secret (opcional)</label>
                <input type="password" placeholder="Chave para validar webhooks" value={mpForm.mpWebhookSecret}
                  onChange={e => setMpForm(f => ({ ...f, mpWebhookSecret: e.target.value }))} className="input font-mono text-xs" />
              </div>
            </div>

            {mpSaved && (
              <div className="p-3 rounded-xl text-sm font-semibold anim-scale"
                style={{ background: 'var(--success-subtle)', border: '1px solid var(--success-border)', color: 'var(--success-text)' }}>
                ✅ Credenciais salvas com sucesso!
              </div>
            )}

            <button onClick={salvarMp} disabled={savingMp || !mpForm.mpAccessToken || !mpForm.mpPublicKey} className="btn-primary">
              {savingMp ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Salvando...</> : '💾 Salvar Credenciais'}
            </button>
          </div>

          {/* Pix Manual */}
          <div className="card p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>⚡</div>
                <div>
                  <h2 className="font-bold" style={{ color: 'var(--text-1)' }}>Pix Manual</h2>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
                    Use sua própria chave Pix. O cliente copia a chave e você aprova o pagamento manualmente.
                  </p>
                </div>
              </div>
              {/* Toggle ativo/inativo */}
              <button
                onClick={() => setPixForm(f => ({ ...f, ativo: !f.ativo }))}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 transition-all"
                style={pixForm.ativo
                  ? { background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-border)' }
                  : { background: 'var(--bg-input)', color: 'var(--text-3)', border: '1px solid var(--border)' }}>
                <div className={`w-3 h-3 rounded-full transition-colors ${pixForm.ativo ? 'bg-green-400' : 'bg-gray-500'}`} />
                {pixForm.ativo ? 'Habilitado' : 'Desabilitado'}
              </button>
            </div>

            {pixForm.ativo && (
              <div className="rounded-2xl p-3 text-xs" style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success-text)' }}>
                ✅ Pix Manual ativo — os clientes verão a opção de pagar via sua chave Pix
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="input-label">Chave Pix</label>
                <input
                  type="text"
                  placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                  value={pixForm.chave}
                  onChange={e => setPixForm(f => ({ ...f, chave: e.target.value }))}
                  className="input font-mono text-sm"
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                  Esta chave será exibida para o cliente copiar e fazer o pagamento no app do banco.
                </p>
              </div>
              <div>
                <label className="input-label">Nome exibido ao cliente (opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Bar do João / CNPJ: 00.000.000/0001-00"
                  value={pixForm.descricao}
                  onChange={e => setPixForm(f => ({ ...f, descricao: e.target.value }))}
                  className="input"
                />
              </div>

              {/* Upload da imagem do QR Code */}
              <div>
                <label className="input-label">Imagem do QR Code Pix</label>
                <div
                  className="mt-1 rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden"
                  style={{ borderColor: pixForm.qrCodeImage ? 'var(--success-border)' : 'var(--border)', background: 'var(--bg-input)' }}
                  onClick={() => document.getElementById('pix-qr-upload')?.click()}
                >
                  {pixForm.qrCodeImage ? (
                    <div className="flex items-center gap-4 p-4">
                      <img
                        src={pixForm.qrCodeImage}
                        alt="QR Code Pix"
                        className="w-28 h-28 object-contain rounded-xl bg-white p-1 flex-shrink-0 shadow"
                      />
                      <div className="flex-1 min-w-0 space-y-2">
                        <p className="text-sm font-semibold" style={{ color: 'var(--success-text)' }}>✅ QR Code carregado</p>
                        <p className="text-xs" style={{ color: 'var(--text-3)' }}>É isso que o cliente vai ver na tela de pagamento.</p>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); setPixForm(f => ({ ...f, qrCodeImage: '' })) }}
                          className="text-xs px-3 py-1.5 rounded-lg transition-all"
                          style={{ background: 'var(--danger-subtle)', color: 'var(--danger-text)' }}>
                          🗑️ Remover imagem
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 text-center">
                      <div className="text-3xl">📷</div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>Clique para enviar o QR Code</p>
                      <p className="text-xs" style={{ color: 'var(--text-3)' }}>PNG, JPG ou JPEG · Tamanho máximo 2MB</p>
                    </div>
                  )}
                </div>
                <input
                  id="pix-qr-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    if (file.size > 2 * 1024 * 1024) { alert('Imagem muito grande. Máximo 2MB.'); return }
                    const reader = new FileReader()
                    reader.onload = ev => setPixForm(f => ({ ...f, qrCodeImage: ev.target?.result as string }))
                    reader.readAsDataURL(file)
                    e.target.value = ''
                  }}
                />
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-3)' }}>
                  💡 Salve uma captura de tela do QR Code do seu banco e faça o upload aqui.
                </p>
              </div>
            </div>

            {pixSaved && (
              <div className="p-3 rounded-xl text-sm font-semibold anim-scale"
                style={{ background: 'var(--success-subtle)', border: '1px solid var(--success-border)', color: 'var(--success-text)' }}>
                ✅ Configuração de Pix salva!
              </div>
            )}

            <button onClick={salvarPix} disabled={savingPix || (pixForm.ativo && !pixForm.chave.trim() && !pixForm.qrCodeImage)} className="btn-primary">
              {savingPix
                ? <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Salvando...</>
                : '💾 Salvar configuração Pix'}
            </button>
          </div>

          {/* Webhook info */}
          <div className="card p-6 space-y-3">
            <h3 className="font-bold" style={{ color: 'var(--text-1)' }}>🔗 Configuração do Webhook</h3>
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>
              Configure a URL abaixo no painel do Mercado Pago em <strong>Suas aplicações → Webhooks → Evento: payment</strong>
            </p>
            <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
              <code className="text-xs flex-1 break-all" style={{ color: 'var(--accent)' }}>
                {process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'}/api/pagamentos/webhook
              </code>
              <button onClick={() => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'}/api/pagamentos/webhook`)}
                className="btn-ghost text-xs flex-shrink-0">Copiar</button>
            </div>
            <div className="rounded-xl p-3 text-xs space-y-1" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
              <p className="font-bold" style={{ color: 'var(--text-2)' }}>Para desenvolvimento local com ngrok:</p>
              <code className="block" style={{ color: 'var(--accent)' }}>ngrok http 3001</code>
              <p style={{ color: 'var(--text-3)' }}>Use a URL gerada (https://abc.ngrok.io) como BACKEND_URL no .env</p>
            </div>
          </div>
        </div>
      )}

      {/* Usuários */}
      {section === 'usuarios' && (
        <div className="space-y-4 anim-up">
          <div className="card p-6 space-y-5">
            <h2 className="font-bold" style={{ color: 'var(--text-1)' }}>Criar Novo Usuário</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Nome</label>
                <input type="text" placeholder="Nome completo" value={novoUsuario.nome}
                  onChange={e => setNovoUsuario(f => ({ ...f, nome: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="input-label">E-mail</label>
                <input type="email" placeholder="email@exemplo.com" value={novoUsuario.email}
                  onChange={e => setNovoUsuario(f => ({ ...f, email: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="input-label">Senha</label>
                <input type="password" placeholder="Senha segura" value={novoUsuario.senha}
                  onChange={e => setNovoUsuario(f => ({ ...f, senha: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="input-label">Perfil</label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {[
                    { value: 'ADMIN',     label: '👑 Admin' },
                    { value: 'GERENTE',   label: '🎯 Gerente' },
                    { value: 'STAFF',     label: '🍻 Garçom' },
                    { value: 'SEGURANCA', label: '🚪 Saída' },
                  ].map(r => (
                    <button key={r.value} onClick={() => setNovoUsuario(f => ({ ...f, role: r.value }))}
                      className="py-2 px-3 rounded-xl text-xs font-semibold transition-all"
                      style={novoUsuario.role === r.value
                        ? { background: 'var(--accent)', color: '#fff' }
                        : { background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={criarUsuario} disabled={criandoUser} className="btn-primary">
              {criandoUser ? '...' : '➕ Criar Usuário'}
            </button>
          </div>

          {/* Roles info */}
          <div className="card p-6 space-y-3">
            <h3 className="font-bold" style={{ color: 'var(--text-1)' }}>📋 Permissões por Perfil</h3>
            <div className="space-y-2">
              {[
                { role: '👑 Admin',     desc: 'Acesso total: dashboard, relatórios, configurações, todos os módulos' },
                { role: '🎯 Gerente',   desc: 'Acesso ao dashboard, comandas, pedidos e relatórios. Sem configurações' },
                { role: '🍻 Garçom',    desc: 'Apenas lançar pedidos e criar comandas' },
                { role: '🚪 Segurança', desc: 'Apenas validação de saída (portaria)' },
              ].map(r => (
                <div key={r.role} className="flex items-start gap-3 py-2.5 px-3 rounded-xl" style={{ background: 'var(--bg-input)' }}>
                  <span className="font-bold text-sm flex-shrink-0" style={{ color: 'var(--text-1)' }}>{r.role}</span>
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>{r.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Aparência */}
      {section === 'seguranca' && (
        <div className="space-y-4 anim-up">
          <div className="card p-6 space-y-5">
            <h2 className="font-bold" style={{ color: 'var(--text-1)' }}>🎨 Aparência</h2>
            <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
              <div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Tema do painel</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Alterne entre tema escuro e claro</p>
              </div>
              <button onClick={toggle}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all"
                style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 12px var(--accent-glow)' }}>
                {isDark ? '☀️ Tema Claro' : '🌙 Tema Escuro'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Tema Escuro',  desc: 'Ideal para ambientes com pouca luz (boates, bares)', icon: '🌙', t: 'dark' as const },
                { label: 'Tema Claro',   desc: 'Ideal para escritório e luz do dia', icon: '☀️', t: 'light' as const },
              ].map(opt => (
                <div key={opt.t}
                  onClick={() => { if (theme !== opt.t) toggle() }}
                  className="p-4 rounded-2xl cursor-pointer transition-all"
                  style={{
                    border: `2px solid ${theme === opt.t ? 'var(--accent)' : 'var(--border)'}`,
                    background: theme === opt.t ? 'var(--accent-subtle)' : 'var(--bg-input)',
                  }}>
                  <p className="text-2xl mb-2">{opt.icon}</p>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>{opt.label}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{opt.desc}</p>
                  {theme === opt.t && (
                    <p className="text-xs font-bold mt-2" style={{ color: 'var(--accent)' }}>✓ Ativo</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sobre */}
          <div className="card p-6 space-y-3">
            <h3 className="font-bold" style={{ color: 'var(--text-1)' }}>ℹ️ Sobre o Sistema</h3>
            <div className="grid grid-cols-2 gap-3">
              <InfoField label="Versão" value="1.0.0 MVP" />
              <InfoField label="Stack" value="NestJS + Next.js" />
              <InfoField label="Pagamentos" value="Mercado Pago" />
              <InfoField label="Banco" value="PostgreSQL / SQLite" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoField({ label, value, mono, badge, color }: {
  label: string; value: string; mono?: boolean; badge?: boolean; color?: 'success' | 'danger'
}) {
  return (
    <div>
      <label className="input-label">{label}</label>
      <div className="mt-1">
        {badge ? (
          <span className={color === 'success' ? 'badge-aberta' : color === 'danger' ? 'badge-bloqueada' : 'badge-paga'}>
            {value}
          </span>
        ) : (
          <p className={`text-sm font-semibold ${mono ? 'font-mono' : ''}`} style={{ color: 'var(--text-1)' }}>{value}</p>
        )}
      </div>
    </div>
  )
}
