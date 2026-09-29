import { useCallback, useMemo, useRef, useState } from 'react'
import { paraNumero } from '@/lib/calculos'
import { cenarioExemploEdutask, criarCenarioEmBranco } from '@/data/exemploEdutask'
import { formatarMoeda, rotuloMes } from '@/lib/formato'
import type { ResultadoImportacao } from '@/lib/importar'
import { type Ajustes, descreverAjustes } from '@/lib/simulacao'
import { CAMPOS_NUMERICOS, type PeriodoInput } from '@/types'
import type { CenarioEditavel, EstadoPlanner, FonteDados, Proveniencia } from '@/domain/scenario/types'
import { LIMITE_CENARIOS, cenarioReferencia, gerarId, nomeCurto, proximaCor, rotuloFonte } from '@/domain/scenario/types'
import { computar, periodoParaInput, type CampoNumerico, type CenarioComputado } from '@/domain/scenario/computar'
import { descricaoDerivado, novoCenario, periodosAjustados } from '@/domain/scenario/fabricas'
import type { AuditActor, AuditCategory, AuditEntity, NovoAuditEvent } from '@/domain/audit/types'
import { useAutosave } from './useAutosave'

export type { CampoNumerico, CenarioComputado }
export { ROTULO_CAMPO } from '@/domain/scenario/computar'

const RESUMO_EDICAO: Record<CampoNumerico, string> = {
  receitas: 'Receita atualizada',
  despesas: 'Despesa atualizada',
  investimentos: 'Investimento atualizado',
  tributos: 'Tributo atualizado',
  residual: 'Valor residual atualizado',
}

const LIMITE_HISTORICO = 50

function buscar(estado: EstadoPlanner, id: string): CenarioEditavel | undefined {
  return estado.cenarios.find((c) => c.id === id)
}

function refCenario(c: CenarioEditavel) {
  return { id: c.id, nome: nomeCurto(c.nome) }
}

function valorAuditavel(bruto: string): string {
  if (bruto.trim() === '') return '(vazio)'
  const n = paraNumero(bruto)
  return Number.isNaN(n) ? `"${bruto}"` : formatarMoeda(n)
}

function resumir(texto: string, limite = 140): string {
  const t = texto.trim()
  if (t === '') return '(vazio)'
  return t.length > limite ? `${t.slice(0, limite - 1)}…` : t
}

function mesVazio(mes: number): PeriodoInput {
  return { mes, receitas: '0', despesas: '0', investimentos: '0', tributos: '0', residual: '0' }
}

interface EntradaHistorico {
  estado: EstadoPlanner
  descricao: string
  category: AuditCategory
}

interface Historico {
  passado: EntradaHistorico[]
  futuro: EntradaHistorico[]
}

interface OpcoesPlanner {
  ator: AuditActor
  registrar(evento: NovoAuditEvent): void
  inicial: EstadoPlanner
  salvar(estado: EstadoPlanner): Promise<void>
}

export type OrigemNovoCenario =
  | { tipo: 'branco' }
  | { tipo: 'duplicar'; deId: string }
  | { tipo: 'ajustes'; deId: string; ajustes: Ajustes }

/**
 * Estado de um planejamento aberto: cenários editáveis, cálculo derivado via
 * calculos.ts (inalterado), persistência local, trilha de auditoria e
 * histórico de desfazer/refazer.
 *
 * Toda alteração passa por `commit`, que atualiza o estado de forma síncrona
 * (via ref), assim duas ações seguidas no mesmo evento nunca leem estado
 * velho, e emite o evento de auditoria uma única vez (fora de updaters do
 * React, que o StrictMode executa duas vezes).
 */
