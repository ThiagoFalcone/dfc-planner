import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { mockAuthService } from './mockAuthService'
import type { CredenciaisLogin, DadosCadastro, Usuario } from './types'

interface AuthContextValue {
  usuario: Usuario | null
  carregando: boolean
  entrar(credenciais: CredenciaisLogin): Promise<void>
  cadastrar(dados: DadosCadastro): Promise<void>
  sair(): Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Ponto único de injeção do serviço de autenticação — troque aqui quando
// existir um backend real, sem tocar em nenhuma tela.
const authService = mockAuthService

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    authService.sessaoAtual().then((sessao) => {
      setUsuario(sessao?.usuario ?? null)
      setCarregando(false)
    })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      carregando,
      async entrar(credenciais) {
        const sessao = await authService.login(credenciais)
        setUsuario(sessao.usuario)
      },
      async cadastrar(dados) {
        const sessao = await authService.registrar(dados)
        setUsuario(sessao.usuario)
      },
      async sair() {
        await authService.logout()
        setUsuario(null)
      },
    }),
    [usuario, carregando],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.')
  return ctx
}
