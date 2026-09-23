import clsx from 'clsx'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Icon, type NomeIcone } from '@/components/ui/Icon'
import { useFocusTrap } from '@/components/ui/Modal'

export interface Comando {
  id: string
  grupo: string
  rotulo: string
  icone: NomeIcone
  palavras?: string
  dica?: string
  desabilitado?: boolean
  marcador?: ReactNode
  executar(): void
}

function normalizar(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Abre com Ctrl/⌘ + K em qualquer página do workspace. */
export function useAtalhoPaleta(abrir: () => void) {
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        abrir()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [abrir])
}

/** Montada apenas quando aberta: cada abertura começa com busca vazia. */
export function CommandPalette({ onFechar, comandos }: { onFechar(): void; comandos: Comando[] }) {
  const [busca, setBusca] = useState('')
  const [indice, setIndice] = useState(0)
  const idLista = useId()
  const trap = useFocusTrap(true)
  const listaRef = useRef<HTMLUListElement>(null)

  const filtrados = useMemo(() => {
    const termos = normalizar(busca).split(/\s+/).filter(Boolean)
    return comandos.filter((c) => {
      const alvo = normalizar(`${c.rotulo} ${c.grupo} ${c.palavras ?? ''}`)
      return termos.every((t) => alvo.includes(t))
    })
  }, [busca, comandos])

  const selecionado = filtrados[Math.min(indice, filtrados.length - 1)]

  useEffect(() => {
    listaRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [indice, busca])

  function executar(c: Comando | undefined) {
    if (!c || c.desabilitado) return
    onFechar()
    c.executar()
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndice((i) => (i + 1) % Math.max(1, filtrados.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndice((i) => (i - 1 + filtrados.length) % Math.max(1, filtrados.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      executar(selecionado)
    }
  }

  const grupos = Array.from(new Set(filtrados.map((c) => c.grupo)))

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center px-3 pt-[10vh]"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          onFechar()
        }
        trap.onKeyDown(e)
      }}
    >
      <div className="animate-fade-in absolute inset-0 bg-(--scrim)" onClick={onFechar} aria-hidden="true" />
      <GlassPanel
        elevacao="overlay"
        ref={trap.ref}
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de comandos"
        className="animate-pop-in relative w-full max-w-xl overflow-hidden rounded-[20px]"
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4">
          <Icon nome="busca" className="h-[18px] w-[18px] shrink-0 text-fg-3" />
          <input
            data-autofocus
            role="combobox"
            aria-expanded="true"
            aria-controls={idLista}
            aria-activedescendant={selecionado ? `${idLista}-${selecionado.id}` : undefined}
            aria-autocomplete="list"
            aria-label="Buscar comando"
            placeholder="Buscar comando…"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value)
              setIndice(0)
            }}
            onKeyDown={onKeyDown}
            className="h-13 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-3"
          />
          <kbd className="rounded border border-line-strong px-1.5 font-mono text-[10.5px] text-fg-3">Esc</kbd>
        </div>
        <ul ref={listaRef} id={idLista} role="listbox" aria-label="Comandos" className="scrollbar-thin max-h-[min(60vh,420px)] overflow-y-auto p-1.5">
          {filtrados.length === 0 && (
            <li className="px-3 py-8 text-center text-[13px] text-fg-3" role="presentation">
              Nenhum comando encontrado para “{busca}”.
            </li>
          )}
          {grupos.map((g) => (
            <li key={g} role="presentation">
              <p className="px-2.5 pt-2 pb-1 text-xs font-medium text-fg-3" aria-hidden="true">
                {g}
              </p>
              <ul role="group" aria-label={g}>
                {filtrados
                  .filter((c) => c.grupo === g)
                  .map((c) => {
                    const ativo = c === selecionado
                    return (
                      <li
                        key={c.id}
                        id={`${idLista}-${c.id}`}
                        role="option"
                        aria-selected={ativo}
                        aria-disabled={c.desabilitado || undefined}
                        onMouseMove={() => setIndice(filtrados.indexOf(c))}
                        onClick={() => executar(c)}
                        className={clsx(
                          'flex cursor-pointer items-center gap-3 rounded-[10px] px-2.5 py-2 text-[13px]',
                          ativo ? 'bg-hover text-fg' : 'text-fg-2',
                          c.desabilitado && 'cursor-not-allowed opacity-50',
                        )}
                      >
                        <Icon nome={c.icone} className="h-4 w-4 shrink-0 text-fg-3" />
                        <span className="flex-1">{c.rotulo}</span>
                        {c.marcador}
                        {c.dica && <span className="text-xs text-fg-3">{c.dica}</span>}
                        {ativo && <Icon nome="seta" className="h-3.5 w-3.5 text-fg-3" />}
                      </li>
                    )
                  })}
              </ul>
            </li>
          ))}
        </ul>
      </GlassPanel>
    </div>,
    document.body,
  )
}
