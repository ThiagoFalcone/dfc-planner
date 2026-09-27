import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { criarRepositorioHttpAuditoria } from './httpAuditRepository'
import type { NovoAuditEvent } from '@/domain/audit/types'

const evento: NovoAuditEvent = {
  scenario: null,
  category: 'sessao',
  entity: 'sessao',
  field: null,
  previousValue: null,
  newValue: null,
  action: 'LOGIN',
  summary: 'Sessão iniciada',
}

describe('criarRepositorioHttpAuditoria', () => {
  beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
  afterEach(() => vi.unstubAllGlobals())

  it('registrar envia POST sem id/timestamp/user no corpo', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ...evento, id: 'evt_1', timestamp: 't', user: { id: 'u', nome: 'A' } }), {
        status: 200,
      }),
    )
    const repo = criarRepositorioHttpAuditoria()
    await repo.registrar(evento)
    const [url, opcoes] = vi.mocked(fetch).mock.calls[0]
    expect(url).toContain('/auditoria')
    expect(opcoes?.method).toBe('POST')
    const corpo = JSON.parse(opcoes?.body as string)
    expect(corpo.id).toBeUndefined()
    expect(corpo.timestamp).toBeUndefined()
  })

  it('limpar envia DELETE', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }))
    const repo = criarRepositorioHttpAuditoria()
    await repo.limpar()
    const [, opcoes] = vi.mocked(fetch).mock.calls[0]
    expect(opcoes?.method).toBe('DELETE')
  })
})
