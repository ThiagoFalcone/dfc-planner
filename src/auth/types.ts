export interface Usuario {
  id: string
  nome: string
  email: string
  empresa?: string
}

export interface Sessao {
  usuario: Usuario
  token: string
  criadoEm: string
  /** true = "manter conectado" (sobrevive ao fechar o navegador). */
  persistente: boolean
}

export interface CredenciaisLogin {
  email: string
  senha: string
  manterConectado?: boolean
}

export interface DadosCadastro {
  nome: string
  email: string
  senha: string
  empresa?: string
}

/**
 * Contrato de autenticação. A implementação mock (mockAuthService) guarda
 * tudo no navegador; uma implementação futura para um backend real
 * (ex.: httpAuthService) troca só este arquivo; os componentes de tela e o
 * AuthContext não precisam mudar.
 */
export interface AuthService {
  login(credenciais: CredenciaisLogin): Promise<Sessao>
  registrar(dados: DadosCadastro): Promise<Sessao>
  logout(): Promise<void>
  sessaoAtual(): Promise<Sessao | null>
}
