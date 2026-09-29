/**
 * Único ponto de acesso HTTP ao backend. As três implementações HTTP
 * (auth, planejamentos, auditoria) passam por aqui — nenhuma delas chama
 * fetch diretamente.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  status: number
  constructor(status: number, mensagem: string) {
    super(mensagem)
    this.status = status
  }
}

export class ErroAutenticacao extends ApiError {}

let obterToken: () => string | null = () => null

export function definirObtentorToken(fn: () => string | null): void {
  obterToken = fn
}

export async function apiFetch<T>(caminho: string, opcoes: RequestInit = {}): Promise<T> {
  const token = obterToken()
  const resposta = await fetch(`${BASE_URL}${caminho}`, {
    ...opcoes,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opcoes.headers,
    },
  })
  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => null)
    const mensagem = corpo?.detail ?? `Erro ${resposta.status}`
    if (resposta.status === 401) throw new ErroAutenticacao(resposta.status, mensagem)
    throw new ApiError(resposta.status, mensagem)
  }
  if (resposta.status === 204) return undefined as T
  return resposta.json()
}
