import clsx from 'clsx'
import { useId, useState } from 'react'
import type { Insight, TomInsight } from '@/lib/insights'
import { Icon, type NomeIcone } from '@/components/ui/Icon'

const TOM: Record<TomInsight, { cor: string; icone: NomeIcone; rotulo: string }> = {
  positivo: { cor: 'text-positive', icone: 'check', rotulo: 'Favorável' },
  negativo: { cor: 'text-negative', icone: 'alerta', rotulo: 'Desfavorável' },
  atencao: { cor: 'text-warning', icone: 'alerta', rotulo: 'Atenção' },
  neutro: { cor: 'text-fg-3', icone: 'info', rotulo: 'Informativo' },
}

function ItemInsight({ insight }: { insight: Insight }) {
  const [regraAberta, setRegraAberta] = useState(false)
  const idRegra = useId()
  const tom = TOM[insight.tom]
  return (
    <li className="flex gap-3 py-3.5 first:pt-0 last:pb-0">
      <span className={clsx('mt-0.5 shrink-0', tom.cor)}>
        <Icon nome={tom.icone} className="h-4 w-4" />
        <span className="sr-only">{tom.rotulo}:</span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-fg">{insight.titulo}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-fg-2">{insight.texto}</p>
        <button
          type="button"
          aria-expanded={regraAberta}
          aria-controls={idRegra}
          onClick={() => setRegraAberta((v) => !v)}
          className="focus-ring mt-1 inline-flex items-center gap-1 rounded text-xs text-fg-3 hover:text-fg-2"
        >
          Como foi calculado
          <Icon nome="chevron" className={clsx('h-3.5 w-3.5 transition-transform duration-150', regraAberta && 'rotate-180')} />
        </button>
        {regraAberta && (
          <p id={idRegra} className="animate-fade-in mt-1 text-xs leading-relaxed text-fg-3">
            {insight.regra}
          </p>
        )}
      </div>
    </li>
  )
}

/** Leituras determinísticas — cada uma expõe a regra que a gerou. */
export function FinancialInsights({ insights }: { insights: Insight[] }) {
  return (
    <ul className="divide-y divide-line" aria-live="polite">
      {insights.map((i) => (
        <ItemInsight key={i.id} insight={i} />
      ))}
    </ul>
  )
}
