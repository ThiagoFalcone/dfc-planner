import { useId } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import type { IndicadoresFluxoCaixa, ResultadoPeriodo } from '@/types'
import { formatarMoedaCurta, rotuloMes } from '@/lib/formato'
import { Icon } from '@/components/ui/Icon'
import { useChartTheme, type ChartTheme } from './useChartTheme'
import { ChartTooltipFrame, dominioComFolga, eixoX, eixoY, TooltipLinha } from './chartUtils'

interface Ponto extends ResultadoPeriodo {
  descontado?: number
}

interface Marcos {
  mesDeficit: number | null
  mesRecuperacao: number | null
}

function TooltipAcumulado({ active, payload, marcos }: TooltipContentProps & { marcos: Marcos }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as Ponto
  const emDeficit = d.acumulado < -0.005
  return (
    <ChartTooltipFrame titulo={rotuloMes(d.mes)}>
      <TooltipLinha rotulo="Acumulado" valor={formatarMoedaCurta(d.acumulado)} enfase />
      <TooltipLinha rotulo="Fluxo do mês" valor={formatarMoedaCurta(d.fluxo)} />
      {d.descontado !== undefined && (
        <TooltipLinha rotulo="Acumulado descontado" valor={formatarMoedaCurta(d.descontado)} />
      )}
      <p className={`mt-1 inline-flex items-center gap-1 ${emDeficit ? 'text-negative' : 'text-positive'}`}>
        <Icon nome={emDeficit ? 'alerta' : 'check'} className="h-3.5 w-3.5" />
        {emDeficit ? 'Em déficit' : 'Zona saudável'}
      </p>
      {d.mes === marcos.mesDeficit && <p className="text-fg-2">Ponto de maior exposição</p>}
      {d.mes === marcos.mesRecuperacao && <p className="text-fg-2">Mês de recuperação</p>}
    </ChartTooltipFrame>
  )
}

function Rotulo({
  x,
  y,
  linhas,
  ancora,
  t,
}: {
  x: number
  y: number
  linhas: [string, string]
  ancora: 'start' | 'end'
  t: ChartTheme
}) {
  return (
    <text x={x} y={y} textAnchor={ancora} className="tabular" style={{ paintOrder: 'stroke' }} stroke={t.surface} strokeWidth={4} strokeLinejoin="round">
      <tspan x={x} fontSize={11} fill={t.textSecondary}>
        {linhas[0]}
      </tspan>
      <tspan x={x} dy={14} fontSize={12} fontWeight={600} fill={t.textPrimary}>
        {linhas[1]}
      </tspan>
    </text>
  )
}

/**
 * Fluxo acumulado: o gráfico central do produto. Mostra linha zero, zona de
 * déficit, maior déficit, mês de recuperação e saldo final, de modo que a
 * situação financeira seja legível sem consultar a tabela.
 */
