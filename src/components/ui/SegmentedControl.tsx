import clsx from 'clsx'
import { useRef, type KeyboardEvent, type ReactNode } from 'react'

export interface Segmento<T extends string> {
  valor: T
  rotulo: ReactNode
  /** Nome acessível quando o rótulo visual é só um ícone. */
  ariaLabel?: string
  indicador?: ReactNode
}

/**
 * Grupo de opções mutuamente exclusivas (radiogroup), com setas para
 * alternar — padrão de teclado de um controle segmentado nativo.
 */
export function SegmentedControl<T extends string>({
  valor,
  onChange,
  opcoes,
  rotulo,
  tamanho = 'md',
  className,
  cheio,
}: {
  valor: T
  onChange(v: T): void
  opcoes: ReadonlyArray<Segmento<T>>
  rotulo: string
  tamanho?: 'sm' | 'md'
  className?: string
  cheio?: boolean
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  function onKeyDown(e: KeyboardEvent, i: number) {
    const passo = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!passo) return
    e.preventDefault()
    const proximo = (i + passo + opcoes.length) % opcoes.length
    onChange(opcoes[proximo].valor)
    refs.current[proximo]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={rotulo}
      className={clsx(
        'inline-flex items-center gap-0.5 rounded-[10px] bg-hover p-0.5 ring-1 ring-line ring-inset',
        cheio && 'flex w-full',
        className,
      )}
    >
      {opcoes.map((o, i) => {
        const ativo = o.valor === valor
        return (
          <button
            key={o.valor}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            role="radio"
            aria-checked={ativo}
            aria-label={o.ariaLabel}
            tabIndex={ativo ? 0 : -1}
            onClick={() => onChange(o.valor)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={clsx(
              'focus-ring relative inline-flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap',
              'transition-[background-color,color,box-shadow] duration-150',
              tamanho === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-[13px]',
              cheio && 'flex-1',
              ativo
                ? 'bg-elevated text-fg shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_var(--border)]'
                : 'text-fg-2 hover:text-fg',
            )}
          >
            {o.rotulo}
            {o.indicador}
          </button>
        )
      })}
    </div>
  )
}
