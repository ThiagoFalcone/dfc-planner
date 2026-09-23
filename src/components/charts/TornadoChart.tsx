import { Bar, BarChart, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from 'recharts'
import type { LinhaTornado } from '@/lib/simulacao'
import { formatarMoedaCurta } from '@/lib/formato'
import { useChartTheme } from './useChartTheme'
import { ChartTooltipFrame, formatarEixoY, TooltipLinha } from './chartUtils'

interface Barra {
  rotulo: string
  base: number
  baixo: number
  alto: number
  largura: number
  comReducao: number
  comAumento: number
}

function Tip({ active, payload, t }: TooltipContentProps & { t: ReturnType<typeof useChartTheme> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as Barra
  return (
    <ChartTooltipFrame titulo={d.rotulo}>
      <TooltipLinha marcador={<span className="h-2 w-2 rounded-full" style={{ background: t.negative }} />} rotulo="Redução de 20%" valor={formatarMoedaCurta(d.comReducao)} />
      <TooltipLinha marcador={<span className="h-2 w-2 rounded-full" style={{ background: t.positive }} />} rotulo="Aumento de 20%" valor={formatarMoedaCurta(d.comAumento)} />
      <TooltipLinha rotulo="Valor base" valor={formatarMoedaCurta(d.base)} />
      {d.largura < 1 && <p className="mt-1 text-fg-3">Sem efeito nesta métrica: a variação ocorre depois do ponto que a determina.</p>}
    </ChartTooltipFrame>
  )
}

/** Rótulo do eixo Y: nome da premissa + "sem efeito" quando a variação não muda a métrica (ex.: receita após o pico de déficit). */
function TickCategoria({ x, y, payload, dados, t }: { x?: number | string; y?: number | string; payload?: { value: string }; dados: Barra[]; t: ReturnType<typeof useChartTheme> }) {
  const linha = dados.find((d) => d.rotulo === payload?.value)
  const semEfeito = (linha?.largura ?? 1) < 1
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fontSize={12} fill={t.textSecondary}>
      {payload?.value}
      {semEfeito && (
        <tspan dx={4} fontSize={10.5} fill={t.textSecondary} fillOpacity={0.7}>
          (sem efeito)
        </tspan>
      )}
    </text>
  )
}

/**
 * Tornado: para cada premissa, a barra vai do resultado com −20% ao
 * resultado com +20%, ordenadas pela maior amplitude: a leitura visual de
 * "o que mais mexe na decisão". Uma premissa pode ter amplitude zero para
 * uma métrica (ex.: receita não muda o capital necessário quando o maior
 * déficit ocorre antes de qualquer receita); isso é lido do cálculo, não
 * ocultado.
 */
export function TornadoChart({ linhas, metricaRotulo }: { linhas: LinhaTornado[]; metricaRotulo: string }) {
  const t = useChartTheme()
  if (linhas.length === 0) {
    return <p className="px-3 py-10 text-center text-[13px] text-fg-3">Nenhuma variável com valor no horizonte para testar.</p>
  }
  const dados: Barra[] = linhas.map((l) => {
    const baixo = Math.min(l.comReducao, l.comAumento)
    const alto = Math.max(l.comReducao, l.comAumento)
    return { rotulo: l.rotulo, base: l.base, baixo, alto, largura: alto - baixo, comReducao: l.comReducao, comAumento: l.comAumento }
  })
  const min = Math.min(...dados.map((d) => d.baixo), 0)
  const max = Math.max(...dados.map((d) => d.alto), 0)

  return (
    <div>
      <div className="w-full" style={{ height: 46 * dados.length + 40 }} role="img" aria-label={`Sensibilidade de ${metricaRotulo} a cada premissa, variando ±20%. ${dados.filter((d) => d.largura < 1).map((d) => d.rotulo).join(', ') || 'Nenhuma'} sem efeito nesta métrica.`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }} barCategoryGap="34%">
            <XAxis type="number" domain={[min, max]} tickFormatter={formatarEixoY} tick={{ fontSize: 11, fill: t.axis }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="rotulo" width={112} tick={(p) => <TickCategoria {...p} dados={dados} t={t} />} axisLine={false} tickLine={false} />
            <ReferenceLine x={0} stroke={t.baseline} />
            <Tooltip content={(p) => <Tip {...p} t={t} />} cursor={{ fill: t.range }} isAnimationActive={false} />
            <Bar dataKey="baixo" stackId="s" fill="transparent" isAnimationActive={false} />
            <Bar dataKey="largura" stackId="s" radius={[3, 3, 3, 3]} maxBarSize={22} isAnimationActive={t.animar} animationDuration={t.duracao}>
              {dados.map((d) => (
                <Cell
                  key={d.rotulo}
                  fill={d.largura < 1 ? 'transparent' : d.comReducao <= d.comAumento ? t.negative : t.positive}
                  fillOpacity={0.75}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-2">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: t.negative, opacity: 0.75 }} /> Piora com −20%
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: t.positive, opacity: 0.75 }} /> Melhora com −20%
        </span>
      </p>
    </div>
  )
}
