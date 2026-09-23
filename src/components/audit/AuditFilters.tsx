import clsx from 'clsx'
import { useId } from 'react'
import type { AuditAction, AuditCategory, AuditEvent } from '@/domain/audit/types'
import { CATEGORIAS_AUDITORIA, ROTULO_ACAO } from '@/domain/audit/types'
import { campoClasses } from '@/components/ui/TextField'

export type Periodo = 'tudo' | 'hoje' | '7d' | '30d'

export interface FiltrosAuditoria {
  categoria: AuditCategory | 'todas'
  usuario: string
  cenario: string
  periodo: Periodo
  acao: AuditAction | 'todas'
}

export const FILTROS_INICIAIS: FiltrosAuditoria = {
  categoria: 'todas',
  usuario: 'todos',
  cenario: 'todos',
  periodo: 'tudo',
  acao: 'todas',
}

export function aplicarFiltros(eventos: AuditEvent[], f: FiltrosAuditoria, agora: Date, ignorarCategoria = false): AuditEvent[] {
  const limite =
    f.periodo === 'hoje'
      ? new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime()
      : f.periodo === '7d'
        ? agora.getTime() - 7 * 86_400_000
        : f.periodo === '30d'
          ? agora.getTime() - 30 * 86_400_000
          : -Infinity
  return eventos.filter(
    (e) =>
      (ignorarCategoria || f.categoria === 'todas' || e.category === f.categoria) &&
      (f.usuario === 'todos' || e.user.id === f.usuario) &&
      (f.cenario === 'todos' || e.scenario?.id === f.cenario) &&
      (f.acao === 'todas' || e.action === f.acao) &&
      new Date(e.timestamp).getTime() >= limite,
  )
}

function Seletor<T extends string>({
  rotulo,
  valor,
  onChange,
  opcoes,
}: {
  rotulo: string
  valor: T
  onChange(v: T): void
  opcoes: ReadonlyArray<{ valor: T; rotulo: string }>
}) {
  const id = useId()
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="text-xs text-fg-3">
        {rotulo}
      </label>
      <select
        id={id}
        value={valor}
        onChange={(e) => onChange(e.target.value as T)}
        className={clsx(campoClasses, 'h-9 border-line-strong pr-8 text-[13px]')}
      >
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
    </div>
  )
}

export function AuditFilters({
  filtros,
  onChange,
  eventos,
  contagemPorCategoria,
}: {
  filtros: FiltrosAuditoria
  onChange(f: FiltrosAuditoria): void
  eventos: AuditEvent[]
  contagemPorCategoria: Record<string, number>
}) {
  const usuarios = Array.from(new Map(eventos.map((e) => [e.user.id, e.user.nome])).entries())
  const cenarios = Array.from(
    new Map(eventos.filter((e) => e.scenario).map((e) => [e.scenario!.id, e.scenario!.nome])).entries(),
  )
  const acoes = Array.from(new Set(eventos.map((e) => e.action)))
  const chips: Array<{ valor: FiltrosAuditoria['categoria']; rotulo: string }> = [
    { valor: 'todas', rotulo: 'Todos' },
    ...CATEGORIAS_AUDITORIA,
  ]

  return (
    <div className="flex flex-col gap-4">
      <div role="group" aria-label="Categoria" className="scrollbar-thin -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
        {chips.map((c) => {
          const ativo = filtros.categoria === c.valor
          const n = contagemPorCategoria[c.valor] ?? 0
          return (
            <button
              key={c.valor}
              type="button"
              aria-pressed={ativo}
              onClick={() => onChange({ ...filtros, categoria: c.valor })}
              className={clsx(
                'focus-ring inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors duration-120',
                ativo ? 'bg-fg text-surface' : 'bg-hover text-fg-2 hover:text-fg',
              )}
            >
              {c.rotulo}
              <span className={clsx('tabular text-xs', ativo ? 'opacity-70' : 'text-fg-3')}>{n}</span>
            </button>
          )
        })}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Seletor
          rotulo="Usuário"
          valor={filtros.usuario}
          onChange={(usuario) => onChange({ ...filtros, usuario })}
          opcoes={[{ valor: 'todos', rotulo: 'Todos' }, ...usuarios.map(([valor, rotulo]) => ({ valor, rotulo }))]}
        />
        <Seletor
          rotulo="Cenário"
          valor={filtros.cenario}
          onChange={(cenario) => onChange({ ...filtros, cenario })}
          opcoes={[{ valor: 'todos', rotulo: 'Todos' }, ...cenarios.map(([valor, rotulo]) => ({ valor, rotulo }))]}
        />
        <Seletor<Periodo>
          rotulo="Período"
          valor={filtros.periodo}
          onChange={(periodo) => onChange({ ...filtros, periodo })}
          opcoes={[
            { valor: 'tudo', rotulo: 'Todo o histórico' },
            { valor: 'hoje', rotulo: 'Hoje' },
            { valor: '7d', rotulo: 'Últimos 7 dias' },
            { valor: '30d', rotulo: 'Últimos 30 dias' },
          ]}
        />
        <Seletor<FiltrosAuditoria['acao']>
          rotulo="Ação"
          valor={filtros.acao}
          onChange={(acao) => onChange({ ...filtros, acao })}
          opcoes={[{ valor: 'todas', rotulo: 'Todas' }, ...acoes.map((a) => ({ valor: a, rotulo: ROTULO_ACAO[a] }))]}
        />
      </div>
    </div>
  )
}
