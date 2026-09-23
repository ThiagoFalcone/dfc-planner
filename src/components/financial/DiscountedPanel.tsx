import clsx from 'clsx'
import { useId, useState, type ReactNode } from 'react'
import type { AnaliseDescontada } from '@/lib/financeiro'
import { formatarPercentual, lerTMA, taxaEquivalenteAnual } from '@/lib/financeiro'
import { rotuloMes } from '@/lib/formato'
import { campoClasses } from '@/components/ui/TextField'
import { Icon } from '@/components/ui/Icon'
import { MoneyValue } from './MoneyValue'

function Metrica({ rotulo, valor, detalhe }: { rotulo: string; valor: ReactNode; detalhe?: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-fg-3">{rotulo}</dt>
      <dd className="mt-1 text-lg font-semibold tracking-[-0.015em] whitespace-nowrap">{valor}</dd>
      {detalhe && <dd className="mt-0.5 text-xs text-fg-3">{detalhe}</dd>}
    </div>
  )
}

/**
 * Leitura com valor do dinheiro no tempo. Complementar: a Opção 3 decide em
 * caixa corrente; aqui a TMA desconta os mesmos fluxos para mostrar VPL, TIR
 * e payback descontado, sem alterar nenhum indicador obrigatório.
 */
export function DiscountedPanel({
  tma,
  analise,
  onTMA,
  mostrarNoGrafico,
  onMostrarNoGrafico,
}: {
  tma: string
  analise: AnaliseDescontada | null
  onTMA(v: string): void
  mostrarNoGrafico: boolean
  onMostrarNoGrafico(v: boolean): void
}) {
  const id = useId()
  const [rascunho, setRascunho] = useState(tma)
  const [origem, setOrigem] = useState(tma)
  if (origem !== tma) {
    setOrigem(tma)
    setRascunho(tma)
  }
  const lida = lerTMA(rascunho)
  const invalida = lida === 'invalida'

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
      <div className="flex w-full max-w-60 shrink-0 flex-col gap-1.5">
        <label htmlFor={id} className="text-[13px] font-medium text-fg-2">
          TMA do cenário (% ao mês)
        </label>
        <input
          id={id}
          inputMode="decimal"
          placeholder="Ex.: 1,5"
          value={rascunho}
          aria-invalid={invalida || undefined}
          aria-describedby={`${id}-dica`}
          onChange={(e) => setRascunho(e.target.value)}
          onBlur={() => !invalida && onTMA(rascunho)}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className={clsx(campoClasses, 'tabular text-right', invalida ? 'border-negative' : 'border-line-strong')}
        />
        <p id={`${id}-dica`} className={clsx('text-xs', invalida ? 'text-negative' : 'text-fg-3')}>
          {invalida
            ? 'Informe um número entre 0 e 100.'
            : typeof lida === 'number'
              ? `Equivale a ${formatarPercentual(taxaEquivalenteAnual(lida))} ao ano.`
              : 'Taxa mínima de atratividade: o retorno exigido pelo capital.'}
        </p>
        {analise && (
          <label className="mt-1 flex cursor-pointer items-center gap-2 text-[13px] text-fg-2 select-none">
            <input
              type="checkbox"
              checked={mostrarNoGrafico}
              onChange={(e) => onMostrarNoGrafico(e.target.checked)}
              className="accent-accent"
            />
            Mostrar acumulado descontado no gráfico
          </label>
        )}
      </div>

      {analise ? (
        <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          <Metrica
            rotulo="VPL"
            valor={<MoneyValue valor={analise.vpl} tom="auto" />}
            detalhe={analise.vpl >= 0 ? 'Remunera a TMA e sobra valor' : 'Não remunera a TMA no horizonte'}
          />
          <Metrica
            rotulo="TIR"
            valor={analise.tir === null ? <span className="text-fg-3">—</span> : `${formatarPercentual(analise.tir)} a.m.`}
            detalhe={
              analise.tir === null
                ? 'Sem taxa que zere o VPL'
                : `${formatarPercentual(analise.tirAnual ?? 0)} a.a.${analise.tir >= analise.taxa ? ' · acima da TMA' : ' · abaixo da TMA'}`
            }
          />
          <Metrica
            rotulo="Payback descontado"
            valor={
              !analise.houveDeficitDescontado ? (
                <span className="text-fg-3">—</span>
              ) : analise.paybackDescontado !== null ? (
                <span className="text-positive">{rotuloMes(analise.paybackDescontado)}</span>
              ) : (
                <span className="text-negative">Não recupera</span>
              )
            }
            detalhe="Recuperação com fluxos descontados"
          />
          <Metrica rotulo="TMA anual equivalente" valor={formatarPercentual(analise.taxaAnual)} detalhe="(1 + i)¹² − 1" />
          {analise.mudancasDeSinal > 1 && (
            <p className="col-span-full flex items-start gap-2 text-xs text-warning">
              <Icon nome="alerta" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              O fluxo muda de sinal {analise.mudancasDeSinal} vezes: pode haver mais de uma TIR. Prefira o VPL para decidir.
            </p>
          )}
        </dl>
      ) : (
        <p className="flex-1 self-center text-[13px] leading-relaxed text-fg-3">
          Informe a TMA para ver VPL, TIR e payback descontado deste cenário. Os indicadores acima (em caixa corrente)
          não mudam.
        </p>
      )}
    </div>
  )
}
