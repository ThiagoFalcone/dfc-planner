import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { httpAuthService } from './httpAuthService'
import { definirObtentorToken } from '@/lib/httpClient'
import { CHAVES } from '@/services/storage/localStore'

describe('httpAuthService', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    definirObtentorToken(() => null)
  })

  it('login grava a sessão em localStorage quando manterConectado é true', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ usuario: { id: 'usr_1', nome: 'Ana', email: 'a@a.com' }, token: 'tok' }), {
        status: 200,
      }),
    )
    const sessao = await httpAuthService.login({ email: 'a@a.com', senha: 'x', manterConectado: true })
    expect(sessao.token).toBe('tok')
    expect(localStorage.getItem(CHAVES.sessao)).not.toBeNull()
    expect(sessionStorage.getItem(CHAVES.sessao)).toBeNull()
  })

  it('login grava a sessão em sessionStorage quando manterConectado é false', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ usuario: { id: 'usr_1', nome: 'Ana', email: 'a@a.com' }, token: 'tok' }), {
        status: 200,
      }),
    )
    await httpAuthService.login({ email: 'a@a.com', senha: 'x', manterConectado: false })
    expect(sessionStorage.getItem(CHAVES.sessao)).not.toBeNull()
    expect(localStorage.getItem(CHAVES.sessao)).toBeNull()
  })

  it('logout remove a sessão de ambos os storages', async () => {
    localStorage.setItem(CHAVES.sessao, JSON.stringify({ usuario: {}, token: 't', criadoEm: '', persistente: true }))
    await httpAuthService.logout()
    expect(localStorage.getItem(CHAVES.sessao)).toBeNull()
  })

  it('sessaoAtual lê a sessão gravada', async () => {
    const sessao = { usuario: { id: 'usr_1', nome: 'Ana', email: 'a@a.com' }, token: 't', criadoEm: '2026-01-01T00:00:00.000Z', persistente: true }
    localStorage.setItem(CHAVES.sessao, JSON.stringify(sessao))
    await expect(httpAuthService.sessaoAtual()).resolves.toEqual(sessao)
  })

  it('sessaoAtual retorna null sem sessão gravada', async () => {
    await expect(httpAuthService.sessaoAtual()).resolves.toBeNull()
  })
})
