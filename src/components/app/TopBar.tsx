import clsx from 'clsx'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '@/theme/ThemeContext'
import { BrandMark, Icon } from '@/components/ui/Icon'
import { MenuItem, MenuLabel, Popover } from '@/components/ui/Popover'
import type { CenarioComputado } from '@/hooks/usePlanner'
import { nomeCurto } from '@/domain/scenario/types'
import { NavegacaoDesktop, ROTAS, type ItemNavegacao } from './Navigation'
import { UserMenu, type SecaoConta } from './UserMenu'
import { SaveStatus } from './SaveStatus'

export function ThemeToggle() {
  const { tema, alternar } = useTheme()
  const proximo = tema === 'dark' ? 'claro' : 'escuro'
  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={`Mudar para tema ${proximo}`}
      title={`Mudar para tema ${proximo}`}
      className="focus-ring flex h-9 w-9 items-center justify-center rounded-[10px] text-fg-2 transition-colors duration-120 hover:bg-hover hover:text-fg"
    >
      <Icon nome={tema === 'dark' ? 'sol' : 'lua'} />
    </button>
  )
}

/** Notificações reais: pendências de validação por cenário (nada fictício). */
function Notificacoes({ cenarios, onAbrirCenario }: { cenarios: CenarioComputado[]; onAbrirCenario(id: string): void }) {
  const comProblema = cenarios.filter((c) => c.problemas.length > 0)
  return (
    <Popover
      rotulo="Pendências"
      largura="w-72"
      trigger={(props) => (
        <button
          {...props}
          type="button"
          aria-label={comProblema.length ? `Pendências: ${comProblema.length}` : 'Pendências: nenhuma'}
          className="focus-ring relative flex h-9 w-9 items-center justify-center rounded-[10px] text-fg-2 hover:bg-hover hover:text-fg"
        >
          <Icon nome="sino" />
          {comProblema.length > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-negative ring-2 ring-[var(--canvas)]" />
          )}
        </button>
      )}
    >
      {(fechar) => (
        <>
          <MenuLabel>Pendências</MenuLabel>
          {comProblema.length === 0 ? (
            <p className="flex items-start gap-2 px-2.5 pb-2 text-[13px] text-fg-2">
              <Icon nome="check" className="mt-0.5 h-4 w-4 shrink-0 text-positive" />
              Todos os cenários estão com valores válidos.
            </p>
          ) : (
            comProblema.map((c) => (
              <MenuItem
                key={c.editavel.id}
                icone={<Icon nome="alerta" className="h-4 w-4 text-negative" />}
                descricao={`${c.problemas.length} ${c.problemas.length === 1 ? 'campo precisa' : 'campos precisam'} de correção`}
                onSelect={() => {
                  fechar()
                  onAbrirCenario(c.editavel.id)
                }}
              >
                Cenário {nomeCurto(c.editavel.nome).toLowerCase()}
              </MenuItem>
            ))
          )}
        </>
      )}
    </Popover>
  )
}

export function TopBar({
  itens,
  cenarios,
  salvoEm,
  onAbrirPaleta,
  onAbrirConta,
  onSair,
  onAbrirCenario,
}: {
  itens: ItemNavegacao[]
  cenarios: CenarioComputado[]
  salvoEm: string | null
  onAbrirPaleta(): void
  onAbrirConta(s: SecaoConta): void
  onSair(): void
  onAbrirCenario(id: string): void
}) {
  const navigate = useNavigate()
  const ehMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

  return (
    <header className="glass sticky top-0 z-40 border-x-0 border-t-0 !shadow-none">
      <div className="mx-auto flex h-14 max-w-[1360px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link to={ROTAS.planejamento} className="focus-ring flex shrink-0 items-center gap-2.5 rounded-lg" aria-label="DFC Planner, início">
          <BrandMark className="h-7 w-7" />
          <span className="hidden text-[14px] font-semibold tracking-[-0.01em] text-fg lg:inline">DFC Planner</span>
        </Link>

        <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-line-strong md:block" />
        <NavegacaoDesktop itens={itens} />

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={onAbrirPaleta}
            aria-label="Abrir paleta de comandos"
            aria-keyshortcuts="Control+K Meta+K"
            className={clsx(
              'focus-ring flex h-9 items-center gap-2 rounded-[10px] text-[13px] text-fg-3 transition-colors duration-120 hover:text-fg-2',
              'w-9 justify-center hover:bg-hover xl:w-52 xl:justify-start xl:bg-hover xl:px-3 xl:ring-1 xl:ring-line xl:ring-inset',
            )}
          >
            <Icon nome="busca" className="h-4 w-4 shrink-0" />
            <span className="hidden flex-1 truncate text-left whitespace-nowrap xl:inline">Buscar comandos…</span>
            <kbd className="hidden rounded border border-line-strong px-1.5 font-mono text-[10.5px] xl:inline">
              {ehMac ? '⌘K' : 'Ctrl K'}
            </kbd>
          </button>
          <SaveStatus salvoEm={salvoEm} className="mx-2 hidden 2xl:flex" />
          <ThemeToggle />
          <Notificacoes
            cenarios={cenarios}
            onAbrirCenario={(id) => {
              onAbrirCenario(id)
              navigate(ROTAS.planejamento)
            }}
          />
          <UserMenu onAbrirConta={onAbrirConta} onSair={onSair} />
        </div>
      </div>
    </header>
  )
}
