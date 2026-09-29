import { useEffect, useRef, useState } from 'react'
import { ErroAutenticacao } from '@/lib/httpClient'

export type StatusSalvamento = 'salvo' | 'salvando' | 'erro' | 'sessao-expirada'

/**
 * Autosave assíncrono: debounce (evita uma requisição por campo editado) +
 * fila de profundidade 1 (se um salvamento ainda está em voo quando o
 * próximo dispara, guarda só o estado mais recente e o envia em seguida —
 * nunca empilha os intermediários, nunca deixa uma resposta atrasada
 * sobrescrever um estado mais novo já salvo).
 */
export function useAutosave<T extends { atualizadoEm: string }>(
  estado: T,
  salvar: (estado: T) => Promise<void>,
  atrasoMs = 500,
) {
  const [salvoEm, setSalvoEm] = useState<string | null>(null)
  const [status, setStatus] = useState<StatusSalvamento>('salvo')
  const emVooRef = useRef(false)
  const pendenteRef = useRef<T | null>(null)
  const salvarRef = useRef(salvar)
  salvarRef.current = salvar

  useEffect(() => {
    const timer = window.setTimeout(() => disparar(estado), atrasoMs)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, atrasoMs])

  function disparar(alvo: T): void {
    if (emVooRef.current) {
      pendenteRef.current = alvo
      return
    }
    emVooRef.current = true
    setStatus('salvando')
    salvarRef
      .current(alvo)
      .then(() => {
        setSalvoEm(alvo.atualizadoEm)
        setStatus('salvo')
      })
      .catch((erro: unknown) => {
        setStatus(erro instanceof ErroAutenticacao ? 'sessao-expirada' : 'erro')
      })
      .finally(() => {
        emVooRef.current = false
        const proximo = pendenteRef.current
        pendenteRef.current = null
        if (proximo) disparar(proximo)
      })
  }

  return { salvoEm, status }
}
