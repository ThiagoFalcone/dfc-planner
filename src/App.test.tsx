import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'

describe('fluxo ponta a ponta', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('bloqueia rotas privadas sem sessão', async () => {
    window.history.pushState({}, '', '/app/resultados')
    render(<App />)
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
  })
})
