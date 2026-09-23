import clsx from 'clsx'

/** Controle deslizante com valor numérico visível, para os ajustes "e se". */
export function AdjustSlider({
  rotulo,
  valor,
  onChange,
  min = -60,
  max = 60,
  sufixo = '%',
}: {
  rotulo: string
  valor: number
  onChange(v: number): void
  min?: number
  max?: number
  sufixo?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-fg-2">{rotulo}</span>
        <span className={clsx('tabular text-[13px] font-semibold', valor === 0 ? 'text-fg-3' : valor > 0 ? 'text-positive' : 'text-negative')}>
          {valor > 0 ? '+' : ''}
          {valor}
          {sufixo}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={rotulo}
        aria-valuetext={`${valor > 0 ? '+' : ''}${valor}${sufixo}`}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line-strong accent-accent"
      />
    </div>
  )
}
