import { lazy, Suspense, type ReactNode } from 'react'
import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthContext'
import { ProtectedRoute, PublicOnlyRoute } from '@/auth/ProtectedRoute'
import { ThemeProvider } from '@/theme/ThemeContext'
import { LoginPage } from '@/pages/auth/Login'
import { RegisterPage } from '@/pages/auth/Register'
import { PlannerLayout } from '@/pages/planner/PlannerLayout'
import { PlanejamentoPage } from '@/pages/planner/PlanejamentoPage'
import { AuditoriaPage } from '@/pages/planner/AuditoriaPage'

// Páginas com gráficos (Recharts) ou pouco acessadas carregam sob demanda.
const ResultadosPage = lazy(() => import('@/pages/planner/ResultadosPage').then((m) => ({ default: m.ResultadosPage })))
const CenariosPage = lazy(() => import('@/pages/planner/CenariosPage').then((m) => ({ default: m.CenariosPage })))
const SensibilidadePage = lazy(() => import('@/pages/planner/SensibilidadePage').then((m) => ({ default: m.SensibilidadePage })))
const ProjetosPage = lazy(() => import('@/pages/planner/ProjetosPage').then((m) => ({ default: m.ProjetosPage })))
const RelatorioPage = lazy(() => import('@/pages/planner/RelatorioPage').then((m) => ({ default: m.RelatorioPage })))

function Carregando({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-[18px] bg-hover" aria-label="Carregando" />}>
      {children}
    </Suspense>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/app" replace />} />
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/registrar"
              element={
                <PublicOnlyRoute>
                  <RegisterPage />
                </PublicOnlyRoute>
              }
            />
            <Route path="/entrar" element={<Navigate to="/login" replace />} />
            <Route
              path="/relatorio"
              element={
                <ProtectedRoute>
                  <Suspense fallback={null}>
                    <RelatorioPage />
                  </Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <PlannerLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="planejamento" replace />} />
              <Route path="planejamento" element={<PlanejamentoPage />} />
              <Route path="resultados" element={<Carregando><ResultadosPage /></Carregando>} />
              <Route path="cenarios" element={<Carregando><CenariosPage /></Carregando>} />
              <Route path="sensibilidade" element={<Carregando><SensibilidadePage /></Carregando>} />
              <Route path="auditoria" element={<AuditoriaPage />} />
              <Route path="projetos" element={<Carregando><ProjetosPage /></Carregando>} />
              <Route path="entradas" element={<Navigate to="/app/planejamento" replace />} />
              <Route path="comparacao" element={<Navigate to="/app/cenarios" replace />} />
              <Route path="*" element={<Navigate to="/app/planejamento" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/app" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
