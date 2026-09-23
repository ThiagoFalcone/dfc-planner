import { createPortal } from 'react-dom'
import { Icon } from './Icon'

export interface Aviso {
  id: number
  texto: string
  acao?: { rotulo: string; executar(): void }
}

/** Aviso transitório, com ação opcional (ex.: "Desfazer" após excluir). */
export function Toast({ aviso, onFechar }: { aviso: Aviso | null; onFechar(): void }) {
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex justify-center px-4 md:bottom-6">
      <div role="status" aria-live="polite" className="contents">
        {aviso && (
          <div
            key={aviso.id}
            className="glass-strong animate-pop-in pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl py-2 pr-2 pl-4 text-[13px] text-fg"
          >
            <span className="min-w-0 flex-1">{aviso.texto}</span>
            {aviso.acao && (
              <button
                type="button"
                onClick={() => {
                  aviso.acao?.executar()
                  onFechar()
                }}
                className="focus-ring shrink-0 rounded-lg px-2.5 py-1.5 font-medium text-accent hover:bg-accent-soft"
              >
                {aviso.acao.rotulo}
              </button>
            )}
            <button
              type="button"
              onClick={onFechar}
              aria-label="Fechar aviso"
              className="focus-ring shrink-0 rounded-lg p-1.5 text-fg-3 hover:bg-hover hover:text-fg"
            >
              <Icon nome="x" className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
