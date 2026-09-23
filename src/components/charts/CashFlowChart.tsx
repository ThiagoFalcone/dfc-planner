import { useId } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import type { ResultadoPeriodo } from '@/types'
import { formatarMoedaCurta, rotuloMes } from '@/lib/formato'
import { Icon } from '@/components/ui/Icon'
import { useChartTheme } from './useChartTheme'
import { ChartTooltipFrame, dominioComFolga, eixoX, eixoY, Swatch, TooltipLinha } from './chartUtils'

function TooltipFluxo({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as ResultadoPeriodo
  const negativo = d.fluxo < 0
  return (
    <ChartTooltipFrame titulo={rotuloMes(d.mes)}>
      <TooltipLinha rotulo="Fluxo líquido" valor={formatarMoedaCurta(d.fluxo)} enfase />
      <TooltipLinha rotulo="Acumulado" valor={formatarMoedaCurta(d.acumulado)} />
      <p className={`mt-1 inline-flex items-center gap-1 ${negativo ? 'text-negative' : 'text-positive'}`}>
        <Icon nome={negativo ? 'desce' : 'sobe'} className="h-3.5 w-3.5" />
        {negativo ? 'Saída líquida no mês' : d.fluxo === 0 ? 'Mês neutro' : 'Entrada líquida no mês'}
      </p>
    </ChartTooltipFrame>
  )
}

/**
 * Fluxo líquido mensal (RF06: azul positivo, vermelho negativo). Barras crescem da linha zero: posição (acima/abaixo),
 * hachura nas negativas e ícones ▲▼ no tooltip — a cor nunca é o único sinal.
 */
export function CashFlowChart({ resultados }: { resultados: ResultadoPeriodo[] }) {
  const t = useChartTheme()
  const idHachura = `hachura-${useId().replace(/:/g, '')}`
  const { dominio, ticks } = dominioComFolga(resultados.map((r) => r.fluxo), 0.08, 0.08)

  return (
    <figure className="m-0">
      <div className="h-60 w-full sm:h-64" role="img" aria-label={descreverFluxo(resultados)}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={resultados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
            <defs>
              <pattern id={idHachura} patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                <rect width="6" height="6" fill={t.negative} />
                <line x1="0" y1="0" x2="0" y2="6" stroke={t.surface} strokeOpacity="0.35" strokeWidth="2" />
              </pattern>
            </defs>
            <CartesianGrid stroke={t.grid} vertical={false} />
            <XAxis {...eixoX(t.axis, t.baseline)} />
            <YAxis {...eixoY(t.axis)} domain={dominio} ticks={ticks} />
            <ReferenceLine y={0} stroke={t.baseline} strokeWidth={1.25} ifOverflow="extendDomain" />
            <Tooltip
              content={(props) => <TooltipFluxo {...props} />}
              cursor={{ fill: t.range }}
              isAnimationActive={false}
            />
            <Bar
              dataKey="fluxo"
              name="Fluxo líquido"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
              isAnimationActive={t.animar}
              animationDuration={t.duracao}
              animationEasing="ease-out"
            >
              {resultados.map((r) => (
                <Cell key={r.mes} fill={r.fluxo < 0 ? `url(#${idHachura})` : t.inflow} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-2">
        <span className="inline-flex items-center gap-1.5">
          <Swatch cor={t.inflow} forma="barra" /> Entrada líquida (acima de zero)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg className="h-2.5 w-2.5" aria-hidden="true">
            <rect width="10" height="10" rx="2" fill={`url(#${idHachura})`} />
          </svg>
          Saída líquida (abaixo de zero)
        </span>
      </figcaption>
    </figure>
  )
}

function descreverFluxo(resultados: ResultadoPeriodo[]): string {
  const negativos = resultados.filter((r) => r.fluxo < 0).map((r) => r.mes)
  if (resultados.length === 0) return 'Gráfico de fluxo líquido sem dados.'
  return `Fluxo líquido por mês, do Mês ${resultados[0].mes} ao Mês ${resultados[resultados.length - 1].mes}. ${
    negativos.length ? `Fluxo negativo nos meses ${negativos.join(', ')}.` : 'Nenhum mês com fluxo negativo.'
  }`
}
