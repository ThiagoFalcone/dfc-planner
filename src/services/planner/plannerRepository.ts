import type { CenarioEditavel, EstadoPlanner, ResumoProjeto } from '@/domain/scenario/types'
import { gerarId } from '@/domain/scenario/types'
import { CAMPOS_NUMERICOS } from '@/types'
import { CHAVES, ehObjeto, gravarJSON, lerJSON, remover } from '@/services/storage/localStore'

/**
 * Persistência local dos planejamentos (CRUD), isolada por usuário.
 *
 * Layout no navegador:
 *   dfc-planner:projetos:<usuario>            → índice { ativoId, projetos: ResumoProjeto[] }
 *   dfc-planner:projeto:<usuario>:<projetoId> → EstadoPlanner completo
 *
 * Um backend futuro implementaria as mesmas funções (listar, carregar,
 * salvar, excluir) sobre uma API; nenhuma tela acessa o storage diretamente.
 */

interface Indice {
  ativoId: string | null
  projetos: ResumoProjeto[]
}

const COR_POR_ID: Record<string, number> = { base: 1, pessimista: 2, otimista: 3 }

function ehPeriodos(v: unknown): boolean {
  return (
    Array.isArray(v) &&
    v.every((p) => ehObjeto(p) && typeof p.mes === 'number' && CAMPOS_NUMERICOS.every((c) => typeof p[c] === 'string'))
  )
}

/** Aceita cenários do formato anterior (sem cor/tma) e completa os campos novos. */
function normalizarCenario(v: unknown, i: number): CenarioEditavel | null {
  if (!ehObjeto(v) || typeof v.id !== 'string' || typeof v.nome !== 'string' || !ehPeriodos(v.periodos)) return null
  if (!ehObjeto(v.proveniencia) || typeof v.proveniencia.fonte !== 'string') return null
  return {
    ...(v as unknown as CenarioEditavel),
    descricaoPremissas: typeof v.descricaoPremissas === 'string' ? v.descricaoPremissas : '',
    cor: typeof v.cor === 'number' ? v.cor : (COR_POR_ID[v.id] ?? i + 1),
    tma: typeof v.tma === 'string' ? v.tma : '',
  }
}

function normalizarEstado(v: unknown, idPadrao?: string): EstadoPlanner | null {
  if (!ehObjeto(v) || typeof v.nomeProjeto !== 'string' || !Array.isArray(v.cenarios) || v.cenarios.length === 0) return null
  const cenarios = v.cenarios.map(normalizarCenario)
  if (cenarios.some((c) => c === null)) return null
  const lista = cenarios as CenarioEditavel[]
  const atualizadoEm = typeof v.atualizadoEm === 'string' ? v.atualizadoEm : new Date().toISOString()
  const ativo = typeof v.cenarioAtivoId === 'string' && lista.some((c) => c.id === v.cenarioAtivoId) ? v.cenarioAtivoId : lista[0].id
  return {
    versao: 2,
    id: typeof v.id === 'string' ? v.id : (idPadrao ?? gerarId('prj')),
    nomeProjeto: v.nomeProjeto,
    criadoEm: typeof v.criadoEm === 'string' ? v.criadoEm : atualizadoEm,
    atualizadoEm,
    cenarios: lista,
    cenarioAtivoId: ativo,
  }
}

function ehIndice(v: unknown): v is Indice {
  return ehObjeto(v) && Array.isArray(v.projetos) && v.projetos.every((p) => ehObjeto(p) && typeof p.id === 'string')
}

export function resumir(estado: EstadoPlanner): ResumoProjeto {
  return {
    id: estado.id,
    nome: estado.nomeProjeto,
    criadoEm: estado.criadoEm,
    atualizadoEm: estado.atualizadoEm,
    cenarios: estado.cenarios.length,
    meses: Math.max(0, ...estado.cenarios.map((c) => c.periodos.length)),
  }
}

export function criarRepositorioProjetos(usuarioId: string) {
  const chaveIndice = CHAVES.projetos(usuarioId)
  const chaveProjeto = (id: string) => CHAVES.projeto(usuarioId, id)

  function lerIndice(): Indice {
    const indice = lerJSON(chaveIndice, ehIndice)
    if (indice) return indice
    // Migração: formato anterior guardava um único planejamento em "planner:<usuario>".
    const antigo = normalizarEstado(lerJSON(CHAVES.planner(usuarioId), ehObjeto))
    if (antigo) {
      gravarJSON(chaveProjeto(antigo.id), antigo)
      remover(CHAVES.planner(usuarioId))
      const migrado = { ativoId: antigo.id, projetos: [resumir(antigo)] }
      gravarJSON(chaveIndice, migrado)
      return migrado
    }
    return { ativoId: null, projetos: [] }
  }

  function gravarIndice(i: Indice) {
    gravarJSON(chaveIndice, i)
  }

  return {
    listar(): ResumoProjeto[] {
      return [...lerIndice().projetos].sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm))
    },
    ativoId(): string | null {
      const i = lerIndice()
      return i.ativoId && i.projetos.some((p) => p.id === i.ativoId) ? i.ativoId : (i.projetos[0]?.id ?? null)
    },
    definirAtivo(id: string) {
      gravarIndice({ ...lerIndice(), ativoId: id })
    },
    carregar(id: string): EstadoPlanner | null {
      return normalizarEstado(lerJSON(chaveProjeto(id), ehObjeto), id)
    },
    /** Grava o conteúdo e atualiza a linha do índice. */
    salvar(estado: EstadoPlanner): boolean {
      const ok = gravarJSON(chaveProjeto(estado.id), estado)
      if (!ok) return false
      const i = lerIndice()
      const resumo = resumir(estado)
      const existe = i.projetos.some((p) => p.id === estado.id)
      gravarIndice({
        ativoId: i.ativoId ?? estado.id,
        projetos: existe ? i.projetos.map((p) => (p.id === estado.id ? resumo : p)) : [...i.projetos, resumo],
      })
      return true
    },
    excluir(id: string) {
      remover(chaveProjeto(id))
      const i = lerIndice()
      const projetos = i.projetos.filter((p) => p.id !== id)
      gravarIndice({ ativoId: i.ativoId === id ? (projetos[0]?.id ?? null) : i.ativoId, projetos })
    },
  }
}

export type RepositorioProjetos = ReturnType<typeof criarRepositorioProjetos>
