import type { AuthService, CredenciaisLogin, DadosCadastro, Sessao, Usuario } from './types'
import { apiFetch, definirObtentorToken } from '@/lib/httpClient'
import { CHAVES, ehObjeto, gravarJSON, lerJSON, remover } from '@/services/storage/localStore'

/**
 * Implementação real de AuthService, consumindo a API FastAPI. Único ponto
 * de troca em relação ao mockAuthService: veja AuthContext.tsx.
 */

interface RespostaAuth {
  usuario: Usuario
  token: string
}

export function ehSessao(v: unknown): v is Sessao {
  return (
    ehObjeto(v) &&
    typeof v.token === 'string' &&
    typeof v.criadoEm === 'string' &&
    ehObjeto(v.usuario) &&
    typeof v.usuario.id === 'string'
  )
}

function lerSessaoArmazenada(): Sessao | null {
  return lerJSON(CHAVES.sessao, ehSessao, 'local') ?? lerJSON(CHAVES.sessao, ehSessao, 'sessao')
}

function gravarSessao(sessao: Sessao): void {
  remover(CHAVES.sessao, 'local')
  remover(CHAVES.sessao, 'sessao')
  gravarJSON(CHAVES.sessao, sessao, sessao.persistente ? 'local' : 'sessao')
}

function montarSessao(resposta: RespostaAuth, persistente: boolean): Sessao {
  return { usuario: resposta.usuario, token: resposta.token, criadoEm: new Date().toISOString(), persistente }
}

class HttpAuthService implements AuthService {
  async login({ email, senha, manterConectado = true }: CredenciaisLogin): Promise<Sessao> {
    const resposta = await apiFetch<RespostaAuth>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    })
    const sessao = montarSessao(resposta, manterConectado)
    gravarSessao(sessao)
    return sessao
  }

  async registrar(dados: DadosCadastro): Promise<Sessao> {
    const resposta = await apiFetch<RespostaAuth>('/auth/registrar', {
      method: 'POST',
      body: JSON.stringify(dados),
    })
    const sessao = montarSessao(resposta, true)
    gravarSessao(sessao)
    return sessao
  }

  async logout(): Promise<void> {
    remover(CHAVES.sessao, 'local')
    remover(CHAVES.sessao, 'sessao')
  }

  async sessaoAtual(): Promise<Sessao | null> {
    return lerSessaoArmazenada()
  }
}

export const httpAuthService: AuthService = new HttpAuthService()
definirObtentorToken(() => lerSessaoArmazenada()?.token ?? null)
