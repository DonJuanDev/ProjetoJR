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
      `Sem conexão com a API (${API_URL}). Suba o backend na pasta backend com "npm run start:dev" (porta 3001), ` +
        `use o mesmo host no navegador (localhost ou 127.0.0.1) e confira NEXT_PUBLIC_API_URL no .env.local.`,
    )
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro desconhecido' }))
    throw new Error(err.message || `HTTP ${res.status}`)
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
