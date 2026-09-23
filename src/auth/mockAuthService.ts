import type { AuthService, CredenciaisLogin, DadosCadastro, Sessao, Usuario } from './types'

/**
 * Implementação mock do AuthService: nenhuma chamada de rede, tudo em
 * localStorage. Existe para dar uma base de front-end completa e coerente
 * (telas, formulários, estados de erro, sessão persistida) enquanto o
 * back-end real não existe.
 *
 * Quando houver uma API, crie um httpAuthService.ts implementando a mesma
 * interface AuthService (fetch/axios no lugar do localStorage) e troque a
 * instância exportada em src/auth/AuthContext.tsx — nenhuma tela muda.
 */

const CHAVE_USUARIOS = 'dfc-planner:usuarios'
const CHAVE_SESSAO = 'dfc-planner:sessao'

interface UsuarioArmazenado extends Usuario {
  senha: string
}

const USUARIO_DEMO: UsuarioArmazenado = {
  id: 'usr_demo',
  nome: 'Conta de demonstração',
  email: 'demo@dfcplanner.app',
  empresa: 'Turma de Engenharia Econômica',
  senha: 'demo1234',
}

function lerUsuarios(): UsuarioArmazenado[] {
  try {
    const bruto = localStorage.getItem(CHAVE_USUARIOS)
    const usuarios = bruto ? (JSON.parse(bruto) as UsuarioArmazenado[]) : []
    if (!usuarios.some((u) => u.email === USUARIO_DEMO.email)) {
      const comDemo = [...usuarios, USUARIO_DEMO]
      salvarUsuarios(comDemo)
      return comDemo
    }
    return usuarios
  } catch {
    return [USUARIO_DEMO]
  }
}

function salvarUsuarios(usuarios: UsuarioArmazenado[]) {
  localStorage.setItem(CHAVE_USUARIOS, JSON.stringify(usuarios))
}

function gerarId(): string {
  return `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function gerarToken(): string {
  return `mock_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

// Pequeno atraso para simular latência de rede real (a UI já mostra estado de carregando).
function atraso(ms = 450) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

class MockAuthService implements AuthService {
  async login({ email, senha }: CredenciaisLogin): Promise<Sessao> {
    await atraso()
    const usuarios = lerUsuarios()
    const encontrado = usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (!encontrado || encontrado.senha !== senha) {
      throw new Error('E-mail ou senha inválidos.')
    }
    const { senha: _senha, ...usuario } = encontrado
    const sessao: Sessao = { usuario, token: gerarToken(), criadoEm: new Date().toISOString() }
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao))
    return sessao
  }

  async registrar(dados: DadosCadastro): Promise<Sessao> {
    await atraso()
    const usuarios = lerUsuarios()
    if (usuarios.some((u) => u.email.toLowerCase() === dados.email.toLowerCase())) {
      throw new Error('Já existe uma conta com este e-mail.')
    }
    const novo: UsuarioArmazenado = {
      id: gerarId(),
      nome: dados.nome,
      email: dados.email,
      empresa: dados.empresa,
      senha: dados.senha,
    }
    salvarUsuarios([...usuarios, novo])
    const { senha: _senha, ...usuario } = novo
    const sessao: Sessao = { usuario, token: gerarToken(), criadoEm: new Date().toISOString() }
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao))
    return sessao
  }

  async logout(): Promise<void> {
    await atraso(150)
    localStorage.removeItem(CHAVE_SESSAO)
  }

  async sessaoAtual(): Promise<Sessao | null> {
    try {
      const bruto = localStorage.getItem(CHAVE_SESSAO)
      return bruto ? (JSON.parse(bruto) as Sessao) : null
    } catch {
      return null
    }
  }
}

export const mockAuthService: AuthService = new MockAuthService()
