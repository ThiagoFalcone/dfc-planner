import type { Cenario, IndicadoresFluxoCaixa, ResultadoPeriodo } from '@/types'
import type { Proveniencia } from '@/domain/scenario/types'
import { rotuloFonte } from '@/domain/scenario/types'
import type { AnaliseDescontada } from './financeiro'

function baixarArquivo(conteudo: string, nomeArquivo: string, tipo: string) {
  const blob = new Blob([conteudo], { type: tipo })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeArquivo
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export interface DadosExportacao {
  cenario: Cenario
  resultados: ResultadoPeriodo[]
  indicadores: IndicadoresFluxoCaixa
  projeto?: string
  proveniencia?: Proveniencia
  /** Análise complementar (TMA informada); null quando a TMA não foi informada. */
  analiseDescontada?: AnaliseDescontada | null
}

const CABECALHO_CSV = [
  'mes',
  'receitas',
  'despesas',
  'investimentos',
  'tributos',
  'residual',
  'fluxo',
  'acumulado',
]

export function exportarCSV({ cenario, resultados }: DadosExportacao): string {
  const linhas = cenario.periodos.map((p) => {
    const r = resultados.find((res) => res.mes === p.mes)
    return [
      p.mes,
      p.receitas,
      p.despesas,
      p.investimentos,
      p.tributos,
      p.residual,
      r?.fluxo ?? '',
      r?.acumulado ?? '',
    ].join(';')
  })
  const csv = [CABECALHO_CSV.join(';'), ...linhas].join('\n')
  const nome = `${slug(cenario.nome)}.csv`
  // BOM para o Excel reconhecer UTF-8.
  baixarArquivo(`﻿${csv}`, nome, 'text/csv;charset=utf-8')
  return nome
}

export function exportarJSON({ cenario, resultados, indicadores, projeto, proveniencia, analiseDescontada }: DadosExportacao): string {
  const payload = {
    moeda: 'BRL',
    unidadeTempo: 'mes',
    geradoEm: new Date().toISOString(),
    projeto: projeto ?? null,
    cenario: {
      id: cenario.id,
      nome: cenario.nome,
      premissas: cenario.descricaoPremissas,
      proveniencia: proveniencia
        ? { ...proveniencia, fonteRotulo: rotuloFonte(proveniencia.fonte) }
        : null,
      periodos: cenario.periodos,
    },
    resultados,
    indicadores,
    analiseDescontadaComplementar: analiseDescontada
      ? {
          observacao: 'Complementar: não altera os indicadores em caixa corrente (Opção 3).',
          tmaMensal: analiseDescontada.taxa,
          tmaAnualEquivalente: analiseDescontada.taxaAnual,
          vpl: analiseDescontada.vpl,
          tirMensal: analiseDescontada.tir,
          tirAnualEquivalente: analiseDescontada.tirAnual,
          paybackDescontado: analiseDescontada.paybackDescontado,
          acumuladoDescontado: analiseDescontada.serie,
        }
      : null,
  }
  const nome = `${slug(cenario.nome)}.json`
  baixarArquivo(JSON.stringify(payload, null, 2), nome, 'application/json')
  return nome
}

export function exportarHistoricoJSON(eventos: unknown[]): string {
  const nome = `historico-dfc-planner-${new Date().toISOString().slice(0, 10)}.json`
  baixarArquivo(
    JSON.stringify(
      {
        aviso: 'Histórico local do navegador. Não é uma trilha de auditoria inviolável.',
        exportadoEm: new Date().toISOString(),
        eventos,
      },
      null,
      2,
    ),
    nome,
    'application/json',
  )
  return nome
}

function slug(texto: string): string {
  return (
    texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'cenario'
  )
}
