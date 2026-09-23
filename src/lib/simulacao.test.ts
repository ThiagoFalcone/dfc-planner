import { describe, expect, it } from 'vitest'
import { aplicarAjustes, analiseTornado, descreverAjustes, indicadoresCom, SEM_AJUSTES, temAjuste, limiarAtrasoReceitas } from './simulacao'
import { calcularIndicadores, calcularResultados } from './calculos'
import { cenarioExemploEdutask } from '@/data/exemploEdutask'

describe('aplicarAjustes', () => {
  it('sem ajustes, devolve os mesmos valores', () => {
    const ajustados = aplicarAjustes(cenarioExemploEdutask.periodos, SEM_AJUSTES)
    expect(ajustados).toEqual(cenarioExemploEdutask.periodos)
  })

  it('aplica percentual por variável, isoladamente', () => {
    const ajustados = aplicarAjustes(cenarioExemploEdutask.periodos, { ...SEM_AJUSTES, receitas: -20 })
    const mes4 = ajustados.find((p) => p.mes === 4)!
    expect(mes4.receitas).toBeCloseTo(12000 * 0.8, 2)
    expect(mes4.despesas).toBe(6000) // despesas não mudam
  })

  it('atraso empurra receitas para meses seguintes; a receita original do mês 6 (fora do horizonte) desaparece', () => {
    const ajustados = aplicarAjustes(cenarioExemploEdutask.periodos, { ...SEM_AJUSTES, atrasoReceitas: 2 })
    expect(ajustados.find((p) => p.mes === 0)!.receitas).toBe(0)
    expect(ajustados.find((p) => p.mes === 1)!.receitas).toBe(0)
    // Receita do mês 6 passa a ser a do mês 4 original (12000); a receita original do mês 6 (22000) sairia do mês 8, fora do horizonte.
    expect(ajustados.find((p) => p.mes === 6)!.receitas).toBeCloseTo(12000, 2)
  })
})

describe('temAjuste / descreverAjustes', () => {
  it('detecta ausência e presença de ajuste', () => {
    expect(temAjuste(SEM_AJUSTES)).toBe(false)
    expect(temAjuste({ ...SEM_AJUSTES, despesas: 5 })).toBe(true)
    expect(temAjuste({ ...SEM_AJUSTES, atrasoReceitas: 1 })).toBe(true)
  })

  it('descreve os ajustes em texto', () => {
    expect(descreverAjustes({ ...SEM_AJUSTES, receitas: -20, despesas: 10 })).toBe('receitas −20%, despesas +10%')
    expect(descreverAjustes(SEM_AJUSTES)).toBe('sem ajustes')
  })
})

describe('analiseTornado', () => {
  it('ordena as variáveis pela maior amplitude de efeito no capital necessário', () => {
    const linhas = analiseTornado(cenarioExemploEdutask.periodos, (i) => i.necessidadeCapital)
    expect(linhas.length).toBeGreaterThan(0)
    for (let i = 1; i < linhas.length; i++) expect(linhas[i - 1].amplitude).toBeGreaterThanOrEqual(linhas[i].amplitude)
  })

  it('reduzir despesas em 20% não aumenta o capital necessário', () => {
    const linhas = analiseTornado(cenarioExemploEdutask.periodos, (i) => i.necessidadeCapital)
    const despesas = linhas.find((l) => l.variavel === 'despesas')!
    const base = calcularIndicadores(calcularResultados(cenarioExemploEdutask.periodos)).necessidadeCapital
    expect(despesas.comReducao).toBeLessThanOrEqual(base)
  })
})

describe('limiarAtrasoReceitas', () => {
  it('encontra o menor atraso que impede a recuperação no horizonte do EduTask', () => {
    const atraso = limiarAtrasoReceitas(cenarioExemploEdutask.periodos)
    expect(atraso).not.toBeNull()
    if (atraso !== null) {
      expect(indicadoresCom(cenarioExemploEdutask.periodos, { ...SEM_AJUSTES, atrasoReceitas: atraso }).mesRecuperacao).toBeNull()
    }
  })
})