export function AccumulatedChart({
  resultados,
  indicadores,
  descontado,
  altura = 'h-72 sm:h-80',
}: {
  resultados: ResultadoPeriodo[]
  indicadores: IndicadoresFluxoCaixa
  /** Série do acumulado descontado pela TMA (análise complementar), desenhada tracejada. */
  descontado?: ResultadoPeriodo[]
  altura?: string
}) {
  const t = useChartTheme()
  const uid = useId().replace(/:/g, '')
  const valores = resultados.map((r) => r.acumulado)
  const max = Math.max(...valores)
  const min = Math.min(...valores)
  // Ponto do gradiente onde a curva cruza o zero (acima: positivo; abaixo: negativo).
  const corte = max <= 0 ? 0 : min >= 0 ? 1 : max / (max - min)
  const dados: Ponto[] = resultados.map((r) => ({
    ...r,
    descontado: descontado?.find((d) => d.mes === r.mes)?.acumulado,
  }))
  const { dominio, ticks } = dominioComFolga([...valores, ...(descontado ?? []).map((d) => d.acumulado)], 0.26, 0.2)

  const ultimo = resultados[resultados.length - 1]
  const primeiroMes = resultados[0]?.mes ?? 0
  const pontoDeficit = indicadores.houveDeficit
    ? resultados.find((r) => r.mes === indicadores.mesMaiorDeficit)
    : undefined
  const mesRecuperacao = indicadores.mesRecuperacao
  const deficitEhUltimo = pontoDeficit?.mes === ultimo?.mes
  const deficitNaDireita = pontoDeficit ? pontoDeficit.mes - primeiroMes > (ultimo.mes - primeiroMes) * 0.6 : false

  const marcos: Marcos = { mesDeficit: pontoDeficit?.mes ?? null, mesRecuperacao }

  return (
    <figure className="m-0">
      <div className={`${altura} w-full`} role="img" aria-label={descrever(resultados, indicadores)}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={dados} margin={{ top: 20, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`linha-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset={corte} stopColor={t.positive} />
                <stop offset={corte} stopColor={t.negative} />
              </linearGradient>
              <linearGradient id={`area-${uid}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset={0} stopColor={t.positive} stopOpacity={0.16} />
                <stop offset={corte} stopColor={t.positive} stopOpacity={0.04} />
                <stop offset={corte} stopColor={t.negative} stopOpacity={0.04} />
                <stop offset={1} stopColor={t.negative} stopOpacity={0.16} />
              </linearGradient>
            </defs>

            {min < 0 && (
              <ReferenceArea
                y1={dominio[0]}
                y2={0}
                fill={t.deficitZone}
                fillOpacity={1}
                stroke="none"
                ifOverflow="visible"
                label={{ value: 'Zona de déficit', position: 'insideBottomLeft', fill: t.negative, fontSize: 11, offset: 8 }}
              />
            )}
            <CartesianGrid stroke={t.grid} vertical={false} />
            <XAxis {...eixoX(t.axis, t.baseline)} />
            <YAxis {...eixoY(t.axis)} domain={dominio} ticks={ticks} />
            <ReferenceLine
              y={0}
              stroke={t.baseline}
              strokeWidth={1.5}
              label={{ value: 'Zero', position: 'insideTopLeft', fill: t.axis, fontSize: 11, offset: 6 }}
            />

            {mesRecuperacao !== null && (
              <ReferenceLine
                x={mesRecuperacao}
                stroke={t.positive}
                strokeDasharray="3 4"
                strokeWidth={1.25}
                label={(props: { viewBox?: { x?: number; y?: number; height?: number } }) => {
                  const x = props.viewBox?.x ?? 0
                  const y = props.viewBox?.y ?? 0
                  const altura = props.viewBox?.height ?? 0
                  // No último mês o topo é do rótulo de saldo final; a recuperação desce para a base da linha.
                  const aEsquerda = mesRecuperacao === ultimo?.mes
                  return (
                    <Rotulo
                      x={aEsquerda ? x - 8 : x + 8}
                      y={aEsquerda ? y + altura - 26 : y + 12}
                      ancora={aEsquerda ? 'end' : 'start'}
                      linhas={['Recuperação', rotuloMes(mesRecuperacao)]}
                      t={t}
                    />
                  )
                }}
              />
            )}

            <Tooltip
              content={(props) => <TooltipAcumulado {...props} marcos={marcos} />}
              cursor={{ stroke: t.baseline, strokeWidth: 1 }}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="acumulado"
              baseValue={0}
              stroke="none"
              fill={`url(#area-${uid})`}
              isAnimationActive={t.animar}
              animationDuration={t.duracao}
              animationEasing="ease-out"
              activeDot={false}
              tooltipType="none"
            />
            <Line
              type="monotone"
              dataKey="acumulado"
              name="Acumulado"
              stroke={`url(#linha-${uid})`}
              strokeWidth={2.25}
              strokeLinecap="round"
              dot={false}
              activeDot={{ r: 5, fill: t.line, stroke: t.surface, strokeWidth: 2 }}
              isAnimationActive={t.animar}
              animationDuration={t.duracao}
              animationEasing="ease-out"
            />

            {descontado && (
              <Line
                type="monotone"
                dataKey="descontado"
                name="Acumulado descontado"
                stroke={t.discounted}
                strokeWidth={1.75}
                strokeDasharray="6 4"
                dot={false}
                activeDot={{ r: 4, fill: t.discounted, stroke: t.surface, strokeWidth: 2 }}
                isAnimationActive={t.animar}
                animationDuration={t.duracao}
              />
            )}

            {pontoDeficit && (
              <ReferenceDot
                x={pontoDeficit.mes}
                y={pontoDeficit.acumulado}
                ifOverflow="visible"
                shape={({ cx = 0, cy = 0 }) => (
                  <g>
                    <circle cx={cx} cy={cy} r={5.5} fill={t.negative} stroke={t.surface} strokeWidth={2} />
                    <Rotulo
                      x={deficitNaDireita ? cx - 10 : cx + 10}
                      y={cy + 16}
                      ancora={deficitNaDireita ? 'end' : 'start'}
                      linhas={['Maior déficit', `${formatarMoedaCurta(-indicadores.maiorDeficit)} · ${rotuloMes(pontoDeficit.mes)}`]}
                      t={t}
                    />
                  </g>
                )}
              />
            )}

            {ultimo && !deficitEhUltimo && (
              <ReferenceDot
                x={ultimo.mes}
                y={ultimo.acumulado}
                ifOverflow="visible"
                shape={({ cx = 0, cy = 0 }) => (
                  <g>
                    <circle cx={cx} cy={cy} r={4.5} fill={t.line} stroke={t.surface} strokeWidth={2} />
                    <Rotulo
                      x={cx - 8}
                      y={ultimo.acumulado >= 0 ? cy - 26 : cy + 16}
                      ancora="end"
                      linhas={['Saldo final', formatarMoedaCurta(ultimo.acumulado)]}
                      t={t}
                    />
                  </g>
                )}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </figure>
  )
}

function descrever(resultados: ResultadoPeriodo[], ind: IndicadoresFluxoCaixa): string {
  if (!resultados.length) return 'Gráfico de fluxo acumulado sem dados.'
  const partes = [`Fluxo acumulado do Mês ${resultados[0].mes} ao Mês ${resultados[resultados.length - 1].mes}.`]
  if (ind.houveDeficit && ind.mesMaiorDeficit !== null) {
    partes.push(`Maior déficit de ${formatarMoedaCurta(ind.maiorDeficit)} no Mês ${ind.mesMaiorDeficit}.`)
    partes.push(
      ind.mesRecuperacao !== null ? `Recuperação no Mês ${ind.mesRecuperacao}.` : 'Não recupera dentro do horizonte.',
    )
  } else {
    partes.push('Sem déficit no horizonte.')
  }
  partes.push(`Saldo final de ${formatarMoedaCurta(ind.saldoFinal)}.`)
  return partes.join(' ')
}
