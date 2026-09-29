import clsx from 'clsx'
import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { GlassPanel } from './GlassPanel'
import { Icon } from './Icon'

const FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** Mantém o foco dentro do diálogo e o devolve a quem abriu ao fechar. */
export function useFocusTrap(ativo: boolean) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!ativo) return
    const anterior = document.activeElement as HTMLElement | null
    const alvo = ref.current?.querySelector<HTMLElement>('[data-autofocus]') ?? ref.current?.querySelector<HTMLElement>(FOCAVEIS)
    alvo?.focus()
    return () => anterior?.focus()
  }, [ativo])

  function onKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab' || !ref.current) return
    const itens = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCAVEIS))
    if (itens.length === 0) return
    const primeiro = itens[0]
    const ultimo = itens[itens.length - 1]
    if (e.shiftKey && document.activeElement === primeiro) {
      e.preventDefault()
      ultimo.focus()
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault()
      primeiro.focus()
    }
  }

  return { ref, onKeyDown }
}

export function Modal({
  aberto,
  onFechar,
  titulo,
  descricao,
  children,
  rodape,
  largura = 'max-w-lg',
}: {
  aberto: boolean
  onFechar(): void
  titulo: string
  descricao?: ReactNode
  children?: ReactNode
  rodape?: ReactNode
  largura?: string
}) {
  const idTitulo = useId()
  const idDescricao = useId()
  const trap = useFocusTrap(aberto)

  if (!aberto) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-start sm:pt-[12vh]"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          onFechar()
        }
        trap.onKeyDown(e)
      }}
    >
      <div className="animate-fade-in absolute inset-0 bg-[var(--scrim)]" onClick={onFechar} aria-hidden="true" />
      <GlassPanel
        elevacao="overlay"
        ref={trap.ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={descricao ? idDescricao : undefined}
        className={clsx('animate-pop-in relative w-full rounded-[20px]', largura)}
      >
        <div className="flex items-start gap-4 px-5 pt-5 pb-3">
          <div className="min-w-0 flex-1">
            <h2 id={idTitulo} className="text-[15px] font-semibold text-fg">
              {titulo}
            </h2>
            {descricao && (
              <div id={idDescricao} className="mt-1 text-[13px] leading-relaxed text-fg-2">
                {descricao}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="focus-ring -mt-1 -mr-1 rounded-md p-1.5 text-fg-3 hover:bg-hover hover:text-fg"
          >
            <Icon nome="x" className="h-4 w-4" />
          </button>
        </div>
        {children && <div className="px-5 pb-5">{children}</div>}
        {rodape && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3.5">{rodape}</div>
        )}
      </GlassPanel>
    </div>,
    document.body,
  )
}
