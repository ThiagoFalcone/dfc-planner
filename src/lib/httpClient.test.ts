import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, ErroAutenticacao, apiFetch, definirObtentorToken } from './httpClient'

describe('apiFetch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    definirObtentorToken(() => null)
  })

  it('monta a URL com a base configurada e envia Content-Type JSON', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    await apiFetch('/health')
    const [url, opcoes] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('http://localhost:8000/health')
    expect((opcoes?.headers as Record<string, string>)['Content-Type']).toBe('application/json')
  })

  it('anexa Authorization quando há token', async () => {
    definirObtentorToken(() => 'meu-token')
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 }))
    await apiFetch('/projetos')
    const [, opcoes] = vi.mocked(fetch).mock.calls[0]
    expect((opcoes?.headers as Record<string, string>).Authorization).toBe('Bearer meu-token')
  })

  it('não anexa Authorization quando não há token', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('{}', { status: 200 }))
    await apiFetch('/health')
    const [, opcoes] = vi.mocked(fetch).mock.calls[0]
    expect((opcoes?.headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it('lança ApiError com a mensagem do corpo em respostas de erro', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ detail: 'Deu ruim' }), { status: 400 }))
    await expect(apiFetch('/x')).rejects.toMatchObject({ status: 400, message: 'Deu ruim' })
  })

  it('lança ErroAutenticacao em 401', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ detail: 'Token inválido' }), { status: 401 }))
    await expect(apiFetch('/x')).rejects.toBeInstanceOf(ErroAutenticacao)
  })

  it('lança ApiError (não ErroAutenticacao) em outros erros', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ detail: 'Não encontrado' }), { status: 404 }))
    const erro = await apiFetch('/x').catch((e) => e)
    expect(erro).toBeInstanceOf(ApiError)
    expect(erro).not.toBeInstanceOf(ErroAutenticacao)
  })

  it('retorna undefined em 204', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }))
    await expect(apiFetch('/x')).resolves.toBeUndefined()
  })
})
