import { describe, expect, it } from 'vitest'
import {
  calcularFluxo,
  calcularIndicadores,
  calcularNecessidadeCapital,
  calcularResultados,
  encontrarRecuperacao,
  paraNumero,
  validarPeriodos,
} from '@/lib/calculos'
import { cenarioExemploEdutask } from '@/data/exemploEdutask'
import type { Periodo } from '@/types'

/**
 * Casos de referência independentes (conferidos manualmente, sem o agente de IA),
 * conforme exigido no Passo 3 da atividade. Ver modelo_calculos.md.
 */

describe('calcularFluxo — regra fluxo[k] = receitas - despesas - investimentos - tributos + residual', () => {
  it('caso normal: soma e subtrai os componentes corretamente', () => {
    const periodo: Periodo = {
      mes: 1,
      receitas: 10000,
      despesas: 4000,
      investimentos: 2000,
      tributos: 500,
      residual: 0,
    }
    expect(calcularFluxo(periodo)).toBe(3500)
  })

  it('caso limite: todos os componentes zero resulta em fluxo zero', () => {
    const periodo: Periodo = {
      mes: 0,
      receitas: 0,
      despesas: 0,
      investimentos: 0,
      tributos: 0,
      residual: 0,
    }
    expect(calcularFluxo(periodo)).toBe(0)
  })
})

describe('caso de referência EduTask (dado pelo enunciado)', () => {
  const resultados = calcularResultados(cenarioExemploEdutask.periodos)
  const indicadores = calcularIndicadores(resultados)

  it('calcula fluxo e acumulado mês a mês exatamente como a tabela de referência', () => {
    expect(resultados).toEqual([
      { mes: 0, fluxo: -6000, acumulado: -6000 },
      { mes: 1, fluxo: -8000, acumulado: -14000 },
      { mes: 2, fluxo: -8000, acumulado: -22000 },
      { mes: 3, fluxo: -6000, acumulado: -28000 },
      { mes: 4, fluxo: 6000, acumulado: -22000 },
      { mes: 5, fluxo: 11000, acumulado: -11000 },
      { mes: 6, fluxo: 19000, acumulado: 8000 },
    ])
  })

  it('identifica o maior déficit de R$ 28.000 no mês 3', () => {
    expect(indicadores.maiorDeficit).toBe(28000)
    expect(indicadores.mesMaiorDeficit).toBe(3)
  })

  it('necessidade de capital é igual ao maior déficit em módulo (R$ 28.000)', () => {
    expect(calcularNecessidadeCapital(resultados)).toBe(28000)
    expect(indicadores.necessidadeCapital).toBe(28000)
  })

  it('saldo final do horizonte é R$ 8.000', () => {
    expect(indicadores.saldoFinal).toBe(8000)
  })

  it('recuperação ocorre no mês 6, conforme o enunciado', () => {
    expect(indicadores.mesRecuperacao).toBe(6)
    expect(indicadores.reincideNegativoAposRecuperacao).toBe(false)
  })
})

describe('cenário desfavorável: receita insuficiente para recuperar no horizonte', () => {
  it('reporta ausência de recuperação (mesRecuperacao = null) em vez de travar', () => {
    const periodosSemRecuperacao: Periodo[] = cenarioExemploEdutask.periodos.map((p) =>
      p.mes >= 4 ? { ...p, receitas: 0 } : p,
    )
    const resultados = calcularResultados(periodosSemRecuperacao)
    const indicadores = calcularIndicadores(resultados)

    expect(indicadores.houveDeficit).toBe(true)
    expect(indicadores.mesRecuperacao).toBeNull()
    expect(indicadores.saldoFinal).toBeLessThan(0)
  })
})

