import { describe, expect, it } from 'vitest'
import { normalizarEntradaMonetaria, tempoRelativo } from './formato'
import { paraNumero } from './calculos'

describe('normalizarEntradaMonetaria', () => {
  it.each([
    ['6000', '6000'],
    ['6.000', '6000'],
    ['6.000,50', '6000.50'],
    ['1.234.567', '1234567'],
    ['6000,5', '6000.5'],
    ['R$ 8.000', '8000'],
    ['12.5', '12.5'],
    ['  7000 ', '7000'],
    ['', ''],
  ])('"%s" → "%s"', (entrada, esperado) => {
    expect(normalizarEntradaMonetaria(entrada)).toBe(esperado)
  })

  it('mantém texto não reconhecido para a validação sinalizar', () => {
    const r = normalizarEntradaMonetaria('abc')
    expect(r).toBe('abc')
    expect(Number.isNaN(paraNumero(r))).toBe(true)
  })

  it('preserva o sinal negativo para a validação recusar', () => {
    expect(paraNumero(normalizarEntradaMonetaria('-8.000'))).toBe(-8000)
  })
})

describe('tempoRelativo', () => {
  const agora = new Date('2026-09-23T12:00:00Z')
  it('descreve intervalos curtos e longos', () => {
    expect(tempoRelativo('2026-09-23T11:59:40Z', agora)).toBe('agora')
    expect(tempoRelativo('2026-09-23T11:57:00Z', agora)).toBe('há 3 min')
    expect(tempoRelativo('2026-09-23T10:00:00Z', agora)).toBe('há 2 h')
    expect(tempoRelativo('2026-09-22T12:00:00Z', agora)).toBe('ontem')
  })
})
