import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAutosave } from './useAutosave'
import { ErroAutenticacao } from '@/lib/httpClient'

interface Estado {
  atualizadoEm: string
}

describe('useAutosave', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('salva após o debounce e reporta status salvo com salvoEm', async () => {
    const salvar = vi.fn().mockResolvedValue(undefined)
    const { result, rerender } = renderHook(({ estado }) => useAutosave(estado, salvar), {
      initialProps: { estado: { atualizadoEm: 't1' } as Estado },
    })
    expect(result.current.status).toBe('salvo')

    await act(async () => {
      vi.advanceTimersByTime(500)
      await Promise.resolve()
    })

    expect(salvar).toHaveBeenCalledTimes(1)
    expect(result.current.salvoEm).toBe('t1')
    rerender({ estado: { atualizadoEm: 't1' } })
  })

  it('coalesce edições rápidas: só a última chega a salvar antes do debounce disparar', async () => {
    const salvar = vi.fn().mockResolvedValue(undefined)
    const { rerender } = renderHook(({ estado }) => useAutosave(estado, salvar), {
      initialProps: { estado: { atualizadoEm: 't1' } as Estado },
    })
    rerender({ estado: { atualizadoEm: 't2' } })
    rerender({ estado: { atualizadoEm: 't3' } })

    await act(async () => {
      vi.advanceTimersByTime(500)
      await Promise.resolve()
    })

    expect(salvar).toHaveBeenCalledTimes(1)
    expect(salvar).toHaveBeenCalledWith({ atualizadoEm: 't3' })
  })

  it('se um salvamento está em voo, enfileira só o mais recente e dispara em seguida', async () => {
    let resolverPrimeiro: () => void = () => {}
    const salvar = vi
      .fn()
      .mockImplementationOnce(() => new Promise<void>((resolve) => (resolverPrimeiro = resolve)))
      .mockResolvedValueOnce(undefined)
    const { rerender } = renderHook(({ estado }) => useAutosave(estado, salvar), {
      initialProps: { estado: { atualizadoEm: 't1' } as Estado },
    })

    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    expect(salvar).toHaveBeenCalledTimes(1)

    rerender({ estado: { atualizadoEm: 't2' } })
    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    expect(salvar).toHaveBeenCalledTimes(1) // ainda em voo, não disparou de novo

    await act(async () => {
      resolverPrimeiro()
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(salvar).toHaveBeenCalledTimes(2)
    expect(salvar).toHaveBeenLastCalledWith({ atualizadoEm: 't2' })
  })

  it('classifica ErroAutenticacao como sessao-expirada, e outros erros como erro', async () => {
    const salvar = vi.fn().mockRejectedValue(new ErroAutenticacao(401, 'expirado'))
    const { result } = renderHook(({ estado }) => useAutosave(estado, salvar), {
      initialProps: { estado: { atualizadoEm: 't1' } as Estado },
    })
    await act(async () => {
      vi.advanceTimersByTime(500)
      await Promise.resolve()
    })
    expect(result.current.status).toBe('sessao-expirada')
  })
})
