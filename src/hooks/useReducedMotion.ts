import { useEffect, useState } from 'react'

const CONSULTA = '(prefers-reduced-motion: reduce)'

export function useReducedMotion(): boolean {
  const [reduzido, setReduzido] = useState(() => window.matchMedia(CONSULTA).matches)
  useEffect(() => {
    const mq = window.matchMedia(CONSULTA)
    const onChange = (e: MediaQueryListEvent) => setReduzido(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduzido
}
