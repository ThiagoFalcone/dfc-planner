import { cenarioExemploEdutask, criarCenarioEmBranco } from '@/data/exemploEdutask'
import { aplicarAjustes, descreverAjustes, SEM_AJUSTES, type Ajustes } from '@/lib/simulacao'
import type { PeriodoInput } from '@/types'
import { paraPeriodosNumericos, periodoParaInput } from './computar'
import type { CenarioEditavel, EstadoPlanner, FonteDados } from './types'
import { gerarId } from './types'

/**
 * Fábricas de planejamentos e cenários. Todo dado inicial do sistema nasce
 * aqui — e só de duas fontes: o caso de referência do enunciado (EduTask) ou
 * valores em branco. Nada de números inventados.
 */

export type PontoDePartida = 'exemplo' | 'branco' | 'importado'

interface Meta {
  responsavel: string
  agora: string
}

export function novoCenario(
  dados: Omit<CenarioEditavel, 'proveniencia' | 'tma'> & {
    fonte: FonteDados
    referencia: string
    tma?: string
  },
  meta: Meta,
): CenarioEditavel {
  const { fonte, referencia, tma = '', ...resto } = dados
  return {
    ...resto,
    tma,
    proveniencia: { fonte, referencia, responsavel: meta.responsavel, atualizadoEm: meta.agora },
  }
}

/** Periodos com ajustes da simulação aplicados — o mesmo mecanismo do simulador de sensibilidade. */
export function periodosAjustados(periodos: PeriodoInput[], ajustes: Ajustes): PeriodoInput[] {
  // Valores inválidos (NaN) passariam adiante como "NaN"; mantemos o texto original nesses campos.
  const numericos = paraPeriodosNumericos(periodos)
  const ajustados = aplicarAjustes(numericos, ajustes).map(periodoParaInput)
  return ajustados.map((p, i) => {
    const original = periodos.find((o) => o.mes === p.mes) ?? periodos[i]
    const r = { ...p }
    for (const campo of ['receitas', 'despesas', 'investimentos', 'tributos', 'residual'] as const) {
      if (r[campo] === 'NaN') r[campo] = original[campo]
    }
    return r
  })
}

export function descricaoDerivado(ajustes: Ajustes): string {
  return `Derivado do cenário base (${descreverAjustes(ajustes)}). Demais entradas inalteradas.`
}

function tresCenarios(base: PeriodoInput[], premissasBase: string, fonteBase: FonteDados, refBase: string, meta: Meta) {
  const pess: Ajustes = { ...SEM_AJUSTES, receitas: -20 }
  const otim: Ajustes = { ...SEM_AJUSTES, receitas: 20 }
  return [
    novoCenario({ id: 'base', nome: 'Cenário base', descricaoPremissas: premissasBase, cor: 1, periodos: base, fonte: fonteBase, referencia: refBase }, meta),
    novoCenario(
      {
        id: 'pessimista',
        nome: 'Cenário pessimista',
        descricaoPremissas: `${descricaoDerivado(pess)} Hipótese: demanda mais lenta que o previsto.`,
        cor: 2,
        periodos: periodosAjustados(base, pess),
        fonte: 'simulacao',
        referencia: 'Derivado do cenário base (receitas −20%)',
      },
      meta,
    ),
    novoCenario(
      {
        id: 'otimista',
        nome: 'Cenário otimista',
        descricaoPremissas: `${descricaoDerivado(otim)} Hipótese: adoção mais rápida que o previsto.`,
        cor: 3,
        periodos: periodosAjustados(base, otim),
        fonte: 'simulacao',
        referencia: 'Derivado do cenário base (receitas +20%)',
      },
      meta,
    ),
  ]
}

export function criarProjeto(
  opcoes: {
    nome: string
    partida: PontoDePartida
    importado?: { periodos: PeriodoInput[]; premissas?: string; referencia: string; fonte?: FonteDados }
  },
  meta: Meta,
): EstadoPlanner {
  let cenarios: CenarioEditavel[]
  if (opcoes.partida === 'exemplo') {
    cenarios = tresCenarios(
      cenarioExemploEdutask.periodos.map(periodoParaInput),
      cenarioExemploEdutask.descricaoPremissas,
      'material-disciplina',
      'Enunciado EduTask — opção 3',
      meta,
    )
  } else if (opcoes.partida === 'importado' && opcoes.importado) {
    const imp = opcoes.importado
    cenarios = tresCenarios(imp.periodos, imp.premissas ?? '', imp.fonte ?? 'documento', imp.referencia, meta)
  } else {
    const vazio = criarCenarioEmBranco('base', 'Cenário base').periodos.map(periodoParaInput)
    cenarios = tresCenarios(vazio, '', 'estimativa', '', meta).map((c) => ({
      ...c,
      periodos: vazio.map((p) => ({ ...p })),
      descricaoPremissas: '',
      proveniencia: { ...c.proveniencia, fonte: 'estimativa' as const, referencia: '' },
    }))
  }
  return {
    versao: 2,
    id: gerarId('prj'),
    nomeProjeto: opcoes.nome.trim() || 'Novo planejamento',
    criadoEm: meta.agora,
    atualizadoEm: meta.agora,
    cenarios,
    cenarioAtivoId: 'base',
  }
}
