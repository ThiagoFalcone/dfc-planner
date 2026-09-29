import clsx from 'clsx'
import { useAuth } from '@/auth/AuthContext'
import { useTheme, type PreferenciaTema } from '@/theme/ThemeContext'
import { Icon, type NomeIcone } from '@/components/ui/Icon'
import { MenuItem, MenuLabel, MenuSeparator, Popover } from '@/components/ui/Popover'

export type SecaoConta = 'conta' | 'preferencias' | 'sessao'

export function iniciais(nome: string | undefined): string {
  return (nome ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export const OPCOES_TEMA: ReadonlyArray<{ valor: PreferenciaTema; rotulo: string; icone: NomeIcone }> = [
  { valor: 'light', rotulo: 'Claro', icone: 'sol' },
  { valor: 'dark', rotulo: 'Escuro', icone: 'lua' },
  { valor: 'system', rotulo: 'Sistema', icone: 'monitor' },
]

export function UserMenu({ onAbrirConta, onSair }: { onAbrirConta(s: SecaoConta): void; onSair(): void }) {
  const { usuario } = useAuth()
  const { preferencia, definirPreferencia } = useTheme()

  return (
    <Popover
      rotulo="Menu da conta"
      largura="w-64"
      trigger={(props) => (
        <button
          {...props}
          type="button"
          aria-label={`Conta de ${usuario?.nome ?? 'usuário'}`}
          className="focus-ring flex h-9 items-center gap-1.5 rounded-full pr-1.5 pl-0.5 hover:bg-hover"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-fg text-[11px] font-semibold text-surface">
            {iniciais(usuario?.nome)}
          </span>
          <Icon nome="chevron" className="hidden h-3.5 w-3.5 text-fg-3 sm:block" />
        </button>
      )}
    >
      {(fechar) => (
        <>
          <div className="px-2.5 pt-1.5 pb-2">
            <p className="truncate text-[13px] font-medium text-fg">{usuario?.nome}</p>
            <p className="truncate text-xs text-fg-3">{usuario?.email}</p>
          </div>
          <MenuSeparator />
          <MenuItem icone={<Icon nome="usuario" className="h-4 w-4" />} onSelect={() => {
            fechar()
            onAbrirConta('conta')
          }}>
            Minha conta
          </MenuItem>
          <MenuItem icone={<Icon nome="ajustes" className="h-4 w-4" />} onSelect={() => {
            fechar()
            onAbrirConta('preferencias')
          }}>
            Preferências
          </MenuItem>
          <MenuItem icone={<Icon nome="escudo" className="h-4 w-4" />} onSelect={() => {
            fechar()
            onAbrirConta('sessao')
          }}>
            Sessão
          </MenuItem>
          <MenuSeparator />
          <MenuLabel>Tema</MenuLabel>
          {OPCOES_TEMA.map((o) => (
            <button
              key={o.valor}
              type="button"
              role="menuitemradio"
              aria-checked={preferencia === o.valor}
              onClick={() => definirPreferencia(o.valor)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-fg outline-none hover:bg-hover focus-visible:bg-hover"
            >
              <Icon nome={o.icone} className="h-4 w-4 text-fg-3" />
              <span className="flex-1">{o.rotulo}</span>
              <Icon nome="check" className={clsx('h-4 w-4 text-accent', preferencia !== o.valor && 'invisible')} />
            </button>
          ))}
          <MenuSeparator />
          <MenuItem icone={<Icon nome="sair" className="h-4 w-4" />} destrutivo onSelect={() => {
            fechar()
            onSair()
          }}>
            Sair
          </MenuItem>
        </>
      )}
    </Popover>
  )
}
