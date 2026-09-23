import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { formatarNumero } from '@/lib/formato'

/**
 * Valor calculado (fluxo/acumulado). Quando muda por causa de uma edição,
 * pisca um realce curto — o recálculo fica visível sem loader.
 */
export function DerivedValue({ valor, destaque }: { valor: number | undefined; destaque?: boolean }) {
  const anterior = useRef(valor)
  const [pulso, setPulso] = useState(0)

  useEffect(() => {
    if (anterior.current !== undefined && valor !== undefined && anterior.current !== valor) {
      setPulso((p) => p + 1)
    }
    anterior.current = valor
  }, [valor])

  if (valor === undefined) return <span className="text-fg-3">—</span>

  const negativo = valor < -0.005
  return (
    <span
      key={pulso}
      className={clsx(
        'tabular -mx-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5',
        pulso > 0 && 'animate-flash',
        destaque ? 'font-semibold' : 'font-medium',
        negativo ? 'text-negative' : destaque && valor > 0 ? 'text-positive' : 'text-fg',
      )}
    >
      {negativo && <span className="sr-only">negativo</span>}
      {formatarNumero(valor)}
    </span>
  )
}
