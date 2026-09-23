import clsx from 'clsx'
import { useState, type ReactNode } from 'react'
import type { CenarioComputado } from '@/hooks/usePlanner'
import type { ResumoProjeto } from '@/domain/scenario/types'
import { formatarDataHora, rotuloMes, tempoRelativo } from '@/lib/formato'
import { useAgora } from '@/hooks/useAgora'
import { Icon } from '@/components/ui/Icon'
import { MenuItem, MenuLabel, MenuSeparator, Popover } from '@/components/ui/Popover'
import { ScenarioSwitcher } from '@/components/financial/ScenarioSwitcher'
import { SaveStatus } from './SaveStatus'

function NomeProjeto({ nome, onRenomear }: { nome: string; onRenomear(n: string): void }) {
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState(nome)

  if (editando) {
    return (
      <input
        autoFocus
        aria-label="Nome do planejamento"
        value={rascunho}
        maxLength={80}
        onChange={(e) => setRascunho(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={() => {
          onRenomear(rascunho)
          setEditando(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            setRascunho(nome)
            setEditando(false)
          }
        }}
        className="h-6 w-56 rounded-md bg-surface px-1.5 text-[13px] text-fg ring-1 ring-accent outline-none"
      />
    )
  }
  return (
    <button
      type="button"
      onClick={() => {
        setRascunho(nome)
        setEditando(true)
      }}
      className="focus-ring group inline-flex items-center gap-1.5 rounded-md px-1 text-[13px] font-medium text-fg-2 hover:text-fg"
      title="Renomear planejamento"
    >
      {nome}
      <Icon nome="lapis" className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
      <span className="sr-only">(renomear)</span>
    </button>
  )
}

/** Troca rápida entre planejamentos, a partir do caminho de navegação. */
function SeletorProjeto({
  projetos,
  atualId,
  onAbrir,
  onVerTodos,
  onNovo,
}: {
  projetos: ResumoProjeto[]
  atualId: string
  onAbrir(id: string): void
  onVerTodos(): void
  onNovo(): void
}) {
  const outros = projetos.filter((p) => p.id !== atualId).slice(0, 6)
  return (
    <Popover
      rotulo="Planejamentos"
      align="start"
      largura="w-72"
      trigger={(props) => (
        <button
          {...props}
          type="button"
          aria-label="Trocar de planejamento"
          title="Trocar de planejamento"
          className="focus-ring rounded-md p-0.5 text-fg-3 hover:bg-hover hover:text-fg"
        >
          <Icon nome="chevron" className="h-3.5 w-3.5" />
        </button>
      )}
    >
      {(fechar) => (
        <>
          {outros.length > 0 && <MenuLabel>Abrir outro planejamento</MenuLabel>}
          {outros.map((p) => (
            <MenuItem
              key={p.id}
              icone={<Icon nome="pasta" className="h-4 w-4" />}
              descricao={`${p.cenarios} cenários · ${tempoRelativo(p.atualizadoEm)}`}
              onSelect={() => {
                fechar()
                onAbrir(p.id)
              }}
            >
              {p.nome}
            </MenuItem>
          ))}
          {outros.length > 0 && <MenuSeparator />}
          <MenuItem
            icone={<Icon nome="mais" className="h-4 w-4" />}
            onSelect={() => {
              fechar()
              onNovo()
            }}
          >
            Novo planejamento
          </MenuItem>
          <MenuItem
            icone={<Icon nome="camadas" className="h-4 w-4" />}
            onSelect={() => {
              fechar()
              onVerTodos()
            }}
          >
            Todos os planejamentos
          </MenuItem>
        </>
      )}
    </Popover>
  )
}

function Meta({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-[11px] text-fg-3">{rotulo}</span>
      <span className="truncate text-[13px] font-medium text-fg">{children}</span>
    </div>
  )
}

function BotaoHistorico({
  icone,
  rotulo,
  detalhe,
  atalho,
  desabilitado,
  onClick,
}: {
  icone: 'voltar' | 'refazer'
  rotulo: string
  detalhe: string | null
  atalho: string
  desabilitado: boolean
  onClick(): void
}) {
  const titulo = detalhe ? `${rotulo}: ${detalhe} (${atalho})` : `${rotulo} (${atalho})`
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      aria-label={detalhe ? `${rotulo}: ${detalhe}` : rotulo}
      title={titulo}
      className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-fg-2 hover:bg-hover hover:text-fg disabled:pointer-events-none disabled:opacity-35"
    >
      <Icon nome={icone} className="h-4 w-4" />
    </button>
  )
}

export interface ControleHistorico {
  podeDesfazer: boolean
  podeRefazer: boolean
  proximoDesfazer: string | null
  proximoRefazer: string | null
  desfazer(): void
  refazer(): void
}

/**
 * Cabeçalho do workspace: planejamento, página e a barra de contexto (cenário,
 * status, horizonte, última alteração, desfazer/refazer). A barra é vidro
 * porque é um controle que fica sobre o conteúdo ao rolar.
 */
export function WorkspaceHeader({
  titulo,
  descricao,
  nomeProjeto,
  projetoId,
  projetos,
  onRenomear,
  onAbrirProjeto,
  onVerProjetos,
  onNovoProjeto,
  cenarios,
  ativo,
  onSelecionarCenario,
  atualizadoEm,
  salvoEm,
  historico,
  acoes,
  mostrarContexto = true,
}: {
  titulo: string
  descricao?: string
  nomeProjeto: string
  projetoId: string
  projetos: ResumoProjeto[]
  onRenomear(n: string): void
  onAbrirProjeto(id: string): void
  onVerProjetos(): void
  onNovoProjeto(): void
  cenarios: CenarioComputado[]
  ativo: CenarioComputado
  onSelecionarCenario(id: string): void
  atualizadoEm: string
  salvoEm: string | null
  historico: ControleHistorico
  acoes?: ReactNode
  mostrarContexto?: boolean
}) {
  const agora = useAgora()
  const meses = ativo.editavel.periodos.map((p) => p.mes)
  const pendencias = ativo.problemas.length
  const horizonte = meses.length ? `${rotuloMes(Math.min(...meses))} → ${rotuloMes(Math.max(...meses))}` : '—'

  // Fragmento: a barra de contexto precisa ser filha direta do contêiner da página para o sticky funcionar.
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <nav aria-label="Local" className="flex items-center gap-1 text-[13px] text-fg-3">
            <span>DFC Planner</span>
            <span aria-hidden="true">/</span>
            <NomeProjeto nome={nomeProjeto} onRenomear={onRenomear} />
            <SeletorProjeto
              projetos={projetos}
              atualId={projetoId}
              onAbrir={onAbrirProjeto}
              onVerTodos={onVerProjetos}
              onNovo={onNovoProjeto}
            />
          </nav>
          <h1 className="mt-1 text-[26px] leading-tight font-semibold tracking-[-0.025em] text-fg sm:text-[28px]">
            {titulo}
          </h1>
          {descricao && <p className="mt-1 max-w-2xl text-[13px] text-fg-2">{descricao}</p>}
        </div>
        {acoes && <div className="flex items-center gap-2">{acoes}</div>}
      </div>

      {mostrarContexto && (
        <div className="glass z-30 flex flex-col gap-3 rounded-2xl px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 lg:sticky lg:top-[64px]">
          <ScenarioSwitcher cenarios={cenarios} ativoId={ativo.editavel.id} onChange={onSelecionarCenario} />
          <div className="grid grid-cols-3 gap-4 px-1 sm:flex sm:items-center sm:gap-6">
            <Meta rotulo="Status">
              <span className={clsx('inline-flex items-center gap-1.5', pendencias ? 'text-negative' : 'text-fg')}>
                <span
                  aria-hidden="true"
                  className={clsx('h-1.5 w-1.5 rounded-full', pendencias ? 'bg-negative' : 'bg-positive')}
                />
                {pendencias ? `${pendencias} ${pendencias === 1 ? 'pendência' : 'pendências'}` : 'Atualizado'}
              </span>
            </Meta>
            <Meta rotulo="Horizonte">
              <span className="tabular">{horizonte}</span>
            </Meta>
            <Meta rotulo="Última alteração">
              <time dateTime={atualizadoEm} title={formatarDataHora(atualizadoEm)}>
                {tempoRelativo(atualizadoEm, agora)}
              </time>
            </Meta>
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <SaveStatus salvoEm={salvoEm} className="flex px-1 2xl:hidden" />
            <div className="flex items-center" role="group" aria-label="Histórico de alterações">
              <BotaoHistorico
                icone="voltar"
                rotulo="Desfazer"
                detalhe={historico.proximoDesfazer}
                atalho="Ctrl+Z"
                desabilitado={!historico.podeDesfazer}
                onClick={historico.desfazer}
              />
              <BotaoHistorico
                icone="refazer"
                rotulo="Refazer"
                detalhe={historico.proximoRefazer}
                atalho="Ctrl+Shift+Z"
                desabilitado={!historico.podeRefazer}
                onClick={historico.refazer}
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
