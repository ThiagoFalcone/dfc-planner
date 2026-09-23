import clsx from 'clsx'
import type { CampoInvalido, PeriodoInput, ResultadoPeriodo } from '@/types'
import { formatarMoeda } from '@/lib/formato'

const COLUNAS: Array<{ campo: keyof Omit<PeriodoInput, 'mes'>; rotulo: string; sinal: '+' | '-' }> = [
  { campo: 'receitas', rotulo: 'Recebimentos', sinal: '+' },
  { campo: 'despesas', rotulo: 'Despesas', sinal: '-' },
  { campo: 'investimentos', rotulo: 'Investimentos', sinal: '-' },
  { campo: 'tributos', rotulo: 'Tributos pagos', sinal: '-' },
  { campo: 'residual', rotulo: 'Residual', sinal: '+' },
]

export function TabelaMensal({
  periodos,
  resultados,
  problemas,
  onAlterarCampo,
  onRemoverMes,
  onAdicionarMes,
  somenteLeitura,
}: {
  periodos: PeriodoInput[]
  resultados: ResultadoPeriodo[]
  problemas: CampoInvalido[]
  onAlterarCampo: (mes: number, campo: keyof Omit<PeriodoInput, 'mes'>, valor: string) => void
  onRemoverMes: (mes: number) => void
  onAdicionarMes: () => void
  somenteLeitura?: boolean
}) {
  const problemaPara = (mes: number, campo: string) =>
    problemas.find((p) => p.mes === mes && p.campo === campo)

  const resultadoPara = (mes: number) => resultados.find((r) => r.mes === mes)

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-200">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs font-medium uppercase tracking-wide text-ink-500">
              <th className="sticky left-0 z-10 bg-ink-50 px-4 py-3">Mês</th>
              {COLUNAS.map((c) => (
                <th key={c.campo} className="px-3 py-3 text-right font-medium">
                  <span className="tabular text-ink-400">{c.sinal}</span> {c.rotulo}
                </th>
              ))}
              <th className="px-3 py-3 text-right font-medium">Fluxo</th>
              <th className="px-3 py-3 text-right font-medium">Acumulado</th>
              {!somenteLeitura && <th className="w-9 px-2 py-3" />}
            </tr>
          </thead>
          <tbody>
            {periodos.map((p) => {
              const resultado = resultadoPara(p.mes)
              return (
                <tr key={p.mes} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/60">
                  <td className="sticky left-0 z-10 bg-white px-4 py-2 font-medium text-ink-800">
                    {p.mes === 0 ? 'Mês 0' : p.mes}
                  </td>
                  {COLUNAS.map((c) => {
                    const problema = problemaPara(p.mes, c.campo)
                    return (
                      <td key={c.campo} className="px-2 py-1.5">
                        <input
                          type="text"
                          inputMode="decimal"
                          disabled={somenteLeitura}
                          value={p[c.campo]}
                          onChange={(e) => onAlterarCampo(p.mes, c.campo, e.target.value)}
                          aria-invalid={!!problema}
                          title={problema?.motivo}
                          className={clsx(
                            'tabular h-9 w-full rounded-lg border bg-white px-2 text-right text-sm outline-none transition-colors',
                            'focus:border-brand-500 focus:ring-2 focus:ring-brand-100',
                            'disabled:bg-ink-50 disabled:text-ink-400',
                            problema ? 'border-negative bg-red-50' : 'border-ink-200',
                          )}
                        />
                      </td>
                    )
                  })}
                  <td
                    className={clsx(
                      'tabular px-3 py-2 text-right font-medium',
                      !resultado ? 'text-ink-300' : resultado.fluxo < 0 ? 'text-negative' : 'text-ink-800',
                    )}
                  >
                    {resultado ? formatarMoeda(resultado.fluxo) : '—'}
                  </td>
                  <td
                    className={clsx(
                      'tabular px-3 py-2 text-right font-semibold',
                      !resultado ? 'text-ink-300' : resultado.acumulado < 0 ? 'text-negative' : 'text-positive',
                    )}
                  >
                    {resultado ? formatarMoeda(resultado.acumulado) : '—'}
                  </td>
                  {!somenteLeitura && (
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoverMes(p.mes)}
                        disabled={periodos.length <= 1}
                        aria-label={`Remover mês ${p.mes}`}
                        className="rounded-md p-1 text-ink-300 transition-colors hover:bg-red-50 hover:text-negative disabled:opacity-0"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path
                            fillRule="evenodd"
                            d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {!somenteLeitura && (
        <div className="border-t border-ink-100 bg-ink-50/60 px-4 py-2.5">
          <button
            type="button"
            onClick={onAdicionarMes}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 3a.75.75 0 01.75.75v5.5h5.5a.75.75 0 010 1.5h-5.5v5.5a.75.75 0 01-1.5 0v-5.5h-5.5a.75.75 0 010-1.5h5.5v-5.5A.75.75 0 0110 3z" />
            </svg>
            Adicionar mês
          </button>
        </div>
      )}
    </div>
  )
}
