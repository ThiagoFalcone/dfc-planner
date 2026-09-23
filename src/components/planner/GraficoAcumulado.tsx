import {
  CartesianGrid,
  ComposedChart,
  Area,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { IndicadoresFluxoCaixa, ResultadoPeriodo } from '@/types'
import { formatarMoeda, formatarMoedaCompacta, rotuloMes } from '@/lib/formato'

const COR_POSITIVO = '#2a78d6'
const COR_NEGATIVO = '#e34948'
const COR_LINHA = '#0b0b0b'
const COR_GRID = '#e1e0d9'
const COR_EIXO = '#898781'
const COR_BASELINE = '#c3c2b7'

interface Ponto extends ResultadoPeriodo {
  positivo: number
  negativo: number
}

function TooltipAcumulado({ active, payload }: { active?: boolean; payload?: Array<{ payload: Ponto }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-ink-900">{rotuloMes(d.mes)}</p>
      <p className={d.acumulado < 0 ? 'text-negative' : 'text-positive'}>
        Acumulado: <span className="tabular font-medium">{formatarMoeda(d.acumulado)}</span>
      </p>
    </div>
  )
}

/** Gráfico do acumulado ao longo do horizonte, com a área abaixo de zero destacada em vermelho. */
export function GraficoAcumulado({
  resultados,
  indicadores,
}: {
  resultados: ResultadoPeriodo[]
  indicadores?: IndicadoresFluxoCaixa
}) {
  const dados: Ponto[] = resultados.map((r) => ({
    ...r,
    positivo: r.acumulado > 0 ? r.acumulado : 0,
    negativo: r.acumulado < 0 ? r.acumulado : 0,
  }))

  const pontoDeficit =
    indicadores?.houveDeficit && indicadores.mesMaiorDeficit !== null
      ? dados.find((d) => d.mes === indicadores.mesMaiorDeficit)
      : undefined
  const pontoRecuperacao =
    indicadores?.mesRecuperacao !== null && indicadores?.mesRecuperacao !== undefined
      ? dados.find((d) => d.mes === indicadores.mesRecuperacao)
      : undefined

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="acumuladoPositivo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COR_POSITIVO} stopOpacity={0.28} />
              <stop offset="100%" stopColor={COR_POSITIVO} stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="acumuladoNegativo" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor={COR_NEGATIVO} stopOpacity={0.28} />
              <stop offset="100%" stopColor={COR_NEGATIVO} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={COR_GRID} vertical={false} />
          <XAxis
            dataKey="mes"
            tickFormatter={(mes: number) => (mes === 0 ? '0' : String(mes))}
            tick={{ fontSize: 12, fill: COR_EIXO }}
            axisLine={{ stroke: COR_BASELINE }}
            tickLine={false}
            label={{ value: 'Mês', position: 'insideBottom', offset: -2, fontSize: 11, fill: COR_EIXO }}
          />
          <YAxis
            tickFormatter={(v: number) => formatarMoedaCompacta(v)}
            tick={{ fontSize: 11, fill: COR_EIXO }}
            axisLine={false}
            tickLine={false}
            width={72}
          />
          <ReferenceLine y={0} stroke={COR_BASELINE} />
          <Tooltip content={<TooltipAcumulado />} />
          <Area
            type="monotone"
            dataKey="positivo"
            stroke="none"
            fill="url(#acumuladoPositivo)"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="negativo"
            stroke="none"
            fill="url(#acumuladoNegativo)"
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="acumulado"
            stroke={COR_LINHA}
            strokeWidth={2}
            dot={{ r: 3, fill: COR_LINHA, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
          {pontoDeficit && (
            <ReferenceDot
              x={pontoDeficit.mes}
              y={pontoDeficit.acumulado}
              r={5}
              fill={COR_NEGATIVO}
              stroke="#fff"
              strokeWidth={2}
            />
          )}
          {pontoRecuperacao && (
            <ReferenceDot
              x={pontoRecuperacao.mes}
              y={pontoRecuperacao.acumulado}
              r={5}
              fill={COR_POSITIVO}
              stroke="#fff"
              strokeWidth={2}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-ink-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: COR_NEGATIVO }} /> Maior déficit
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: COR_POSITIVO }} /> Mês de recuperação
        </span>
      </div>
    </div>
  )
}
