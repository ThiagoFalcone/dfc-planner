import { useId, useState } from 'react'
import type { CenarioEditavel, FonteDados } from '@/domain/scenario/types'
import { FONTES_DADOS } from '@/domain/scenario/types'
import { formatarDataHora, tempoRelativo } from '@/lib/formato'
import { campoClasses } from '@/components/ui/TextField'

/**
 * Premissas e origem dos dados do cenário. Texto é registrado no histórico
 * ao sair do campo (não a cada tecla).
 */
export function ProvenancePanel({
  cenario,
  onPremissas,
  onProveniencia,
}: {
  cenario: CenarioEditavel
  onPremissas(texto: string): void
  onProveniencia(m: { fonte?: FonteDados; referencia?: string }): void
}) {
  const idPremissas = useId()
  const idFonte = useId()
  const idReferencia = useId()
  const [premissas, setPremissas] = useState(cenario.descricaoPremissas)
  const [referencia, setReferencia] = useState(cenario.proveniencia.referencia)
  const [origem, setOrigem] = useState({
    id: cenario.id,
    premissas: cenario.descricaoPremissas,
    referencia: cenario.proveniencia.referencia,
  })

  // Troca de cenário ou alteração externa (carregar exemplo, zerar) reinicia os rascunhos.
  if (
    origem.id !== cenario.id ||
    origem.premissas !== cenario.descricaoPremissas ||
    origem.referencia !== cenario.proveniencia.referencia
  ) {
    setOrigem({ id: cenario.id, premissas: cenario.descricaoPremissas, referencia: cenario.proveniencia.referencia })
    setPremissas(cenario.descricaoPremissas)
    setReferencia(cenario.proveniencia.referencia)
  }

  const { proveniencia } = cenario

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={idPremissas} className="text-[13px] font-medium text-fg-2">
          Premissas do cenário
        </label>
        <textarea
          id={idPremissas}
          rows={3}
          value={premissas}
          onChange={(e) => setPremissas(e.target.value)}
          onBlur={() => onPremissas(premissas)}
          placeholder="Ex.: tributos = 0; residual representa devolução do capital de giro no último mês."
          className={`${campoClasses} h-auto resize-y border-line-strong py-2 leading-relaxed`}
        />
        <p className="text-xs text-fg-3">Convenções e hipóteses usadas. Entram na exportação e no histórico.</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={idFonte} className="text-[13px] font-medium text-fg-2">
            Fonte dos dados
          </label>
          <select
            id={idFonte}
            value={proveniencia.fonte}
            onChange={(e) => onProveniencia({ fonte: e.target.value as FonteDados })}
            className={`${campoClasses} border-line-strong pr-8`}
          >
            {FONTES_DADOS.map((f) => (
              <option key={f.valor} value={f.valor}>
                {f.rotulo}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={idReferencia} className="text-[13px] font-medium text-fg-2">
            Referência
          </label>
          <input
            id={idReferencia}
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            onBlur={() => onProveniencia({ referencia })}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            placeholder="Documento, página, planilha…"
            className={`${campoClasses} border-line-strong`}
          />
        </div>
        <dl className="grid grid-cols-2 gap-3 pt-1 text-xs">
          <div>
            <dt className="text-fg-3">Responsável</dt>
            <dd className="mt-0.5 truncate font-medium text-fg">{proveniencia.responsavel}</dd>
          </div>
          <div>
            <dt className="text-fg-3">Última atualização</dt>
            <dd className="mt-0.5 font-medium text-fg" title={formatarDataHora(proveniencia.atualizadoEm)}>
              <time dateTime={proveniencia.atualizadoEm}>{tempoRelativo(proveniencia.atualizadoEm)}</time>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
