import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatarMoeda, formatarMoedaCompacta, rotuloMes } from '@/lib/formato'
import type { CenarioComputado } from '@/hooks/usePlanner'

// Ordem categórica fixa (não muda com o cenário selecionado).
const CORES: Record<string, string> = {
  base: '#2a78d6',
  pessimista: '#eb6834',
  otimista: '#1baf7a',
}
const COR_GRID = '#e1e0d9'
const COR_EIXO = '#898781'
const COR_BASELINE = '#c3c2b7'

interface LinhaTooltip {
  color?: string
  name?: string
  value?: number
}

function TooltipComparacao({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: LinhaTooltip[]
  label?: number
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-ink-900">{rotuloMes(label ?? 0)}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-ink-600">{p.name}:</span>
          <span className="tabular font-medium text-ink-900">{formatarMoeda(p.value ?? 0)}</span>
        </p>
      ))}
    </div>
  )
}

export function GraficoComparacaoCenarios({ cenarios }: { cenarios: CenarioComputado[] }) {
  const meses = Array.from(
    new Set(cenarios.flatMap((c) => c.resultados.map((r) => r.mes))),
  ).sort((a, b) => a - b)

  const dados = meses.map((mes) => {
    const linha: Record<string, number | undefined> & { mes: number } = { mes }
    for (const c of cenarios) {
      const r = c.resultados.find((res) => res.mes === mes)
      linha[c.editavel.id] = r?.acumulado
    }
    return linha
  })

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          <Tooltip content={<TooltipComparacao />} />
          <Legend
            verticalAlign="top"
            height={28}
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span className="text-xs text-ink-600">{value}</span>}
          />
          {cenarios.map((c) => (
            <Line
              key={c.editavel.id}
              type="monotone"
              dataKey={c.editavel.id}
              name={c.editavel.nome}
              stroke={CORES[c.editavel.id] ?? '#4a3aa7'}
              strokeWidth={2}
              dot={{ r: 2.5 }}
              activeDot={{ r: 5 }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
