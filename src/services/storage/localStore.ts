/**
 * Único ponto de acesso a localStorage/sessionStorage da aplicação.
 *
 * Tudo que o DFC Planner persiste no navegador passa por aqui: sessão
 * simulada, preferência de tema, estado do planejamento e histórico local.
 * Leituras são validadas por um type guard, porque o conteúdo do storage
 * pode ter sido editado à mão ou vir de uma versão antiga do app.
 */

const PREFIXO = 'dfc-planner:'

export const CHAVES = {
  usuarios: `${PREFIXO}usuarios`,
  sessao: `${PREFIXO}sessao`,
  // Duplicada no script inline de index.html (aplica o tema antes da pintura).
  tema: `${PREFIXO}tema`,
  /** Formato anterior (um único planejamento); lido só para migração. */
  planner: (usuarioId: string) => `${PREFIXO}planner:${usuarioId}`,
  projetos: (usuarioId: string) => `${PREFIXO}projetos:${usuarioId}`,
  projeto: (usuarioId: string, projetoId: string) => `${PREFIXO}projeto:${usuarioId}:${projetoId}`,
  auditoria: (usuarioId: string) => `${PREFIXO}auditoria:${usuarioId}`,
} as const

export type TipoArmazenamento = 'local' | 'sessao'

function storage(tipo: TipoArmazenamento): Storage | null {
  try {
    return tipo === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

export function lerJSON<T>(
  chave: string,
  validar: (valor: unknown) => valor is T,
  tipo: TipoArmazenamento = 'local',
): T | null {
  try {
    const bruto = storage(tipo)?.getItem(chave)
    if (bruto == null) return null
    const valor: unknown = JSON.parse(bruto)
    return validar(valor) ? valor : null
  } catch {
    return null
  }
}

export function gravarJSON(chave: string, valor: unknown, tipo: TipoArmazenamento = 'local'): boolean {
  try {
    storage(tipo)?.setItem(chave, JSON.stringify(valor))
    return true
  } catch {
    return false
  }
}

export function remover(chave: string, tipo: TipoArmazenamento = 'local'): void {
  try {
    storage(tipo)?.removeItem(chave)
  } catch {
    // storage indisponível (modo privado restrito): nada a remover
  }
}

export function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}
