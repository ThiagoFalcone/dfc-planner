import { arredondar, calcularIndicadores, calcularResultados } from './calculos'
import type { IndicadoresFluxoCaixa, Periodo } from '@/types'

/**
 * Simulação "e se": aplica ajustes percentuais por tipo de entrada (e um
 * atraso nas receitas) sobre uma cópia dos períodos. Nada aqui altera o
 * cenário salvo — o resultado só vira cenário se a pessoa pedir.
 */
export interface Ajustes {
  /** Variações em % (ex.: -20 = 20% menor). */
  receitas: number
  despesas: number
  investimentos: number
  tributos: number
  residual: number
  /** Meses de atraso no início das receitas. Receitas empurradas para além do horizonte saem do cálculo. */
  atrasoReceitas: number
}

export const SEM_AJUSTES: Ajustes = {
  receitas: 0,
  despesas: 0,
  investimentos: 0,
  tributos: 0,
  residual: 0,
  atrasoReceitas: 0,
}

export type VariavelSensivel = 'receitas' | 'despesas' | 'investimentos' | 'tributos' | 'residual'

export const ROTULO_VARIAVEL: Record<VariavelSensivel, string> = {
  receitas: 'Receitas',
  despesas: 'Despesas',
  investimentos: 'Investimento',
  tributos: 'Tributos',
  residual: 'Residual',
}

const VARIAVEIS: VariavelSensivel[] = ['receitas', 'despesas', 'investimentos', 'tributos', 'residual']

function escalar(v: number, pct: number): number {
  return arredondar(v * (1 + pct / 100))
}

export function aplicarAjustes(periodos: Periodo[], a: Ajustes): Periodo[] {
  const ordenados = [...periodos].sort((x, y) => x.mes - y.mes)
  const atraso = Math.max(0, Math.round(a.atrasoReceitas))
  return ordenados.map((p, i) => {
    const origem = ordenados[i - atraso]
    const receitaBase = atraso === 0 ? p.receitas : origem ? origem.receitas : 0
    return {
      mes: p.mes,
      receitas: escalar(receitaBase, a.receitas),
      despesas: escalar(p.despesas, a.despesas),
      investimentos: escalar(p.investimentos, a.investimentos),
      tributos: escalar(p.tributos, a.tributos),
      residual: escalar(p.residual, a.residual),
    }
  })
}

export function temAjuste(a: Ajustes): boolean {
  return VARIAVEIS.some((v) => a[v] !== 0) || a.atrasoReceitas !== 0
}

export function descreverAjustes(a: Ajustes): string {
  const partes: string[] = []
  for (const v of VARIAVEIS) {
    if (a[v] !== 0) partes.push(`${ROTULO_VARIAVEL[v].toLowerCase()} ${a[v] > 0 ? '+' : '−'}${Math.abs(a[v])}%`)
  }
  if (a.atrasoReceitas > 0) {
    partes.push(`receitas atrasadas ${a.atrasoReceitas} ${a.atrasoReceitas === 1 ? 'mês' : 'meses'}`)
  }
  return partes.length ? partes.join(', ') : 'sem ajustes'
}

export function indicadoresCom(periodos: Periodo[], a: Ajustes): IndicadoresFluxoCaixa {
  return calcularIndicadores(calcularResultados(aplicarAjustes(periodos, a)))
}

export interface LinhaTornado {
  variavel: VariavelSensivel
  rotulo: string
  base: number
  /** Métrica com a variável reduzida em `variacao`%. */
  comReducao: number
  /** Métrica com a variável aumentada em `variacao`%. */
  comAumento: number
  amplitude: number
}

/**
 * Tornado: varia uma entrada por vez (±variacao%) e mede o efeito numa
 * métrica. Variáveis sem nenhum valor no horizonte ficam de fora.
 */
export function analiseTornado(
  periodos: Periodo[],
  metrica: (i: IndicadoresFluxoCaixa) => number,
  variacao = 20,
): LinhaTornado[] {
  const base = metrica(indicadoresCom(periodos, SEM_AJUSTES))
  return VARIAVEIS.filter((v) => periodos.some((p) => p[v] !== 0))
    .map((v) => {
      const comReducao = metrica(indicadoresCom(periodos, { ...SEM_AJUSTES, [v]: -variacao }))
      const comAumento = metrica(indicadoresCom(periodos, { ...SEM_AJUSTES, [v]: variacao }))
      return {
        variavel: v,
        rotulo: ROTULO_VARIAVEL[v],
        base,
        comReducao,
        comAumento,
        amplitude: Math.abs(comAumento - comReducao),
      }
    })
    .sort((a, b) => b.amplitude - a.amplitude)
}

/**
 * Menor atraso (em meses) no início das receitas que faz a recuperação deixar
 * de ocorrer no horizonte. 0 = já não recupera; null = não há déficit ou
 * nenhum atraso possível dentro do horizonte muda a decisão.
 */
export function limiarAtrasoReceitas(periodos: Periodo[]): number | null {
  const base = indicadoresCom(periodos, SEM_AJUSTES)
  if (!base.houveDeficit) return null
  if (base.mesRecuperacao === null) return 0
  for (let atraso = 1; atraso < periodos.length; atraso++) {
    if (indicadoresCom(periodos, { ...SEM_AJUSTES, atrasoReceitas: atraso }).mesRecuperacao === null) return atraso
  }
  return null
}
