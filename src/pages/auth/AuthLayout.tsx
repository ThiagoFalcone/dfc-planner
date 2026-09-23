import type { ReactNode } from 'react'
import { BrandMark } from '@/components/ui/Icon'
import { ThemeToggle } from '@/components/app/TopBar'

/**
 * Moldura das telas de acesso: centrada, sem ilustração. A única assinatura
 * visual é a curva da marca — um acumulado que afunda e se recupera.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="relative flex min-h-svh flex-col">
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[18vh] h-[46vh] w-full opacity-60"
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
      >
        <line x1="0" x2="1200" y1="170" y2="170" stroke="var(--border-strong)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <path
          d="M0 120 C 180 120, 260 330, 430 330 S 700 160, 820 120 S 1060 40, 1200 30"
          fill="none"
          stroke="var(--border-strong)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <header className="relative flex items-center justify-between px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2.5">
          <BrandMark className="h-7 w-7" />
          <span className="text-[14px] font-semibold tracking-[-0.01em] text-fg">DFC Planner</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="relative flex flex-1 items-center justify-center px-5 pt-4 pb-16">
        <div className="glass w-full max-w-100 rounded-[22px] px-6 py-7 sm:px-8 sm:py-8">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-fg">{title}</h1>
          <p className="mt-1 text-[13px] text-fg-2">{subtitle}</p>
          <div className="mt-6">{children}</div>
          <div className="mt-6 border-t border-line pt-5 text-center text-[13px] text-fg-2">{footer}</div>
        </div>
      </main>

      <footer className="relative px-5 pb-5 text-center text-xs text-fg-3">
        Engenharia Econômica · SENAI FATESG. Autenticação demonstrativa: conta e dados ficam neste navegador.
      </footer>
    </div>
  )
}
