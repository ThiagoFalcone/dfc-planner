import clsx from 'clsx'
import type { ReactNode } from 'react'
import type { IndicadoresFluxoCaixa } from '@/types'
import { formatarMoeda, rotuloMes } from '@/lib/formato'

function Indicador({
  rotulo,
  valor,
  tom = 'neutro',
  ajuda,
}: {
  rotulo: string
  valor: ReactNode
  tom?: 'neutro' | 'negativo' | 'positivo' | 'alerta'
  ajuda: string
}) {
  const tomClasses: Record<string, string> = {
    neutro: 'text-ink-900',
    negativo: 'text-negative',
    positivo: 'text-positive',
    alerta: 'text-warning',
  }
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-ink-200 bg-white px-5 py-4 shadow-sm shadow-ink-900/[0.03]">
      <span className="text-xs font-medium uppercase tracking-wide text-ink-400">{rotulo}</span>
      <span className={clsx('tabular text-2xl font-semibold', tomClasses[tom])}>{valor}</span>
      <span className="text-xs leading-relaxed text-ink-400">{ajuda}</span>
    </div>
  )
}

export function PainelIndicadores({ indicadores }: { indicadores: IndicadoresFluxoCaixa }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Indicador
        rotulo="Maior déficit"
        valor={indicadores.houveDeficit ? formatarMoeda(-indicadores.maiorDeficit) : formatarMoeda(0)}
        tom={indicadores.houveDeficit ? 'negativo' : 'positivo'}
        ajuda={
          indicadores.houveDeficit && indicadores.mesMaiorDeficit !== null
            ? `Pico do acumulado negativo, no ${rotuloMes(indicadores.mesMaiorDeficit)}.`
            : 'O acumulado não ficou negativo em nenhum mês do horizonte.'
        }
      />
      <Indicador
        rotulo="Necessidade de capital"
        valor={formatarMoeda(indicadores.necessidadeCapital)}
        tom={indicadores.necessidadeCapital > 0 ? 'alerta' : 'positivo'}
        ajuda="Quanto capital cobriria o maior déficit projetado, sem reserva adicional."
      />
      <Indicador
        rotulo="Mês de recuperação"
        valor={
          !indicadores.houveDeficit
            ? '—'
            : indicadores.mesRecuperacao !== null
              ? rotuloMes(indicadores.mesRecuperacao)
              : 'Não recupera no horizonte'
        }
        tom={
          !indicadores.houveDeficit
            ? 'neutro'
            : indicadores.mesRecuperacao !== null
              ? 'positivo'
              : 'negativo'
        }
        ajuda={
          indicadores.reincideNegativoAposRecuperacao
            ? 'Atenção: o saldo volta a ficar negativo depois deste mês.'
            : 'Primeiro mês, após o início do déficit, em que o acumulado volta a ser ≥ 0.'
        }
      />
      <Indicador
        rotulo="Saldo final do horizonte"
        valor={formatarMoeda(indicadores.saldoFinal)}
        tom={indicadores.saldoFinal >= 0 ? 'positivo' : 'negativo'}
        ajuda="Acumulado no último mês informado nesta tabela."
      />
    </div>
  )
}
