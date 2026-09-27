import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { AuditProvider, useAudit } from '@/audit/AuditContext'
import { usePlanner, type OrigemNovoCenario, type Planner } from '@/hooks/usePlanner'
import { useTheme } from '@/theme/ThemeContext'
import type { AuditActor, NovoAuditEvent } from '@/domain/audit/types'
import type { EstadoPlanner, ResumoProjeto } from '@/domain/scenario/types'
import { gerarId, nomeCurto } from '@/domain/scenario/types'
import { criarProjeto } from '@/domain/scenario/fabricas'
import { criarRepositorioHttpProjetos } from '@/services/planner/httpPlannerRepository'
import { exportarCSV, exportarJSON } from '@/lib/exportar'
import { analisarDescontado, lerTMA } from '@/lib/financeiro'
import { TopBar } from '@/components/app/TopBar'
import { NavegacaoMobile, ROTAS, itensNavegacao } from '@/components/app/Navigation'
import { CommandPalette, useAtalhoPaleta, type Comando } from '@/components/app/CommandPalette'
import { AccountModal } from '@/components/app/AccountModal'
import { ExportMenu, type FormatoExportacao } from '@/components/app/ExportMenu'
import { WorkspaceHeader } from '@/components/app/WorkspaceHeader'
import { NovoProjetoModal, type OpcoesNovoProjeto } from '@/components/app/NovoProjetoModal'
import { NovoCenarioModal } from '@/components/app/NovoCenarioModal'
import { ShortcutsModal } from '@/components/app/ShortcutsModal'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import type { SecaoConta } from '@/components/app/UserMenu'
import { CorCenario } from '@/components/financial/ScenarioSwitcher'
import { Toast, type Aviso } from '@/components/ui/Toast'

export interface ControleProjetos {
  lista: ResumoProjeto[]
  atualId: string
  abrir(id: string): void
  criar(o: OpcoesNovoProjeto): void
  renomear(id: string, nome: string): void
  duplicar(id: string): void
  excluir(id: string): void
}

export interface WorkspaceContext {
  planner: Planner
  projetos: ControleProjetos
  exportar(formato: FormatoExportacao): void
  avisar(texto: string, acao?: Aviso['acao']): void
  /** Aviso com botão "Desfazer", usado em ações destrutivas. */
  avisarDesfeito(texto: string): void
  abrirNovoCenario(): void
  abrirNovoProjeto(): void
}

export function useWorkspace(): WorkspaceContext {
  return useOutletContext<WorkspaceContext>()
}

const PAGINAS: Record<string, { titulo: string; descricao: string; contexto?: boolean }> = {
  [ROTAS.planejamento]: {
    titulo: 'Planejamento',
    descricao: 'Valores mensais em R$. O Mês 0 é o instante do investimento inicial.',
  },
  [ROTAS.resultados]: {
    titulo: 'Resultados',
    descricao: 'Indicadores e gráficos recalculados a cada alteração do planejamento.',
  },
  [ROTAS.cenarios]: {
    titulo: 'Cenários',
    descricao: 'Hipóteses sobre o mesmo projeto, comparadas mês a mês.',
  },
  [ROTAS.sensibilidade]: {
    titulo: 'Sensibilidade',
    descricao: 'Teste “e se” sobre o cenário ativo sem alterar os dados salvos.',
  },
  [ROTAS.auditoria]: {
    titulo: 'Histórico e auditoria',
    descricao: 'Alterações relevantes registradas neste navegador, da mais recente para a mais antiga.',
  },
  [ROTAS.projetos]: {
    titulo: 'Planejamentos',
    descricao: 'Crie, abra, renomeie, duplique ou exclua planejamentos. Cada um guarda seus cenários e premissas.',
    contexto: false,
  },
}

export function PlannerLayout() {
  const { usuario } = useAuth()
  const ator = useMemo(
    () => ({ id: usuario?.id ?? 'anonimo', nome: usuario?.nome ?? 'Usuário' }),
    [usuario?.id, usuario?.nome],
  )
  return (
    <AuditProvider ator={ator}>
      <GestorProjetos ator={ator} />
    </AuditProvider>
  )
}

