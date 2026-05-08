import { api } from './api'

export interface PortariaValidacaoResult {
  valida: boolean
  status: string
  mensagem: string
  comanda?: { id: string; codigo: string; total: number }
}

/** Valida na portaria enviando texto cru (URL, hash do QR ou código #XXXXXX). */
export async function validarPortaria(raw: string): Promise<PortariaValidacaoResult> {
  const trimmed = raw.trim()
  if (trimmed.length < 2) {
    throw new Error('Informe pelo menos 2 caracteres.')
  }
  return api.post<PortariaValidacaoResult>('/comandas/validar', { raw: trimmed })
}
