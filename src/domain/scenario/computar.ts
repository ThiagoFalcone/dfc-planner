import { calcularIndicadores, calcularResultados, paraNumero, validarPeriodos } from '@/lib/calculos'
import type { CampoInvalido, IndicadoresFluxoCaixa, Periodo, PeriodoInput, ResultadoPeriodo } from '@/types'
import type { CenarioEditavel } from './types'

export type CampoNumerico = keyof Omit<PeriodoInput, 'mes'>

export interface CenarioComputado {
  editavel: CenarioEditavel
  periodosNumericos: Periodo[]
  problemas: CampoInvalido[]
  resultados: ResultadoPeriodo[]
  indicadores: IndicadoresFluxoCaixa | null
}

export const ROTULO_CAMPO: Record<CampoNumerico, string> = {
  receitas: 'Receita',
  despesas: 'Despesa',
  investimentos: 'Investimento',
  tributos: 'Tributo',
  residual: 'Valor residual',
}

export function paraPeriodosNumericos(periodos: PeriodoInput[]): Periodo[] {
  return periodos.map((p) => ({
    mes: p.mes,
    receitas: paraNumero(p.receitas),
    despesas: paraNumero(p.despesas),
    investimentos: paraNumero(p.investimentos),
    tributos: paraNumero(p.tributos),
    residual: paraNumero(p.residual),
  }))
}

export function periodoParaInput(p: Periodo): PeriodoInput {
  return {
    mes: p.mes,
    receitas: String(p.receitas),
    despesas: String(p.despesas),
    investimentos: String(p.investimentos),
    tributos: String(p.tributos),
    residual: String(p.residual),
  }
}

/**
 * Deriva resultados de um cenário editável usando apenas calculos.ts.
 * Com campos inválidos não produz resultado nenhum (RF09).
 */
export function computar(editavel: CenarioEditavel): CenarioComputado {
  const periodosNumericos = paraPeriodosNumericos(editavel.periodos)
  const problemas = validarPeriodos(periodosNumericos)
  if (problemas.length > 0) {
    return { editavel, periodosNumericos, problemas, resultados: [], indicadores: null }
  }
  const resultados = calcularResultados(periodosNumericos)
  return { editavel, periodosNumericos, problemas, resultados, indicadores: calcularIndicadores(resultados) }
}
