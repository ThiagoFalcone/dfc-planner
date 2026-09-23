import type { PeriodoInput } from '@/types'

export type FonteDados = 'simulacao' | 'material-disciplina' | 'estimativa' | 'documento' | 'outro'

export const FONTES_DADOS: ReadonlyArray<{ valor: FonteDados; rotulo: string }> = [
  { valor: 'simulacao', rotulo: 'Simulação' },
  { valor: 'material-disciplina', rotulo: 'Material da disciplina' },
  { valor: 'estimativa', rotulo: 'Estimativa' },
  { valor: 'documento', rotulo: 'Documento' },
  { valor: 'outro', rotulo: 'Outro' },
]

export function rotuloFonte(fonte: FonteDados): string {
  return FONTES_DADOS.find((f) => f.valor === fonte)?.rotulo ?? 'Outro'
}

/** De onde vêm os números de um cenário e quem mexeu por último. */
export interface Proveniencia {
  fonte: FonteDados
  /** Referência livre: documento, página do material, nome da planilha etc. */
  referencia: string
  responsavel: string
  atualizadoEm: string
}

export const LIMITE_CENARIOS = 6

export interface CenarioEditavel {
  id: string
  nome: string
  descricaoPremissas: string
  proveniencia: Proveniencia
  /** Posição fixa na paleta de séries (1–6): a cor acompanha o cenário, não a ordem. */
  cor: number
  /**
   * Taxa mínima de atratividade, em % ao mês, como texto da UI ('' = não informada).
   * Usada só pela análise descontada complementar — não altera os indicadores da Opção 3.
   */
  tma: string
  periodos: PeriodoInput[]
}

/** Conteúdo de um planejamento (projeto). */
export interface EstadoPlanner {
  versao: 2
  id: string
  nomeProjeto: string
  criadoEm: string
  atualizadoEm: string
  cenarios: CenarioEditavel[]
  cenarioAtivoId: string
}

/** Linha do índice de planejamentos — o suficiente para listar sem abrir cada um. */
export interface ResumoProjeto {
  id: string
  nome: string
  criadoEm: string
  atualizadoEm: string
  cenarios: number
  meses: number
}

/** "Cenário pessimista" → "Pessimista". */
export function nomeCurto(nome: string): string {
  const semPrefixo = nome.replace(/^cen[aá]rio\s+/i, '').trim()
  return semPrefixo.charAt(0).toUpperCase() + semPrefixo.slice(1)
}

/** Primeira cor de série ainda não usada (ou a de menor uso, se todas estiverem ocupadas). */
export function proximaCor(cenarios: ReadonlyArray<Pick<CenarioEditavel, 'cor'>>): number {
  for (let cor = 1; cor <= LIMITE_CENARIOS; cor++) {
    if (!cenarios.some((c) => c.cor === cor)) return cor
  }
  return (cenarios.length % LIMITE_CENARIOS) + 1
}

/** Cenário de referência para diferenças e derivações: o "base", se existir, senão o primeiro. */
export function cenarioReferencia<T extends { editavel: CenarioEditavel } | CenarioEditavel>(cenarios: T[]): T | undefined {
  const id = (c: T) => ('editavel' in c ? c.editavel.id : c.id)
  return cenarios.find((c) => id(c) === 'base') ?? cenarios[0]
}

export function gerarId(prefixo: string): string {
  return `${prefixo}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}
