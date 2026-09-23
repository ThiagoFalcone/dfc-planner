/**
 * Núcleo de cálculo do Planejador de Fluxo de Caixa (Opção 3).
 *
 * Todas as funções aqui são puras: recebem dados e devolvem resultados,
 * sem depender de estado de tela. Isso permite testá-las isoladamente
 * (ver calculos.test.ts) e reaproveitá-las em um backend futuro.
 *
 * Regra de cálculo (modelo_calculos.md tem o detalhamento completo):
 *
 *   fluxo[k]     = receitas[k] - despesas[k] - investimentos[k] - tributos[k] + residual[k]
 *   acumulado[k] = soma(fluxo[j], para j de 0 até k)
 *   necessidadeCapital = max(0, -min(acumulado))
 *
 * Convenção de sinal: receitas e residual entram positivos; despesas,
 * investimentos e tributos são informados como valores não-negativos e o
 * sinal negativo é aplicado aqui — a UI nunca pede que o usuário digite
 * "-8000".
 */
import type {
  CampoInvalido,
  IndicadoresFluxoCaixa,
  Periodo,
  ResultadoPeriodo,
} from '@/types'

const TOLERANCIA = 0.01

/** Arredonda apenas para apresentação — os cálculos internos usam o valor cheio. */
export function arredondar(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100
}

function quaseIgual(a: number, b: number, tolerancia = TOLERANCIA): boolean {
  return Math.abs(a - b) <= tolerancia
}

export { quaseIgual }

/** Calcula o fluxo líquido de um único período. */
export function calcularFluxo(periodo: Periodo): number {
  return (
    periodo.receitas -
    periodo.despesas -
    periodo.investimentos -
    periodo.tributos +
    periodo.residual
  )
}

/** Calcula fluxo e acumulado para toda a série de períodos, em ordem de mês. */
export function calcularResultados(periodos: Periodo[]): ResultadoPeriodo[] {
  const ordenados = [...periodos].sort((a, b) => a.mes - b.mes)
  let acumulado = 0
  return ordenados.map((p) => {
    const fluxo = calcularFluxo(p)
    acumulado += fluxo
    return { mes: p.mes, fluxo: arredondar(fluxo), acumulado: arredondar(acumulado) }
  })
}

/** necessidade_capital = max(0, -min(acumulado)) */
export function calcularNecessidadeCapital(resultados: ResultadoPeriodo[]): number {
  if (resultados.length === 0) return 0
  const menorAcumulado = Math.min(...resultados.map((r) => r.acumulado))
  return arredondar(Math.max(0, -menorAcumulado))
}

/**
 * Regra de recuperação: após ocorrer o primeiro acumulado negativo, localiza
 * o primeiro mês posterior em que o acumulado volta a ser >= 0. Um saldo
 * zero registrado antes do primeiro desembolso (isto é, antes de qualquer
 * acumulado negativo ter ocorrido) não conta como recuperação.
 */
export function encontrarRecuperacao(
  resultados: ResultadoPeriodo[],
): { mesRecuperacao: number | null; reincideNegativoAposRecuperacao: boolean } {
  const primeiroNegativoIdx = resultados.findIndex((r) => r.acumulado < -TOLERANCIA)

  if (primeiroNegativoIdx === -1) {
    // Nunca houve déficit: não há o que "recuperar".
    return { mesRecuperacao: null, reincideNegativoAposRecuperacao: false }
  }

  let mesRecuperacao: number | null = null
  for (let i = primeiroNegativoIdx + 1; i < resultados.length; i++) {
    if (resultados[i].acumulado >= -TOLERANCIA) {
      mesRecuperacao = resultados[i].mes
      break
    }
  }

  let reincide = false
  if (mesRecuperacao !== null) {
    const idxRecuperacao = resultados.findIndex((r) => r.mes === mesRecuperacao)
    reincide = resultados
      .slice(idxRecuperacao + 1)
      .some((r) => r.acumulado < -TOLERANCIA)
  }

  return { mesRecuperacao, reincideNegativoAposRecuperacao: reincide }
}

/** Consolida todos os indicadores exigidos pela atividade a partir da série calculada. */
export function calcularIndicadores(resultados: ResultadoPeriodo[]): IndicadoresFluxoCaixa {
  if (resultados.length === 0) {
    return {
      houveDeficit: false,
      maiorDeficit: 0,
      mesMaiorDeficit: null,
      necessidadeCapital: 0,
      mesRecuperacao: null,
      saldoFinal: 0,
      reincideNegativoAposRecuperacao: false,
    }
  }

  const piorResultado = resultados.reduce((pior, atual) =>
    atual.acumulado < pior.acumulado ? atual : pior,
  )
  const houveDeficit = piorResultado.acumulado < -TOLERANCIA
  const necessidadeCapital = calcularNecessidadeCapital(resultados)
  const { mesRecuperacao, reincideNegativoAposRecuperacao } = encontrarRecuperacao(resultados)
  const saldoFinal = resultados[resultados.length - 1].acumulado

  return {
    houveDeficit,
    maiorDeficit: houveDeficit ? arredondar(-piorResultado.acumulado) : 0,
    mesMaiorDeficit: houveDeficit ? piorResultado.mes : null,
    necessidadeCapital,
    mesRecuperacao,
    saldoFinal: arredondar(saldoFinal),
    reincideNegativoAposRecuperacao,
  }
}

/**
 * Valida os períodos segundo as convenções obrigatórias da atividade:
 * - receita, despesa, investimento, tributo e residual não podem ser negativos
 *   (o sinal já é aplicado pela fórmula — pedir um valor negativo duplicaria o sinal);
 * - NaN (campo vazio ou não numérico) é sinalizado, nunca calculado como se fosse zero
 *   silenciosamente — a tela decide como exibir isso ao usuário.
 */
export function validarPeriodos(periodos: Periodo[]): CampoInvalido[] {
  const problemas: CampoInvalido[] = []
  for (const p of periodos) {
    const campos: Array<[keyof Omit<Periodo, 'mes'>, number]> = [
      ['receitas', p.receitas],
      ['despesas', p.despesas],
      ['investimentos', p.investimentos],
      ['tributos', p.tributos],
      ['residual', p.residual],
    ]
    for (const [campo, valor] of campos) {
      if (Number.isNaN(valor)) {
        problemas.push({ mes: p.mes, campo, motivo: 'Campo obrigatório vazio ou inválido.' })
      } else if (valor < 0) {
        problemas.push({
          mes: p.mes,
          campo,
          motivo: 'Não deve ser negativo — o sinal já é aplicado no cálculo.',
        })
      }
    }
  }
  return problemas
}

/** Converte os valores em string da UI (PeriodoInput) para números, com NaN para campo vazio. */
export function paraNumero(valor: string): number {
  if (valor.trim() === '') return NaN
  const n = Number(valor.replace(',', '.'))
  return n
}
