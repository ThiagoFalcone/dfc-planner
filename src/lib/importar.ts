import { CAMPOS_NUMERICOS, type PeriodoInput } from '@/types'
import type { FonteDados } from '@/domain/scenario/types'
import { normalizarEntradaMonetaria } from './formato'

/**
 * Importação de dados para um cenário.
 *
 * Aceita:
 * - CSV/TSV (o CSV exportado pelo próprio app, ou uma planilha copiada):
 *   separador ";", "," ou tabulação; cabeçalho opcional; números no formato
 *   brasileiro ("6.000,50") ou internacional ("6000.5"). Colunas fluxo e
 *   acumulado são ignoradas — são sempre recalculadas.
 * - JSON exportado pelo app (cenario.periodos) ou uma lista de períodos.
 *
 * Valores inválidos não são corrigidos: entram como estão e a validação do
 * cálculo (RF09) sinaliza a célula.
 */

export interface ResultadoImportacao {
  periodos: PeriodoInput[]
  nome?: string
  premissas?: string
  referencia?: string
  fonte?: FonteDados
  avisos: string[]
}

export class ErroImportacao extends Error {}

const SINONIMOS: Record<string, keyof PeriodoInput> = {
  mes: 'mes',
  mês: 'mes',
  periodo: 'mes',
  período: 'mes',
  receita: 'receitas',
  receitas: 'receitas',
  recebimentos: 'receitas',
  despesa: 'despesas',
  despesas: 'despesas',
  investimento: 'investimentos',
  investimentos: 'investimentos',
  tributo: 'tributos',
  tributos: 'tributos',
  impostos: 'tributos',
  residual: 'residual',
  'valor residual': 'residual',
}

const ORDEM_PADRAO: Array<keyof PeriodoInput> = ['mes', ...CAMPOS_NUMERICOS]

function detectarSeparador(linha: string): string {
  if (linha.includes('\t')) return '\t'
  if (linha.includes(';')) return ';'
  return ','
}

function normalizarCabecalho(c: string): string {
  return c.trim().toLowerCase().replace(/^[+\-−]\s*/, '').replace(/\s+/g, ' ')
}

/**
 * Divide uma linha CSV respeitando campos entre aspas (que podem conter o
 * próprio separador, como em "1.500,50" num arquivo separado por vírgula).
 * `""` dentro de um campo entre aspas vira uma aspa literal.
 */
function dividirLinhaCSV(linha: string, sep: string): string[] {
  const campos: string[] = []
  let atual = ''
  let entreAspas = false
  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i]
    if (entreAspas) {
      if (ch === '"' && linha[i + 1] === '"') {
        atual += '"'
        i++
      } else if (ch === '"') {
        entreAspas = false
      } else {
        atual += ch
      }
    } else if (ch === '"' && atual === '') {
      entreAspas = true
    } else if (ch === sep) {
      campos.push(atual)
      atual = ''
    } else {
      atual += ch
    }
  }
  campos.push(atual)
  return campos.map((c) => c.trim())
}

