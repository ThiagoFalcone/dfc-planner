import type { ReactNode } from 'react'

/**
 * Domínio do eixo Y com folga e passos "redondos", incluindo sempre o zero.
 * A folga abre espaço para os rótulos de maior déficit e saldo final.
 */
export function dominioComFolga(valores: number[], folgaInferior = 0.18, folgaSuperior = 0.12): {
  dominio: [number, number]
  ticks: number[]
} {
  const min = Math.min(0, ...valores)
  const max = Math.max(0, ...valores)
  const amplitude = max - min || 1
  const baixo = min - (min < 0 ? amplitude * folgaInferior : 0)
  const alto = max + (max > 0 ? amplitude * folgaSuperior : amplitude * 0.05)
  const passoBruto = (alto - baixo) / 5
  const magnitude = Math.pow(10, Math.floor(Math.log10(passoBruto)))
  const passo = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((p) => p >= passoBruto) ?? passoBruto
  const inicio = Math.floor(baixo / passo) * passo
  const fim = Math.ceil(alto / passo) * passo
  const ticks: number[] = []
  for (let v = inicio; v <= fim + passo / 2; v += passo) ticks.push(Math.round(v))
  return { dominio: [inicio, fim], ticks }
}

/** Ticks curtos ("−20 mil"); a unidade R$ fica no subtítulo/tooltip para o eixo não quebrar linha. */
export function formatarEixoY(v: number): string {
  if (v === 0) return '0'
  const abs = Math.abs(v)
  const sinal = v < 0 ? '−' : ''
  if (abs >= 1_000_000) return `${sinal}${(abs / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`
  if (abs >= 1_000) return `${sinal}${(abs / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`
  return `${sinal}${abs.toLocaleString('pt-BR')}`
}

export const eixoX = (cor: string, baseline: string) => ({
  dataKey: 'mes',
  tickFormatter: (mes: number) => `M${mes}`,
  tick: { fontSize: 11, fill: cor },
  axisLine: { stroke: baseline },
  tickLine: false,
  tickMargin: 8,
})

export const eixoY = (cor: string) => ({
  tickFormatter: formatarEixoY,
  tick: { fontSize: 11, fill: cor },
  axisLine: false,
  tickLine: false,
  width: 56,
})

/** Contêiner de tooltip: vidro de popover, com texto em tokens de texto (nunca na cor da série). */
export function ChartTooltipFrame({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="glass-strong min-w-44 rounded-xl px-3 py-2.5 text-xs">
      <p className="mb-1.5 font-semibold text-fg">{titulo}</p>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}

export function TooltipLinha({
  marcador,
  rotulo,
  valor,
  enfase,
}: {
  marcador?: ReactNode
  rotulo: string
  valor: ReactNode
  enfase?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      {marcador}
      <span className="flex-1 text-fg-2">{rotulo}</span>
      <span className={enfase ? 'tabular font-semibold text-fg' : 'tabular font-medium text-fg'}>{valor}</span>
    </div>
  )
}

export function Swatch({ cor, forma = 'ponto' }: { cor: string; forma?: 'ponto' | 'barra' | 'linha' }) {
  const classe = forma === 'linha' ? 'h-0.5 w-3 rounded-full' : forma === 'barra' ? 'h-2.5 w-2.5 rounded-[3px]' : 'h-2 w-2 rounded-full'
  return <span aria-hidden="true" className={`inline-block shrink-0 ${classe}`} style={{ background: cor }} />
}
