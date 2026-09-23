import { type ReactNode, useState } from 'react'
import { useAuth } from '@/auth/AuthContext'

export function AppShell({ children }: { children: ReactNode }) {
  const { usuario, sair } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)

  const iniciais = (usuario?.nome ?? '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-svh bg-ink-50">
      <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 font-mono text-xs font-bold text-white">
              DFC
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-ink-900">DFC Planner</p>
              <p className="text-[11px] text-ink-400">Planejador de fluxo de caixa</p>
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuAberto((v) => !v)}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm hover:bg-ink-100"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                {iniciais}
              </span>
              <span className="hidden text-ink-700 sm:inline">{usuario?.nome}</span>
              <svg className="h-4 w-4 text-ink-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {menuAberto && (
              <>
                <button
                  type="button"
                  aria-label="Fechar menu"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setMenuAberto(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-ink-200 bg-white py-1 shadow-lg">
                  <div className="border-b border-ink-100 px-3.5 py-2.5">
                    <p className="truncate text-sm font-medium text-ink-800">{usuario?.nome}</p>
                    <p className="truncate text-xs text-ink-400">{usuario?.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => sair()}
                    className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-ink-600 hover:bg-ink-50"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z"
                        clipRule="evenodd"
                      />
                      <path
                        fillRule="evenodd"
                        d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-.943a.75.75 0 111.004-1.114l2.5 2.25a.75.75 0 010 1.114l-2.5 2.25a.75.75 0 11-1.004-1.114l1.048-.943H6.75A.75.75 0 016 10z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Sair
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  )
}
