/**
 * Tipos centrais do domínio "Planejador de fluxo de caixa" (Opção 3).
 * Ver modelo_calculos.md para as convenções de sinal, unidades e limites de validade.
 */

/** Um período (mês) do fluxo de caixa. `mes` 0 é o instante inicial do projeto. */
export interface Periodo {
  /** Índice do mês, começando em 0 (mês do lançamento / investimento inicial). */
  mes: number
  /** Recebimentos previstos no período (R$, valor não-negativo). */
  receitas: number
  /** Despesas de operação pagas no período (R$, valor não-negativo, já positivo — o sinal é aplicado no cálculo). */
  despesas: number
  /** Investimentos (desembolsos de capital) feitos no período (R$, valor não-negativo). */
  investimentos: number
  /** Tributos pagos no período (R$, valor absoluto já calculado — não é uma alíquota). */
  tributos: number
  /** Valor residual recebido no período (ex.: venda de ativo, capital de giro devolvido). */
  residual: number
}

/** Estado "bruto" de edição de um período — strings para permitir campo vazio na UI. */
export interface PeriodoInput {
  mes: number
  receitas: string
  despesas: string
  investimentos: string
  tributos: string
  residual: string
}

export interface ResultadoPeriodo {
  mes: number
  fluxo: number
  acumulado: number
}

export interface IndicadoresFluxoCaixa {
  /** true se algum mês do horizonte teve acumulado negativo. */
  houveDeficit: boolean
  /** Maior déficit em módulo (valor positivo), isto é, o menor valor de acumulado, invertido. */
  maiorDeficit: number
  /** Mês em que ocorreu o maior déficit (null se não houve déficit). */
  mesMaiorDeficit: number | null
  /** Necessidade de capital = max(0, -min(acumulado)). */
  necessidadeCapital: number
  /** Primeiro mês, após o início do déficit, em que o acumulado volta a ser >= 0. */
  mesRecuperacao: number | null
  /** Saldo acumulado no último mês do horizonte. */
  saldoFinal: number
  /** true se, tendo havido déficit, o saldo volta a ficar negativo depois de recuperado. */
  reincideNegativoAposRecuperacao: boolean
}

export interface CampoInvalido {
  mes: number
  campo: keyof Omit<Periodo, 'mes'>
  motivo: string
}

export interface Cenario {
  id: string
  nome: string
  descricaoPremissas: string
  periodos: Periodo[]
}

export interface ResultadoCenario {
  cenario: Cenario
  resultados: ResultadoPeriodo[]
  indicadores: IndicadoresFluxoCaixa
}

export const CAMPOS_NUMERICOS = [
  'receitas',
  'despesas',
  'investimentos',
  'tributos',
  'residual',
] as const
