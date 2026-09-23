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
} from 'recharts'
import type { ResultadoPeriodo } from '@/types'
import { formatarMoeda, formatarMoedaCompacta, rotuloMes } from '@/lib/formato'

const COR_POSITIVO = '#2a78d6'
const COR_NEGATIVO = '#e34948'
const COR_GRID = '#e1e0d9'
const COR_EIXO = '#898781'
const COR_BASELINE = '#c3c2b7'

function TooltipFluxo({ active, payload }: { active?: boolean; payload?: Array<{ payload: ResultadoPeriodo }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-ink-900">{rotuloMes(d.mes)}</p>
      <p className={d.fluxo < 0 ? 'text-negative' : 'text-ink-700'}>
        Fluxo do mês: <span className="tabular font-medium">{formatarMoeda(d.fluxo)}</span>
      </p>
    </div>
  )
}

/** Diagrama de fluxo de caixa: barra por mês, azul para fluxo positivo e vermelho para negativo. */
export function GraficoFluxo({ resultados }: { resultados: ResultadoPeriodo[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={resultados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="28%">
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
          <Tooltip content={<TooltipFluxo />} cursor={{ fill: 'rgba(11,11,11,0.04)' }} />
          <Bar dataKey="fluxo" radius={[4, 4, 4, 4]} maxBarSize={40}>
            {resultados.map((r) => (
              <Cell key={r.mes} fill={r.fluxo < 0 ? COR_NEGATIVO : COR_POSITIVO} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-1 flex items-center gap-4 text-xs text-ink-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COR_POSITIVO }} /> Fluxo positivo
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COR_NEGATIVO }} /> Fluxo negativo
        </span>
      </div>
    </div>
  )
}
