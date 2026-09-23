import type { IndicadoresFluxoCaixa, Periodo, ResultadoPeriodo } from '@/types'
import { formatarMoedaCurta, rotuloMes } from './formato'
import { limiarAumentoDespesaSemRecuperacao, limiarQuedaReceitaSemRecuperacao } from './sensibilidade'

/**
 * Insights financeiros determinísticos. Nenhum texto aqui é gerado por IA:
 * cada insight é uma regra explícita sobre os indicadores de calculos.ts e
 * a análise de sensibilidade de sensibilidade.ts. A `regra` acompanha o
 * insight na interface para que qualquer pessoa confira de onde ele vem.
 */

export type TipoInsight = 'exposicao' | 'liquidez' | 'recuperacao' | 'sensibilidade' | 'cenarios' | 'saldo'
export type TomInsight = 'positivo' | 'negativo' | 'atencao' | 'neutro'

export interface Insight {
  id: string
  tipo: TipoInsight
  tom: TomInsight
  titulo: string
  texto: string
  regra: string
}

export interface EntradaInsights {
  nomeCenario: string
  periodos: Periodo[]
  resultados: ResultadoPeriodo[]
  indicadores: IndicadoresFluxoCaixa
  /** Outros cenários válidos, para a leitura comparativa. */
  outros: ReadonlyArray<{ nome: string; indicadores: IndicadoresFluxoCaixa }>
}

export function gerarInsights({ nomeCenario, periodos, resultados, indicadores, outros }: EntradaInsights): Insight[] {
  const insights: Insight[] = []
  const ultimoMes = resultados.length ? resultados[resultados.length - 1].mes : 0

  if (!indicadores.houveDeficit) {
    insights.push({
      id: 'sem-deficit',
      tipo: 'exposicao',
      tom: 'positivo',
      titulo: 'Sem exposição',
      texto: `O fluxo acumulado não fica negativo em nenhum mês entre o Mês 0 e o ${rotuloMes(ultimoMes)}. Não há necessidade de capital adicional com estas premissas.`,
      regra: 'Nenhum valor do fluxo acumulado é menor que zero (tolerância de R$ 0,01).',
    })
  } else {
    insights.push({
      id: 'exposicao',
      tipo: 'exposicao',
      tom: 'negativo',
      titulo: 'Maior exposição',
      texto: `O maior déficit acumulado ocorre no ${rotuloMes(indicadores.mesMaiorDeficit ?? 0)}, atingindo ${formatarMoedaCurta(indicadores.maiorDeficit)}.`,
      regra: 'Menor valor da série de fluxo acumulado.',
    })
    insights.push({
      id: 'liquidez',
      tipo: 'liquidez',
      tom: 'atencao',
      titulo: 'Liquidez',
      texto: `O projeto necessita de pelo menos ${formatarMoedaCurta(indicadores.necessidadeCapital)} para cobrir o ponto de maior exposição financeira.`,
      regra: 'Necessidade de capital = max(0, −mínimo do acumulado). Não inclui reserva de segurança.',
    })

    if (indicadores.mesRecuperacao !== null) {
      const mesesEmDeficit = resultados.filter((r) => r.acumulado < -0.01).length
      insights.push({
        id: 'recuperacao',
        tipo: 'recuperacao',
        tom: indicadores.reincideNegativoAposRecuperacao ? 'atencao' : 'positivo',
        titulo: 'Recuperação',
        texto: indicadores.reincideNegativoAposRecuperacao
          ? `O fluxo acumulado volta a um valor não negativo no ${rotuloMes(indicadores.mesRecuperacao)}, mas fica negativo de novo depois disso.`
          : `O fluxo acumulado retorna a valor não negativo no ${rotuloMes(indicadores.mesRecuperacao)}, após ${mesesEmDeficit} ${mesesEmDeficit === 1 ? 'mês' : 'meses'} em déficit.`,
        regra: 'Primeiro mês, depois do primeiro acumulado negativo, em que o acumulado é ≥ 0.',
      })
    } else {
      insights.push({
        id: 'sem-recuperacao',
        tipo: 'recuperacao',
        tom: 'negativo',
        titulo: 'Recuperação',
        texto: `O déficit não é recuperado até o ${rotuloMes(ultimoMes)}. O horizonte informado não basta para o acumulado voltar a zero.`,
        regra: 'Nenhum mês posterior ao primeiro déficit tem acumulado ≥ 0.',
      })
    }

    const quedaReceita = limiarQuedaReceitaSemRecuperacao(periodos)
    const aumentoDespesa = limiarAumentoDespesaSemRecuperacao(periodos)
    if (quedaReceita !== null && quedaReceita > 0) {
      const complementoDespesa =
        aumentoDespesa !== null && aumentoDespesa > 0
          ? ` Um aumento de cerca de ${aumentoDespesa}% nas despesas mensais teria o mesmo efeito.`
          : ''
      insights.push({
        id: 'sensibilidade',
        tipo: 'sensibilidade',
        tom: quedaReceita <= 15 ? 'atencao' : 'neutro',
        titulo: 'Sensibilidade',
        texto: `Uma queda de aproximadamente ${quedaReceita}% nas receitas de todos os meses já impediria a recuperação dentro do horizonte.${complementoDespesa}`,
        regra: 'Varia uma premissa por vez em passos de 1% e recalcula até a recuperação deixar de ocorrer.',
      })
    }
  }

  insights.push({
    id: 'saldo',
    tipo: 'saldo',
    tom: indicadores.saldoFinal >= 0 ? 'positivo' : 'negativo',
    titulo: 'Saldo final',
    texto: `Ao fim do ${rotuloMes(ultimoMes)}, o saldo acumulado de "${nomeCenario}" é ${formatarMoedaCurta(indicadores.saldoFinal)}.`,
    regra: 'Valor do fluxo acumulado no último mês do horizonte.',
  })

  const semRecuperacao = outros.filter((o) => o.indicadores.houveDeficit && o.indicadores.mesRecuperacao === null)
  for (const o of semRecuperacao) {
    insights.push({
      id: `cenario-${o.nome}`,
      tipo: 'cenarios',
      tom: 'atencao',
      titulo: 'Outros cenários',
      texto: `No cenário ${o.nome.toLowerCase()}, o projeto não recupera o déficit dentro do horizonte analisado.`,
      regra: 'Mesma regra de recuperação, aplicada a cada cenário válido.',
    })
  }

  return insights
}
