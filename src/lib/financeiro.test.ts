import { describe, expect, it } from 'vitest'
import { analisarDescontado, lerTMA, taxaEquivalenteAnual, tir, vpl } from './financeiro'
import { calcularResultados } from './calculos'
import { cenarioExemploEdutask } from '@/data/exemploEdutask'
import type { ResultadoPeriodo } from '@/types'

describe('lerTMA', () => {
  it.each([
    ['', null],
    ['1,5', 0.015],
    ['1.5', 0.015],
    ['0', 0],
  ])('"%s" → %s', (texto, esperado) => {
    expect(lerTMA(texto)).toBe(esperado)
  })

  it('rejeita fora de [0, 100)', () => {
    expect(lerTMA('-1')).toBe('invalida')
    expect(lerTMA('100')).toBe('invalida')
    expect(lerTMA('abc')).toBe('invalida')
  })
})

describe('taxaEquivalenteAnual', () => {
  it('1% a.m. ≈ 12,68% a.a.', () => {
    expect(taxaEquivalenteAnual(0.01)).toBeCloseTo(0.126825, 5)
  })
})

describe('vpl e tir', () => {
  const resultados = calcularResultados(cenarioExemploEdutask.periodos)

  it('VPL cai conforme a taxa sobe (fluxos líquidos positivos no total)', () => {
    const v0 = vpl(resultados, 0)
    const v10 = vpl(resultados, 0.1)
    expect(v0).toBeGreaterThan(v10)
  })

  it('TIR encontrada faz o VPL ficar próximo de zero', () => {
    const taxa = tir(resultados)
    expect(taxa).not.toBeNull()
    expect(Math.abs(vpl(resultados, taxa as number))).toBeLessThan(1)
  })

  it('sem fluxos negativos ou sem positivos, não há TIR', () => {
    const todosPositivos: ResultadoPeriodo[] = [{ mes: 0, fluxo: 100, acumulado: 100 }]
    expect(tir(todosPositivos)).toBeNull()
  })
})

describe('analisarDescontado', () => {
  it('payback descontado é igual ou posterior ao payback simples', () => {
    const resultados = calcularResultados(cenarioExemploEdutask.periodos)
    const a = analisarDescontado(resultados, 0.02)
    expect(a.paybackDescontado).not.toBeNull()
    expect(a.paybackDescontado as number).toBeGreaterThanOrEqual(6)
  })

  it('taxa zero: VPL descontado é igual à soma simples dos fluxos', () => {
    const resultados = calcularResultados(cenarioExemploEdutask.periodos)
    const a = analisarDescontado(resultados, 0)
    const soma = resultados.reduce((s, r) => s + r.fluxo, 0)
    expect(a.vpl).toBeCloseTo(soma, 1)
  })
})