export function importarTabela(texto: string): ResultadoImportacao {
  const linhas = texto
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== '')
  if (linhas.length === 0) throw new ErroImportacao('O arquivo está vazio.')

  const sep = detectarSeparador(linhas[0])
  const primeira = dividirLinhaCSV(linhas[0], sep)
  const ehCabecalho = primeira.some((c) => SINONIMOS[normalizarCabecalho(c)] !== undefined)
  const avisos: string[] = []

  let colunas: Array<keyof PeriodoInput | null>
  if (ehCabecalho) {
    colunas = primeira.map((c) => SINONIMOS[normalizarCabecalho(c)] ?? null)
    const ignoradas = primeira.filter((c) => SINONIMOS[normalizarCabecalho(c)] === undefined).map((c) => c.trim())
    if (ignoradas.length) avisos.push(`Colunas ignoradas: ${ignoradas.join(', ')} (fluxo e acumulado são recalculados).`)
    if (!colunas.some((c) => c && c !== 'mes')) throw new ErroImportacao('Nenhuma coluna reconhecida (receitas, despesas…).')
  } else {
    const n = primeira.length
    // Sem cabeçalho: com 6+ colunas assume "mês, receitas, despesas, investimento, tributos, residual"; com 5, sem a coluna de mês.
    colunas = n >= 6 ? ORDEM_PADRAO.slice() : CAMPOS_NUMERICOS.slice(0, n)
    avisos.push('Arquivo sem cabeçalho: colunas lidas na ordem mês, receitas, despesas, investimento, tributos, residual.')
  }

  const dados = ehCabecalho ? linhas.slice(1) : linhas
  if (dados.length === 0) throw new ErroImportacao('O arquivo não tem linhas de dados.')
  const temMes = colunas.includes('mes')

  const periodos: PeriodoInput[] = dados.map((linha, i) => {
    const celulas = dividirLinhaCSV(linha, sep)
    const p: PeriodoInput = { mes: i, receitas: '0', despesas: '0', investimentos: '0', tributos: '0', residual: '0' }
    colunas.forEach((col, j) => {
      if (!col) return
      const bruto = celulas[j] ?? ''
      if (col === 'mes') {
        const n = Number(bruto.replace(/[^\d-]/g, ''))
        p.mes = Number.isInteger(n) && bruto !== '' ? n : i
      } else {
        p[col] = normalizarEntradaMonetaria(bruto)
      }
    })
    return p
  })

  if (temMes) {
    const meses = periodos.map((p) => p.mes)
    if (new Set(meses).size !== meses.length) {
      avisos.push('Meses repetidos no arquivo: renumerados em sequência a partir do Mês 0.')
      periodos.forEach((p, i) => (p.mes = i))
    }
  }
  periodos.sort((a, b) => a.mes - b.mes)
  return { periodos, avisos, fonte: 'documento' }
}

function ehObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function periodoDeObjeto(o: unknown, i: number): PeriodoInput {
  if (!ehObjeto(o)) throw new ErroImportacao(`Período ${i + 1} não é um objeto.`)
  const valor = (k: string) => (o[k] === undefined || o[k] === null ? '0' : normalizarEntradaMonetaria(String(o[k])))
  return {
    mes: typeof o.mes === 'number' ? o.mes : i,
    receitas: valor('receitas'),
    despesas: valor('despesas'),
    investimentos: valor('investimentos'),
    tributos: valor('tributos'),
    residual: valor('residual'),
  }
}

export function importarJSON(texto: string): ResultadoImportacao {
  let dados: unknown
  try {
    dados = JSON.parse(texto)
  } catch {
    throw new ErroImportacao('JSON inválido.')
  }
  if (Array.isArray(dados)) return { periodos: dados.map(periodoDeObjeto), avisos: [], fonte: 'documento' }
  if (ehObjeto(dados) && ehObjeto(dados.cenario) && Array.isArray(dados.cenario.periodos)) {
    const c = dados.cenario
    const prov = ehObjeto(c.proveniencia) ? c.proveniencia : null
    return {
      periodos: (c.periodos as unknown[]).map(periodoDeObjeto),
      nome: typeof c.nome === 'string' ? c.nome : undefined,
      premissas: typeof c.premissas === 'string' ? c.premissas : undefined,
      referencia: prov && typeof prov.referencia === 'string' ? prov.referencia : undefined,
      fonte: prov && typeof prov.fonte === 'string' ? (prov.fonte as FonteDados) : 'documento',
      avisos: [],
    }
  }
  throw new ErroImportacao('Formato não reconhecido: esperado o JSON exportado pelo DFC Planner ou uma lista de períodos.')
}

export function importarArquivo(nomeArquivo: string, conteudo: string): ResultadoImportacao {
  const r = /\.json$/i.test(nomeArquivo) ? importarJSON(conteudo) : importarTabela(conteudo)
  if (r.periodos.length === 0) throw new ErroImportacao('Nenhum mês encontrado no arquivo.')
  if (r.periodos.length > 120) throw new ErroImportacao('O arquivo tem mais de 120 meses; divida o horizonte.')
  return { ...r, referencia: r.referencia ?? nomeArquivo }
}

/** Texto colado de uma planilha (Excel/Sheets): linhas por quebra, colunas por tabulação. */
export function lerBlocoColado(texto: string): string[][] {
  return texto
    .replace(/\r/g, '')
    .replace(/\n$/, '')
    .split('\n')
    .map((l) => l.split('\t').map((c) => normalizarEntradaMonetaria(c)))
}
