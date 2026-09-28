import clsx from 'clsx'
import { formatarDataHora, tempoRelativo } from '@/lib/formato'
import { useAgora } from '@/hooks/useAgora'
import type { StatusSalvamento } from '@/hooks/useAutosave'

const CONFIG: Record<StatusSalvamento, { ponto: string; texto: (salvoEm: string | null, tempo: string) => string }> = {
  salvo: { ponto: 'bg-positive', texto: (salvoEm, tempo) => (salvoEm ? `Salvo · ${tempo}` : 'Salvo') },
  salvando: { ponto: 'bg-accent animate-pulse', texto: () => 'Salvando…' },
  erro: { ponto: 'bg-negative', texto: () => 'Falha ao salvar — verifique sua conexão' },
  'sessao-expirada': { ponto: 'bg-negative', texto: () => 'Sessão expirada — atualize a página para continuar salvando' },
}

/** Feedback discreto de persistência: "Salvo · agora", "Salvando…", ou um erro. */
export function SaveStatus({
  status,
  salvoEm,
  className,
}: {
  status: StatusSalvamento
  salvoEm: string | null
  className?: string
}) {
  const agora = useAgora()
  const config = CONFIG[status]
  const tempo = salvoEm ? tempoRelativo(salvoEm, agora) : ''
  return (
    <p className={clsx('items-center gap-1.5 text-xs whitespace-nowrap text-fg-3', className)}>
      <span aria-hidden="true" className={clsx('h-1.5 w-1.5 rounded-full', config.ponto)} />
      <span title={salvoEm ? formatarDataHora(salvoEm) : undefined}>{config.texto(salvoEm, tempo)}</span>
    </p>
  )
}
