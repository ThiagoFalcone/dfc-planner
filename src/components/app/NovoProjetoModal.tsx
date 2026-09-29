import clsx from 'clsx'
import { useState } from 'react'
import type { PontoDePartida } from '@/domain/scenario/fabricas'
import type { ResultadoImportacao } from '@/lib/importar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TextField } from '@/components/ui/TextField'
import { FileImporter } from '@/components/financial/FileImporter'

export interface OpcoesNovoProjeto {
  nome: string
  partida: PontoDePartida
  importado?: ResultadoImportacao
}

const PARTIDAS: Array<{ valor: PontoDePartida; titulo: string; texto: string }> = [
  {
    valor: 'branco',
    titulo: 'Em branco',
    texto: 'Mês 0 a Mês 6 zerados, com os cenários Base, Pessimista e Otimista para preencher.',
  },
  {
    valor: 'exemplo',
    titulo: 'Exemplo do enunciado',
    texto: 'Dados de referência do EduTask (material da disciplina), com variações de receita ±20%.',
  },
  {
    valor: 'importado',
    titulo: 'Importar arquivo',
    texto: 'CSV ou JSON. O cenário Base recebe os dados; Pessimista e Otimista são derivados (±20% nas receitas).',
  },
]

export function NovoProjetoModal({
  aberto,
  onFechar,
  onCriar,
}: {
  aberto: boolean
  onFechar(): void
  onCriar(o: OpcoesNovoProjeto): void
}) {
  const [nome, setNome] = useState('')
  const [partida, setPartida] = useState<PontoDePartida>('branco')
  const [importado, setImportado] = useState<ResultadoImportacao | null>(null)

  const podeCriar = nome.trim().length > 0 && (partida !== 'importado' || importado !== null)

  function fechar() {
    setNome('')
    setPartida('branco')
    setImportado(null)
    onFechar()
  }

  return (
    <Modal
      aberto={aberto}
      onFechar={fechar}
      titulo="Novo planejamento"
      descricao="Cada planejamento tem seus próprios cenários, premissas e histórico de alterações."
      rodape={
        <>
          <Button size="sm" variant="ghost" onClick={fechar}>
            Cancelar
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={!podeCriar}
            onClick={() => {
              onCriar({ nome: nome.trim(), partida, importado: importado ?? undefined })
              fechar()
            }}
          >
            Criar planejamento
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TextField
          data-autofocus
          label="Nome"
          placeholder="Ex.: Lançamento do app de agendamento"
          value={nome}
          maxLength={80}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && podeCriar) {
              onCriar({ nome: nome.trim(), partida, importado: importado ?? undefined })
              fechar()
            }
          }}
        />
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-[13px] font-medium text-fg-2">Ponto de partida</legend>
          {PARTIDAS.map((p) => (
            <label
              key={p.valor}
              className={clsx(
                'flex cursor-pointer gap-3 rounded-xl border px-3.5 py-3 transition-colors',
                partida === p.valor ? 'border-accent bg-accent-soft' : 'border-line-strong hover:bg-hover',
              )}
            >
              <input
                type="radio"
                name="partida"
                value={p.valor}
                checked={partida === p.valor}
                onChange={() => setPartida(p.valor)}
                className="mt-0.5 accent-accent"
              />
              <span>
                <span className="block text-[13px] font-medium text-fg">{p.titulo}</span>
                <span className="block text-xs leading-relaxed text-fg-2">{p.texto}</span>
              </span>
            </label>
          ))}
        </fieldset>
        {partida === 'importado' && <FileImporter onResultado={setImportado} />}
      </div>
    </Modal>
  )
}
