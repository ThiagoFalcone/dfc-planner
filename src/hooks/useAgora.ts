import { useEffect, useState } from 'react'

/** Relógio de baixa frequência para textos relativos ("há 3 min"). */
export function useAgora(intervaloMs = 30_000): Date {
  const [agora, setAgora] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setAgora(new Date()), intervaloMs)
    return () => window.clearInterval(id)
  }, [intervaloMs])
  return agora
}
