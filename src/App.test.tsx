import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import App from './App'

async function entrarComDemo() {
  window.history.pushState({}, '', '/login')
  render(<App />)
  fireEvent.click(await screen.findByRole('button', { name: 'Usar a conta de demonstração' }))
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  await screen.findByRole('grid', {}, { timeout: 3000 })
}

function celula(rotulo: RegExp) {
  return screen.getByRole('gridcell', { name: rotulo })
}

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

  it('edita uma célula, recalcula, registra na auditoria e sai', async () => {
    await entrarComDemo()

    // Exemplo EduTask: saldo final R$ 8.000 no rodapé.
    const grade = screen.getByRole('grid')
    expect(within(grade).getAllByText('8.000,00').length).toBeGreaterThan(0)

    // Clique entra em edição; Esc cancela sem alterar.
    fireEvent.click(celula(/^Despesa, Mês 2:/))
    let editor = screen.getByRole('textbox', { name: /Editar despesa, Mês 2/ })
    fireEvent.change(editor, { target: { value: '99999' } })
    fireEvent.keyDown(editor, { key: 'Escape' })
    expect(celula(/^Despesa, Mês 2: 8\.000,00/)).toBeInTheDocument()

    // Enter confirma; formato brasileiro "10.000" vira 10000.
    fireEvent.click(celula(/^Despesa, Mês 2:/))
    editor = screen.getByRole('textbox', { name: /Editar despesa, Mês 2/ })
    fireEvent.change(editor, { target: { value: '10.000' } })
    fireEvent.keyDown(editor, { key: 'Enter' })
    expect(celula(/^Despesa, Mês 2: 10\.000,00/)).toBeInTheDocument()
    // Saldo final cai R$ 2.000 → R$ 6.000.
    expect(within(grade).getAllByText('6.000,00').length).toBeGreaterThan(0)

    // Valor negativo é sinalizado, não calculado.
    fireEvent.click(celula(/^Tributo, Mês 1:/))
    editor = screen.getByRole('textbox', { name: /Editar tributo, Mês 1/ })
    fireEvent.change(editor, { target: { value: '-5' } })
    fireEvent.keyDown(editor, { key: 'Enter' })
    expect(await screen.findByText(/Existem valores que precisam ser corrigidos/)).toBeInTheDocument()

    // Auditoria mostra a edição com valor anterior e novo.
    fireEvent.click(screen.getAllByRole('link', { name: /Auditoria/ })[0])
    await screen.findByRole('heading', { level: 1, name: 'Histórico e auditoria' })
    expect(screen.getAllByText('Despesa atualizada').length).toBeGreaterThan(0)
    expect(screen.getByText('R$ 8.000,00')).toBeInTheDocument()
    expect(screen.getByText('R$ 10.000,00')).toBeInTheDocument()
    expect(screen.getByText('Sessão iniciada')).toBeInTheDocument()

    // Logout limpa a sessão e volta ao login.
    fireEvent.click(screen.getByRole('button', { name: /Conta de/ }))
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Sair' }))
    await screen.findByRole('button', { name: 'Entrar' }, { timeout: 3000 })
    await waitFor(() => expect(window.location.pathname).toBe('/login'))
    expect(localStorage.getItem('dfc-planner:sessao')).toBeNull()
  })

  it('persiste o planejamento entre sessões', async () => {
    await entrarComDemo()
    fireEvent.click(celula(/^Receita, Mês 4:/))
    const editor = screen.getByRole('textbox', { name: /Editar receita, Mês 4/ })
    fireEvent.change(editor, { target: { value: '15000' } })
    fireEvent.keyDown(editor, { key: 'Enter' })

    const indice = JSON.parse(localStorage.getItem('dfc-planner:projetos:usr_demo') ?? '{}')
    const projetoId = indice.ativoId
    expect(projetoId).toBeTruthy()
    const salvo = JSON.parse(localStorage.getItem(`dfc-planner:projeto:usr_demo:${projetoId}`) ?? '{}')
    const base = salvo.cenarios.find((c: { id: string }) => c.id === 'base')
    expect(base.periodos.find((p: { mes: number }) => p.mes === 4).receitas).toBe('15000')
    expect(base.proveniencia.responsavel).toBe('Conta de demonstração')
  })
})
