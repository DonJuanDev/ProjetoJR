const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('gateway_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error(
      `Sem conexão com a API (${API_URL}). Em produção (Vercel + Railway): confira CORS no backend e ` +
        `FRONTEND_URL nas Variables do Railway; no navegador, veja F12 → Network/Console. Em dev local: suba o backend ` +
        `(npm run start:dev na pasta backend, porta 3001), use localhost no navegador e NEXT_PUBLIC_API_URL no .env.local.`,
    )
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}) as Record<string, unknown>)
    const raw = errBody.message
    const msg =
      typeof raw === 'string'
        ? raw
        : Array.isArray(raw)
          ? raw.join('; ')
          : typeof raw === 'object' && raw !== null && 'error' in raw && typeof (raw as { error: string }).error === 'string'
            ? (raw as { error: string }).error
            : 'Erro desconhecido'
    throw new Error(`${msg} [HTTP ${res.status}]`)
  }

  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

export function formatCurrency(value: number | string): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value))
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    ABERTA: 'Aberta',
    AGUARDANDO_PAGAMENTO: 'Aguardando Pagamento',
    PAGA: 'Paga',
    BLOQUEADA: 'Bloqueada',
    CANCELADA: 'Cancelada',
  }
  return map[status] || status
}
