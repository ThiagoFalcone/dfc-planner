import type { CenarioComputado } from '@/hooks/usePlanner'
import { nomeCurto } from '@/domain/scenario/types'
import { SegmentedControl } from '@/components/ui/SegmentedControl'

export function CorCenario({ cor }: { cor: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-2 w-2 shrink-0 rounded-full"
      style={{ background: `var(--series-${cor}, var(--text-tertiary))` }}
    />
  )
}

export function ScenarioSwitcher({
  cenarios,
  ativoId,
  onChange,
}: {
  cenarios: CenarioComputado[]
  ativoId: string
  onChange(id: string): void
}) {
  return (
    <div className="scrollbar-thin -mx-1 max-w-full overflow-x-auto px-1 py-0.5">
      <SegmentedControl
        rotulo="Cenário ativo"
        valor={ativoId}
        onChange={onChange}
        opcoes={cenarios.map((c) => ({
          valor: c.editavel.id,
          rotulo: (
            <>
              <CorCenario cor={c.editavel.cor} />
              {nomeCurto(c.editavel.nome)}
            </>
          ),
          indicador:
            c.problemas.length > 0 ? (
              <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-negative px-1 text-[10px] font-semibold text-white">
                {c.problemas.length}
                <span className="sr-only"> campos com problema</span>
              </span>
            ) : undefined,
        }))}
      />
    </div>
  )
}
