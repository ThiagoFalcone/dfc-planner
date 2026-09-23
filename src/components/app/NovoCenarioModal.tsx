import clsx from 'clsx'
import { useState } from 'react'
import type { CenarioComputado, OrigemNovoCenario } from '@/hooks/usePlanner'
import { LIMITE_CENARIOS, nomeCurto } from '@/domain/scenario/types'
import { SEM_AJUSTES } from '@/lib/simulacao'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { TextField, campoClasses } from '@/components/ui/TextField'

type Tipo = OrigemNovoCenario['tipo']

export function NovoCenarioModal({
  aberto,
  onFechar,
  cenarios,
  ativoId,
  onCriar,
}: {
  aberto: boolean
  onFechar(): void
  cenarios: CenarioComputado[]
  ativoId: string
  onCriar(nome: string, origem: OrigemNovoCenario): void
}) {
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<Tipo>('duplicar')
  const [deId, setDeId] = useState(ativoId)
  const [receitas, setReceitas] = useState('-10')
  const [despesas, setDespesas] = useState('0')

  const r = Number(receitas.replace(',', '.'))
  const d = Number(despesas.replace(',', '.'))
  const ajustesValidos = Number.isFinite(r) && Number.isFinite(d) && r > -100 && d > -100
  const cheio = cenarios.length >= LIMITE_CENARIOS
  const podeCriar = !cheio && nome.trim().length > 0 && (tipo !== 'ajustes' || ajustesValidos)

  function fechar() {
    setNome('')
    setTipo('duplicar')
    onFechar()
  }

  function criar() {
    const origem: OrigemNovoCenario =
      tipo === 'branco'
        ? { tipo: 'branco' }
        : tipo === 'duplicar'
          ? { tipo: 'duplicar', deId }
          : { tipo: 'ajustes', deId, ajustes: { ...SEM_AJUSTES, receitas: r, despesas: d } }
    onCriar(nome, origem)
    fechar()
  }

  const opcoes: Array<{ valor: Tipo; titulo: string }> = [
    { valor: 'duplicar', titulo: 'Copiar um cenário' },
    { valor: 'ajustes', titulo: 'Derivar com variação percentual' },
    { valor: 'branco', titulo: 'Em branco' },
  ]

  return (
    <Modal
      aberto={aberto}
      onFechar={fechar}
      titulo="Novo cenário"
      descricao={
        cheio
          ? `O limite é de ${LIMITE_CENARIOS} cenários por planejamento — exclua um para criar outro.`
          : 'O novo cenário vira o cenário ativo e entra na comparação.'
      }
      rodape={
        <>
          <Button size="sm" variant="ghost" onClick={fechar}>
            Cancelar
          </Button>
          <Button size="sm" variant="primary" disabled={!podeCriar} onClick={criar}>
            Criar cenário
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TextField
          data-autofocus
          label="Nome"
          placeholder="Ex.: Atraso na captação"
          value={nome}
          maxLength={40}
          onChange={(e) => setNome(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && podeCriar && criar()}
        />
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-[13px] font-medium text-fg-2">Origem dos valores</legend>
          {opcoes.map((o) => (
            <label
              key={o.valor}
              className={clsx(
                'flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[13px]',
                tipo === o.valor ? 'border-accent bg-accent-soft' : 'border-line-strong hover:bg-hover',
              )}
            >
              <input type="radio" name="origem" checked={tipo === o.valor} onChange={() => setTipo(o.valor)} className="accent-accent" />
              {o.titulo}
            </label>
          ))}
        </fieldset>
        {tipo !== 'branco' && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="origem-cenario" className="text-[13px] font-medium text-fg-2">
              A partir de
            </label>
            <select id="origem-cenario" value={deId} onChange={(e) => setDeId(e.target.value)} className={clsx(campoClasses, 'border-line-strong')}>
              {cenarios.map((c) => (
                <option key={c.editavel.id} value={c.editavel.id}>
                  {nomeCurto(c.editavel.nome)}
                </option>
              ))}
            </select>
          </div>
        )}
        {tipo === 'ajustes' && (
          <div className="grid grid-cols-2 gap-3">
            <TextField label="Receitas (%)" inputMode="decimal" value={receitas} onChange={(e) => setReceitas(e.target.value)} className="tabular text-right" />
            <TextField label="Despesas (%)" inputMode="decimal" value={despesas} onChange={(e) => setDespesas(e.target.value)} className="tabular text-right" />
          </div>
        )}
      </div>
    </Modal>
  )
}
