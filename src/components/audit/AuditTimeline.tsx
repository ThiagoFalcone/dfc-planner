import clsx from 'clsx'
import type { AuditAction, AuditEvent } from '@/domain/audit/types'
import { CATEGORIAS_AUDITORIA, ROTULO_ACAO } from '@/domain/audit/types'
import { formatarDataHora, formatarDia, formatarHora } from '@/lib/formato'

const TOM_ACAO: Record<AuditAction, string> = {
  CREATE: 'bg-positive',
  ADD: 'bg-positive',
  EDIT: 'bg-accent',
  LOAD_EXAMPLE: 'bg-accent',
  SWITCH: 'bg-fg-3',
  EXPORT: 'bg-fg-3',
  LOGIN: 'bg-fg-3',
  LOGOUT: 'bg-fg-3',
  REMOVE: 'bg-negative',
  RESET: 'bg-negative',
  CLEAR: 'bg-warning',
  DELETE: 'bg-negative',
  UNDO: 'bg-fg-3',
  REDO: 'bg-fg-3',
  IMPORT: 'bg-accent',
  PASTE: 'bg-accent',
}

function rotuloDia(iso: string, agora: Date): string {
  const d = new Date(iso)
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime()
  const inicioDia = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const dias = Math.round((inicioHoje - inicioDia) / 86_400_000)
  if (dias === 0) return 'Hoje'
  if (dias === 1) return 'Ontem'
  return formatarDia(iso)
}

function agruparPorDia(eventos: AuditEvent[], agora: Date) {
  const grupos: Array<{ dia: string; eventos: AuditEvent[] }> = []
  for (const e of eventos) {
    const dia = rotuloDia(e.timestamp, agora)
    const ultimo = grupos[grupos.length - 1]
    if (ultimo?.dia === dia) ultimo.eventos.push(e)
    else grupos.push({ dia, eventos: [e] })
  }
  return grupos
}

function Evento({ evento }: { evento: AuditEvent }) {
  const categoria = CATEGORIAS_AUDITORIA.find((c) => c.valor === evento.category)?.rotulo
  const contexto = [evento.scenario ? `Cenário ${evento.scenario.nome}` : null, evento.field].filter(Boolean).join(' • ')
  const textoLongo = (evento.previousValue?.length ?? 0) > 40 || (evento.newValue?.length ?? 0) > 40

  return (
    <li className="relative grid grid-cols-[52px_minmax(0,1fr)] gap-x-4 pb-5 last:pb-1">
      <time dateTime={evento.timestamp} title={formatarDataHora(evento.timestamp)} className="tabular pt-px text-right text-xs text-fg-3">
        {formatarHora(evento.timestamp)}
      </time>
      <div className="relative pl-5">
        <span
          aria-hidden="true"
          className={clsx('absolute top-[5px] left-0 h-2 w-2 rounded-full ring-4 ring-surface', TOM_ACAO[evento.action])}
        />
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="text-[13px] font-medium text-fg">{evento.summary}</p>
          <span className="rounded-md bg-hover px-1.5 py-px text-[11px] text-fg-2">{ROTULO_ACAO[evento.action]}</span>
          {categoria && <span className="text-[11px] text-fg-3">{categoria}</span>}
        </div>
        {contexto && <p className="mt-0.5 text-xs text-fg-2">{contexto}</p>}
        {(evento.previousValue || evento.newValue) &&
          (textoLongo ? (
            <div className="mt-1.5 flex flex-col gap-1 rounded-lg bg-surface-muted px-3 py-2 text-xs leading-relaxed">
              {evento.previousValue && (
                <p className="text-fg-3">
                  <span className="sr-only">Antes: </span>
                  <del>{evento.previousValue}</del>
                </p>
              )}
              {evento.newValue && (
                <p className="text-fg">
                  <span className="sr-only">Depois: </span>
                  {evento.newValue}
                </p>
              )}
            </div>
          ) : (
            <p className="tabular mt-1 flex flex-wrap items-center gap-1.5 text-[13px]">
              {evento.previousValue && (
                <>
                  <span className="sr-only">De </span>
                  <span className="text-fg-3 line-through decoration-fg-3/60">{evento.previousValue}</span>
                  <span aria-hidden="true" className="text-fg-3">
                    →
                  </span>
                  <span className="sr-only"> para </span>
                </>
              )}
              {evento.newValue && <span className="font-medium text-fg">{evento.newValue}</span>}
            </p>
          ))}
        <p className="mt-1 text-xs text-fg-3">por {evento.user.nome}</p>
      </div>
    </li>
  )
}

export function AuditTimeline({ eventos, agora }: { eventos: AuditEvent[]; agora: Date }) {
  const grupos = agruparPorDia(eventos, agora)
  return (
    <div className="flex flex-col gap-6">
      {grupos.map((g) => (
        <section key={g.dia} aria-label={g.dia}>
          <h3 className="mb-3 text-xs font-medium text-fg-2">
            {g.dia}
          </h3>
          <ol className="relative before:absolute before:top-2 before:bottom-2 before:left-[71.5px] before:w-px before:bg-line">
            {g.eventos.map((e) => (
              <Evento key={e.id} evento={e} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
