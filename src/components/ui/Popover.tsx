import clsx from 'clsx'
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { GlassPanel } from './GlassPanel'

interface TriggerProps {
  id: string
  'aria-haspopup': 'menu' | 'dialog'
  'aria-expanded': boolean
  'aria-controls': string
  onClick(): void
  ref: (el: HTMLButtonElement | null) => void
}

/**
 * Popover ancorado ao gatilho, com fechamento por Esc e clique fora, e foco
 * devolvido ao gatilho. `role="menu"` ativa a navegação por setas entre
 * elementos [role=menuitem] / [role=menuitemradio].
 */
export function Popover({
  trigger,
  children,
  role = 'menu',
  align = 'end',
  largura = 'w-64',
  rotulo,
}: {
  trigger: (props: TriggerProps) => ReactNode
  children: (fechar: () => void) => ReactNode
  role?: 'menu' | 'dialog'
  align?: 'start' | 'end'
  largura?: string
  rotulo: string
}) {
  const [aberto, setAberto] = useState(false)
  const idBase = useId()
  const gatilhoRef = useRef<HTMLButtonElement | null>(null)
  const painelRef = useRef<HTMLDivElement | null>(null)

  const fechar = useCallback((devolverFoco = true) => {
    setAberto(false)
    if (devolverFoco) gatilhoRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!aberto) return
    const itens = painelRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"], button, input, select')
    itens?.[0]?.focus()
    const onPointer = (e: PointerEvent) => {
      const alvo = e.target as Node
      if (!painelRef.current?.contains(alvo) && !gatilhoRef.current?.contains(alvo)) fechar(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [aberto, fechar])

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.stopPropagation()
      fechar()
      return
    }
    if (role !== 'menu') return
    const itens = Array.from(
      painelRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([aria-disabled="true"])') ?? [],
    )
    const i = itens.indexOf(document.activeElement as HTMLElement)
    const mover = (n: number) => {
      e.preventDefault()
      itens[(n + itens.length) % itens.length]?.focus()
    }
    if (e.key === 'ArrowDown') mover(i + 1)
    else if (e.key === 'ArrowUp') mover(i - 1)
    else if (e.key === 'Home') mover(0)
    else if (e.key === 'End') mover(itens.length - 1)
    else if (e.key === 'Tab') fechar(false)
  }

  const painelId = `${idBase}-painel`

  return (
    <div className="relative">
      {trigger({
        id: `${idBase}-gatilho`,
        'aria-haspopup': role,
        'aria-expanded': aberto,
        'aria-controls': painelId,
        onClick: () => setAberto((v) => !v),
        ref: (el) => {
          gatilhoRef.current = el
        },
      })}
      {aberto && (
        <GlassPanel
          elevacao="overlay"
          ref={painelRef}
          id={painelId}
          role={role}
          aria-label={rotulo}
          onKeyDown={onKeyDown}
          className={clsx(
            'animate-pop-in absolute z-50 mt-2 origin-top rounded-[14px] p-1.5',
            align === 'end' ? 'right-0' : 'left-0',
            largura,
          )}
        >
          {children(() => fechar())}
        </GlassPanel>
      )}
    </div>
  )
}

export function MenuItem({
  children,
  onSelect,
  icone,
  atalho,
  destrutivo,
  desabilitado,
  descricao,
}: {
  children: ReactNode
  onSelect(): void
  icone?: ReactNode
  atalho?: string
  destrutivo?: boolean
  desabilitado?: boolean
  descricao?: string
}) {
  return (
    <button
      type="button"
      role="menuitem"
      aria-disabled={desabilitado || undefined}
      onClick={() => !desabilitado && onSelect()}
      className={clsx(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] outline-none',
        'transition-colors duration-100',
        desabilitado
          ? 'cursor-not-allowed text-fg-3'
          : destrutivo
            ? 'text-negative hover:bg-negative-soft focus-visible:bg-negative-soft'
            : 'text-fg hover:bg-hover focus-visible:bg-hover',
      )}
    >
      {icone && <span className="shrink-0 text-fg-3">{icone}</span>}
      <span className="min-w-0 flex-1">
        <span className="block">{children}</span>
        {descricao && <span className="block text-xs text-fg-3">{descricao}</span>}
      </span>
      {atalho && <kbd className="font-mono text-[11px] text-fg-3">{atalho}</kbd>}
    </button>
  )
}

export function MenuSeparator() {
  return <div role="separator" className="my-1.5 h-px bg-line" />
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="px-2.5 pt-1.5 pb-1 text-xs font-medium text-fg-3">{children}</div>
}
