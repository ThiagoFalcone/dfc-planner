import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { AuditActor, AuditEvent, NovoAuditEvent } from '@/domain/audit/types'
import { criarEvento, criarRepositorioLocal } from '@/services/audit/auditRepository'

interface AuditContextValue {
  eventos: AuditEvent[]
  registrar(evento: NovoAuditEvent): void
  limpar(): void
}

const AuditContext = createContext<AuditContextValue | null>(null)

export function AuditProvider({ ator, children }: { ator: AuditActor; children: ReactNode }) {
  // Ponto único de troca: um repositório de servidor entraria aqui.
  const repositorio = useMemo(() => criarRepositorioLocal(ator.id), [ator.id])
  const [eventos, setEventos] = useState<AuditEvent[]>(() => repositorio.listar())

  const registrar = useCallback(
    (dados: NovoAuditEvent) => {
      setEventos(repositorio.registrar(criarEvento(ator, dados)))
    },
    [repositorio, ator],
  )

  const limpar = useCallback(() => {
    repositorio.limpar()
    // A limpeza fica registrada: o histórico local não finge ser contínuo.
    setEventos(
      repositorio.registrar(
        criarEvento(ator, {
          scenario: null,
          category: 'sessao',
          entity: 'historico',
          field: null,
          previousValue: null,
          newValue: null,
          action: 'CLEAR',
          summary: 'Histórico local apagado',
        }),
      ),
    )
  }, [repositorio, ator])

  const value = useMemo(() => ({ eventos, registrar, limpar }), [eventos, registrar, limpar])
  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>
}

export function useAudit(): AuditContextValue {
  const ctx = useContext(AuditContext)
  if (!ctx) throw new Error('useAudit deve ser usado dentro de <AuditProvider>.')
  return ctx
}
