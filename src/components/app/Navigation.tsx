import clsx from 'clsx'
import { NavLink } from 'react-router-dom'
import { Icon, type NomeIcone } from '@/components/ui/Icon'

export interface ItemNavegacao {
  to: string
  rotulo: string
  icone: NomeIcone
  pendencias?: number
}

export const ROTAS = {
  planejamento: '/app/planejamento',
  resultados: '/app/resultados',
  cenarios: '/app/cenarios',
  sensibilidade: '/app/sensibilidade',
  auditoria: '/app/auditoria',
  projetos: '/app/projetos',
} as const

export function itensNavegacao(pendencias: number): ItemNavegacao[] {
  return [
    { to: ROTAS.planejamento, rotulo: 'Planejamento', icone: 'planejamento', pendencias },
    { to: ROTAS.resultados, rotulo: 'Resultados', icone: 'resultados' },
    { to: ROTAS.cenarios, rotulo: 'Cenários', icone: 'cenarios' },
    { to: ROTAS.sensibilidade, rotulo: 'Sensibilidade', icone: 'sensibilidade' },
    { to: ROTAS.auditoria, rotulo: 'Auditoria', icone: 'auditoria' },
  ]
}

function Pendencias({ n }: { n?: number }) {
  if (!n) return null
  return (
    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-negative px-1 text-[10px] font-semibold text-white">
      {n}
      <span className="sr-only"> pendências</span>
    </span>
  )
}

/** Navegação principal no desktop, dentro da barra superior. */
export function NavegacaoDesktop({ itens }: { itens: ItemNavegacao[] }) {
  return (
    <nav aria-label="Principal" className="hidden md:block">
      <ul className="flex items-center gap-0.5">
        {itens.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'focus-ring inline-flex h-8 items-center gap-2 rounded-lg px-3 text-[13px] font-medium transition-colors duration-120',
                  isActive ? 'bg-elevated text-fg shadow-[0_0_0_1px_var(--border)]' : 'text-fg-2 hover:bg-hover hover:text-fg',
                )
              }
            >
              <Icon nome={item.icone} className="h-4 w-4" />
              <span className="sr-only lg:not-sr-only">{item.rotulo}</span>
              <Pendencias n={item.pendencias} />
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Barra de abas inferior no celular: navegação própria, não a do desktop comprimida. */
export function NavegacaoMobile({ itens }: { itens: ItemNavegacao[] }) {
  return (
    <nav
      aria-label="Principal"
      className="glass fixed inset-x-3 bottom-3 z-40 rounded-2xl pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-5">
        {itens.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'focus-ring relative flex h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10.5px] font-medium',
                  isActive ? 'text-fg' : 'text-fg-3',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className={clsx('relative rounded-lg px-2.5 py-0.5', isActive && 'bg-hover')}>
                    <Icon nome={item.icone} className="h-5 w-5" />
                    {item.pendencias ? (
                      <span className="absolute -top-0.5 right-1.5 h-2 w-2 rounded-full bg-negative ring-2 ring-surface">
                        <span className="sr-only">{item.pendencias} pendências</span>
                      </span>
                    ) : null}
                  </span>
                  {item.rotulo}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
