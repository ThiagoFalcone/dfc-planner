import clsx from 'clsx'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CenarioComputado } from '@/hooks/usePlanner'
import type { IndicadoresFluxoCaixa } from '@/types'
import { LIMITE_CENARIOS, cenarioReferencia, nomeCurto, rotuloFonte } from '@/domain/scenario/types'
import { formatarDataHora, formatarMoedaCurta, rotuloMes, tempoRelativo } from '@/lib/formato'
import { analisarDescontado, formatarPercentual, lerTMA, type AnaliseDescontada } from '@/lib/financeiro'
import { SEM_AJUSTES } from '@/lib/simulacao'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Surface, SurfaceHeader } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { campoClasses } from '@/components/ui/TextField'
import { CorCenario } from '@/components/financial/ScenarioSwitcher'
import { MoneyValue } from '@/components/financial/MoneyValue'
import { ScenarioComparisonChart } from '@/components/charts/ScenarioComparisonChart'
import { ROTAS } from '@/components/app/Navigation'
import { useWorkspace } from './PlannerLayout'

type LinhaMatriz = {
  rotulo: string
  ajuda: string
  valor(i: IndicadoresFluxoCaixa): number | null
  formatar(v: number, i: IndicadoresFluxoCaixa): ReactNode
  unidade: 'moeda' | 'mes'
}

const LINHAS: LinhaMatriz[] = [
  {
    rotulo: 'Capital necessário',
    ajuda: 'max(0, −mínimo do acumulado)',
    valor: (i) => i.necessidadeCapital,
    formatar: (v) => <MoneyValue valor={v} tom={v > 0 ? 'atencao' : 'neutro'} animar={false} />,
    unidade: 'moeda',
  },
  {
    rotulo: 'Déficit máximo',
    ajuda: 'Menor valor do acumulado',
    valor: (i) => (i.houveDeficit ? -i.maiorDeficit : 0),
    formatar: (v, i) =>
      i.houveDeficit ? (
        <>
          <MoneyValue valor={v} tom="negativo" animar={false} />
          <span className="ml-1.5 text-xs font-normal text-fg-3">{rotuloMes(i.mesMaiorDeficit ?? 0)}</span>
        </>
      ) : (
        <span className="text-fg-3">Nenhum</span>
      ),
    unidade: 'moeda',
  },
  {
    rotulo: 'Recuperação',
    ajuda: 'Primeiro mês com acumulado ≥ 0 após o déficit',
    valor: (i) => (i.houveDeficit ? i.mesRecuperacao : null),
    formatar: (v) => <span className="text-positive">{rotuloMes(v)}</span>,
    unidade: 'mes',
  },
  {
    rotulo: 'Saldo final',
    ajuda: 'Acumulado no último mês',
    valor: (i) => i.saldoFinal,
    formatar: (v) => <MoneyValue valor={v} tom="auto" animar={false} />,
    unidade: 'moeda',
  },
]

function Diferenca({ valor, base, unidade }: { valor: number | null; base: number | null; unidade: 'moeda' | 'mes' }) {
  if (valor === null || base === null) return null
  const d = valor - base
  if (Math.abs(d) < 0.005) return <span className="block text-xs text-fg-3">igual à referência</span>
  const texto =
    unidade === 'mes'
      ? `${d > 0 ? '+' : '−'}${Math.abs(d)} ${Math.abs(d) === 1 ? 'mês' : 'meses'}`
      : `${d > 0 ? '+' : '−'}${formatarMoedaCurta(Math.abs(d))}`
  return <span className="tabular block text-xs text-fg-3">{texto} vs. referência</span>
}

function celulaIndicador(linha: LinhaMatriz, c: CenarioComputado): ReactNode {
  const i = c.indicadores
  if (!i) return <span className="text-xs text-negative">Valores pendentes</span>
  const v = linha.valor(i)
  if (v === null) {
    return linha.unidade === 'mes' && i.houveDeficit ? <span className="text-negative">Não recupera</span> : <span className="text-fg-3">—</span>
  }
  return linha.formatar(v, i)
}

function Amplitude({ linha, validos }: { linha: LinhaMatriz; validos: CenarioComputado[] }) {
  const valores = validos.map((c) => linha.valor(c.indicadores!))
  if (valores.length < 2 || valores.some((v) => v === null)) return <span className="text-fg-3">—</span>
  const nums = valores as number[]
  const a = Math.max(...nums) - Math.min(...nums)
  return <span className="tabular text-fg-2">{linha.unidade === 'mes' ? `${a} ${a === 1 ? 'mês' : 'meses'}` : formatarMoedaCurta(a)}</span>
}