describe('alteração de premissa: variar o valor residual muda saldo final e necessidade de capital', () => {
  it('aumentar o residual do último mês reduz (ou zera) a necessidade de capital, sem alterar os meses anteriores', () => {
    const base = calcularResultados(cenarioExemploEdutask.periodos)
    const comResidualMaior = cenarioExemploEdutask.periodos.map((p) =>
      p.mes === 6 ? { ...p, residual: 25000 } : p,
    )
    const alterado = calcularResultados(comResidualMaior)

    // meses anteriores ao mês alterado permanecem idênticos
    expect(alterado.slice(0, 6)).toEqual(base.slice(0, 6))
    // saldo final sobe exatamente pela diferença de residual (25000 - 5000 = 20000)
    expect(alterado[6].acumulado).toBe(base[6].acumulado + 20000)
  })
})

describe('caso "saldo zero antes do primeiro desembolso não representa recuperação"', () => {
  it('não marca recuperação por um acumulado zero inicial, apenas após o primeiro déficit real', () => {
    const periodos: Periodo[] = [
      { mes: 0, receitas: 0, despesas: 0, investimentos: 0, tributos: 0, residual: 0 }, // acumulado 0, não é déficit
      { mes: 1, receitas: 0, despesas: 5000, investimentos: 0, tributos: 0, residual: 0 }, // acumulado -5000
      { mes: 2, receitas: 5000, despesas: 0, investimentos: 0, tributos: 0, residual: 0 }, // acumulado 0 → recuperação real
    ]
    const resultados = calcularResultados(periodos)
    const { mesRecuperacao } = encontrarRecuperacao(resultados)
    expect(mesRecuperacao).toBe(2)
  })
})

describe('entradas inválidas não podem quebrar o programa', () => {
  it('sinaliza campo vazio (NaN) sem calcular silenciosamente como zero', () => {
    const problemas = validarPeriodos([
      { mes: 0, receitas: NaN, despesas: 0, investimentos: 0, tributos: 0, residual: 0 },
    ])
    expect(problemas).toHaveLength(1)
    expect(problemas[0]).toMatchObject({ mes: 0, campo: 'receitas' })
  })

  it('sinaliza valor negativo digitado por engano (o sinal já é aplicado na fórmula)', () => {
    const problemas = validarPeriodos([
      { mes: 0, receitas: 0, despesas: -100, investimentos: 0, tributos: 0, residual: 0 },
    ])
    expect(problemas).toHaveLength(1)
    expect(problemas[0].campo).toBe('despesas')
  })

  it('receita zero em todos os meses não quebra o cálculo (necessidade de capital = despesas totais)', () => {
    const periodos: Periodo[] = [
      { mes: 0, receitas: 0, despesas: 1000, investimentos: 0, tributos: 0, residual: 0 },
      { mes: 1, receitas: 0, despesas: 500, investimentos: 0, tributos: 0, residual: 0 },
    ]
    const resultados = calcularResultados(periodos)
    const indicadores = calcularIndicadores(resultados)
    expect(indicadores.necessidadeCapital).toBe(1500)
    expect(indicadores.mesRecuperacao).toBeNull()
  })

  it('paraNumero trata campo vazio como NaN e aceita vírgula decimal', () => {
    expect(Number.isNaN(paraNumero(''))).toBe(true)
    expect(Number.isNaN(paraNumero('   '))).toBe(true)
    expect(paraNumero('1500,50')).toBe(1500.5)
    expect(paraNumero('1500.50')).toBe(1500.5)
  })
})

describe('caso sem nenhum déficit no horizonte', () => {
  it('necessidade de capital é zero e recuperação não se aplica (não houve déficit)', () => {
    const periodos: Periodo[] = [
      { mes: 0, receitas: 1000, despesas: 200, investimentos: 0, tributos: 0, residual: 0 },
      { mes: 1, receitas: 1000, despesas: 200, investimentos: 0, tributos: 0, residual: 0 },
    ]
    const resultados = calcularResultados(periodos)
    const indicadores = calcularIndicadores(resultados)
    expect(indicadores.houveDeficit).toBe(false)
    expect(indicadores.necessidadeCapital).toBe(0)
    expect(indicadores.mesRecuperacao).toBeNull()
    expect(indicadores.maiorDeficit).toBe(0)
  })
})
