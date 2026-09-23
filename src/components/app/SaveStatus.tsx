import clsx from 'clsx'
import { formatarDataHora, tempoRelativo } from '@/lib/formato'
import { useAgora } from '@/hooks/useAgora'

/** Feedback discreto de persistência: "Salvo localmente · agora". */
export function SaveStatus({ salvoEm, className }: { salvoEm: string | null; className?: string }) {
  const agora = useAgora()
  return (
    <p className={clsx('items-center gap-1.5 text-xs whitespace-nowrap text-fg-3', className)}>
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-positive" />
      {salvoEm ? (
        <span title={formatarDataHora(salvoEm)}>Salvo localmente · {tempoRelativo(salvoEm, agora)}</span>
      ) : (
        <span>Salvo localmente</span>
      )}
    </p>
  )
}