function listar(nomes: string[]): string {
  return nomes.length <= 1 ? (nomes[0] ?? '') : `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`
}

/** RF07: leitura objetiva, mostrando qual tem menor necessidade de capital e qual recupera antes, sem prever o futuro. */
function LeituraComparacao({ validos }: { validos: CenarioComputado[] }) {
  if (validos.length < 2) return null
  const menorCapital = Math.min(...validos.map((c) => c.indicadores!.necessidadeCapital))
  const comMenorCapital = validos.filter((c) => Math.abs(c.indicadores!.necessidadeCapital - menorCapital) < 0.01)
  const recuperam = validos.filter((c) => c.indicadores!.houveDeficit && c.indicadores!.mesRecuperacao !== null)
  const primeiraRecuperacao = recuperam.length ? Math.min(...recuperam.map((c) => c.indicadores!.mesRecuperacao as number)) : null
  const recuperamPrimeiro = recuperam.filter((c) => c.indicadores!.mesRecuperacao === primeiraRecuperacao)
  const naoRecuperam = validos.filter((c) => c.indicadores!.houveDeficit && c.indicadores!.mesRecuperacao === null)
  const nome = (c: CenarioComputado) => nomeCurto(c.editavel.nome)

  return (
    <Alert tone="info" title="Leitura da comparação">
      <p>
        {comMenorCapital.length === validos.length
          ? `Todos os cenários exigem o mesmo capital (${formatarMoedaCurta(menorCapital)}). `
          : `${listar(comMenorCapital.map(nome))} ${comMenorCapital.length === 1 ? 'é o cenário' : 'são os cenários'} com menor necessidade de capital (${formatarMoedaCurta(menorCapital)}). `}
        {primeiraRecuperacao !== null
          ? `${listar(recuperamPrimeiro.map(nome))} ${recuperamPrimeiro.length === 1 ? 'recupera' : 'recuperam'} o investimento mais cedo, no ${rotuloMes(primeiraRecuperacao)}. `
          : 'Nenhum cenário recupera o investimento dentro do horizonte informado. '}
        {naoRecuperam.length > 0 && primeiraRecuperacao !== null && `${listar(naoRecuperam.map(nome))} não ${naoRecuperam.length === 1 ? 'recupera' : 'recuperam'} no horizonte. `}
      </p>
      <p className="mt-1">
        Essa leitura vale apenas para as premissas de cada cenário. Mudar receitas, despesas ou o horizonte pode
        alterar qual deles é mais favorável.
      </p>
    </Alert>
  )
}

