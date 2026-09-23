import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

function CarregandoSessao() {
  return (
    <div className="flex min-h-svh items-center justify-center" role="status" aria-label="Carregando sessão">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
    </div>
  )
}

/**
 * Guarda de rota do front-end. Com a autenticação simulada, isso controla
 * apenas a navegação; não protege dados, que já estão no navegador.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAuth()
  const location = useLocation()

  if (carregando) return <CarregandoSessao />
  if (!usuario) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

/** Login e cadastro não fazem sentido com sessão aberta. */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAuth()
  const location = useLocation()
  const destino = (location.state as { from?: string } | null)?.from ?? '/app'
  if (carregando) return <CarregandoSessao />
  if (usuario) return <Navigate to={destino} replace />
  return <>{children}</>
}
