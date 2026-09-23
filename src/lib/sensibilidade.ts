import { calcularIndicadores, calcularResultados } from './calculos'
import type { Periodo } from '@/types'

/**
 * Análise de sensibilidade de uma entrada por vez (Passo 7 da atividade):
 * reduz as receitas em percentuais crescentes até identificar o menor
 * percentual de queda que faz a recuperação deixar de ocorrer dentro do
 * horizonte informado. Não altera despesas, investimentos, tributos ou
 * residual — isola o efeito de uma única premissa, como pede o enunciado.
 *
 * Retorna null quando nem uma queda de 100% das receitas impede a
 * recuperação (indicando que a decisão é pouco sensível a esta variável, ao
 * menos no horizonte considerado) ou quando o cenário base já não recupera.
 */
export function limiarQuedaReceitaSemRecuperacao(periodos: Periodo[]): number | null {
  const base = calcularIndicadores(calcularResultados(periodos))
  if (!base.houveDeficit) return null // não há déficit para recuperar
  if (base.mesRecuperacao === null) return 0 // já não recupera no cenário informado

  for (let quedaPercentual = 1; quedaPercentual <= 100; quedaPercentual++) {
    const ajustados = periodos.map((p) => ({
      ...p,
      receitas: p.receitas * (1 - quedaPercentual / 100),
    }))
    const indicadores = calcularIndicadores(calcularResultados(ajustados))
    if (indicadores.mesRecuperacao === null) {
      return quedaPercentual
    }
  }
  return null
}

/**
 * Analogamente, identifica o menor percentual de aumento nas despesas
 * mensais que faz a recuperação deixar de ocorrer no horizonte.
 */
export function limiarAumentoDespesaSemRecuperacao(periodos: Periodo[]): number | null {
  const base = calcularIndicadores(calcularResultados(periodos))
  if (!base.houveDeficit) return null
  if (base.mesRecuperacao === null) return 0

  for (let aumentoPercentual = 1; aumentoPercentual <= 200; aumentoPercentual++) {
    const ajustados = periodos.map((p) => ({
      ...p,
      despesas: p.despesas * (1 + aumentoPercentual / 100),
    }))
    const indicadores = calcularIndicadores(calcularResultados(ajustados))
    if (indicadores.mesRecuperacao === null) {
      return aumentoPercentual
    }
  }
  return null
}