function RenomearCenario({ cenario, onRenomear }: { cenario: CenarioComputado; onRenomear(nome: string): void }) {
  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState(cenario.editavel.nome)
  if (editando) {
    return (
      <input
        autoFocus
        aria-label="Nome do cenário"
        value={nome}
        maxLength={40}
        onChange={(e) => setNome(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={() => {
          onRenomear(nome)
          setEditando(false)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            setNome(cenario.editavel.nome)
            setEditando(false)
          }
        }}
        className={clsx(campoClasses, 'h-8 w-56 border-accent text-[13px]')}
      />
    )
  }
  return (
    <button
      type="button"
      onClick={() => {
        setNome(cenario.editavel.nome)
        setEditando(true)
      }}
      className="focus-ring group inline-flex items-center gap-1.5 rounded text-[13px] font-medium text-fg"
      title="Renomear"
    >
      {nomeCurto(cenario.editavel.nome)}
      <Icon nome="lapis" className="h-3.5 w-3.5 text-fg-3 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" />
      <span className="sr-only">(renomear)</span>
    </button>
  )
}

function Derivar({ cenario, referencia, onDerivar }: { cenario: CenarioComputado; referencia: string; onDerivar(p: number): void }) {
  const [percentual, setPercentual] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const n = Number(percentual.replace(',', '.'))
  const valido = percentual.trim() !== '' && Number.isFinite(n) && n > -100 && n <= 500
  const nome = nomeCurto(cenario.editavel.nome).toLowerCase()
  return (
    <div className="flex items-center gap-1.5">
      <input
        aria-label={`Variação nas receitas para recriar ${nome} a partir de ${referencia} (%)`}
        placeholder="± % receitas"
        inputMode="decimal"
        value={percentual}
        onChange={(e) => setPercentual(e.target.value)}
        className={clsx(campoClasses, 'tabular h-8 w-28 border-line-strong text-right text-[13px]')}
      />
      <Button size="sm" variant="secondary" disabled={!valido} onClick={() => setConfirmando(true)}>
        Recriar
      </Button>
      <Modal
        aberto={confirmando}
        onFechar={() => setConfirmando(false)}
        titulo={`Recriar o cenário ${nome}?`}
        descricao={`Os valores de ${nome} serão substituídos pelos de ${referencia}, com receitas ${n >= 0 ? '+' : ''}${n}%. Dá para desfazer com Ctrl+Z.`}
        rodape={
          <>
            <Button size="sm" variant="ghost" onClick={() => setConfirmando(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                onDerivar(n)
                setConfirmando(false)
                setPercentual('')
              }}
            >
              Recriar cenário
            </Button>
          </>
        }
      />
    </div>
  )
}

export function CenariosPage() {
  const { planner, abrirNovoCenario, avisarDesfeito } = useWorkspace()
  const navigate = useNavigate()
  const { cenarios, cenarioAtivoId } = planner
  const [destaque, setDestaque] = useState<string>('todos')
  const [excluindo, setExcluindo] = useState<CenarioComputado | null>(null)

  const validos = cenarios.filter((c) => c.indicadores && c.problemas.length === 0)
  const comProblema = cenarios.filter((c) => c.problemas.length > 0)
  const referencia = cenarioReferencia(cenarios)
  const nomeReferencia = referencia ? nomeCurto(referencia.editavel.nome) : ''

  const analises = new Map<string, AnaliseDescontada | null>(
    cenarios.map((c) => {
      const t = lerTMA(c.editavel.tma)
      return [c.editavel.id, c.indicadores && typeof t === 'number' ? analisarDescontado(c.resultados, t) : null]
    }),
  )
  const algumaTMA = [...analises.values()].some(Boolean)

  function abrirNoPlanejamento(id: string) {
    planner.selecionarCenario(id)
    navigate(ROTAS.planejamento)
  }

  return (
    <div className="flex flex-col gap-5">
      {comProblema.length > 0 && (
        <Alert
          tone="warning"
          title={`${listar(comProblema.map((c) => nomeCurto(c.editavel.nome)))} fora da comparação`}
          action={
            <Button size="sm" variant="secondary" onClick={() => abrirNoPlanejamento(comProblema[0].editavel.id)}>
              Revisar
            </Button>
          }
        >
          Cenários com valores pendentes não entram no gráfico nem nas diferenças até serem corrigidos.
        </Alert>
      )}

      <Surface aria-labelledby="titulo-comparacao">
        <SurfaceHeader
          id="titulo-comparacao"
          title="Fluxo acumulado por cenário"
          subtitle="Passe o cursor sobre um mês para ver os valores e a divergência entre eles."
          action={
            <div className="scrollbar-thin max-w-full overflow-x-auto">
              <SegmentedControl
                rotulo="Destacar cenário"
                tamanho="sm"
                valor={destaque}
                onChange={setDestaque}
                opcoes={[
                  { valor: 'todos', rotulo: 'Todos' },
                  ...cenarios.map((c) => ({
                    valor: c.editavel.id,
                    rotulo: (
                      <>
                        <CorCenario cor={c.editavel.cor} />
                        {nomeCurto(c.editavel.nome)}
                      </>
                    ),
                  })),
                ]}
              />
            </div>
          }
        />
        <div className="px-2 pb-4 sm:px-4">
          {validos.length > 0 ? (
            <ScenarioComparisonChart cenarios={validos} destaque={destaque === 'todos' ? null : destaque} />
          ) : (
            <p className="px-3 py-16 text-center text-[13px] text-fg-3">Nenhum cenário com valores válidos para comparar.</p>
          )}
        </div>
        <div className="px-5 pb-5">
          <LeituraComparacao validos={validos} />
        </div>
      </Surface>

      <Surface aria-labelledby="titulo-matriz">
        <SurfaceHeader
          id="titulo-matriz"
          title="Diferenças objetivas"
          subtitle={`Mesmas regras de cálculo em cada cenário, comparadas com ${nomeReferencia} (referência). Nenhum é apontado como melhor.`}
        />
        <div className="scrollbar-thin relative overflow-x-auto px-5 pb-5">
          <table className="w-full min-w-[720px] border-separate border-spacing-0 text-[13px]">
            <caption className="sr-only">Indicadores por cenário, com diferença em relação ao cenário de referência</caption>
            <thead>
              <tr className="text-left text-xs text-fg-2">
                <th scope="col" className="w-[200px] border-b border-line pb-2.5 font-medium">
                  <span className="sr-only">Indicador</span>
                </th>
                {cenarios.map((c) => (
                  <th key={c.editavel.id} scope="col" className="border-b border-line px-3 pb-2.5 text-right font-medium">
                    <span className="inline-flex items-center gap-1.5 text-[13px] text-fg">
                      <CorCenario cor={c.editavel.cor} />
                      {nomeCurto(c.editavel.nome)}
                    </span>
                    {c.editavel.id === cenarioAtivoId && (
                      <span className="ml-1.5 rounded-full bg-accent-soft px-1.5 py-0.5 text-[10.5px] text-accent">Ativo</span>
                    )}
                  </th>
                ))}
                <th scope="col" className="border-b border-line px-3 pb-2.5 text-right font-medium">
                  Amplitude
                </th>
              </tr>
            </thead>
            <tbody>
              {LINHAS.map((linha) => (
                <tr key={linha.rotulo} className="align-top">
                  <th scope="row" className="border-b border-line py-3 pr-3 text-left font-medium text-fg">
                    {linha.rotulo}
                    <span className="block text-xs font-normal text-fg-3">{linha.ajuda}</span>
                  </th>
                  {cenarios.map((c) => (
                    <td key={c.editavel.id} className="tabular border-b border-line px-3 py-3 text-right font-semibold">
                      {celulaIndicador(linha, c)}
                      {c !== referencia && c.indicadores && referencia?.indicadores && (
                        <span className="font-normal">
                          <Diferenca valor={linha.valor(c.indicadores)} base={linha.valor(referencia.indicadores)} unidade={linha.unidade} />
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="border-b border-line px-3 py-3 text-right">
                    <Amplitude linha={linha} validos={validos} />
                  </td>
                </tr>
              ))}
              {algumaTMA && (
                <>
                  <tr className="align-top">
                    <th scope="row" className="border-b border-line py-3 pr-3 text-left font-medium text-fg">
                      VPL
                      <span className="block text-xs font-normal text-fg-3">Complementar, pela TMA de cada cenário</span>
                    </th>
                    {cenarios.map((c) => {
                      const a = analises.get(c.editavel.id)
                      return (
                        <td key={c.editavel.id} className="tabular border-b border-line px-3 py-3 text-right font-semibold">
                          {a ? (
                            <>
                              <MoneyValue valor={a.vpl} tom="auto" animar={false} />
                              <span className="block text-xs font-normal text-fg-3">TMA {formatarPercentual(a.taxa)} a.m.</span>
                            </>
                          ) : (
                            <span className="text-xs font-normal text-fg-3">TMA não informada</span>
                          )}
                        </td>
                      )
                    })}
                    <td className="border-b border-line" />
                  </tr>
                  <tr className="align-top">
                    <th scope="row" className="border-b border-line py-3 pr-3 text-left font-medium text-fg">
                      TIR
                      <span className="block text-xs font-normal text-fg-3">Taxa que zera o VPL</span>
                    </th>
                    {cenarios.map((c) => {
                      const a = analises.get(c.editavel.id)
                      return (
                        <td key={c.editavel.id} className="tabular border-b border-line px-3 py-3 text-right font-semibold">
                          {a?.tir != null ? `${formatarPercentual(a.tir)} a.m.` : <span className="font-normal text-fg-3">—</span>}
                        </td>
                      )
                    })}
                    <td className="border-b border-line" />
                  </tr>
                </>
              )}
              <tr className="align-top">
                <th scope="row" className="border-b border-line py-3 pr-3 text-left font-medium text-fg">
                  Fonte dos dados
                </th>
                {cenarios.map((c) => (
                  <td key={c.editavel.id} className="border-b border-line px-3 py-3 text-right">
                    <span className="text-fg">{rotuloFonte(c.editavel.proveniencia.fonte)}</span>
                    {c.editavel.proveniencia.referencia && (
                      <span className="block text-xs text-fg-3">{c.editavel.proveniencia.referencia}</span>
                    )}
                  </td>
                ))}
                <td className="border-b border-line" />
              </tr>
              <tr className="align-top">
                <th scope="row" className="border-b border-line py-3 pr-3 text-left font-medium text-fg">
                  Última atualização
                </th>
                {cenarios.map((c) => (
                  <td key={c.editavel.id} className="border-b border-line px-3 py-3 text-right">
                    <time className="text-fg" dateTime={c.editavel.proveniencia.atualizadoEm} title={formatarDataHora(c.editavel.proveniencia.atualizadoEm)}>
                      {tempoRelativo(c.editavel.proveniencia.atualizadoEm)}
                    </time>
                    <span className="block text-xs text-fg-3">por {c.editavel.proveniencia.responsavel}</span>
                  </td>
                ))}
                <td className="border-b border-line" />
              </tr>
              <tr className="align-top">
                <th scope="row" className="py-3 pr-3 text-left font-medium text-fg">
                  Premissas
                </th>
                {cenarios.map((c) => (
                  <td key={c.editavel.id} className="px-3 py-3 text-right text-xs leading-relaxed text-fg-2">
                    <span className="line-clamp-3" title={c.editavel.descricaoPremissas}>
                      {c.editavel.descricaoPremissas || '—'}
                    </span>
                  </td>
                ))}
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </Surface>

      <Surface aria-labelledby="titulo-gerenciar">
        <SurfaceHeader
          id="titulo-gerenciar"
          title="Gerenciar cenários"
          subtitle={`Até ${LIMITE_CENARIOS} cenários por planejamento. "Recriar" copia ${nomeReferencia} variando só as receitas (sensibilidade de uma premissa).`}
          action={
            <Button size="sm" variant="primary" onClick={abrirNovoCenario} disabled={cenarios.length >= LIMITE_CENARIOS}>
              <Icon nome="mais" className="h-4 w-4" />
              Novo cenário
            </Button>
          }
        />
        <ul className="divide-y divide-line px-5 pb-3">
          {cenarios.map((c) => (
            <li key={c.editavel.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <div className="flex min-w-48 flex-1 items-center gap-2.5">
                <CorCenario cor={c.editavel.cor} />
                <div className="min-w-0">
                  <RenomearCenario cenario={c} onRenomear={(n) => planner.renomearCenario(c.editavel.id, n)} />
                  <p className="text-xs text-fg-3">
                    {c.editavel.periodos.length} meses · {rotuloFonte(c.editavel.proveniencia.fonte)}
                    {c === referencia && ' · referência'}
                    {c.problemas.length > 0 && <span className="text-negative"> · {c.problemas.length} pendências</span>}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {c !== referencia && (
                  <Derivar
                    cenario={c}
                    referencia={nomeReferencia}
                    onDerivar={(p) => {
                      planner.recriarAPartirDaReferencia(c.editavel.id, { ...SEM_AJUSTES, receitas: p })
                      avisarDesfeito(`Cenário ${nomeCurto(c.editavel.nome).toLowerCase()} recriado`)
                    }}
                  />
                )}
                <Button size="sm" variant="ghost" onClick={() => abrirNoPlanejamento(c.editavel.id)}>
                  Editar valores
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={cenarios.length >= LIMITE_CENARIOS}
                  onClick={() => planner.criarCenario(`Cópia de ${nomeCurto(c.editavel.nome)}`, { tipo: 'duplicar', deId: c.editavel.id })}
                >
                  Duplicar
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Excluir cenário ${nomeCurto(c.editavel.nome)}`}
                  title={cenarios.length <= 1 ? 'O planejamento precisa de ao menos um cenário' : 'Excluir'}
                  disabled={cenarios.length <= 1}
                  onClick={() => setExcluindo(c)}
                  className="hover:bg-negative-soft hover:text-negative"
                >
                  <Icon nome="lixeira" className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Surface>

      <Modal
        aberto={excluindo !== null}
        onFechar={() => setExcluindo(null)}
        titulo={`Excluir o cenário ${excluindo ? nomeCurto(excluindo.editavel.nome).toLowerCase() : ''}?`}
        descricao="Os valores e premissas deste cenário saem do planejamento. Dá para desfazer com Ctrl+Z, e a exclusão fica no histórico."
        rodape={
          <>
            <Button size="sm" variant="ghost" onClick={() => setExcluindo(null)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                if (!excluindo) return
                planner.excluirCenario(excluindo.editavel.id)
                avisarDesfeito(`Cenário ${nomeCurto(excluindo.editavel.nome).toLowerCase()} excluído`)
                setExcluindo(null)
              }}
            >
              Excluir cenário
            </Button>
          </>
        }
      />
    </div>
  )
}
