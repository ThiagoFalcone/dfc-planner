import { useMemo, useState } from 'react'
import { nomeCurto } from '@/domain/scenario/types'
import { calcularIndicadores, calcularResultados } from '@/lib/calculos'
import { limiarAumentoDespesaSemRecuperacao, limiarQuedaReceitaSemRecuperacao } from '@/lib/sensibilidade'
import {
  analiseTornado,
  aplicarAjustes,
  descreverAjustes,
  limiarAtrasoReceitas,
  SEM_AJUSTES,
  temAjuste,
  type Ajustes,
} from '@/lib/simulacao'
import { rotuloMes } from '@/lib/formato'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Surface, SurfaceHeader } from '@/components/ui/Card'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { EmptyState } from '@/components/financial/EmptyState'
import { AdjustSlider } from '@/components/financial/AdjustSlider'
import { MoneyValue } from '@/components/financial/MoneyValue'
import { AccumulatedChart } from '@/components/charts/AccumulatedChart'
import { TornadoChart } from '@/components/charts/TornadoChart'
import { ROTAS } from '@/components/app/Navigation'
import { useWorkspace } from './PlannerLayout'

type Metrica = 'necessidadeCapital' | 'saldoFinal'

export function SensibilidadePage() {
  const { planner } = useWorkspace()
  const { cenarioAtivo } = planner
  const { editavel, problemas, periodosNumericos, indicadores: indicadoresOriginais } = cenarioAtivo
  const nome = nomeCurto(editavel.nome)
  const [ajustes, setAjustes] = useState<Ajustes>(SEM_AJUSTES)
  const [metrica, setMetrica] = useState<Metrica>('necessidadeCapital')

  const simulado = useMemo(() => {
    const periodos = aplicarAjustes(periodosNumericos, ajustes)
    const resultados = calcularResultados(periodos)
    return { resultados, indicadores: calcularIndicadores(resultados) }
  }, [periodosNumericos, ajustes])

  const tornado = useMemo(
    () =>
      analiseTornado(periodosNumericos, (i) => (metrica === 'necessidadeCapital' ? i.necessidadeCapital : i.saldoFinal)),
    [periodosNumericos, metrica],
  )

  const limiarReceita = useMemo(() => limiarQuedaReceitaSemRecuperacao(periodosNumericos), [periodosNumericos])
  const limiarDespesa = useMemo(() => limiarAumentoDespesaSemRecuperacao(periodosNumericos), [periodosNumericos])
  const limiarAtraso = useMemo(() => limiarAtrasoReceitas(periodosNumericos), [periodosNumericos])

  if (problemas.length > 0) {
    return (
      <EmptyState
        icone="alerta"
        titulo="Existem valores que precisam ser corrigidos antes da análise"
        texto={`O cenário ${nome.toLowerCase()} tem campos inválidos. A simulação usa os mesmos dados de Resultados.`}
        acao={{ rotulo: 'Revisar planejamento', para: ROTAS.planejamento }}
      />
    )
  }

  const ativo = temAjuste(ajustes)
  const antes = indicadoresOriginais
  const depois = simulado.indicadores
  const delta = antes ? depois.necessidadeCapital - antes.necessidadeCapital : 0

  return (
    <div className="flex flex-col gap-5">
      <Alert tone="info">
        Esta página só simula: os ajustes abaixo não alteram os dados salvos do cenário. Para registrar uma hipótese
        como cenário, use “Recriar” em Cenários ou “Novo cenário”.
      </Alert>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        <Surface className="p-5 sm:p-6 lg:col-span-4" aria-labelledby="titulo-simulador">
          <h2 id="titulo-simulador" className="text-[15px] font-semibold tracking-[-0.01em] text-fg">
            Simulador “e se” de {nome}
          </h2>
          <p className="mt-1 text-[13px] text-fg-3">Varia uma ou mais premissas de uma vez, a partir dos valores atuais.</p>

          <div className="mt-5 flex flex-col gap-4">
            <AdjustSlider rotulo="Receitas" valor={ajustes.receitas} onChange={(v) => setAjustes((a) => ({ ...a, receitas: v }))} />
            <AdjustSlider rotulo="Despesas" valor={ajustes.despesas} onChange={(v) => setAjustes((a) => ({ ...a, despesas: v }))} />
            <AdjustSlider rotulo="Investimento" valor={ajustes.investimentos} onChange={(v) => setAjustes((a) => ({ ...a, investimentos: v }))} />
            <AdjustSlider rotulo="Tributos" valor={ajustes.tributos} onChange={(v) => setAjustes((a) => ({ ...a, tributos: v }))} />
            <AdjustSlider rotulo="Residual" valor={ajustes.residual} onChange={(v) => setAjustes((a) => ({ ...a, residual: v }))} />
            <AdjustSlider
              rotulo="Atraso nas receitas"
              valor={ajustes.atrasoReceitas}
              onChange={(v) => setAjustes((a) => ({ ...a, atrasoReceitas: v }))}
              min={0}
              max={periodosNumericos.length - 1}
              sufixo=" meses"
            />
          </div>

          <Button size="sm" variant="ghost" className="mt-4" disabled={!ativo} onClick={() => setAjustes(SEM_AJUSTES)}>
            Restaurar valores originais
          </Button>

          {ativo && antes && (
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4">
              <div>
                <dt className="text-xs text-fg-3">Capital necessário</dt>
                <dd className="mt-0.5 text-base font-semibold">
                  <MoneyValue valor={depois.necessidadeCapital} tom={depois.necessidadeCapital > 0 ? 'atencao' : 'positivo'} />
                </dd>
                {Math.abs(delta) > 0.01 && (
                  <dd className={`text-xs ${delta > 0 ? 'text-negative' : 'text-positive'}`}>
                    {delta > 0 ? '+' : ''}
                    <MoneyValue valor={delta} tom="neutro" animar={false} className="inline" /> vs. atual
                  </dd>
                )}
              </div>
              <div>
                <dt className="text-xs text-fg-3">Recuperação</dt>
                <dd className="mt-0.5 text-base font-semibold">
                  {!depois.houveDeficit ? '—' : depois.mesRecuperacao !== null ? (
                    <span className="text-positive">{rotuloMes(depois.mesRecuperacao)}</span>
                  ) : (
                    <span className="text-negative">Não recupera</span>
                  )}
                </dd>
              </div>
            </dl>
          )}
        </Surface>

        <Surface className="lg:col-span-8" aria-labelledby="titulo-simulado">
          <SurfaceHeader
            id="titulo-simulado"
            title="Acumulado simulado"
            subtitle={ativo ? `Com ${descreverAjustes(ajustes)}.` : 'Ajuste um controle ao lado para ver o efeito no acumulado.'}
          />
          <div className="px-2 pb-4 sm:px-4">
            <AccumulatedChart resultados={simulado.resultados} indicadores={depois} altura="h-64 sm:h-72" />
          </div>
        </Surface>
      </div>

      <Surface aria-labelledby="titulo-tornado">
        <SurfaceHeader
          id="titulo-tornado"
          title="Qual premissa mais pesa na decisão"
          subtitle="Cada barra varia uma única premissa em ±20%, mantendo as demais como estão: a leitura clássica de sensibilidade."
          action={
            <SegmentedControl
              rotulo="Métrica"
              tamanho="sm"
              valor={metrica}
              onChange={(v) => setMetrica(v as Metrica)}
              opcoes={[
                { valor: 'necessidadeCapital', rotulo: 'Capital necessário' },
                { valor: 'saldoFinal', rotulo: 'Saldo final' },
              ]}
            />
          }
        />
        <div className="px-4 pb-5">
          <TornadoChart linhas={tornado} metricaRotulo={metrica === 'necessidadeCapital' ? 'capital necessário' : 'saldo final'} />
        </div>
      </Surface>

      <Surface aria-labelledby="titulo-limiares" className="p-5 sm:p-6">
        <h2 id="titulo-limiares" className="text-[15px] font-semibold tracking-[-0.01em] text-fg">
          Limiares de recuperação (RF08)
        </h2>
        <p className="mt-1 text-[13px] text-fg-3">
          Varia uma única entrada por vez, em passos de 1%, até a recuperação deixar de ocorrer no horizonte.
        </p>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-fg-3">Queda de receita</dt>
            <dd className="mt-0.5 text-base font-semibold">
              {limiarReceita === null ? 'Pouco sensível' : `${limiarReceita}%`}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-fg-3">Aumento de despesa</dt>
            <dd className="mt-0.5 text-base font-semibold">
              {limiarDespesa === null ? 'Pouco sensível' : `${limiarDespesa}%`}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-fg-3">Atraso nas receitas</dt>
            <dd className="mt-0.5 text-base font-semibold">
              {limiarAtraso === null ? 'Pouco sensível' : `${limiarAtraso} ${limiarAtraso === 1 ? 'mês' : 'meses'}`}
            </dd>
          </div>
        </dl>
      </Surface>
    </div>
  )
}
