import clsx from 'clsx'
import { forwardRef, type HTMLAttributes } from 'react'

type Elevacao = 'control' | 'overlay'

/**
 * Superfície de vidro. `control` para barras e controles fixos; `overlay`
 * para popovers, paleta de comandos e modais (mais blur, mais opaca).
 */
export const GlassPanel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { elevacao?: Elevacao }>(
  function GlassPanel({ elevacao = 'control', className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={clsx(elevacao === 'control' ? 'glass' : 'glass-strong', className)}
        {...props}
      />
    )
  },
)
