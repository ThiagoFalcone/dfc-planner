import clsx from 'clsx'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { TabelaMensal } from '@/components/planner/TabelaMensal'
import { PainelIndicadores } from '@/components/planner/PainelIndicadores'
import { GraficoFluxo } from '@/components/planner/GraficoFluxo'
import { GraficoAcumulado } from '@/components/planner/GraficoAcumulado'
import { Interpretacao } from '@/components/planner/Interpretacao'
import { ComparacaoCenarios } from '@/components/planner/ComparacaoCenarios'
import { usePlanner } from '@/hooks/usePlanner'
import { exportarCSV, exportarJSON } from '@/lib/exportar'
import { rotuloMes } from '@/lib/formato'

export function PlannerPage() {
  const {
    cenarios,
    cenarioAtivo,
    cenarioAtivoId,
    setCenarioAtivoId,
    atualizarCampo,
    adicionarMes,
    removerMes,
    carregarExemplo,
    zerarCenario,
    atualizarPremissas,
  } = usePlanner()

  if (!cenarioAtivo) return null

  const { editavel, resultados, indicadores, problemas } = cenarioAtivo

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-ink-900">
            Planejador de fluxo de caixa
          </h1>
          <p className="max-w-2xl text-sm text-ink-500">
            Opção 3 — apoia a decisão de quanto capital é necessário para lançar o projeto e
            quando o investimento se recupera. Moeda: Real (R$). Unidade de tempo: mês, com o mês
            0 representando o instante do investimento inicial.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-ink-200 bg-white p-1.5">
          {cenarios.map((c) => (
            <button
              key={c.editavel.id}
              type="button"
              onClick={() => setCenarioAtivoId(c.editavel.id)}
              className={clsx(
                'relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors',
                c.editavel.id === cenarioAtivoId
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-ink-500 hover:bg-ink-50 hover:text-ink-700',
              )}
            >
              {c.editavel.nome}
              {c.problemas.length > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-negative text-[10px] font-semibold text-white">
                  !
                </span>
              )}
            </button>
          ))}
        </div>

        <Card>
          <CardHeader
            title={editavel.nome}
            subtitle="Entradas mês a mês — recebimentos, despesas pagas, investimentos, tributos pagos e valor residual."
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => carregarExemplo(editavel.id)}>
                  Carregar exemplo
                </Button>
                <Button variant="ghost" size="sm" onClick={() => zerarCenario(editavel.id)}>
                  Zerar
                </Button>
              </div>
            }
          />
          <CardBody className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="premissas" className="text-sm font-medium text-ink-700">
                Premissas deste cenário
              </label>
              <textarea
                id="premissas"
                rows={2}
                value={editavel.descricaoPremissas}
                onChange={(e) => atualizarPremissas(editavel.id, e.target.value)}
                placeholder="Ex.: dados fictícios de simulação; tributos = 0; residual representa devolução de capital de giro."
                className="w-full resize-none rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
              <p className="text-xs text-ink-400">
                Declare a origem dos dados (simulação ou fonte documentada) e qualquer convenção
                usada — isso entra na exportação e no relatório de decisão.
              </p>
            </div>

            {problemas.length > 0 && (
              <Alert tone="danger" title="Corrija os campos indicados antes de calcular">
                <ul className="list-disc space-y-0.5 pl-4">
                  {problemas.slice(0, 6).map((p, i) => (
                    <li key={i}>
                      {rotuloMes(p.mes)} — {p.campo}: {p.motivo}
                    </li>
                  ))}
                  {problemas.length > 6 && <li>e mais {problemas.length - 6} campo(s)...</li>}
                </ul>
              </Alert>
            )}

            <TabelaMensal
              periodos={editavel.periodos}
              resultados={resultados}
              problemas={problemas}
              onAlterarCampo={(mes, campo, valor) => atualizarCampo(editavel.id, mes, campo, valor)}
              onRemoverMes={(mes) => removerMes(editavel.id, mes)}
              onAdicionarMes={() => adicionarMes(editavel.id)}
            />

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={!indicadores}
                onClick={() =>
                  indicadores &&
                  exportarCSV({
                    cenario: {
                      id: editavel.id,
                      nome: editavel.nome,
                      descricaoPremissas: editavel.descricaoPremissas,
                      periodos: cenarioAtivo.periodosNumericos,
                    },
                    resultados,
                    indicadores,
                  })
                }
              >
                Exportar CSV
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!indicadores}
                onClick={() =>
                  indicadores &&
                  exportarJSON({
                    cenario: {
                      id: editavel.id,
                      nome: editavel.nome,
                      descricaoPremissas: editavel.descricaoPremissas,
                      periodos: cenarioAtivo.periodosNumericos,
                    },
                    resultados,
                    indicadores,
                  })
                }
              >
                Exportar JSON
              </Button>
              {!indicadores && (
                <span className="text-xs text-ink-400">
                  Corrija os campos pendentes para habilitar a exportação.
                </span>
              )}
            </div>
          </CardBody>
        </Card>

        {indicadores && (
          <>
            <PainelIndicadores indicadores={indicadores} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader title="Diagrama de fluxo de caixa" subtitle="Fluxo líquido por mês" />
                <CardBody>
                  <GraficoFluxo resultados={resultados} />
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Acumulado" subtitle="Necessidade de capital e recuperação" />
                <CardBody>
                  <GraficoAcumulado resultados={resultados} indicadores={indicadores} />
                </CardBody>
              </Card>
            </div>

            <Card>
              <CardHeader title="Interpretação" subtitle="Vinculada aos indicadores calculados acima" />
              <CardBody>
                <Interpretacao
                  indicadores={indicadores}
                  periodos={cenarioAtivo.periodosNumericos}
                  nomeCenario={editavel.nome}
                />
              </CardBody>
            </Card>
          </>
        )}

        <ComparacaoCenarios cenarios={cenarios} />
      </div>
    </AppShell>
  )
}
