import { beforeEach, describe, expect, it } from 'vitest'
import { criarRepositorioProjetos, resumir } from './plannerRepository'
import { criarProjeto } from '@/domain/scenario/fabricas'

const meta = { responsavel: 'Thiago', agora: '2026-09-23T12:00:00.000Z' }

describe('repositório de planejamentos', () => {
  beforeEach(() => localStorage.clear())

  it('salva, lista e carrega, isolado por usuário', () => {
    const repoA = criarRepositorioProjetos('a')
    const repoB = criarRepositorioProjetos('b')
    const p1 = criarProjeto({ nome: 'Projeto 1', partida: 'branco' }, meta)
    repoA.salvar(p1)
    repoA.definirAtivo(p1.id)

    expect(repoA.listar().map((p) => p.nome)).toEqual(['Projeto 1'])
    expect(repoB.listar()).toEqual([])
    expect(repoA.carregar(p1.id)?.nomeProjeto).toBe('Projeto 1')
    expect(repoA.ativoId()).toBe(p1.id)
  })

  it('excluir remove do índice e do conteúdo', () => {
    const repo = criarRepositorioProjetos('a')
    const p1 = criarProjeto({ nome: 'Projeto 1', partida: 'branco' }, meta)
    repo.salvar(p1)
    repo.excluir(p1.id)
    expect(repo.listar()).toEqual([])
    expect(repo.carregar(p1.id)).toBeNull()
  })

  it('migra o formato anterior (um único planejamento em "planner:<usuario>")', () => {
    const antigo = criarProjeto({ nome: 'Projeto EduTask', partida: 'exemplo' }, meta)
    // Formato de antes do CRUD: sem id de projeto, sem versão 2, cenários sem cor/tma.
    const semCampos = { ...antigo }
    // @ts-expect-error simula o formato salvo antes do CRUD de planejamentos
    delete semCampos.id
    const cenariosAntigos = antigo.cenarios.map(({ cor: _cor, tma: _tma, ...resto }) => resto)
    localStorage.setItem('dfc-planner:planner:a', JSON.stringify({ ...semCampos, cenarios: cenariosAntigos }))

    const repo = criarRepositorioProjetos('a')
    const lista = repo.listar()
    expect(lista).toHaveLength(1)
    expect(lista[0].nome).toBe('Projeto EduTask')

    const migrado = repo.carregar(lista[0].id)
    expect(migrado?.cenarios.find((c) => c.id === 'base')?.cor).toBe(1)
    expect(migrado?.cenarios.every((c) => typeof c.tma === 'string')).toBe(true)
    expect(localStorage.getItem('dfc-planner:planner:a')).toBeNull()
  })

  it('resumir conta cenários e o maior número de meses entre eles', () => {
    const p = criarProjeto({ nome: 'X', partida: 'exemplo' }, meta)
    const r = resumir(p)
    expect(r.cenarios).toBe(3)
    expect(r.meses).toBe(7)
  })
})
