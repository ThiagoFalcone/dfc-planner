import type { Cenario, IndicadoresFluxoCaixa, ResultadoPeriodo } from '@/types'

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

interface DadosExportacao {
  cenario: Cenario
  resultados: ResultadoPeriodo[]
  indicadores: IndicadoresFluxoCaixa
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

export function exportarCSV({ cenario, resultados }: DadosExportacao) {
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
  baixarArquivo(csv, `${slug(cenario.nome)}.csv`, 'text/csv;charset=utf-8')
}

export function exportarJSON({ cenario, resultados, indicadores }: DadosExportacao) {
  const payload = {
    moeda: 'BRL',
    unidadeTempo: 'mes',
    geradoEm: new Date().toISOString(),
    cenario: {
      id: cenario.id,
      nome: cenario.nome,
      premissas: cenario.descricaoPremissas,
      periodos: cenario.periodos,
    },
    resultados,
    indicadores,
  }
  baixarArquivo(JSON.stringify(payload, null, 2), `${slug(cenario.nome)}.json`, 'application/json')
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
