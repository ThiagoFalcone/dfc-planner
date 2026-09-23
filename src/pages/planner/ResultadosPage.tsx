import { useMemo, useState } from 'react'
import { Surface, SurfaceHeader } from '@/components/ui/Card'
import { KpiPanel } from '@/components/financial/KpiPanel'
import { FinancialInsights } from '@/components/financial/FinancialInsights'
import { EmptyState } from '@/components/financial/EmptyState'
import { AccumulatedChart } from '@/components/charts/AccumulatedChart'
import { CashFlowChart } from '@/components/charts/CashFlowChart'
import { ROTAS } from '@/components/app/Navigation'
import { nomeCurto } from '@/domain/scenario/types'
import { gerarInsights } from '@/lib/insights'
import { analisarDescontado, lerTMA } from '@/lib/financeiro'
import { DiscountedPanel } from '@/components/financial/DiscountedPanel'
import { useWorkspace } from './PlannerLayout'

export function ResultadosPage() {
  const { planner } = useWorkspace()
  const { cenarioAtivo, cenarios } = planner
  const { editavel, resultados, indicadores, problemas, periodosNumericos } = cenarioAtivo
  const nome = nomeCurto(editavel.nome)
  const [mostrarDescontado, setMostrarDescontado] = useState(true)
  const taxa = lerTMA(editavel.tma)
  const analise = useMemo(
    () => (indicadores && typeof taxa === 'number' ? analisarDescontado(resultados, taxa) : null),
    [indicadores, taxa, resultados],
  )

  const insights = useMemo(() => {
    if (!indicadores) return []
    return gerarInsights({
      nomeCenario: nome,
      periodos: periodosNumericos,
      resultados,
      indicadores,
      outros: cenarios
        .filter((c) => c.editavel.id !== editavel.id && c.indicadores)
        .map((c) => ({ nome: nomeCurto(c.editavel.nome), indicadores: c.indicadores! })),
    })
  }, [nome, periodosNumericos, resultados, indicadores, cenarios, editavel.id])

  if (problemas.length > 0) {
    return (
      <EmptyState
        icone="alerta"
        titulo="Existem valores que precisam ser corrigidos antes da análise"
        texto={`O cenário ${nome.toLowerCase()} tem ${problemas.length} ${problemas.length === 1 ? 'campo inválido' : 'campos inválidos'}. Indicadores e gráficos voltam assim que forem corrigidos.`}
        acao={{ rotulo: 'Revisar planejamento', para: ROTAS.planejamento }}
      />
    )
  }

  if (!indicadores || resultados.length === 0) {
    return (
      <EmptyState
        icone="planejamento"
        titulo="Seu planejamento ainda não possui dados suficientes"
        texto="Adicione ao menos um mês com valores para ver necessidade de capital, déficit e recuperação."
        acao={{ rotulo: 'Adicionar dados', para: ROTAS.planejamento }}
      />
    )
  }

  const semMovimento = resultados.every((r) => r.fluxo === 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Surface className="p-5 sm:p-6 lg:col-span-4" aria-label="Indicadores principais">
          <KpiPanel indicadores={indicadores} nomeCenario={nome} />
        </Surface>
        <Surface className="lg:col-span-8" aria-labelledby="titulo-acumulado">
          <SurfaceHeader
            id="titulo-acumulado"
            title="Fluxo acumulado"
            subtitle="Onde o caixa fica negativo, quanto afunda e quando volta a zero. Eixo em R$."
          />
          <div className="px-2 pb-4 sm:px-4">
            {semMovimento ? (
              <p className="px-3 py-16 text-center text-[13px] text-fg-3">
                Todos os meses estão zerados. Preencha o planejamento para desenhar a curva.
              </p>
            ) : (
              <AccumulatedChart
                resultados={resultados}
                indicadores={indicadores}
                descontado={analise && mostrarDescontado ? analise.serie : undefined}
              />
            )}
          </div>
        </Surface>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        <Surface className="lg:col-span-7" aria-labelledby="titulo-fluxo-mensal">
          <SurfaceHeader id="titulo-fluxo-mensal" title="Fluxo líquido mensal" subtitle="Receitas e residual menos despesas, investimento e tributos. Eixo em R$." />
          <div className="px-2 pb-4 sm:px-4">
            <CashFlowChart resultados={resultados} />
          </div>
        </Surface>
        <Surface className="lg:col-span-5" aria-labelledby="titulo-insights">
          <SurfaceHeader
            id="titulo-insights"
            title="Leitura financeira"
            subtitle="Regras fixas sobre os indicadores calculados, sem texto gerado por IA."
          />
          <div className="px-5 pb-5">
            <FinancialInsights insights={insights} />
          </div>
        </Surface>
      </div>

      <Surface aria-labelledby="titulo-descontado">
        <SurfaceHeader
          id="titulo-descontado"
          title="Valor do dinheiro no tempo"
          subtitle="Análise complementar: desconta os mesmos fluxos pela TMA. Os indicadores da Opção 3, acima, continuam em caixa corrente."
        />
        <div className="px-5 pb-5">
          <DiscountedPanel
            tma={editavel.tma}
            analise={analise}
            onTMA={(v) => planner.atualizarTMA(editavel.id, v)}
            mostrarNoGrafico={mostrarDescontado}
            onMostrarNoGrafico={setMostrarDescontado}
          />
        </div>
      </Surface>
    </div>
  )
}
