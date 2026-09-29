import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuditActor, AuditEvent, NovoAuditEvent } from '@/domain/audit/types'
import { criarRepositorioHttpAuditoria } from '@/services/audit/httpAuditRepository'

interface AuditContextValue {
  eventos: AuditEvent[]
  registrar(evento: NovoAuditEvent): void
  limpar(): void
}

const AuditContext = createContext<AuditContextValue | null>(null)

export function AuditProvider({ ator, children }: { ator: AuditActor; children: ReactNode }) {
  const repositorio = useMemo(() => criarRepositorioHttpAuditoria(), [])
  const [eventos, setEventos] = useState<AuditEvent[]>([])

  useEffect(() => {
    let cancelado = false
    repositorio
      .listar()
      .then((lista) => {
        if (!cancelado) setEventos(lista)
      })
      .catch(() => {})
    return () => {
      cancelado = true
    }
  }, [repositorio])

  const registrar = useCallback(
    (dados: NovoAuditEvent) => {
      // Otimista: a UI já mostra o evento antes da resposta do servidor
      // chegar — auditoria não é caminho crítico (ver spec).
      const provisorio: AuditEvent = { ...dados, id: `tmp_${Date.now()}`, timestamp: new Date().toISOString(), user: ator }
      setEventos((atual) => [provisorio, ...atual])
      repositorio
        .registrar(dados)
        .then((evento) => {
          setEventos((atual) => [evento, ...atual.filter((e) => e.id !== provisorio.id)])
        })
        .catch(() => {
          // Mantém o evento provisório mesmo se o POST falhar.
        })
    },
    [repositorio, ator],
  )

  const limpar = useCallback(() => {
    setEventos([])
    // O evento CLEAR só é enviado depois que o DELETE terminar: se os dois
    // corressem em paralelo, o DELETE poderia apagar o próprio CLEAR.
    repositorio
      .limpar()
      .then(() =>
        registrar({
          scenario: null,
          category: 'sessao',
          entity: 'historico',
          field: null,
          previousValue: null,
          newValue: null,
          action: 'CLEAR',
          summary: 'Histórico apagado',
        }),
      )
      .catch(() => {})
  }, [repositorio, registrar])

  const value = useMemo(() => ({ eventos, registrar, limpar }), [eventos, registrar, limpar])
  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>
}

export function useAudit(): AuditContextValue {
  const ctx = useContext(AuditContext)
  if (!ctx) throw new Error('useAudit deve ser usado dentro de <AuditProvider>.')
  return ctx
}
