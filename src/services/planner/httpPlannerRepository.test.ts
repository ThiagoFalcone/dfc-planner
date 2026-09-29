import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { criarRepositorioHttpProjetos } from './httpPlannerRepository'
import type { EstadoPlanner } from '@/domain/scenario/types'

const estado: EstadoPlanner = {
  versao: 2,
  id: 'prj_1',
  nomeProjeto: 'Teste',
  criadoEm: '2026-01-01T00:00:00.000Z',
  atualizadoEm: '2026-01-01T00:00:00.000Z',
  cenarioAtivoId: 'cen_1',
  cenarios: [],
}

describe('criarRepositorioHttpProjetos', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
  afterEach(() => vi.unstubAllGlobals())

  it('carregar retorna null em 404', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ detail: 'não achado' }), { status: 404 }))
    const repo = criarRepositorioHttpProjetos()
    await expect(repo.carregar('prj_x')).resolves.toBeNull()
  })

  it('salvar tenta PUT primeiro', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(estado), { status: 200 }))
    const repo = criarRepositorioHttpProjetos()
    await repo.salvar(estado)
    const [url, opcoes] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain('/projetos/prj_1')
    expect(opcoes?.method).toBe('PUT')
  })

  it('salvar cai para POST quando o PUT retorna 404 (projeto novo)', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: 'não achado' }), { status: 404 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(estado), { status: 201 }))
    const repo = criarRepositorioHttpProjetos()
    await repo.salvar(estado)
    expect(fetch).toHaveBeenCalledTimes(2)
    const [, segundaChamada] = vi.mocked(fetch).mock.calls[1]
    expect(segundaChamada?.method).toBe('POST')
  })

  it('ativoId extrai projetoId da resposta', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ projetoId: 'prj_1' }), { status: 200 }))
    const repo = criarRepositorioHttpProjetos()
    await expect(repo.ativoId()).resolves.toBe('prj_1')
  })
})
