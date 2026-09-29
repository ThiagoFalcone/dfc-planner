import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { formatarMoedaCurta } from '@/lib/formato'
import { useReducedMotion } from '@/hooks/useReducedMotion'

export type TomValor = 'auto' | 'neutro' | 'positivo' | 'negativo' | 'atencao'

const TONS: Record<Exclude<TomValor, 'auto'>, string> = {
  neutro: 'text-fg',
  positivo: 'text-positive',
  negativo: 'text-negative',
  atencao: 'text-warning',
}

/**
 * Interpola o número exibido quando o valor muda (≈200 ms), para que o
 * indicador "acompanhe" o recálculo. Sem animação com movimento reduzido.
 */
export function useValorAnimado(alvo: number, duracao = 220): number {
  const reduzido = useReducedMotion()
  const [exibido, setExibido] = useState(alvo)
  const atualRef = useRef(alvo)

  useEffect(() => {
    const inicio = atualRef.current
    if (reduzido || inicio === alvo) {
      atualRef.current = alvo
      setExibido(alvo)
      return
    }
    let quadro = 0
    const t0 = performance.now()
    const passo = (t: number) => {
      const p = Math.min(1, (t - t0) / duracao)
      const suave = 1 - Math.pow(1 - p, 3)
      const valor = inicio + (alvo - inicio) * suave
      atualRef.current = valor
      setExibido(p === 1 ? alvo : valor)
      if (p < 1) quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [alvo, duracao, reduzido])

  return exibido
}

export function MoneyValue({
  valor,
  tom = 'neutro',
  animar = true,
  sinal,
  className,
}: {
  valor: number
  tom?: TomValor
  animar?: boolean
  /** Força "+" em valores positivos (ex.: variações). */
  sinal?: boolean
  className?: string
}) {
  const animado = useValorAnimado(valor)
  const mostrado = animar ? animado : valor
  // Alvo inteiro → quadros intermediários também inteiros (sem centavos piscando).
  const arredondado = Number.isInteger(valor) ? Math.round(mostrado) : Math.round(mostrado * 100) / 100
  const tomEfetivo = tom === 'auto' ? (valor < 0 ? 'negativo' : valor > 0 ? 'positivo' : 'neutro') : tom
  const texto = formatarMoedaCurta(Math.abs(arredondado) < 0.005 ? 0 : arredondado)

  return (
    <span className={clsx(TONS[tomEfetivo], className)} aria-label={formatarMoedaCurta(valor)}>
      <span aria-hidden="true">{sinal && valor > 0 ? `+${texto}` : texto}</span>
    </span>
  )
}
