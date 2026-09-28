import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'
import { CHAVES } from '@/services/storage/localStore'

function Sonda() {
  const { usuario, carregando } = useAuth()
  if (carregando) return <p>carregando</p>
  return <p>{usuario ? `logado:${usuario.nome}` : 'deslogado'}</p>
}

const sessaoGravada = {
  usuario: { id: 'usr_1', nome: 'Ana', email: 'a@a.com' },
  token: 'tok',
  criadoEm: '2026-01-01T00:00:00.000Z',
  persistente: true,
}

describe('AuthProvider: validação da sessão gravada', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('descarta a sessão gravada quando GET /auth/me responde 401', async () => {
    localStorage.setItem(CHAVES.sessao, JSON.stringify(sessaoGravada))
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ detail: 'Token inválido' }), { status: 401 }))
    render(<AuthProvider><Sonda /></AuthProvider>)
    expect(await screen.findByText('deslogado')).toBeInTheDocument()
    expect(localStorage.getItem(CHAVES.sessao)).toBeNull()
    expect(vi.mocked(fetch).mock.calls[0][0]).toMatch(/\/auth\/me$/)
  })

  it('mantém a sessão gravada quando GET /auth/me responde 200', async () => {
    localStorage.setItem(CHAVES.sessao, JSON.stringify(sessaoGravada))
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(sessaoGravada.usuario), { status: 200 }))
    render(<AuthProvider><Sonda /></AuthProvider>)
    expect(await screen.findByText('logado:Ana')).toBeInTheDocument()
    expect(localStorage.getItem(CHAVES.sessao)).not.toBeNull()
  })

  it('mantém a sessão gravada quando o servidor está inacessível', async () => {
    localStorage.setItem(CHAVES.sessao, JSON.stringify(sessaoGravada))
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'))
    render(<AuthProvider><Sonda /></AuthProvider>)
    expect(await screen.findByText('logado:Ana')).toBeInTheDocument()
  })

  it('sem sessão gravada, não consulta o servidor', async () => {
    render(<AuthProvider><Sonda /></AuthProvider>)
    expect(await screen.findByText('deslogado')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })
})
