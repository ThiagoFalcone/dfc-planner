/**
 * Modelo de evento de rastreabilidade.
 *
 * O formato é pensado para ser enviado a um servidor no futuro sem mudança:
 * cada evento é autocontido (quem, quando, onde, o quê, de → para).
 */

export type AuditAction =
  | 'CREATE'
  | 'EDIT'
  | 'ADD'
  | 'REMOVE'
  | 'RESET'
  | 'LOAD_EXAMPLE'
  | 'SWITCH'
  | 'EXPORT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'CLEAR'
  | 'UNDO'
  | 'REDO'
  | 'IMPORT'
  | 'DELETE'
  | 'PASTE'

export type AuditCategory =
  | 'planejamento'
  | 'cenarios'
  | 'premissas'
  | 'estrutura'
  | 'sessao'
  | 'exportacao'

export type AuditEntity =
  | 'receitas'
  | 'despesas'
  | 'investimentos'
  | 'tributos'
  | 'residual'
  | 'mes'
  | 'cenario'
  | 'premissas'
  | 'proveniencia'
  | 'projeto'
  | 'sessao'
  | 'arquivo'
  | 'historico'
  | 'tma'

export interface AuditActor {
  id: string
  nome: string
}

export interface AuditScenarioRef {
  id: string
  nome: string
}

export interface AuditProjectRef {
  id: string
  nome: string
}

export interface AuditEvent {
  id: string
  timestamp: string
  user: AuditActor
  /** Planejamento em que a ação ocorreu (ausente em eventos de sessão e em registros antigos). */
  project?: AuditProjectRef | null
  scenario: AuditScenarioRef | null
  category: AuditCategory
  entity: AuditEntity
  /** Localização dentro da entidade, ex.: "Mês 2". */
  field: string | null
  previousValue: string | null
  newValue: string | null
  action: AuditAction
  /** Frase curta para a linha do tempo, ex.: "Despesa atualizada". */
  summary: string
}

export type NovoAuditEvent = Omit<AuditEvent, 'id' | 'timestamp' | 'user'>

export const CATEGORIAS_AUDITORIA: ReadonlyArray<{ valor: AuditCategory; rotulo: string }> = [
  { valor: 'planejamento', rotulo: 'Planejamento' },
  { valor: 'cenarios', rotulo: 'Cenários' },
  { valor: 'premissas', rotulo: 'Premissas' },
  { valor: 'estrutura', rotulo: 'Estrutura' },
  { valor: 'sessao', rotulo: 'Sessão' },
  { valor: 'exportacao', rotulo: 'Exportação' },
]

export const ROTULO_ACAO: Record<AuditAction, string> = {
  CREATE: 'Criação',
  EDIT: 'Edição',
  ADD: 'Inclusão',
  REMOVE: 'Remoção',
  RESET: 'Zerado',
  LOAD_EXAMPLE: 'Exemplo carregado',
  SWITCH: 'Troca',
  EXPORT: 'Exportação',
  LOGIN: 'Entrada',
  LOGOUT: 'Saída',
  CLEAR: 'Limpeza',
  UNDO: 'Desfeito',
  REDO: 'Refeito',
  IMPORT: 'Importação',
  DELETE: 'Exclusão',
  PASTE: 'Colagem',
}
