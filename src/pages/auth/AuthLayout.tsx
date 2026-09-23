import type { ReactNode } from 'react'

const pontos = [
  'Projete receitas, despesas, investimentos e residual mês a mês.',
  'Veja o maior déficit, a necessidade de capital e o mês de recuperação.',
  'Compare três cenários e identifique o que muda a decisão.',
]

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
    <div className="flex min-h-svh w-full bg-ink-50">
      <div className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-ink-950 px-10 py-10 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(60% 50% at 15% 10%, rgba(122,123,242,0.35) 0%, rgba(10,10,14,0) 60%), radial-gradient(50% 45% at 90% 85%, rgba(91,87,232,0.30) 0%, rgba(10,10,14,0) 60%)',
          }}
        />
        <div className="relative flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 font-mono text-sm font-bold">
            DFC
          </div>
          <span className="text-sm font-semibold tracking-wide text-ink-100">
            DFC Planner
          </span>
        </div>

        <div className="relative">
          <h1 className="max-w-sm text-3xl font-semibold leading-tight tracking-tight text-white">
            Decida com o fluxo de caixa do projeto, não com achismo.
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-300">
            Planejador de fluxo de caixa para apoiar a decisão de quanto capital é
            necessário e quando o investimento se recupera.
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {pontos.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-ink-200">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-ink-400">
          Trabalho acadêmico — Engenharia Econômica, SENAI FATESG.
        </p>
      </div>

      <div className="flex w-full flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 font-mono text-xs font-bold text-white">
              DFC
            </div>
            <span className="text-sm font-semibold text-ink-900">DFC Planner</span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-ink-900">{title}</h2>
          <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>

          <div className="mt-7">{children}</div>

          <div className="mt-6 text-center text-sm text-ink-500">{footer}</div>
        </div>
      </div>
    </div>
  )
}
