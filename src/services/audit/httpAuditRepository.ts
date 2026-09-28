import type { AuditEvent, NovoAuditEvent } from '@/domain/audit/types'
import { apiFetch } from '@/lib/httpClient'

/**
 * Implementação real da trilha de auditoria, consumindo a API. Diferente
 * do repositório local: id/timestamp/user nunca são enviados pelo
 * cliente — o servidor os define a partir do token e do próprio relógio.
 */
export interface AuditRepositoryAsync {
  listar(): Promise<AuditEvent[]>
  registrar(evento: NovoAuditEvent): Promise<AuditEvent>
  limpar(): Promise<void>
}

export function criarRepositorioHttpAuditoria(): AuditRepositoryAsync {
  return {
    listar: () => apiFetch<AuditEvent[]>('/auditoria'),
    registrar: (evento) => apiFetch<AuditEvent>('/auditoria', { method: 'POST', body: JSON.stringify(evento) }),
    limpar: () => apiFetch<void>('/auditoria', { method: 'DELETE' }),
  }
}
