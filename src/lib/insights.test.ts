import { describe, expect, it } from 'vitest'
import { gerarInsights } from './insights'
import { calcularIndicadores, calcularResultados } from './calculos'
import { cenarioExemploEdutask } from '@/data/exemploEdutask'
import type { Periodo } from '@/types'

function entrada(periodos: Periodo[], outros: Parameters<typeof gerarInsights>[0]['outros'] = []) {
  const resultados = calcularResultados(periodos)
  return { nomeCenario: 'Base', periodos, resultados, indicadores: calcularIndicadores(resultados), outros }
}

describe('gerarInsights', () => {
  it('reproduz a leitura do exemplo EduTask a partir dos indicadores', () => {
    const insights = gerarInsights(entrada(cenarioExemploEdutask.periodos))
    const porId = Object.fromEntries(insights.map((i) => [i.id, i]))

    expect(porId.exposicao.texto).toContain('Mês 3')
    expect(porId.exposicao.texto).toMatch(/R\$\s?28\.000/)
    expect(porId.liquidez.texto).toMatch(/pelo menos R\$\s?28\.000/)
    expect(porId.recuperacao.texto).toContain('Mês 6')
    expect(porId.saldo.texto).toMatch(/R\$\s?8\.000/)
    expect(insights.every((i) => i.regra.length > 0)).toBe(true)
  })

  it('não fala em déficit quando o acumulado nunca fica negativo', () => {
    const periodos: Periodo[] = [
      { mes: 0, receitas: 1000, despesas: 0, investimentos: 0, tributos: 0, residual: 0 },
      { mes: 1, receitas: 1000, despesas: 500, investimentos: 0, tributos: 0, residual: 0 },
    ]
    const insights = gerarInsights(entrada(periodos))
    expect(insights.map((i) => i.id)).toEqual(['sem-deficit', 'saldo'])
  })

  it('aponta cenário alternativo que não recupera', () => {
    const semRecuperacao = calcularIndicadores(
      calcularResultados([{ mes: 0, receitas: 0, despesas: 0, investimentos: 1000, tributos: 0, residual: 0 }]),
    )
    const insights = gerarInsights(entrada(cenarioExemploEdutask.periodos, [{ nome: 'Pessimista', indicadores: semRecuperacao }]))
    expect(insights.at(-1)?.texto).toBe(
      'No cenário pessimista, o projeto não recupera o déficit dentro do horizonte analisado.',
    )
  })
})
