import type { AuthService, CredenciaisLogin, DadosCadastro, Sessao, Usuario } from './types'
import { CHAVES, ehObjeto, gravarJSON, lerJSON, remover } from '@/services/storage/localStore'

/**
 * AUTENTICAÇÃO SIMULADA / DEMONSTRATIVA — não oferece segurança real.
 *
 * Nenhuma chamada de rede: usuários (inclusive a senha, em texto puro) e a
 * sessão ficam no armazenamento do navegador. Qualquer pessoa com acesso ao
 * navegador pode ler ou alterar esses dados. O objetivo é dar ao front-end
 * um fluxo completo e coerente (login, cadastro, sessão, logout, rotas
 * protegidas) enquanto não existe backend.
 *
 * Quando houver uma API, crie um httpAuthService.ts implementando a mesma
 * interface AuthService e troque a instância em src/auth/AuthContext.tsx.
 */

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

function ehListaUsuarios(v: unknown): v is UsuarioArmazenado[] {
  return (
    Array.isArray(v) &&
    v.every((u) => ehObjeto(u) && typeof u.id === 'string' && typeof u.email === 'string')
  )
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

function lerUsuarios(): UsuarioArmazenado[] {
  const usuarios = lerJSON(CHAVES.usuarios, ehListaUsuarios) ?? []
  if (usuarios.some((u) => u.email === USUARIO_DEMO.email)) return usuarios
  const comDemo = [...usuarios, USUARIO_DEMO]
  gravarJSON(CHAVES.usuarios, comDemo)
  return comDemo
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

function abrirSessao(usuario: Usuario, persistente: boolean): Sessao {
  const sessao: Sessao = {
    usuario,
    token: gerarToken(),
    criadoEm: new Date().toISOString(),
    persistente,
  }
  // "Manter conectado" → localStorage; caso contrário a sessão morre com a aba/navegador.
  remover(CHAVES.sessao, 'local')
  remover(CHAVES.sessao, 'sessao')
  gravarJSON(CHAVES.sessao, sessao, persistente ? 'local' : 'sessao')
  return sessao
}

class MockAuthService implements AuthService {
  async login({ email, senha, manterConectado = true }: CredenciaisLogin): Promise<Sessao> {
    await atraso()
    const encontrado = lerUsuarios().find((u) => u.email.toLowerCase() === email.trim().toLowerCase())
    if (!encontrado || encontrado.senha !== senha) {
      throw new Error('E-mail ou senha inválidos.')
    }
    const { senha: _senha, ...usuario } = encontrado
    return abrirSessao(usuario, manterConectado)
  }

  async registrar(dados: DadosCadastro): Promise<Sessao> {
    await atraso()
    const usuarios = lerUsuarios()
    if (usuarios.some((u) => u.email.toLowerCase() === dados.email.trim().toLowerCase())) {
      throw new Error('Já existe uma conta com este e-mail.')
    }
    const novo: UsuarioArmazenado = {
      id: gerarId(),
      nome: dados.nome.trim(),
      email: dados.email.trim(),
      empresa: dados.empresa,
      senha: dados.senha,
    }
    gravarJSON(CHAVES.usuarios, [...usuarios, novo])
    const { senha: _senha, ...usuario } = novo
    return abrirSessao(usuario, true)
  }

  async logout(): Promise<void> {
    await atraso(150)
    remover(CHAVES.sessao, 'local')
    remover(CHAVES.sessao, 'sessao')
  }

  async sessaoAtual(): Promise<Sessao | null> {
    const sessao = lerJSON(CHAVES.sessao, ehSessao, 'local') ?? lerJSON(CHAVES.sessao, ehSessao, 'sessao')
    // Sessões gravadas antes do campo "persistente" existir eram sempre em localStorage.
    return sessao
      ? { ...sessao, persistente: typeof sessao.persistente === 'boolean' ? sessao.persistente : true }
      : null
  }
}

export const mockAuthService: AuthService = new MockAuthService()
