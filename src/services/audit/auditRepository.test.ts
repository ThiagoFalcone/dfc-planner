import { beforeEach, describe, expect, it } from 'vitest'
import { criarEvento, criarRepositorioLocal } from './auditRepository'
import type { NovoAuditEvent } from '@/domain/audit/types'

const ator = { id: 'u1', nome: 'Thiago' }
const edicao: NovoAuditEvent = {
  scenario: { id: 'base', nome: 'Base' },
  category: 'planejamento',
  entity: 'despesas',
  field: 'Mês 2',
  previousValue: 'R$ 6.000,00',
  newValue: 'R$ 8.000,00',
  action: 'EDIT',
  summary: 'Despesa atualizada',
}

describe('repositório local de auditoria', () => {
  beforeEach(() => localStorage.clear())

  it('grava do mais recente para o mais antigo, isolado por usuário', () => {
    const repo = criarRepositorioLocal('u1')
    repo.registrar(criarEvento(ator, edicao, new Date('2026-09-23T12:40:00Z')))
    repo.registrar(criarEvento(ator, { ...edicao, field: 'Mês 3' }, new Date('2026-09-23T12:42:00Z')))

    const eventos = repo.listar()
    expect(eventos.map((e) => e.field)).toEqual(['Mês 3', 'Mês 2'])
    expect(eventos[0].user).toEqual(ator)
    expect(criarRepositorioLocal('outro').listar()).toEqual([])
  })

  it('descarta conteúdo corrompido em vez de quebrar a tela', () => {
    localStorage.setItem('dfc-planner:auditoria:u1', '{"nao":"é lista"}')
    expect(criarRepositorioLocal('u1').listar()).toEqual([])
  })

  it('limpar remove todos os eventos', () => {
    const repo = criarRepositorioLocal('u1')
    repo.registrar(criarEvento(ator, edicao))
    repo.limpar()
    expect(repo.listar()).toEqual([])
  })
})
