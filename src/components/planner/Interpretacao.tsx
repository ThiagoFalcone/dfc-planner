import { useMemo } from 'react'
import type { IndicadoresFluxoCaixa, Periodo } from '@/types'
import { formatarMoeda, rotuloMes } from '@/lib/formato'
import { limiarAumentoDespesaSemRecuperacao, limiarQuedaReceitaSemRecuperacao } from '@/lib/sensibilidade'
import { Alert } from '@/components/ui/Alert'

export function Interpretacao({
  indicadores,
  periodos,
  nomeCenario,
}: {
  indicadores: IndicadoresFluxoCaixa
  periodos: Periodo[]
  nomeCenario: string
}) {
  const limiarReceita = useMemo(() => limiarQuedaReceitaSemRecuperacao(periodos), [periodos])
  const limiarDespesa = useMemo(() => limiarAumentoDespesaSemRecuperacao(periodos), [periodos])

  if (!indicadores.houveDeficit) {
    return (
      <Alert tone="success" title="Sem déficit no horizonte informado">
        Com as entradas de "{nomeCenario}", o acumulado não fica negativo em nenhum mês do
        horizonte — não haveria necessidade de capital adicional para este projeto, considerando
        estas premissas e este período. Isso pode mudar se o horizonte for estendido ou se
        despesas e investimentos ainda não lançados forem incluídos.
      </Alert>
    )
  }

  const recuperou = indicadores.mesRecuperacao !== null

  return (
    <div className="flex flex-col gap-3">
      <Alert tone={recuperou ? 'info' : 'danger'} title="Leitura do cenário">
        Em "{nomeCenario}", o maior déficit projetado é de {formatarMoeda(-indicadores.maiorDeficit)}
        {indicadores.mesMaiorDeficit !== null && ` no ${rotuloMes(indicadores.mesMaiorDeficit)}`}, o que
        indica uma necessidade de capital de {formatarMoeda(indicadores.necessidadeCapital)} para
        sustentar o projeto até que ele passe a se pagar.{' '}
        {recuperou ? (
          <>
            Com as premissas informadas, o investimento se recupera no{' '}
            {rotuloMes(indicadores.mesRecuperacao as number)}
            {indicadores.reincideNegativoAposRecuperacao &&
              ', mas o saldo volta a ficar negativo depois disso — vale reavaliar o horizonte.'}
            {!indicadores.reincideNegativoAposRecuperacao && '.'}
          </>
        ) : (
          <>o horizonte informado não é suficiente para que o acumulado volte a ficar positivo.</>
        )}
      </Alert>

      <Alert tone="warning" title="Sensibilidade (uma premissa por vez)">
        {limiarReceita !== null && limiarReceita > 0 && (
          <p>
            Uma queda de aproximadamente {limiarReceita}% nas receitas de todos os meses, mantendo
            as demais entradas, já seria suficiente para que a recuperação deixasse de ocorrer
            dentro do horizonte considerado.
          </p>
        )}
        {limiarReceita === 0 && (
          <p>Mesmo sem alterar as receitas, o cenário informado já não recupera no horizonte.</p>
        )}
        {limiarReceita === null && (
          <p>A recuperação se mostrou pouco sensível a quedas de receita neste horizonte.</p>
        )}
        {limiarDespesa !== null && limiarDespesa > 0 && (
          <p className="mt-1">
            Da mesma forma, um aumento de cerca de {limiarDespesa}% nas despesas mensais também
            levaria à ausência de recuperação no horizonte informado.
          </p>
        )}
      </Alert>
    </div>
  )
}
