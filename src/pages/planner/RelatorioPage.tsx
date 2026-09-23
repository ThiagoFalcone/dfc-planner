import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { criarRepositorioProjetos } from '@/services/planner/plannerRepository'
import { computar } from '@/domain/scenario/computar'
import { nomeCurto, rotuloFonte } from '@/domain/scenario/types'
import { gerarInsights } from '@/lib/insights'
import { analisarDescontado, formatarPercentual, lerTMA } from '@/lib/financeiro'
import { formatarDataHora, formatarMoedaCurta, rotuloMes } from '@/lib/formato'
import { BrandMark } from '@/components/ui/Icon'
import { KpiPanel } from '@/components/financial/KpiPanel'
import { AccumulatedChart } from '@/components/charts/AccumulatedChart'
import { CashFlowChart } from '@/components/charts/CashFlowChart'
import { ChartModoImpressao } from '@/components/charts/useChartTheme'

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="print-avoid mt-6 first:mt-0">
      <h2 className="mb-2 text-[13px] font-semibold tracking-wide text-fg uppercase">{titulo}</h2>
      {children}
    </section>
  )
}

/**
 * Relatório executivo: versão imprimível (Ctrl+P → salvar como PDF).
 * Sem barra de navegação: só o conteúdo do documento, em tema claro fixo.
 */
export function RelatorioPage() {
  const { usuario } = useAuth()
  const [params] = useSearchParams()
  const projetoId = params.get('projeto')
  const cenarioId = params.get('cenario')
  const autoImprimir = params.get('imprimir') === '1'

  const dados = useMemo(() => {
    if (!usuario || !projetoId) return null
    const estado = criarRepositorioProjetos(usuario.id).carregar(projetoId)
    if (!estado) return null
    const editavel = estado.cenarios.find((c) => c.id === cenarioId) ?? estado.cenarios[0]
    const computado = computar(editavel)
    const outros = estado.cenarios
      .filter((c) => c.id !== editavel.id)
      .map((c) => computar(c))
      .filter((c) => c.indicadores)
    return { estado, computado, outros }
  }, [usuario, projetoId, cenarioId])

  useEffect(() => {
    if (autoImprimir && dados?.computado.indicadores) {
      const id = window.setTimeout(() => window.print(), 400)
      return () => window.clearTimeout(id)
    }
  }, [autoImprimir, dados])

  if (!dados) {
    return <p className="p-8 text-sm text-fg-2">Planejamento não encontrado. Feche esta aba e exporte novamente a partir de Resultados.</p>
  }

  const { estado, computado, outros } = dados
  const { editavel, resultados, indicadores, periodosNumericos } = computado
  const nome = nomeCurto(editavel.nome)

  if (!indicadores) {
    return <p className="p-8 text-sm text-fg-2">O cenário "{nome}" tem valores pendentes. Corrija-os em Planejamento antes de gerar o relatório.</p>
  }

  const insights = gerarInsights({
    nomeCenario: nome,
    periodos: periodosNumericos,
    resultados,
    indicadores,
    outros: outros.map((c) => ({ nome: nomeCurto(c.editavel.nome), indicadores: c.indicadores! })),
  })
  const taxa = lerTMA(editavel.tma)
  const descontado = typeof taxa === 'number' ? analisarDescontado(resultados, taxa) : null

  return (
    <ChartModoImpressao.Provider value={true}>
      <div className="tema-claro min-h-svh px-6 py-8 print:p-0">
        <div className="no-print mb-5 flex items-center justify-between rounded-xl bg-hover px-4 py-2.5 text-[13px] text-fg-2">
          <span>Pré-visualização do relatório. Use Ctrl+P (ou ⌘P) para imprimir ou salvar como PDF.</span>
          <button type="button" onClick={() => window.print()} className="focus-ring rounded-lg bg-fg px-3 py-1.5 font-medium text-surface">
            Imprimir / Salvar PDF
          </button>
        </div>

        <article className="mx-auto max-w-[760px] text-fg">
          <header className="flex items-start justify-between border-b border-line pb-4">
            <div className="flex items-center gap-2.5">
              <BrandMark className="h-8 w-8" />
              <div>
                <p className="text-[15px] font-semibold">DFC Planner</p>
                <p className="text-xs text-fg-3">Relatório de decisão do planejamento de fluxo de caixa</p>
              </div>
            </div>
            <p className="text-right text-xs text-fg-3">
              Gerado em {formatarDataHora(new Date().toISOString())}
              <br />
              por {usuario?.nome}
            </p>
          </header>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight">{estado.nomeProjeto}</h1>
          <p className="mt-1 text-[13px] text-fg-2">
            Cenário analisado: <strong className="text-fg">{nome}</strong> · Fonte: {rotuloFonte(editavel.proveniencia.fonte)}
            {editavel.proveniencia.referencia && ` (${editavel.proveniencia.referencia})`}
          </p>

          <Secao titulo="Premissas do cenário">
            <p className="text-[13px] leading-relaxed text-fg-2">{editavel.descricaoPremissas || 'Nenhuma premissa declarada.'}</p>
          </Secao>

          <Secao titulo="Indicadores">
            <KpiPanel indicadores={indicadores} nomeCenario={nome} />
          </Secao>

          <Secao titulo="Fluxo acumulado">
            <AccumulatedChart resultados={resultados} indicadores={indicadores} descontado={descontado?.serie} altura="h-64" />
          </Secao>

          <Secao titulo="Fluxo líquido mensal">
            <CashFlowChart resultados={resultados} />
          </Secao>

          {descontado && (
            <Secao titulo="Valor do dinheiro no tempo (complementar)">
              <p className="text-[13px] leading-relaxed text-fg-2">
                Com TMA de {formatarPercentual(descontado.taxa)} ao mês ({formatarPercentual(descontado.taxaAnual)} ao
                ano): VPL de {formatarMoedaCurta(descontado.vpl)}
                {descontado.tir !== null && `, TIR de ${formatarPercentual(descontado.tir)} ao mês`}
                {descontado.paybackDescontado !== null
                  ? `, payback descontado no ${rotuloMes(descontado.paybackDescontado)}`
                  : descontado.houveDeficitDescontado && ', sem payback descontado dentro do horizonte'}
                . Esta leitura não substitui os indicadores em caixa corrente acima, que são os exigidos pela atividade.
              </p>
            </Secao>
          )}

          <Secao titulo="Leitura financeira">
            <ul className="flex flex-col gap-2">
              {insights.map((i) => (
                <li key={i.id} className="text-[13px] leading-relaxed text-fg-2">
                  <strong className="text-fg">{i.titulo}.</strong> {i.texto}
                </li>
              ))}
            </ul>
          </Secao>

          <p className="print-avoid mt-8 border-t border-line pt-3 text-xs text-fg-3">
            Nenhuma afirmação acima é uma garantia sobre o futuro. São leituras condicionadas às premissas declaradas
            neste documento, válidas apenas para o horizonte e os valores informados.
          </p>
        </article>
      </div>
    </ChartModoImpressao.Provider>
  )
}