export function usePlanner({ ator, registrar, inicial, salvar }: OpcoesPlanner) {
  const [estado, setEstado] = useState<EstadoPlanner>(inicial)
  const estadoRef = useRef(inicial)
  const [historico, setHistorico] = useState<Historico>({ passado: [], futuro: [] })
  const historicoRef = useRef(historico)
  const { salvoEm, status: statusSalvamento } = useAutosave(estado, salvar)

  const definirHistorico = useCallback((h: Historico) => {
    historicoRef.current = h
    setHistorico(h)
  }, [])

  const log = useCallback(
    (e: NovoAuditEvent) =>
      registrar({ ...e, project: { id: estadoRef.current.id, nome: estadoRef.current.nomeProjeto } }),
    [registrar],
  )

  const aplicar = useCallback((novo: EstadoPlanner) => {
    estadoRef.current = novo
    setEstado(novo)
  }, [])

  const commit = useCallback(
    (transformar: (e: EstadoPlanner) => EstadoPlanner, evento: NovoAuditEvent, desfazivel = true) => {
      const anterior = estadoRef.current
      const novo = transformar(anterior)
      if (novo === anterior) return
      aplicar(novo)
      if (desfazivel) {
        const h = historicoRef.current
        definirHistorico({
          passado: [...h.passado, { estado: anterior, descricao: evento.summary, category: evento.category }].slice(
            -LIMITE_HISTORICO,
          ),
          futuro: [],
        })
      }
      log(evento)
    },
    [aplicar, definirHistorico, log],
  )

  /** Altera um cenário e carimba responsável/data na proveniência. */
  const comCenario = useCallback(
    (cenarioId: string, alterar: (c: CenarioEditavel) => CenarioEditavel) =>
      (e: EstadoPlanner): EstadoPlanner => {
        const agora = new Date().toISOString()
        return {
          ...e,
          atualizadoEm: agora,
          cenarios: e.cenarios.map((c) => {
            if (c.id !== cenarioId) return c
            const novo = alterar(c)
            return { ...novo, proveniencia: { ...novo.proveniencia, responsavel: ator.nome, atualizadoEm: agora } }
          }),
        }
      },
    [ator.nome],
  )

  const computados = useMemo(() => estado.cenarios.map(computar), [estado.cenarios])
  const ativo = computados.find((c) => c.editavel.id === estado.cenarioAtivoId) ?? computados[0]

  // ---------------------------------------------------------------- desfazer

  const moverHistorico = useCallback(
    (direcao: 'desfazer' | 'refazer') => {
      const h = historicoRef.current
      const origem = direcao === 'desfazer' ? h.passado : h.futuro
      const entrada = origem[origem.length - 1]
      if (!entrada) return
      const inverso: EntradaHistorico = { estado: estadoRef.current, descricao: entrada.descricao, category: entrada.category }
      definirHistorico(
        direcao === 'desfazer'
          ? { passado: h.passado.slice(0, -1), futuro: [...h.futuro, inverso] }
          : { passado: [...h.passado, inverso], futuro: h.futuro.slice(0, -1) },
      )
      aplicar({ ...entrada.estado, atualizadoEm: new Date().toISOString() })
      log({
        scenario: null,
        category: entrada.category,
        entity: 'projeto',
        field: null,
        previousValue: null,
        newValue: entrada.descricao,
        action: direcao === 'desfazer' ? 'UNDO' : 'REDO',
        summary: direcao === 'desfazer' ? `Desfeito: ${entrada.descricao}` : `Refeito: ${entrada.descricao}`,
      })
    },
    [aplicar, definirHistorico, log],
  )

  const desfazer = useCallback(() => moverHistorico('desfazer'), [moverHistorico])
  const refazer = useCallback(() => moverHistorico('refazer'), [moverHistorico])

  // ------------------------------------------------------------ valores

  const atualizarCampo = useCallback(
    (cenarioId: string, mes: number, campo: CampoNumerico, valor: string) => {
      const cenario = buscar(estadoRef.current, cenarioId)
      const anterior = cenario?.periodos.find((p) => p.mes === mes)?.[campo]
      if (!cenario || anterior === undefined || anterior === valor) return
      commit(
        comCenario(cenarioId, (c) => ({
          ...c,
          periodos: c.periodos.map((p) => (p.mes === mes ? { ...p, [campo]: valor } : p)),
        })),
        {
          scenario: refCenario(cenario),
          category: 'planejamento',
          entity: campo as AuditEntity,
          field: rotuloMes(mes),
          previousValue: valorAuditavel(anterior),
          newValue: valorAuditavel(valor),
          action: 'EDIT',
          summary: RESUMO_EDICAO[campo],
        },
      )
    },
    [commit, comCenario],
  )

  /** Cola um bloco (linhas × colunas) a partir de uma célula; cria meses que faltarem. Células vazias são mantidas. */
  const colarValores = useCallback(
    (cenarioId: string, linhaInicial: number, colunaInicial: number, bloco: string[][]): number => {
      const cenario = buscar(estadoRef.current, cenarioId)
      if (!cenario || bloco.length === 0) return 0
      const ordenados = [...cenario.periodos].sort((a, b) => a.mes - b.mes)
      const periodos = ordenados.map((p) => ({ ...p }))
      let alteradas = 0
      bloco.forEach((linha, i) => {
        const idx = linhaInicial + i
        while (idx >= periodos.length) {
          const ultimo = periodos[periodos.length - 1]
          periodos.push(mesVazio(ultimo ? ultimo.mes + 1 : 0))
        }
        linha.forEach((valor, j) => {
          const campo = CAMPOS_NUMERICOS[colunaInicial + j]
          if (!campo || valor === '') return
          if (periodos[idx][campo] !== valor) {
            periodos[idx][campo] = valor
            alteradas++
          }
        })
      })
      const criados = periodos.length - ordenados.length
      if (alteradas === 0 && criados === 0) return 0
      const primeiro = periodos[linhaInicial]?.mes ?? 0
      const ultimo = periodos[Math.min(linhaInicial + bloco.length, periodos.length) - 1]?.mes ?? primeiro
      commit(comCenario(cenarioId, (c) => ({ ...c, periodos })), {
        scenario: refCenario(cenario),
        category: 'planejamento',
        entity: 'mes',
        field: primeiro === ultimo ? rotuloMes(primeiro) : `${rotuloMes(primeiro)} a ${rotuloMes(ultimo)}`,
        previousValue: null,
        newValue: `${alteradas} ${alteradas === 1 ? 'célula' : 'células'}${
          criados ? `, ${criados} ${criados === 1 ? 'mês criado' : 'meses criados'}` : ''
        }`,
        action: 'PASTE',
        summary: 'Valores colados',
      })
      return alteradas
    },
    [commit, comCenario],
  )

  // ------------------------------------------------------------ estrutura

  const adicionarMes = useCallback(
    (cenarioId: string) => {
      const cenario = buscar(estadoRef.current, cenarioId)
      if (!cenario) return
      const proximoMes = cenario.periodos.length ? Math.max(...cenario.periodos.map((p) => p.mes)) + 1 : 0
      commit(comCenario(cenarioId, (c) => ({ ...c, periodos: [...c.periodos, mesVazio(proximoMes)] })), {
        scenario: refCenario(cenario),
        category: 'estrutura',
        entity: 'mes',
        field: rotuloMes(proximoMes),
        previousValue: null,
        newValue: null,
        action: 'ADD',
        summary: `${rotuloMes(proximoMes)} adicionado`,
      })
    },
    [commit, comCenario],
  )

  const removerMes = useCallback(
    (cenarioId: string, mes: number) => {
      const cenario = buscar(estadoRef.current, cenarioId)
      const periodo = cenario?.periodos.find((p) => p.mes === mes)
      if (!cenario || !periodo || cenario.periodos.length <= 1) return
      commit(comCenario(cenarioId, (c) => ({ ...c, periodos: c.periodos.filter((p) => p.mes !== mes) })), {
        scenario: refCenario(cenario),
        category: 'estrutura',
        entity: 'mes',
        field: rotuloMes(mes),
        previousValue: `Receitas ${valorAuditavel(periodo.receitas)}, despesas ${valorAuditavel(periodo.despesas)}`,
        newValue: null,
        action: 'REMOVE',
        summary: `${rotuloMes(mes)} removido`,
      })
    },
    [commit, comCenario],
  )

  const carregarExemplo = useCallback(
    (cenarioId: string) => {
      const cenario = buscar(estadoRef.current, cenarioId)
      if (!cenario) return
      commit(
        comCenario(cenarioId, (c) => ({
          ...c,
          periodos: cenarioExemploEdutask.periodos.map(periodoParaInput),
          descricaoPremissas: cenarioExemploEdutask.descricaoPremissas,
          proveniencia: { ...c.proveniencia, fonte: 'material-disciplina', referencia: 'Enunciado EduTask, opção 3' },
        })),
        {
          scenario: refCenario(cenario),
          category: 'cenarios',
          entity: 'cenario',
          field: null,
          previousValue: null,
          newValue: 'Exemplo EduTask',
          action: 'LOAD_EXAMPLE',
          summary: 'Dados de exemplo carregados',
        },
      )
    },
    [commit, comCenario],
  )

  const zerarCenario = useCallback(
    (cenarioId: string) => {
      const cenario = buscar(estadoRef.current, cenarioId)
      if (!cenario) return
      const vazio = criarCenarioEmBranco(cenario.id, cenario.nome)
      commit(
        comCenario(cenarioId, (c) => ({
          ...c,
          periodos: vazio.periodos.map(periodoParaInput),
          descricaoPremissas: '',
          proveniencia: { ...c.proveniencia, fonte: 'estimativa', referencia: '' },
        })),
        {
          scenario: refCenario(cenario),
          category: 'cenarios',
          entity: 'cenario',
          field: null,
          previousValue: `${cenario.periodos.length} meses preenchidos`,
          newValue: 'Mês 0 a 6 zerados',
          action: 'RESET',
          summary: 'Cenário zerado',
        },
      )
    },
    [commit, comCenario],
  )

  const importarNoCenario = useCallback(
    (cenarioId: string, dados: ResultadoImportacao) => {
      const cenario = buscar(estadoRef.current, cenarioId)
      if (!cenario) return
      commit(
        comCenario(cenarioId, (c) => ({
          ...c,
          periodos: dados.periodos,
          descricaoPremissas: dados.premissas ?? c.descricaoPremissas,
          proveniencia: { ...c.proveniencia, fonte: dados.fonte ?? 'documento', referencia: dados.referencia ?? '' },
        })),
        {
          scenario: refCenario(cenario),
          category: 'planejamento',
          entity: 'arquivo',
          field: dados.referencia ?? null,
          previousValue: `${cenario.periodos.length} meses`,
          newValue: `${dados.periodos.length} meses importados`,
          action: 'IMPORT',
          summary: 'Dados importados de arquivo',
        },
      )
    },
    [commit, comCenario],
  )

  // ------------------------------------------------------------ premissas

  const atualizarPremissas = useCallback(
    (cenarioId: string, texto: string) => {
      const cenario = buscar(estadoRef.current, cenarioId)
      if (!cenario || cenario.descricaoPremissas === texto) return
      commit(comCenario(cenarioId, (c) => ({ ...c, descricaoPremissas: texto })), {
        scenario: refCenario(cenario),
        category: 'premissas',
        entity: 'premissas',
        field: null,
        previousValue: resumir(cenario.descricaoPremissas),
        newValue: resumir(texto),
        action: 'EDIT',
        summary: 'Premissas atualizadas',
      })
    },
    [commit, comCenario],
  )

  const atualizarProveniencia = useCallback(
    (cenarioId: string, mudanca: Partial<Pick<Proveniencia, 'fonte' | 'referencia'>>) => {
      const cenario = buscar(estadoRef.current, cenarioId)
      if (!cenario) return
      const atual = cenario.proveniencia
      const fonteMudou = mudanca.fonte !== undefined && mudanca.fonte !== atual.fonte
      const refMudou = mudanca.referencia !== undefined && mudanca.referencia !== atual.referencia
      if (!fonteMudou && !refMudou) return
      commit(comCenario(cenarioId, (c) => ({ ...c, proveniencia: { ...c.proveniencia, ...mudanca } })), {
        scenario: refCenario(cenario),
        category: 'premissas',
        entity: 'proveniencia',
        field: fonteMudou ? 'Fonte dos dados' : 'Referência',
        previousValue: fonteMudou ? rotuloFonte(atual.fonte) : resumir(atual.referencia),
        newValue: fonteMudou ? rotuloFonte(mudanca.fonte as FonteDados) : resumir(mudanca.referencia ?? ''),
        action: 'EDIT',
        summary: fonteMudou ? 'Fonte dos dados alterada' : 'Referência dos dados atualizada',
      })
    },
    [commit, comCenario],
  )

  const atualizarTMA = useCallback(
    (cenarioId: string, tma: string) => {
      const cenario = buscar(estadoRef.current, cenarioId)
      const limpo = tma.trim()
      if (!cenario || cenario.tma === limpo) return
      commit(comCenario(cenarioId, (c) => ({ ...c, tma: limpo })), {
        scenario: refCenario(cenario),
        category: 'premissas',
        entity: 'tma',
        field: 'TMA (% a.m.)',
        previousValue: cenario.tma || '(não informada)',
        newValue: limpo || '(não informada)',
        action: 'EDIT',
        summary: 'TMA atualizada',
      })
    },
    [commit, comCenario],
  )

  // ------------------------------------------------------------ cenários (CRUD)

  const selecionarCenario = useCallback(
    (cenarioId: string) => {
      const anterior = buscar(estadoRef.current, estadoRef.current.cenarioAtivoId)
      const novo = buscar(estadoRef.current, cenarioId)
      if (!novo || cenarioId === estadoRef.current.cenarioAtivoId) return
      commit(
        (e) => ({ ...e, cenarioAtivoId: cenarioId }),
        {
          scenario: refCenario(novo),
          category: 'cenarios',
          entity: 'cenario',
          field: null,
          previousValue: anterior ? nomeCurto(anterior.nome) : null,
          newValue: nomeCurto(novo.nome),
          action: 'SWITCH',
          summary: 'Cenário ativo alterado',
        },
        false,
      )
    },
    [commit],
  )

  /** Cria um cenário e o torna ativo. Devolve o id, ou null se o limite foi atingido. */
  const criarCenario = useCallback(
    (nome: string, origem: OrigemNovoCenario): string | null => {
      const e = estadoRef.current
      if (e.cenarios.length >= LIMITE_CENARIOS) return null
      const agora = new Date().toISOString()
      const meta = { responsavel: ator.nome, agora }
      const id = gerarId('cen')
      const nomeFinal = nome.trim() || `Cenário ${e.cenarios.length + 1}`
      const fonteOrigem = origem.tipo === 'branco' ? undefined : buscar(e, origem.deId)
      let cenario: CenarioEditavel
      let descricaoOrigem: string
      if (origem.tipo === 'branco' || !fonteOrigem) {
        descricaoOrigem = 'Em branco'
        cenario = novoCenario(
          {
            id,
            nome: nomeFinal,
            descricaoPremissas: '',
            cor: proximaCor(e.cenarios),
            periodos: criarCenarioEmBranco(id, nomeFinal).periodos.map(periodoParaInput),
            fonte: 'estimativa',
            referencia: '',
          },
          meta,
        )
      } else if (origem.tipo === 'duplicar') {
        descricaoOrigem = `Cópia de ${nomeCurto(fonteOrigem.nome)}`
        cenario = {
          ...fonteOrigem,
          id,
          nome: nomeFinal,
          cor: proximaCor(e.cenarios),
          periodos: fonteOrigem.periodos.map((p) => ({ ...p })),
          proveniencia: { ...fonteOrigem.proveniencia, responsavel: ator.nome, atualizadoEm: agora },
        }
      } else {
        const texto = descreverAjustes(origem.ajustes)
        descricaoOrigem = `${nomeCurto(fonteOrigem.nome)} com ${texto}`
        cenario = novoCenario(
          {
            id,
            nome: nomeFinal,
            descricaoPremissas: `Derivado de "${nomeCurto(fonteOrigem.nome)}" (${texto}). Demais entradas inalteradas.`,
            cor: proximaCor(e.cenarios),
            periodos: periodosAjustados(fonteOrigem.periodos, origem.ajustes),
            fonte: 'simulacao',
            referencia: `${nomeCurto(fonteOrigem.nome)}: ${texto}`,
            tma: fonteOrigem.tma,
          },
          meta,
        )
      }
      commit((est) => ({ ...est, atualizadoEm: agora, cenarios: [...est.cenarios, cenario], cenarioAtivoId: id }), {
        scenario: refCenario(cenario),
        category: 'cenarios',
        entity: 'cenario',
        field: null,
        previousValue: null,
        newValue: descricaoOrigem,
        action: 'CREATE',
        summary: `Cenário ${nomeCurto(nomeFinal).toLowerCase()} criado`,
      })
      return id
    },
    [ator.nome, commit],
  )

  const renomearCenario = useCallback(
    (cenarioId: string, nome: string) => {
      const cenario = buscar(estadoRef.current, cenarioId)
      const limpo = nome.trim()
      if (!cenario || !limpo || limpo === cenario.nome) return
      commit(comCenario(cenarioId, (c) => ({ ...c, nome: limpo })), {
        scenario: { id: cenario.id, nome: nomeCurto(limpo) },
        category: 'cenarios',
        entity: 'cenario',
        field: 'Nome',
        previousValue: cenario.nome,
        newValue: limpo,
        action: 'EDIT',
        summary: 'Cenário renomeado',
      })
    },
    [commit, comCenario],
  )

  const excluirCenario = useCallback(
    (cenarioId: string) => {
      const cenario = buscar(estadoRef.current, cenarioId)
      if (!cenario || estadoRef.current.cenarios.length <= 1) return
      commit(
        (est) => {
          const cenarios = est.cenarios.filter((c) => c.id !== cenarioId)
          return {
            ...est,
            atualizadoEm: new Date().toISOString(),
            cenarios,
            cenarioAtivoId: est.cenarioAtivoId === cenarioId ? cenarios[0].id : est.cenarioAtivoId,
          }
        },
        {
          scenario: refCenario(cenario),
          category: 'cenarios',
          entity: 'cenario',
          field: null,
          previousValue: `${cenario.periodos.length} meses`,
          newValue: null,
          action: 'DELETE',
          summary: `Cenário ${nomeCurto(cenario.nome).toLowerCase()} excluído`,
        },
      )
    },
    [commit],
  )

  /** Substitui os valores de um cenário pelos do cenário de referência com ajustes (sensibilidade de uma premissa). */
  const recriarAPartirDaReferencia = useCallback(
    (cenarioId: string, ajustes: Ajustes) => {
      const e = estadoRef.current
      const referencia = cenarioReferencia(e.cenarios)
      const cenario = buscar(e, cenarioId)
      if (!referencia || !cenario || referencia.id === cenarioId) return
      const texto = descreverAjustes(ajustes)
      commit(
        comCenario(cenarioId, (c) => ({
          ...c,
          periodos: periodosAjustados(referencia.periodos, ajustes),
          descricaoPremissas: descricaoDerivado(ajustes),
          proveniencia: { ...c.proveniencia, fonte: 'simulacao', referencia: `Derivado do cenário base (${texto})` },
        })),
        {
          scenario: refCenario(cenario),
          category: 'cenarios',
          entity: 'cenario',
          field: null,
          previousValue: null,
          newValue: `${nomeCurto(referencia.nome)} com ${texto}`,
          action: 'CREATE',
          summary: `Cenário ${nomeCurto(cenario.nome).toLowerCase()} recriado a partir do ${nomeCurto(referencia.nome)}`,
        },
      )
    },
    [commit, comCenario],
  )

  const renomearProjeto = useCallback(
    (nome: string) => {
      const anterior = estadoRef.current.nomeProjeto
      const limpo = nome.trim()
      if (!limpo || limpo === anterior) return
      commit((e) => ({ ...e, nomeProjeto: limpo, atualizadoEm: new Date().toISOString() }), {
        scenario: null,
        category: 'estrutura',
        entity: 'projeto',
        field: 'Nome do planejamento',
        previousValue: anterior,
        newValue: limpo,
        action: 'EDIT',
        summary: 'Planejamento renomeado',
      })
    },
    [commit],
  )

  return {
    projetoId: estado.id,
    nomeProjeto: estado.nomeProjeto,
    atualizadoEm: estado.atualizadoEm,
    salvoEm,
    statusSalvamento,
    cenarios: computados,
    cenarioAtivo: ativo,
    cenarioAtivoId: ativo.editavel.id,
    podeDesfazer: historico.passado.length > 0,
    podeRefazer: historico.futuro.length > 0,
    proximoDesfazer: historico.passado[historico.passado.length - 1]?.descricao ?? null,
    proximoRefazer: historico.futuro[historico.futuro.length - 1]?.descricao ?? null,
    desfazer,
    refazer,
    selecionarCenario,
    atualizarCampo,
    colarValores,
    adicionarMes,
    removerMes,
    carregarExemplo,
    zerarCenario,
    importarNoCenario,
    atualizarPremissas,
    atualizarProveniencia,
    atualizarTMA,
    criarCenario,
    renomearCenario,
    excluirCenario,
    recriarAPartirDaReferencia,
    renomearProjeto,
  }
}

export type Planner = ReturnType<typeof usePlanner>
