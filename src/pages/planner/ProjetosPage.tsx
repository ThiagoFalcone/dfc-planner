import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ResumoProjeto } from '@/domain/scenario/types'
import { formatarDataHora, tempoRelativo } from '@/lib/formato'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { Surface } from '@/components/ui/Card'
import { EmptyState } from '@/components/financial/EmptyState'
import { ROTAS } from '@/components/app/Navigation'
import { useWorkspace } from './PlannerLayout'

function LinhaProjeto({
  projeto,
  ativo,
  onAbrir,
  onRenomear,
  onDuplicar,
  onExcluir,
}: {
  projeto: ResumoProjeto
  ativo: boolean
  onAbrir(): void
  onRenomear(nome: string): void
  onDuplicar(): void
  onExcluir(): void
}) {
  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState(projeto.nome)

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5">
      <button
        type="button"
        onClick={onAbrir}
        className="focus-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-hover text-fg-2"
        aria-label={`Abrir ${projeto.nome}`}
      >
        <Icon nome="pasta" className="h-4 w-4" />
      </button>
      <div className="min-w-48 flex-1">
        {editando ? (
          <input
            autoFocus
            aria-label="Nome do planejamento"
            value={nome}
            maxLength={80}
            onChange={(e) => setNome(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={() => {
              onRenomear(nome)
              setEditando(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') {
                setNome(projeto.nome)
                setEditando(false)
              }
            }}
            className="h-7 w-full max-w-xs rounded-md border border-accent bg-surface px-1.5 text-[13px] text-fg outline-none"
          />
        ) : (
          <button type="button" onClick={onAbrir} className="focus-ring truncate rounded text-left text-[13px] font-medium text-fg hover:underline">
            {projeto.nome}
          </button>
        )}
        <p className="mt-0.5 text-xs text-fg-3">
          {projeto.cenarios} {projeto.cenarios === 1 ? 'cenário' : 'cenários'} · {projeto.meses} meses · atualizado{' '}
          <time dateTime={projeto.atualizadoEm} title={formatarDataHora(projeto.atualizadoEm)}>
            {tempoRelativo(projeto.atualizadoEm)}
          </time>
          {ativo && <span className="ml-1.5 rounded-full bg-accent-soft px-1.5 py-0.5 text-[10.5px] text-accent">Aberto</span>}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" onClick={() => setEditando(true)}>
          Renomear
        </Button>
        <Button size="sm" variant="ghost" onClick={onDuplicar}>
          Duplicar
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={`Excluir ${projeto.nome}`}
          title={ativo ? 'Abra outro planejamento antes de excluir este' : 'Excluir'}
          disabled={ativo}
          onClick={onExcluir}
          className="hover:bg-negative-soft hover:text-negative"
        >
          <Icon nome="lixeira" className="h-4 w-4" />
        </Button>
      </div>
    </li>
  )
}

/** CRUD de planejamentos: criar, abrir, renomear, duplicar, excluir. */
export function ProjetosPage() {
  const { projetos, abrirNovoProjeto } = useWorkspace()
  const navigate = useNavigate()
  const [excluindo, setExcluindo] = useState<ResumoProjeto | null>(null)

  function abrir(id: string) {
    projetos.abrir(id)
    navigate(ROTAS.planejamento)
  }

  if (projetos.lista.length === 0) {
    return (
      <EmptyState
        icone="pasta"
        titulo="Nenhum planejamento ainda"
        texto="Crie um planejamento em branco, a partir do exemplo do enunciado, ou importando um arquivo."
        acao={{ rotulo: 'Novo planejamento', onClick: abrirNovoProjeto }}
      />
    )
  }

  return (
    <Surface className="px-5">
      <ul className="divide-y divide-line">
        {projetos.lista.map((p) => (
          <LinhaProjeto
            key={p.id}
            projeto={p}
            ativo={p.id === projetos.atualId}
            onAbrir={() => abrir(p.id)}
            onRenomear={(nome) => projetos.renomear(p.id, nome)}
            onDuplicar={() => projetos.duplicar(p.id)}
            onExcluir={() => setExcluindo(p)}
          />
        ))}
      </ul>

      <Modal
        aberto={excluindo !== null}
        onFechar={() => setExcluindo(null)}
        titulo={`Excluir "${excluindo?.nome}"?`}
        descricao="Todos os cenários, premissas e o histórico deste planejamento serão apagados deste navegador. Esta ação não pode ser desfeita."
        rodape={
          <>
            <Button size="sm" variant="ghost" onClick={() => setExcluindo(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                if (excluindo) projetos.excluir(excluindo.id)
                setExcluindo(null)
              }}
            >
              Excluir permanentemente
            </Button>
          </>
        }
      />
    </Surface>
  )
}
