import type { AuditActor, AuditEvent, NovoAuditEvent } from '@/domain/audit/types'
import { CHAVES, ehObjeto, gravarJSON, lerJSON, remover } from '@/services/storage/localStore'

/**
 * Contrato do repositório de eventos de auditoria.
 *
 * ATENÇÃO: a implementação local abaixo NÃO é uma trilha de auditoria
 * inviolável: os eventos ficam no localStorage deste navegador e podem ser
 * apagados ou editados por qualquer pessoa com acesso a ele. Serve para
 * rastreabilidade de trabalho (o que mudou, quando, de quanto para quanto).
 *
 * Para uma trilha confiável, crie um ServerAuditRepository que envie cada
 * evento a um backend append-only (com carimbo de tempo do servidor e
 * identidade autenticada) e troque a fábrica usada em AuditContext. As telas
 * não mudam, porque dependem apenas desta interface.
 */
export interface AuditRepository {
  listar(): AuditEvent[]
  registrar(evento: AuditEvent): AuditEvent[]
  limpar(): void
}

const LIMITE_EVENTOS = 1000

function ehEvento(v: unknown): v is AuditEvent {
  return (
    ehObjeto(v) &&
    typeof v.id === 'string' &&
    typeof v.timestamp === 'string' &&
    typeof v.action === 'string' &&
    typeof v.category === 'string' &&
    typeof v.summary === 'string' &&
    ehObjeto(v.user)
  )
}

function ehListaEventos(v: unknown): v is AuditEvent[] {
  return Array.isArray(v) && v.every(ehEvento)
}

export function criarRepositorioLocal(usuarioId: string): AuditRepository {
  const chave = CHAVES.auditoria(usuarioId)
  return {
    listar() {
      return lerJSON(chave, ehListaEventos) ?? []
    },
    registrar(evento) {
      const eventos = [evento, ...this.listar()].slice(0, LIMITE_EVENTOS)
      gravarJSON(chave, eventos)
      return eventos
    },
    limpar() {
      remover(chave)
    },
  }
}

function gerarId(): string {
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function criarEvento(ator: AuditActor, dados: NovoAuditEvent, agora = new Date()): AuditEvent {
  return { ...dados, id: gerarId(), timestamp: agora.toISOString(), user: ator }
}
