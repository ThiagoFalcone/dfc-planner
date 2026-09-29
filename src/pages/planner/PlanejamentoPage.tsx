import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { Surface, SurfaceHeader } from '@/components/ui/Card'
import { FinancialTable } from '@/components/financial/FinancialTable'
import { FileImporter } from '@/components/financial/FileImporter'
import { LiveSummary } from '@/components/financial/LiveSummary'
import { ProvenancePanel } from '@/components/financial/ProvenancePanel'
import { ROTULO_CAMPO } from '@/hooks/usePlanner'
import { nomeCurto } from '@/domain/scenario/types'
import type { ResultadoImportacao } from '@/lib/importar'
import { rotuloMes } from '@/lib/formato'
import { useWorkspace } from './PlannerLayout'

export function PlanejamentoPage() {
  const { planner, avisar, avisarDesfeito } = useWorkspace()
  const { cenarioAtivo } = planner
  const { editavel, resultados, problemas, indicadores } = cenarioAtivo
  const [confirmarZerar, setConfirmarZerar] = useState(false)
  const [importando, setImportando] = useState(false)
  const [importado, setImportado] = useState<ResultadoImportacao | null>(null)
  const nome = nomeCurto(editavel.nome).toLowerCase()

  function fecharImportacao() {
    setImportando(false)
    setImportado(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <LiveSummary indicadores={indicadores} resultados={resultados} />

      {problemas.length > 0 && (
        <Alert tone="danger" title="Existem valores que precisam ser corrigidos antes da análise">
          <ul className="mt-1 space-y-0.5">
            {problemas.slice(0, 5).map((p) => (
              <li key={`${p.mes}-${p.campo}`}>
                {rotuloMes(p.mes)}, {ROTULO_CAMPO[p.campo].toLowerCase()}: {p.motivo}
              </li>
            ))}
            {problemas.length > 5 && <li>e mais {problemas.length - 5}.</li>}
          </ul>
        </Alert>
      )}

      <section aria-labelledby="titulo-fluxo" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="titulo-fluxo" className="text-[15px] font-semibold tracking-[-0.01em] text-fg">
              Fluxo mensal do cenário {nome}
            </h2>
            <p className="mt-0.5 text-[13px] text-fg-3">
              Informe valores positivos: o sinal de despesas, investimentos e tributos é aplicado no cálculo.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button size="sm" variant="secondary" onClick={() => setImportando(true)}>
              <Icon nome="upload" className="h-4 w-4" />
              Importar
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                planner.carregarExemplo(editavel.id)
                avisarDesfeito('Exemplo do enunciado carregado')
              }}
            >
              Carregar exemplo
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmarZerar(true)}>
              Zerar cenário
            </Button>
          </div>
        </div>
        <FinancialTable
          periodos={editavel.periodos}
          resultados={resultados}
          problemas={problemas}
          onCommit={(mes, campo, valor) => planner.atualizarCampo(editavel.id, mes, campo, valor)}
          onRemoverMes={(mes) => {
            planner.removerMes(editavel.id, mes)
            avisarDesfeito(`${rotuloMes(mes)} removido`)
          }}
          onAdicionarMes={() => planner.adicionarMes(editavel.id)}
          onColar={(linha, coluna, bloco) => {
            const n = planner.colarValores(editavel.id, linha, coluna, bloco)
            if (n > 0) avisarDesfeito(`${n} ${n === 1 ? 'célula colada' : 'células coladas'}`)
            else avisar('Nada para colar: o conteúdo não tinha valores nas colunas da planilha')
          }}
        />
      </section>

      <Surface aria-labelledby="titulo-premissas">
        <SurfaceHeader
          id="titulo-premissas"
          title="Premissas e origem dos dados"
          subtitle="Deixa claro de onde vêm os números e quem os alterou por último."
        />
        <div className="px-5 pb-5">
          <ProvenancePanel
            cenario={editavel}
            onPremissas={(texto) => planner.atualizarPremissas(editavel.id, texto)}
            onProveniencia={(m) => planner.atualizarProveniencia(editavel.id, m)}
          />
        </div>
      </Surface>

      <Modal
        aberto={confirmarZerar}
        onFechar={() => setConfirmarZerar(false)}
        titulo={`Zerar o cenário ${nome}?`}
        descricao="Todos os valores voltam a zero (Mês 0 a Mês 6) e as premissas são apagadas. Dá para desfazer com Ctrl+Z, e a ação fica no histórico."
        rodape={
          <>
            <Button size="sm" variant="ghost" onClick={() => setConfirmarZerar(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                planner.zerarCenario(editavel.id)
                setConfirmarZerar(false)
                avisarDesfeito(`Cenário ${nome} zerado`)
              }}
            >
              Zerar cenário
            </Button>
          </>
        }
      />

      {importando && (
        <Modal
          aberto
          onFechar={fecharImportacao}
          titulo={`Importar dados para o cenário ${nome}`}
          descricao="Os meses do arquivo substituem os valores atuais deste cenário. Fluxo e acumulado são sempre recalculados."
          rodape={
            <>
              <Button size="sm" variant="ghost" onClick={fecharImportacao}>
                Cancelar
              </Button>
              <Button
                size="sm"
                variant="primary"
                disabled={!importado}
                onClick={() => {
                  if (!importado) return
                  planner.importarNoCenario(editavel.id, importado)
                  fecharImportacao()
                  avisarDesfeito(`${importado.periodos.length} meses importados`)
                }}
              >
                Substituir valores
              </Button>
            </>
          }
        >
          <FileImporter onResultado={setImportado} />
        </Modal>
      )}
    </div>
  )
}
