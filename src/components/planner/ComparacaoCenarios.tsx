import clsx from 'clsx'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { formatarMoeda, rotuloMes } from '@/lib/formato'
import type { CenarioComputado } from '@/hooks/usePlanner'
import { GraficoComparacaoCenarios } from './GraficoComparacaoCenarios'

export function ComparacaoCenarios({ cenarios }: { cenarios: CenarioComputado[] }) {
  const comProblemas = cenarios.filter((c) => c.problemas.length > 0)
  const validos = cenarios.filter((c) => c.problemas.length === 0 && c.indicadores)

  const melhorRecuperacao = validos
    .filter((c) => c.indicadores?.mesRecuperacao !== null)
    .sort((a, b) => (a.indicadores!.mesRecuperacao as number) - (b.indicadores!.mesRecuperacao as number))[0]

  const menorNecessidade = [...validos].sort(
    (a, b) => a.indicadores!.necessidadeCapital - b.indicadores!.necessidadeCapital,
  )[0]

  return (
    <Card>
      <CardHeader
        title="Comparação de cenários"
        subtitle="Pessimista, base e otimista — mesma estrutura de meses, premissas de receita diferentes."
      />
      <CardBody className="flex flex-col gap-5">
        {comProblemas.length > 0 && (
          <Alert tone="warning" title="Alguns cenários têm campos pendentes">
            {comProblemas.map((c) => c.editavel.nome).join(', ')}{' '}
            {comProblemas.length === 1 ? 'não entra' : 'não entram'} na comparação até que os campos
            sinalizados na tabela do respectivo cenário sejam corrigidos.
          </Alert>
        )}

        {validos.length > 0 && <GraficoComparacaoCenarios cenarios={validos} />}

        <div className="overflow-hidden rounded-xl border border-ink-200">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-ink-50 text-left text-xs font-medium uppercase tracking-wide text-ink-500">
                <th className="px-4 py-2.5">Cenário</th>
                <th className="px-3 py-2.5 text-right">Maior déficit</th>
                <th className="px-3 py-2.5 text-right">Necessidade de capital</th>
                <th className="px-3 py-2.5 text-right">Recuperação</th>
                <th className="px-3 py-2.5 text-right">Saldo final</th>
              </tr>
            </thead>
            <tbody>
              {cenarios.map((c) => (
                <tr key={c.editavel.id} className="border-b border-ink-100 last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-ink-800">{c.editavel.nome}</td>
                  {c.problemas.length > 0 || !c.indicadores ? (
                    <td colSpan={4} className="px-3 py-2.5 text-right text-xs text-ink-400">
                      Campos pendentes de correção
                    </td>
                  ) : (
                    <>
                      <td
                        className={clsx(
                          'tabular px-3 py-2.5 text-right',
                          c.indicadores.houveDeficit ? 'text-negative' : 'text-ink-700',
                        )}
                      >
                        {c.indicadores.houveDeficit ? formatarMoeda(-c.indicadores.maiorDeficit) : '—'}
                      </td>
                      <td className="tabular px-3 py-2.5 text-right text-ink-700">
                        {formatarMoeda(c.indicadores.necessidadeCapital)}
                      </td>
                      <td
                        className={clsx(
                          'px-3 py-2.5 text-right font-medium',
                          c.indicadores.mesRecuperacao !== null ? 'text-positive' : 'text-negative',
                        )}
                      >
                        {!c.indicadores.houveDeficit
                          ? '—'
                          : c.indicadores.mesRecuperacao !== null
                            ? rotuloMes(c.indicadores.mesRecuperacao)
                            : 'Não recupera'}
                      </td>
                      <td
                        className={clsx(
                          'tabular px-3 py-2.5 text-right font-semibold',
                          c.indicadores.saldoFinal >= 0 ? 'text-positive' : 'text-negative',
                        )}
                      >
                        {formatarMoeda(c.indicadores.saldoFinal)}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {validos.length === cenarios.length && menorNecessidade && (
          <Alert tone="info" title="Leitura da comparação">
            "{menorNecessidade.editavel.nome}" é o cenário com menor necessidade de capital (
            {formatarMoeda(menorNecessidade.indicadores!.necessidadeCapital)}
            ).{' '}
            {melhorRecuperacao
              ? `"${melhorRecuperacao.editavel.nome}" é o que recupera o investimento mais cedo, no ${rotuloMes(
                  melhorRecuperacao.indicadores!.mesRecuperacao as number,
                )}.`
              : 'Nenhum dos cenários recupera o investimento dentro do horizonte informado.'}{' '}
            Essa leitura vale apenas para as premissas de receita, despesa e horizonte usadas em
            cada cenário — mudar qualquer uma delas pode alterar qual cenário é mais favorável.
          </Alert>
        )}
      </CardBody>
    </Card>
  )
}
