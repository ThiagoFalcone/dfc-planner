import clsx from 'clsx'
import type { ReactNode } from 'react'
import type { IndicadoresFluxoCaixa, ResultadoPeriodo } from '@/types'
import { rotuloMes } from '@/lib/formato'
import { MoneyValue } from './MoneyValue'

/** Linha do acumulado em miniatura (SVG puro), com a linha zero. */
function Sparkline({ resultados }: { resultados: ResultadoPeriodo[] }) {
  if (resultados.length < 2) return null
  const largura = 132
  const altura = 36
  const valores = resultados.map((r) => r.acumulado)
  const min = Math.min(0, ...valores)
  const max = Math.max(0, ...valores)
  const amplitude = max - min || 1
  const x = (i: number) => (i / (valores.length - 1)) * (largura - 6) + 3
  const y = (v: number) => altura - 3 - ((v - min) / amplitude) * (altura - 6)
  const pontos = valores.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const iMin = valores.indexOf(Math.min(...valores))
  return (
    <svg width={largura} height={altura} viewBox={`0 0 ${largura} ${altura}`} aria-hidden="true" className="shrink-0">
      <line x1={0} x2={largura} y1={y(0)} y2={y(0)} stroke="var(--chart-baseline)" strokeWidth={1} />
      <polyline points={pontos} fill="none" stroke="var(--chart-line)" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      {valores[iMin] < 0 && <circle cx={x(iMin)} cy={y(valores[iMin])} r={3} fill="var(--chart-negative)" stroke="var(--surface)" strokeWidth={1.5} />}
      <circle cx={x(valores.length - 1)} cy={y(valores[valores.length - 1])} r={2.5} fill="var(--chart-line)" />
    </svg>
  )
}

function Metrica({ rotulo, children, className }: { rotulo: string; children: ReactNode; className?: string }) {
  return (
    <div className={clsx('flex min-w-0 flex-col gap-0.5', className)}>
      <dt className="text-[11px] text-fg-3">{rotulo}</dt>
      <dd className="truncate text-[15px] font-semibold tracking-[-0.01em]">{children}</dd>
    </div>
  )
}

/** Indicadores que acompanham a edição da planilha em tempo real. */
export function LiveSummary({
  indicadores,
  resultados,
}: {
  indicadores: IndicadoresFluxoCaixa | null
  resultados: ResultadoPeriodo[]
}) {
  if (!indicadores) {
    return (
      <div className="flex h-[62px] items-center rounded-[18px] border border-dashed border-line-strong px-4 text-[13px] text-fg-3">
        Os indicadores voltam assim que os valores pendentes forem corrigidos.
      </div>
    )
  }
  return (
    <div className="flex items-center gap-6 overflow-x-auto rounded-[18px] border border-line bg-surface px-4 py-3" aria-live="polite">
      <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        <Metrica rotulo="Capital necessário">
          <MoneyValue valor={indicadores.necessidadeCapital} tom={indicadores.necessidadeCapital > 0 ? 'atencao' : 'positivo'} />
        </Metrica>
        <Metrica rotulo="Maior déficit">
          {indicadores.houveDeficit ? (
            <>
              <MoneyValue valor={-indicadores.maiorDeficit} tom="negativo" />
              <span className="ml-1.5 text-xs font-normal text-fg-3">{rotuloMes(indicadores.mesMaiorDeficit ?? 0)}</span>
            </>
          ) : (
            <span className="text-fg-3">Nenhum</span>
          )}
        </Metrica>
        <Metrica rotulo="Recuperação">
          {!indicadores.houveDeficit ? (
            <span className="text-fg-3">—</span>
          ) : indicadores.mesRecuperacao !== null ? (
            <span className="text-positive">{rotuloMes(indicadores.mesRecuperacao)}</span>
          ) : (
            <span className="text-negative">Não recupera</span>
          )}
        </Metrica>
        <Metrica rotulo="Saldo final">
          <MoneyValue valor={indicadores.saldoFinal} tom="auto" />
        </Metrica>
      </dl>
      <div className="hidden md:block" title="Fluxo acumulado">
        <Sparkline resultados={resultados} />
      </div>
    </div>
  )
}
