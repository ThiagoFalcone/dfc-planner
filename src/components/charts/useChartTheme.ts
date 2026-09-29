import { createContext, useContext, useMemo } from 'react'
import { useTheme } from '@/theme/ThemeContext'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export interface ChartTheme {
  tema: 'light' | 'dark'
  positive: string
  negative: string
  /** Barras de fluxo positivo (azul, RF06). */
  inflow: string
  discounted: string
  line: string
  grid: string
  baseline: string
  axis: string
  surface: string
  deficitZone: string
  range: string
  textPrimary: string
  textSecondary: string
  /** Cores de cenário por posição fixa 1–6 (índice 0 não usado). */
  series: string[]
  animar: boolean
  duracao: number
}

/** Relatório impresso: força tema claro e desliga animação nos gráficos abaixo dele. */
export const ChartModoImpressao = createContext(false)

let sonda: HTMLDivElement | null = null
function elementoClaro(): HTMLElement {
  if (!sonda) {
    sonda = document.createElement('div')
    sonda.className = 'tema-claro'
    sonda.hidden = true
    document.body.appendChild(sonda)
  }
  return sonda
}

function lerVar(estilo: CSSStyleDeclaration, nome: string): string {
  return estilo.getPropertyValue(nome).trim()
}

export function corDaSerie(t: ChartTheme, cor: number): string {
  return t.series[cor] ?? t.line
}

/**
 * Recharts recebe cores como atributos SVG; lemos os tokens CSS resolvidos
 * para o tema atual em vez de duplicar hex nos componentes de gráfico.
 */
export function useChartTheme(): ChartTheme {
  const { tema } = useTheme()
  const reduzido = useReducedMotion()
  const impressao = useContext(ChartModoImpressao)

  return useMemo(() => {
    const e = getComputedStyle(impressao ? elementoClaro() : document.documentElement)
    return {
      tema: impressao ? 'light' : tema,
      positive: lerVar(e, '--chart-positive'),
      negative: lerVar(e, '--chart-negative'),
      inflow: lerVar(e, '--chart-inflow'),
      discounted: lerVar(e, '--chart-discounted'),
      line: lerVar(e, '--chart-line'),
      grid: lerVar(e, '--chart-grid'),
      baseline: lerVar(e, '--chart-baseline'),
      axis: lerVar(e, '--chart-axis'),
      surface: lerVar(e, '--surface'),
      deficitZone: lerVar(e, '--chart-deficit-zone'),
      range: lerVar(e, '--chart-range'),
      textPrimary: lerVar(e, '--text-primary'),
      textSecondary: lerVar(e, '--text-secondary'),
      series: ['', 1, 2, 3, 4, 5, 6].map((n) => (n === '' ? '' : lerVar(e, `--series-${n}`))),
      animar: !reduzido && !impressao,
      duracao: 220,
    }
  }, [tema, reduzido, impressao])
}
