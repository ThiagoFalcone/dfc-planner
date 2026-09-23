import type { ReactNode } from 'react'
import type { IndicadoresFluxoCaixa } from '@/types'
import { rotuloMes } from '@/lib/formato'
import { Icon } from '@/components/ui/Icon'
import { MoneyValue } from './MoneyValue'

function Secundario({ rotulo, valor, detalhe }: { rotulo: string; valor: ReactNode; detalhe: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="min-w-0">
        <span className="block text-[13px] text-fg-2">{rotulo}</span>
        <span className="mt-0.5 block text-xs text-fg-3">{detalhe}</span>
      </dt>
      <dd className="text-lg font-semibold tracking-[-0.015em] whitespace-nowrap">{valor}</dd>
    </div>
  )
}

/**
 * Hierarquia de indicadores: capital necessário é o número principal; os
 * demais aparecem como leitura de apoio, não como quatro cartões iguais.
 */
export function KpiPanel({ indicadores, nomeCenario }: { indicadores: IndicadoresFluxoCaixa; nomeCenario: string }) {
  const precisaCapital = indicadores.necessidadeCapital > 0
  const recupera = indicadores.mesRecuperacao !== null

  return (
    <div className="flex h-full flex-col">
      <div>
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-fg-2">
          Capital necessário
          <span className="text-fg-3">· {nomeCenario}</span>
        </p>
        <p className="mt-2 text-[44px] leading-none font-semibold tracking-[-0.035em] sm:text-[52px]">
          <MoneyValue valor={indicadores.necessidadeCapital} tom={precisaCapital ? 'atencao' : 'positivo'} />
        </p>
        <p className="mt-3 mb-6 max-w-sm text-[13px] leading-relaxed text-fg-2">
          {precisaCapital ? (
            <>
              Valor mínimo para atravessar o ponto de maior exposição
              {indicadores.mesMaiorDeficit !== null && ` no ${rotuloMes(indicadores.mesMaiorDeficit)}`}, sem reserva
              adicional.
            </>
          ) : (
            'O acumulado não fica negativo no horizonte: não há necessidade de capital adicional.'
          )}
        </p>
      </div>

      <dl className="mt-auto flex flex-col divide-y divide-line border-t border-line pt-1">
        <Secundario
          rotulo="Maior déficit"
          valor={
            indicadores.houveDeficit ? (
              <MoneyValue valor={-indicadores.maiorDeficit} tom="negativo" />
            ) : (
              <span className="text-fg-3">Nenhum</span>
            )
          }
          detalhe={indicadores.mesMaiorDeficit !== null ? rotuloMes(indicadores.mesMaiorDeficit) : 'Sem déficit'}
        />
        <Secundario
          rotulo="Recuperação"
          valor={
            !indicadores.houveDeficit ? (
              <span className="text-fg-3">—</span>
            ) : recupera ? (
              <span className="text-positive">{rotuloMes(indicadores.mesRecuperacao as number)}</span>
            ) : (
              <span className="text-negative">Não recupera</span>
            )
          }
          detalhe={
            indicadores.reincideNegativoAposRecuperacao ? (
              <span className="inline-flex items-center gap-1 text-warning">
                <Icon nome="alerta" className="h-3.5 w-3.5" /> Volta a ficar negativo
              </span>
            ) : !indicadores.houveDeficit ? (
              'Não houve déficit'
            ) : recupera ? (
              'Acumulado volta a ≥ 0'
            ) : (
              'Fora do horizonte'
            )
          }
        />
        <Secundario
          rotulo="Saldo final"
          valor={<MoneyValue valor={indicadores.saldoFinal} tom="auto" />}
          detalhe={
            <span className="inline-flex items-center gap-1">
              <Icon nome={indicadores.saldoFinal >= 0 ? 'sobe' : 'desce'} className="h-3.5 w-3.5 text-fg-3" />
              Último mês do horizonte
            </span>
          }
        />
      </dl>
    </div>
  )
}
