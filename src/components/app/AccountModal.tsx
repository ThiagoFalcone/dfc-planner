import type { ReactNode } from 'react'
import { useAuth } from '@/auth/AuthContext'
import { useTheme } from '@/theme/ThemeContext'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { formatarDataHora } from '@/lib/formato'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { OPCOES_TEMA, iniciais, type SecaoConta } from './UserMenu'

function Linha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-[13px] text-fg-3">{rotulo}</dt>
      <dd className="min-w-0 truncate text-right text-[13px] font-medium text-fg">{children}</dd>
    </div>
  )
}

export function AccountModal({
  secao,
  onSecao,
  onFechar,
  onSair,
}: {
  secao: SecaoConta | null
  onSecao(s: SecaoConta): void
  onFechar(): void
  onSair(): void
}) {
  const { usuario, sessao } = useAuth()
  const { preferencia, definirPreferencia, tema } = useTheme()
  const movimentoReduzido = useReducedMotion()

  return (
    <Modal
      aberto={secao !== null}
      onFechar={onFechar}
      titulo="Conta e preferências"
      rodape={
        <Button variant="primary" size="sm" onClick={onFechar}>
          Concluir
        </Button>
      }
    >
      <SegmentedControl<SecaoConta>
        rotulo="Seção"
        valor={secao ?? 'conta'}
        onChange={onSecao}
        cheio
        opcoes={[
          { valor: 'conta', rotulo: 'Minha conta' },
          { valor: 'preferencias', rotulo: 'Preferências' },
          { valor: 'sessao', rotulo: 'Sessão' },
        ]}
      />

      <div className="mt-4 min-h-56">
        {secao === 'conta' && (
          <>
            <div className="flex items-center gap-3 pb-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-fg text-sm font-semibold text-surface">
                {iniciais(usuario?.nome)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-fg">{usuario?.nome}</p>
                <p className="truncate text-[13px] text-fg-3">{usuario?.email}</p>
              </div>
            </div>
            <dl className="divide-y divide-line border-y border-line">
              <Linha rotulo="Nome">{usuario?.nome}</Linha>
              <Linha rotulo="E-mail">{usuario?.email}</Linha>
              <Linha rotulo="Empresa / projeto">{usuario?.empresa || '—'}</Linha>
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-fg-3">
              Os dados vêm do cadastro local deste navegador. Alterar perfil exige um servidor, que esta versão não
              possui.
            </p>
          </>
        )}

        {secao === 'preferencias' && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-[13px] font-medium text-fg">Tema</p>
              <p className="mt-0.5 text-xs text-fg-3">
                Em “Sistema”, acompanha o sistema operacional (agora: {tema === 'dark' ? 'escuro' : 'claro'}).
              </p>
              <SegmentedControl
                className="mt-2.5"
                rotulo="Tema"
                cheio
                valor={preferencia}
                onChange={definirPreferencia}
                opcoes={OPCOES_TEMA.map((o) => ({
                  valor: o.valor,
                  rotulo: (
                    <>
                      <Icon nome={o.icone} className="h-4 w-4" />
                      {o.rotulo}
                    </>
                  ),
                }))}
              />
            </div>
            <div>
              <p className="text-[13px] font-medium text-fg">Movimento</p>
              <p className="mt-0.5 text-xs leading-relaxed text-fg-3">
                {movimentoReduzido
                  ? 'Seu sistema pede movimento reduzido: transições e animações de gráficos estão desligadas.'
                  : 'Transições curtas (até 250 ms) acompanham mudanças de dados. Ative “reduzir movimento” no sistema para desligá-las.'}
              </p>
            </div>
          </div>
        )}

        {secao === 'sessao' && sessao && (
          <>
            <dl className="divide-y divide-line border-y border-line">
              <Linha rotulo="Iniciada em">{formatarDataHora(sessao.criadoEm)}</Linha>
              <Linha rotulo="Duração">
                {sessao.persistente ? 'Mantida neste navegador' : 'Termina ao fechar o navegador'}
              </Linha>
              <Linha rotulo="Autenticação">Simulada (local)</Linha>
            </dl>
            <div className="mt-3 flex gap-2.5 rounded-xl bg-warning-soft px-3.5 py-3 text-xs leading-relaxed text-fg-2">
              <Icon nome="info" className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <p>
                Esta é uma autenticação demonstrativa: conta e sessão ficam no armazenamento do navegador, sem
                verificação em servidor. Serve para organizar o uso, não para proteger dados.
              </p>
            </div>
            <Button variant="secondary" size="sm" className="mt-4" onClick={onSair}>
              <Icon nome="sair" className="h-4 w-4" />
              Sair desta sessão
            </Button>
          </>
        )}
      </div>
    </Modal>
  )
}
