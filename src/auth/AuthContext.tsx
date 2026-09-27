import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { httpAuthService } from './httpAuthService'
import type { CredenciaisLogin, DadosCadastro, Sessao, Usuario } from './types'
import { criarRepositorioHttpAuditoria } from '@/services/audit/httpAuditRepository'
import { CHAVES } from '@/services/storage/localStore'

interface AuthContextValue {
  usuario: Usuario | null
  sessao: Sessao | null
  carregando: boolean
  entrar(credenciais: CredenciaisLogin): Promise<void>
  cadastrar(dados: DadosCadastro): Promise<void>
  sair(): Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Ponto único de injeção do serviço de autenticação: troque aqui quando
// existir um backend real, sem tocar em nenhuma tela.
const authService = httpAuthService

function registrarSessao(_usuario: Usuario, action: 'LOGIN' | 'LOGOUT') {
  criarRepositorioHttpAuditoria()
    .registrar({
      scenario: null,
      category: 'sessao',
      entity: 'sessao',
      field: null,
      previousValue: null,
      newValue: null,
      action,
      summary: action === 'LOGIN' ? 'Sessão iniciada' : 'Sessão encerrada',
    })
    .catch(() => {})
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    authService.sessaoAtual().then((s) => {
      setSessao(s)
      setCarregando(false)
    })
  }, [])

  // Logout (ou login) feito em outra aba reflete aqui também.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CHAVES.sessao || e.key === null) {
        authService.sessaoAtual().then(setSessao)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario: sessao?.usuario ?? null,
      sessao,
      carregando,
      async entrar(credenciais) {
        const nova = await authService.login(credenciais)
        registrarSessao(nova.usuario, 'LOGIN')
        setSessao(nova)
      },
      async cadastrar(dados) {
        const nova = await authService.registrar(dados)
        registrarSessao(nova.usuario, 'LOGIN')
        setSessao(nova)
      },
      async sair() {
        if (sessao) registrarSessao(sessao.usuario, 'LOGOUT')
        await authService.logout()
        setSessao(null)
      },
    }),
    [sessao, carregando],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.')
  return ctx
}