function eventoProjeto(p: { id: string; nome: string }, dados: Omit<NovoAuditEvent, 'scenario' | 'category' | 'entity' | 'project'>): NovoAuditEvent {
  return { ...dados, scenario: null, category: 'estrutura', entity: 'projeto', project: { id: p.id, nome: p.nome } }
}

/** CRUD de planejamentos. O workspace é remontado ao trocar de planejamento (histórico de desfazer próprio). */
function GestorProjetos({ ator }: { ator: AuditActor }) {
  const { registrar } = useAudit()
  const repo = useMemo(() => criarRepositorioHttpProjetos(), [])
  const [lista, setLista] = useState<ResumoProjeto[]>([])
  const [ativoId, setAtivoId] = useState<string | null>(null)
  const [inicial, setInicial] = useState<EstadoPlanner | null>(null)
  const [erroCarregamento, setErroCarregamento] = useState(false)

  const recarregar = useCallback(() => {
    repo.listar().then(setLista).catch(() => setErroCarregamento(true))
  }, [repo])

  // Primeiro acesso: nasce um planejamento com o exemplo do enunciado.
  useEffect(() => {
    let cancelado = false
    async function carregarOuIniciar() {
      try {
        const [listaAtual, ativoAtual] = await Promise.all([repo.listar(), repo.ativoId()])
        if (cancelado) return
        let alvo = ativoAtual
        let listaFinal = listaAtual
        if (!alvo) {
          const agora = new Date().toISOString()
          const novo = criarProjeto({ nome: 'Projeto EduTask', partida: 'exemplo' }, { responsavel: ator.nome, agora })
          await repo.salvar(novo)
          await repo.definirAtivo(novo.id)
          registrar(
            eventoProjeto(
              { id: novo.id, nome: novo.nomeProjeto },
              {
                field: null,
                previousValue: null,
                newValue: 'Exemplo do enunciado',
                action: 'CREATE',
                summary: 'Planejamento criado com os cenários Base, Pessimista e Otimista',
              },
            ),
          )
          alvo = novo.id
          listaFinal = await repo.listar()
        }
        const estado = await repo.carregar(alvo)
        if (cancelado) return
        setLista(listaFinal)
        setAtivoId(alvo)
        setInicial(estado)
      } catch {
        if (!cancelado) setErroCarregamento(true)
      }
    }
    carregarOuIniciar()
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const salvar = useCallback((e: EstadoPlanner) => repo.salvar(e).then(recarregar), [repo, recarregar])

  const abrir = useCallback(
    async (id: string) => {
      const listaAtual = await repo.listar()
      const alvo = listaAtual.find((p) => p.id === id)
      if (!alvo || id === ativoId) return
      await repo.definirAtivo(id)
      const estado = await repo.carregar(id)
      setAtivoId(id)
      setInicial(estado)
      registrar(eventoProjeto(alvo, { field: null, previousValue: null, newValue: alvo.nome, action: 'SWITCH', summary: 'Planejamento aberto' }))
    },
    [repo, ativoId, registrar],
  )

  const criar = useCallback(
    async (o: OpcoesNovoProjeto) => {
      const agora = new Date().toISOString()
      const novo = criarProjeto(
        {
          nome: o.nome,
          partida: o.partida,
          importado: o.importado
            ? { periodos: o.importado.periodos, premissas: o.importado.premissas, referencia: o.importado.referencia ?? 'arquivo', fonte: o.importado.fonte }
            : undefined,
        },
        { responsavel: ator.nome, agora },
      )
      await repo.salvar(novo)
      await repo.definirAtivo(novo.id)
      registrar(
        eventoProjeto(
          { id: novo.id, nome: novo.nomeProjeto },
          {
            field: null,
            previousValue: null,
            newValue: o.partida === 'exemplo' ? 'Exemplo do enunciado' : o.partida === 'importado' ? `Importado de ${o.importado?.referencia ?? 'arquivo'}` : 'Em branco',
            action: o.partida === 'importado' ? 'IMPORT' : 'CREATE',
            summary: 'Planejamento criado',
          },
        ),
      )
      const estado = await repo.carregar(novo.id)
      setAtivoId(novo.id)
      setInicial(estado)
      recarregar()
    },
    [repo, ator.nome, registrar, recarregar],
  )

  const renomearOutro = useCallback(
    async (id: string, nome: string) => {
      const e = await repo.carregar(id)
      const limpo = nome.trim()
      if (!e || !limpo || limpo === e.nomeProjeto) return
      await repo.salvar({ ...e, nomeProjeto: limpo, atualizadoEm: new Date().toISOString() })
      registrar(eventoProjeto({ id, nome: limpo }, { field: 'Nome do planejamento', previousValue: e.nomeProjeto, newValue: limpo, action: 'EDIT', summary: 'Planejamento renomeado' }))
      recarregar()
    },
    [repo, registrar, recarregar],
  )

  const duplicar = useCallback(
    async (id: string) => {
      const e = await repo.carregar(id)
      if (!e) return
      const agora = new Date().toISOString()
      const copia: EstadoPlanner = { ...e, id: gerarId('prj'), nomeProjeto: `Cópia de ${e.nomeProjeto}`, criadoEm: agora, atualizadoEm: agora }
      await repo.salvar(copia)
      registrar(eventoProjeto({ id: copia.id, nome: copia.nomeProjeto }, { field: null, previousValue: null, newValue: `Cópia de ${e.nomeProjeto}`, action: 'CREATE', summary: 'Planejamento duplicado' }))
      recarregar()
    },
    [repo, registrar, recarregar],
  )

  const excluir = useCallback(
    async (id: string) => {
      const listaAtual = await repo.listar()
      const alvo = listaAtual.find((p) => p.id === id)
      if (!alvo || id === ativoId) return
      await repo.excluir(id)
      registrar(eventoProjeto(alvo, { field: null, previousValue: `${alvo.cenarios} cenários`, newValue: null, action: 'DELETE', summary: 'Planejamento excluído' }))
      recarregar()
    },
    [repo, ativoId, registrar, recarregar],
  )

  if (erroCarregamento) {
    return (
      <div className="flex min-h-svh items-center justify-center px-4 text-center" role="alert">
        <p className="text-sm text-fg-3">
          Não foi possível conectar ao servidor. Confira se o backend está rodando e recarregue a página.
        </p>
      </div>
    )
  }

  if (!ativoId || !inicial) {
    return (
      <div className="flex min-h-svh items-center justify-center" role="status" aria-label="Abrindo planejamento">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-line-strong border-t-accent" />
      </div>
    )
  }

  const projetos: Omit<ControleProjetos, 'renomear'> & { renomearOutro(id: string, nome: string): void } = {
    lista,
    atualId: ativoId,
    abrir: (id) => void abrir(id),
    criar: (o) => void criar(o),
    renomearOutro: (id, nome) => void renomearOutro(id, nome),
    duplicar: (id) => void duplicar(id),
    excluir: (id) => void excluir(id),
  }

  return <Workspace key={ativoId} ator={ator} inicial={inicial} salvar={salvar} projetosBase={projetos} />
}

function Workspace({
  ator,
  inicial,
  salvar,
  projetosBase,
}: {
  ator: AuditActor
  inicial: EstadoPlanner
  salvar(e: EstadoPlanner): Promise<void>
  projetosBase: Omit<ControleProjetos, 'renomear'> & { renomearOutro(id: string, nome: string): void }
}) {
  const { sair } = useAuth()
  const { registrar } = useAudit()
  const { alternar, tema } = useTheme()
  const planner = usePlanner({ ator, registrar, inicial, salvar })
  const navigate = useNavigate()
  const location = useLocation()

  const [paletaAberta, setPaletaAberta] = useState(false)
  const [atalhosAbertos, setAtalhosAbertos] = useState(false)
  const [novoProjetoAberto, setNovoProjetoAberto] = useState(false)
  const [novoCenarioAberto, setNovoCenarioAberto] = useState(false)
  const [secaoConta, setSecaoConta] = useState<SecaoConta | null>(null)
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const temporizador = useRef<number | undefined>(undefined)

  const avisar = useCallback((texto: string, acao?: Aviso['acao']) => {
    window.clearTimeout(temporizador.current)
    setAviso({ texto, id: Date.now(), acao })
    temporizador.current = window.setTimeout(() => setAviso(null), acao ? 6000 : 3500)
  }, [])

  const { cenarioAtivo, cenarios, selecionarCenario, nomeProjeto, desfazer, refazer } = planner
  const avisarDesfeito = useCallback(
    (texto: string) => avisar(texto, { rotulo: 'Desfazer', executar: desfazer }),
    [avisar, desfazer],
  )

  const exportar = useCallback(
    (formato: FormatoExportacao) => {
      const { editavel, indicadores, resultados, periodosNumericos } = cenarioAtivo
      if (!indicadores) return
      let arquivo: string
      if (formato === 'pdf') {
        window.open(`/relatorio?projeto=${encodeURIComponent(planner.projetoId)}&cenario=${encodeURIComponent(editavel.id)}&imprimir=1`, '_blank', 'noopener')
        arquivo = 'Relatório executivo'
      } else {
        const tma = lerTMA(editavel.tma)
        const dados = {
          cenario: { id: editavel.id, nome: editavel.nome, descricaoPremissas: editavel.descricaoPremissas, periodos: periodosNumericos },
          resultados,
          indicadores,
          projeto: nomeProjeto,
          proveniencia: editavel.proveniencia,
          analiseDescontada: typeof tma === 'number' ? analisarDescontado(resultados, tma) : null,
        }
        arquivo = formato === 'csv' ? exportarCSV(dados) : exportarJSON(dados)
      }
      registrar({
        project: { id: planner.projetoId, nome: nomeProjeto },
        scenario: { id: editavel.id, nome: nomeCurto(editavel.nome) },
        category: 'exportacao',
        entity: 'arquivo',
        field: formato.toUpperCase(),
        previousValue: null,
        newValue: arquivo,
        action: 'EXPORT',
        summary: `Exportado em ${formato.toUpperCase()}`,
      })
      avisar(formato === 'pdf' ? 'Relatório aberto em nova aba para imprimir ou salvar em PDF' : `Exportado agora · ${arquivo}`)
    },
    [cenarioAtivo, nomeProjeto, planner.projetoId, registrar, avisar],
  )

  const encerrarSessao = useCallback(async () => {
    setSecaoConta(null)
    await sair()
    navigate('/login', { replace: true })
  }, [sair, navigate])

  const abrirPaleta = useCallback(() => setPaletaAberta(true), [])
  useAtalhoPaleta(abrirPaleta)

  // Atalhos globais: fora de campos de texto, para não roubar o desfazer nativo do navegador.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      const alvo = e.target as HTMLElement
      if (alvo.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return
      const mod = e.ctrlKey || e.metaKey
      const tecla = e.key.toLowerCase()
      if (mod && tecla === 'z' && !e.shiftKey) {
        e.preventDefault()
        desfazer()
      } else if (mod && ((tecla === 'z' && e.shiftKey) || tecla === 'y')) {
        e.preventDefault()
        refazer()
      } else if (e.key === '?' && !mod) {
        e.preventDefault()
        setAtalhosAbertos(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [desfazer, refazer])

  const podeExportar = cenarioAtivo.indicadores !== null

  const projetos: ControleProjetos = {
    ...projetosBase,
    renomear: (id, nome) => (id === planner.projetoId ? planner.renomearProjeto(nome) : projetosBase.renomearOutro(id, nome)),
  }

  const criarCenario = useCallback(
    (nome: string, origem: OrigemNovoCenario) => {
      if (planner.criarCenario(nome, origem)) avisar(`Cenário ${nome.trim()} criado`)
    },
    [planner, avisar],
  )

  const comandos: Comando[] = useMemo(
    () => [
      { id: 'ir-planejamento', grupo: 'Ir para', rotulo: 'Planejamento', icone: 'planejamento', palavras: 'entradas tabela', executar: () => navigate(ROTAS.planejamento) },
      { id: 'ir-resultados', grupo: 'Ir para', rotulo: 'Resultados', icone: 'resultados', palavras: 'graficos indicadores vpl tir', executar: () => navigate(ROTAS.resultados) },
      { id: 'ir-cenarios', grupo: 'Ir para', rotulo: 'Cenários', icone: 'cenarios', palavras: 'comparacao', executar: () => navigate(ROTAS.cenarios) },
      { id: 'ir-sensibilidade', grupo: 'Ir para', rotulo: 'Sensibilidade', icone: 'sensibilidade', palavras: 'simulador tornado e se', executar: () => navigate(ROTAS.sensibilidade) },
      { id: 'ir-auditoria', grupo: 'Ir para', rotulo: 'Auditoria', icone: 'auditoria', palavras: 'historico', executar: () => navigate(ROTAS.auditoria) },
      { id: 'ir-projetos', grupo: 'Ir para', rotulo: 'Todos os planejamentos', icone: 'pasta', palavras: 'projetos crud', executar: () => navigate(ROTAS.projetos) },
      ...cenarios.map<Comando>((c) => ({
        id: `cenario-${c.editavel.id}`,
        grupo: 'Cenário',
        rotulo: `Trocar para ${nomeCurto(c.editavel.nome)}`,
        icone: 'camadas',
        palavras: 'cenario ativo',
        marcador: <CorCenario cor={c.editavel.cor} />,
        dica: c.editavel.id === cenarioAtivo.editavel.id ? 'Ativo' : undefined,
        executar: () => selecionarCenario(c.editavel.id),
      })),
      { id: 'novo-cenario', grupo: 'Cenário', rotulo: 'Novo cenário', icone: 'mais', palavras: 'criar duplicar', executar: () => setNovoCenarioAberto(true) },
      { id: 'desfazer', grupo: 'Edição', rotulo: planner.proximoDesfazer ? `Desfazer: ${planner.proximoDesfazer}` : 'Desfazer', icone: 'voltar', desabilitado: !planner.podeDesfazer, dica: 'Ctrl+Z', executar: desfazer },
      { id: 'refazer', grupo: 'Edição', rotulo: planner.proximoRefazer ? `Refazer: ${planner.proximoRefazer}` : 'Refazer', icone: 'refazer', desabilitado: !planner.podeRefazer, dica: 'Ctrl+Shift+Z', executar: refazer },
      { id: 'exportar-csv', grupo: 'Dados', rotulo: 'Exportar CSV', icone: 'download', palavras: 'planilha baixar', desabilitado: !podeExportar, dica: podeExportar ? undefined : 'Há pendências', executar: () => exportar('csv') },
      { id: 'exportar-json', grupo: 'Dados', rotulo: 'Exportar JSON', icone: 'arquivo', palavras: 'baixar', desabilitado: !podeExportar, dica: podeExportar ? undefined : 'Há pendências', executar: () => exportar('json') },
      { id: 'relatorio', grupo: 'Dados', rotulo: 'Relatório executivo (PDF)', icone: 'impressora', palavras: 'imprimir pdf relatorio', desabilitado: !podeExportar, executar: () => exportar('pdf') },
      {
        id: 'carregar-exemplo',
        grupo: 'Dados',
        rotulo: `Carregar exemplo no cenário ${nomeCurto(cenarioAtivo.editavel.nome).toLowerCase()}`,
        icone: 'voltar',
        palavras: 'edutask referencia',
        executar: () => {
          planner.carregarExemplo(cenarioAtivo.editavel.id)
          avisarDesfeito('Exemplo carregado')
        },
      },
      { id: 'novo-projeto', grupo: 'Planejamento', rotulo: 'Novo planejamento', icone: 'mais', palavras: 'projeto criar importar', executar: () => setNovoProjetoAberto(true) },
      ...projetosBase.lista
        .filter((p) => p.id !== planner.projetoId)
        .slice(0, 5)
        .map<Comando>((p) => ({ id: `projeto-${p.id}`, grupo: 'Planejamento', rotulo: `Abrir ${p.nome}`, icone: 'pasta', executar: () => projetosBase.abrir(p.id) })),
      { id: 'tema', grupo: 'Preferências', rotulo: tema === 'dark' ? 'Usar tema claro' : 'Usar tema escuro', icone: tema === 'dark' ? 'sol' : 'lua', palavras: 'tema aparencia dark light', executar: alternar },
      { id: 'atalhos', grupo: 'Preferências', rotulo: 'Atalhos de teclado', icone: 'teclado', dica: '?', executar: () => setAtalhosAbertos(true) },
      { id: 'conta', grupo: 'Preferências', rotulo: 'Conta e preferências', icone: 'usuario', executar: () => setSecaoConta('conta') },
      { id: 'sair', grupo: 'Sessão', rotulo: 'Sair', icone: 'sair', palavras: 'logout encerrar', executar: () => void encerrarSessao() },
    ],
    [navigate, cenarios, cenarioAtivo, selecionarCenario, planner, desfazer, refazer, podeExportar, exportar, avisarDesfeito, projetosBase, tema, alternar, encerrarSessao],
  )

  const pendencias = cenarioAtivo.problemas.length
  const itens = itensNavegacao(pendencias)
  const pagina = PAGINAS[location.pathname] ?? PAGINAS[ROTAS.planejamento]
  const contexto: WorkspaceContext = {
    planner,
    projetos,
    exportar,
    avisar,
    avisarDesfeito,
    abrirNovoCenario: () => setNovoCenarioAberto(true),
    abrirNovoProjeto: () => setNovoProjetoAberto(true),
  }

  return (
    <div className="min-h-svh pb-24 md:pb-10">
      <a
        href="#conteudo"
        className="focus-ring sr-only z-50 rounded-lg bg-elevated px-3 py-2 text-sm focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>
      <TopBar
        itens={itens}
        cenarios={cenarios}
        salvoEm={planner.salvoEm}
        statusSalvamento={planner.statusSalvamento}
        onAbrirPaleta={abrirPaleta}
        onAbrirConta={setSecaoConta}
        onSair={() => void encerrarSessao()}
        onAbrirCenario={selecionarCenario}
      />

      <main id="conteudo" className="mx-auto flex w-full max-w-[1360px] flex-col gap-5 px-4 pt-6 sm:px-6 lg:px-8">
        <WorkspaceHeader
          titulo={pagina.titulo}
          descricao={pagina.descricao}
          nomeProjeto={nomeProjeto}
          projetoId={planner.projetoId}
          projetos={projetosBase.lista}
          onRenomear={planner.renomearProjeto}
          onAbrirProjeto={projetosBase.abrir}
          onVerProjetos={() => navigate(ROTAS.projetos)}
          onNovoProjeto={() => setNovoProjetoAberto(true)}
          cenarios={cenarios}
          ativo={cenarioAtivo}
          onSelecionarCenario={selecionarCenario}
          atualizadoEm={planner.atualizadoEm}
          salvoEm={planner.salvoEm}
          statusSalvamento={planner.statusSalvamento}
          historico={planner}
          mostrarContexto={pagina.contexto !== false}
          mostrarSeletorProjeto={location.pathname !== ROTAS.projetos}
          acoes={
            location.pathname === ROTAS.projetos ? (
              <Button size="sm" variant="primary" onClick={() => setNovoProjetoAberto(true)}>
                <Icon nome="mais" className="h-4 w-4" />
                Novo planejamento
              </Button>
            ) : (
              <ExportMenu disponivel={podeExportar} onExportar={exportar} />
            )
          }
        />
        <div key={location.pathname} className="animate-fade-in">
          <Outlet context={contexto} />
        </div>
      </main>

      <NavegacaoMobile itens={itens} />
      <Toast aviso={aviso} onFechar={() => setAviso(null)} />
      {paletaAberta && <CommandPalette onFechar={() => setPaletaAberta(false)} comandos={comandos} />}
      <ShortcutsModal aberto={atalhosAbertos} onFechar={() => setAtalhosAbertos(false)} />
      {novoProjetoAberto && (
        <NovoProjetoModal aberto onFechar={() => setNovoProjetoAberto(false)} onCriar={(o) => { projetosBase.criar(o); navigate(ROTAS.planejamento) }} />
      )}
      {novoCenarioAberto && (
        <NovoCenarioModal
          aberto
          onFechar={() => setNovoCenarioAberto(false)}
          cenarios={cenarios}
          ativoId={cenarioAtivo.editavel.id}
          onCriar={criarCenario}
        />
      )}
      <AccountModal
        secao={secaoConta}
        onSecao={setSecaoConta}
        onFechar={() => setSecaoConta(null)}
        onSair={() => void encerrarSessao()}
      />
    </div>
  )
}
