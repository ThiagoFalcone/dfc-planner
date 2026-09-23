import { Link } from 'react-router-dom'
import { Icon, type NomeIcone } from '@/components/ui/Icon'

export function EmptyState({
  icone,
  titulo,
  texto,
  acao,
}: {
  icone: NomeIcone
  titulo: string
  texto: string
  acao?: { rotulo: string; para: string } | { rotulo: string; onClick: () => void }
}) {
  const classe = 'focus-ring mt-5 inline-flex h-9 items-center gap-2 rounded-[10px] bg-fg px-4 text-[13px] font-medium text-surface hover:opacity-90'
  return (
    <div className="flex flex-col items-center rounded-[18px] border border-dashed border-line-strong px-6 py-14 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-hover text-fg-2">
        <Icon nome={icone} className="h-5 w-5" />
      </span>
      <p className="mt-4 text-[15px] font-semibold text-fg">{titulo}</p>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-fg-2">{texto}</p>
      {acao && 'para' in acao ? (
        <Link to={acao.para} className={classe}>
          {acao.rotulo}
          <Icon nome="seta" className="h-4 w-4" />
        </Link>
      ) : acao ? (
        <button type="button" onClick={acao.onClick} className={classe}>
          {acao.rotulo}
          <Icon nome="seta" className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}
