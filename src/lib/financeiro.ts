import { arredondar, encontrarRecuperacao } from './calculos'
import type { ResultadoPeriodo } from '@/types'

/**
 * Análise descontada COMPLEMENTAR (valor do dinheiro no tempo).
 *
 * A Opção 3 da atividade trabalha em caixa corrente (ver modelo_calculos.md);
 * os indicadores obrigatórios continuam vindo só de calculos.ts. Este módulo
 * acrescenta, à parte, a leitura descontada por uma TMA mensal:
 *
 *   fluxoDescontado[k] = fluxo[k] / (1 + i)^k      (k = mês; mês 0 não é descontado)
 *   VPL                = Σ fluxoDescontado[k]
 *   TIR                = taxa i que zera o VPL
 *   payback descontado = mesma regra de recuperação, aplicada ao acumulado descontado
 */

export interface AnaliseDescontada {
  /** TMA mensal em fração (0,01 = 1% a.m.). */
  taxa: number
  taxaAnual: number
  vpl: number
  /** TIR mensal em fração; null quando não existe ou não é única no intervalo pesquisado. */
  tir: number | null
  tirAnual: number | null
  paybackDescontado: number | null
  houveDeficitDescontado: boolean
  /** Mais de uma troca de sinal no fluxo pode gerar mais de uma TIR — a UI avisa. */
  mudancasDeSinal: number
  serie: ResultadoPeriodo[]
}

export function taxaEquivalenteAnual(mensal: number): number {
  return Math.pow(1 + mensal, 12) - 1
}

/** Lê a TMA digitada (% a.m.). '' → null; texto inválido ou fora de [0, 100) → 'invalida'. */
export function lerTMA(texto: string): number | null | 'invalida' {
  const t = texto.trim().replace(',', '.').replace('%', '')
  if (t === '') return null
  const n = Number(t)
  if (!Number.isFinite(n) || n < 0 || n >= 100) return 'invalida'
  return n / 100
}

export function vpl(resultados: ResultadoPeriodo[], taxa: number): number {
  return resultados.reduce((soma, r) => soma + r.fluxo / Math.pow(1 + taxa, r.mes), 0)
}

function mudancasDeSinal(resultados: ResultadoPeriodo[]): number {
  const sinais = resultados.map((r) => Math.sign(r.fluxo)).filter((s) => s !== 0)
  let n = 0
  for (let i = 1; i < sinais.length; i++) if (sinais[i] !== sinais[i - 1]) n++
  return n
}

/** TIR mensal por bisseção em (−99,99%, 1000%]. Exige fluxos com sinais opostos e troca de sinal do VPL. */
export function tir(resultados: ResultadoPeriodo[]): number | null {
  if (!resultados.some((r) => r.fluxo > 0) || !resultados.some((r) => r.fluxo < 0)) return null
  let baixo = -0.9999
  let alto = 10
  let vBaixo = vpl(resultados, baixo)
  const vAlto = vpl(resultados, alto)
  if (Math.sign(vBaixo) === Math.sign(vAlto)) return null
  for (let i = 0; i < 200; i++) {
    const meio = (baixo + alto) / 2
    const vMeio = vpl(resultados, meio)
    if (Math.abs(vMeio) < 1e-7 || alto - baixo < 1e-10) return meio
    if (Math.sign(vMeio) === Math.sign(vBaixo)) {
      baixo = meio
      vBaixo = vMeio
    } else {
      alto = meio
    }
  }
  return (baixo + alto) / 2
}

export function serieDescontada(resultados: ResultadoPeriodo[], taxa: number): ResultadoPeriodo[] {
  let acumulado = 0
  return [...resultados]
    .sort((a, b) => a.mes - b.mes)
    .map((r) => {
      const fluxo = r.fluxo / Math.pow(1 + taxa, r.mes)
      acumulado += fluxo
      return { mes: r.mes, fluxo: arredondar(fluxo), acumulado: arredondar(acumulado) }
    })
}

export function analisarDescontado(resultados: ResultadoPeriodo[], taxa: number): AnaliseDescontada {
  const serie = serieDescontada(resultados, taxa)
  const { mesRecuperacao } = encontrarRecuperacao(serie)
  const taxaTir = tir(resultados)
  return {
    taxa,
    taxaAnual: taxaEquivalenteAnual(taxa),
    vpl: arredondar(vpl(resultados, taxa)),
    tir: taxaTir,
    tirAnual: taxaTir === null ? null : taxaEquivalenteAnual(taxaTir),
    paybackDescontado: mesRecuperacao,
    houveDeficitDescontado: serie.some((r) => r.acumulado < -0.01),
    mudancasDeSinal: mudancasDeSinal(resultados),
    serie,
  }
}

export function formatarPercentual(fracao: number, casas = 2): string {
  return `${(fracao * 100).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`
}
