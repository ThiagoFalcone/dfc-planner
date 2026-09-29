import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import type { CenarioComputado } from '@/hooks/usePlanner'
import { nomeCurto } from '@/domain/scenario/types'
import { formatarMoedaCurta, rotuloMes } from '@/lib/formato'
import { corDaSerie, useChartTheme, type ChartTheme } from './useChartTheme'
import { ChartTooltipFrame, dominioComFolga, eixoX, eixoY, Swatch, TooltipLinha } from './chartUtils'

type Linha = { mes: number; faixa: [number, number] | null } & Record<string, number | [number, number] | null | undefined>


function TooltipCenarios({
  active,
  payload,
  label,
  cenarios,
  t,
}: TooltipContentProps & { cenarios: CenarioComputado[]; t: ChartTheme }) {
  if (!active || !payload?.length) return null
  const linha = payload[0].payload as Linha
  const faixa = linha.faixa
  return (
    <ChartTooltipFrame titulo={rotuloMes(Number(label ?? linha.mes))}>
      {cenarios.map((c) => {
        const v = linha[c.editavel.id]
        return (
          <TooltipLinha
            key={c.editavel.id}
            marcador={<Swatch cor={corDaSerie(t, c.editavel.cor)} forma="linha" />}
            rotulo={nomeCurto(c.editavel.nome)}
            valor={typeof v === 'number' ? formatarMoedaCurta(v) : '—'}
          />
        )
      })}
      {faixa && (
        <div className="mt-1 border-t border-line pt-1.5">
          <TooltipLinha rotulo="Divergência" valor={formatarMoedaCurta(faixa[1] - faixa[0])} />
        </div>
      )}
    </ChartTooltipFrame>
  )
}

/**
 * Acumulado dos três cenários sobre um mesmo eixo. A faixa sombreada é a
 * divergência (maior − menor acumulado) em cada mês. Cor segue o cenário,
 * nunca a posição; destacar um cenário só atenua os demais.
 */
export function ScenarioComparisonChart({
  cenarios,
  destaque,
}: {
  cenarios: CenarioComputado[]
  destaque: string | null
}) {
  const t = useChartTheme()
  const meses = Array.from(new Set(cenarios.flatMap((c) => c.resultados.map((r) => r.mes)))).sort((a, b) => a - b)

  const dados: Linha[] = meses.map((mes) => {
    const linha: Linha = { mes, faixa: null }
    const valores: number[] = []
    for (const c of cenarios) {
      const r = c.resultados.find((res) => res.mes === mes)
      linha[c.editavel.id] = r?.acumulado
      if (r) valores.push(r.acumulado)
    }
    linha.faixa = valores.length > 1 ? [Math.min(...valores), Math.max(...valores)] : null
    return linha
  })

  const { dominio, ticks } = dominioComFolga(
    cenarios.flatMap((c) => c.resultados.map((r) => r.acumulado)),
    0.1,
    0.12,
  )

  return (
    <figure className="m-0">
      <div className="h-72 w-full sm:h-80" role="img" aria-label={descrever(cenarios)}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dados} margin={{ top: 12, right: 96, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={t.grid} vertical={false} />
            <XAxis {...eixoX(t.axis, t.baseline)} />
            <YAxis {...eixoY(t.axis)} domain={dominio} ticks={ticks} />
            <ReferenceLine y={0} stroke={t.baseline} strokeWidth={1.5} />
            <Tooltip
              content={(props) => <TooltipCenarios {...props} cenarios={cenarios} t={t} />}
              cursor={{ stroke: t.baseline, strokeWidth: 1 }}
              isAnimationActive={false}
            />
            <Area
              dataKey="faixa"
              stroke="none"
              fill={t.range}
              fillOpacity={1}
              isAnimationActive={t.animar}
              animationDuration={t.duracao}
              activeDot={false}
              tooltipType="none"
              type="monotone"
            />
            {cenarios.map((c) => {
              const id = c.editavel.id
              const atenuado = destaque !== null && destaque !== id
              return (
                <Line
                  key={id}
                  type="monotone"
                  dataKey={id}
                  name={nomeCurto(c.editavel.nome)}
                  stroke={corDaSerie(t, c.editavel.cor)}
                  strokeOpacity={atenuado ? 0.25 : 1}
                  strokeWidth={destaque === id ? 2.75 : 2}
                  dot={false}
                  activeDot={atenuado ? false : { r: 4.5, stroke: t.surface, strokeWidth: 2 }}
                  connectNulls
                  isAnimationActive={t.animar}
                  animationDuration={t.duracao}
                  animationEasing="ease-out"
                />
              )
            })}
            {rotulosFinais(cenarios, dominio).map(({ c, x, y, yRotulo }) => {
              const cor = corDaSerie(t, c.editavel.cor)
              const atenuado = destaque !== null && destaque !== c.editavel.id
              return [
                <ReferenceDot
                  key={`ponto-${c.editavel.id}`}
                  x={x}
                  y={y}
                  ifOverflow="visible"
                  shape={({ cx = 0, cy = 0 }) => (
                    <circle cx={cx} cy={cy} r={4} fill={cor} stroke={t.surface} strokeWidth={2} opacity={atenuado ? 0.35 : 1} />
                  )}
                />,
                <ReferenceDot
                  key={`rotulo-${c.editavel.id}`}
                  x={x}
                  y={yRotulo}
                  ifOverflow="visible"
                  shape={({ cx = 0, cy = 0 }) => (
                    <text x={cx + 10} y={cy + 4} fontSize={11.5} fontWeight={500} fill={t.textPrimary} opacity={atenuado ? 0.45 : 1}>
                      {nomeCurto(c.editavel.nome)}
                    </text>
                  )}
                />,
              ]
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-2">
        {cenarios.map((c) => (
          <span key={c.editavel.id} className="inline-flex items-center gap-1.5">
            <Swatch cor={corDaSerie(t, c.editavel.cor)} forma="linha" />
            {nomeCurto(c.editavel.nome)}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2.5 w-3 rounded-[3px]" style={{ background: t.range }} />
          Divergência entre cenários
        </span>
      </figcaption>
    </figure>
  )
}

/**
 * Rótulos diretos no fim de cada curva. Quando os saldos finais ficam
 * próximos, os rótulos são afastados verticalmente (em unidades do eixo,
 * estimando ~260 px de altura útil) para não se sobreporem.
 */
function rotulosFinais(cenarios: CenarioComputado[], dominio: [number, number]) {
  const separacaoMinima = (Math.abs(dominio[1] - dominio[0]) * 15) / 260
  const itens = cenarios
    .filter((c) => c.resultados.length > 0)
    .map((c) => {
      const fim = c.resultados[c.resultados.length - 1]
      return { c, x: fim.mes, y: fim.acumulado, yRotulo: fim.acumulado }
    })
    .sort((a, b) => b.y - a.y)
  for (let i = 1; i < itens.length; i++) {
    const limite = itens[i - 1].yRotulo - separacaoMinima
    if (itens[i].yRotulo > limite) itens[i].yRotulo = limite
  }
  return itens
}

function descrever(cenarios: CenarioComputado[]): string {
  return `Fluxo acumulado por cenário. ${cenarios
    .map((c) => `${nomeCurto(c.editavel.nome)}: saldo final ${formatarMoedaCurta(c.indicadores?.saldoFinal ?? 0)}`)
    .join('; ')}.`
}
