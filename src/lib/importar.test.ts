import { describe, expect, it } from 'vitest'
import { ErroImportacao, importarArquivo, importarJSON, importarTabela, lerBlocoColado } from './importar'
import { cenarioExemploEdutask } from '@/data/exemploEdutask'

describe('importarTabela', () => {
  it('lê CSV com cabeçalho e separador ";" (o formato exportado pelo app)', () => {
    const r = importarTabela('mes;receitas;despesas;investimentos;tributos;residual;fluxo;acumulado\n0;0;0;6000;0;0;-6000;-6000\n1;0;8000;0;0;0;-8000;-14000')
    expect(r.periodos).toEqual([
      { mes: 0, receitas: '0', despesas: '0', investimentos: '6000', tributos: '0', residual: '0' },
      { mes: 1, receitas: '0', despesas: '8000', investimentos: '0', tributos: '0', residual: '0' },
    ])
    expect(r.avisos.some((a) => a.includes('Colunas ignoradas'))).toBe(true)
  })

  it('lê CSV com vírgula decimal e sem coluna de mês', () => {
    const r = importarTabela('receitas,despesas,investimentos,tributos,residual\n"1.500,50",800,0,0,0')
    expect(r.periodos[0].receitas).toBe('1500.50')
    expect(r.periodos[0].mes).toBe(0)
  })

  it('sem cabeçalho, assume a ordem padrão de 6 colunas', () => {
    const r = importarTabela('0\t0\t0\t6000\t0\t0\n1\t0\t8000\t0\t0\t0')
    expect(r.periodos[0].investimentos).toBe('6000')
    expect(r.avisos.some((a) => a.includes('sem cabeçalho'))).toBe(true)
  })

  it('rejeita arquivo vazio', () => {
    expect(() => importarTabela('')).toThrow(ErroImportacao)
  })

  it('sem cabeçalho reconhecido, cai no fallback posicional em vez de travar (RF09 sinaliza depois)', () => {
    // 2 colunas, nenhuma bate com SINONIMOS: interpretado como "sem cabeçalho", receitas/despesas por posição.
    const r = importarTabela('foo,bar\n1,2')
    expect(r.periodos).toEqual([
      { mes: 0, receitas: 'foo', despesas: 'bar', investimentos: '0', tributos: '0', residual: '0' },
      { mes: 1, receitas: '1', despesas: '2', investimentos: '0', tributos: '0', residual: '0' },
    ])
  })

  it('renumera meses repetidos e ordena por mês', () => {
    const r = importarTabela('mes;receitas\n2;100\n2;200\n0;50')
    expect(r.periodos.map((p) => p.mes)).toEqual([0, 1, 2])
    expect(r.avisos.some((a) => a.includes('repetidos'))).toBe(true)
  })
})

describe('importarJSON', () => {
  it('lê uma lista simples de períodos', () => {
    const r = importarJSON(JSON.stringify([{ mes: 0, receitas: 100, despesas: 50, investimentos: 0, tributos: 0, residual: 0 }]))
    expect(r.periodos[0].receitas).toBe('100')
  })

  it('lê o formato exportado pelo próprio app (cenario.periodos + premissas)', () => {
    const payload = { cenario: { nome: 'Cenário base', premissas: 'teste', periodos: cenarioExemploEdutask.periodos } }
    const r = importarJSON(JSON.stringify(payload))
    expect(r.periodos.length).toBe(cenarioExemploEdutask.periodos.length)
    expect(r.nome).toBe('Cenário base')
    expect(r.premissas).toBe('teste')
  })

  it('rejeita JSON inválido ou de formato desconhecido', () => {
    expect(() => importarJSON('{invalido')).toThrow(ErroImportacao)
    expect(() => importarJSON('{"foo":1}')).toThrow(ErroImportacao)
  })
})

describe('importarArquivo', () => {
  it('escolhe o parser pela extensão', () => {
    expect(importarArquivo('dados.json', '[{"mes":0,"receitas":10,"despesas":0,"investimentos":0,"tributos":0,"residual":0}]').periodos).toHaveLength(1)
    expect(importarArquivo('dados.csv', 'mes;receitas\n0;10').periodos).toHaveLength(1)
  })

  it('rejeita mais de 120 meses', () => {
    const linhas = Array.from({ length: 121 }, (_, i) => `${i};10`).join('\n')
    expect(() => importarArquivo('dados.csv', `mes;receitas\n${linhas}`)).toThrow(ErroImportacao)
  })
})

describe('lerBlocoColado', () => {
  it('separa linhas e colunas de um bloco colado do Excel, normalizando números', () => {
    expect(lerBlocoColado('1.000,50\t800\n2.000\t900')).toEqual([
      ['1000.50', '800'],
      ['2000', '900'],
    ])
  })
})
