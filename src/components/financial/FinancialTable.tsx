import clsx from 'clsx'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { CampoInvalido, PeriodoInput, ResultadoPeriodo } from '@/types'
import type { CampoNumerico } from '@/hooks/usePlanner'
import { ROTULO_CAMPO } from '@/hooks/usePlanner'
import { paraNumero } from '@/lib/calculos'
import { formatarNumero, normalizarEntradaMonetaria, rotuloMes } from '@/lib/formato'
import { lerBlocoColado } from '@/lib/importar'
import { Icon } from '@/components/ui/Icon'
import { DerivedValue } from './DerivedValue'

const COLUNAS: ReadonlyArray<{ campo: CampoNumerico; rotulo: string; sinal: '+' | '−' }> = [
  { campo: 'receitas', rotulo: 'Receitas', sinal: '+' },
  { campo: 'despesas', rotulo: 'Despesas', sinal: '−' },
  { campo: 'investimentos', rotulo: 'Investimento', sinal: '−' },
  { campo: 'tributos', rotulo: 'Tributos', sinal: '−' },
  { campo: 'residual', rotulo: 'Residual', sinal: '+' },
]

interface Posicao {
  linha: number
  coluna: number
}

export function FinancialTable({
  periodos,
  resultados,
  problemas,
  onCommit,
  onRemoverMes,
  onAdicionarMes,
  onColar,
}: {
  periodos: PeriodoInput[]
  resultados: ResultadoPeriodo[]
  problemas: CampoInvalido[]
  onCommit(mes: number, campo: CampoNumerico, valor: string): void
  onRemoverMes(mes: number): void
  onAdicionarMes(): void
  /** Bloco colado de uma planilha, a partir da célula ativa (linha = índice do mês na tabela). */
  onColar(linha: number, coluna: number, bloco: string[][]): void
}) {
  const [ativo, setAtivo] = useState<Posicao>({ linha: 0, coluna: 0 })
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState('')
  const celulas = useRef(new Map<string, HTMLTableCellElement>())
  const focarAoRenderizar = useRef(false)
  // Edição iniciada digitando mantém o caractere; por clique/Enter seleciona tudo.
  const iniciouDigitando = useRef(false)

  const totalLinhas = periodos.length
  const posicaoValida = {
    linha: Math.min(ativo.linha, Math.max(0, totalLinhas - 1)),
    coluna: ativo.coluna,
  }

  useEffect(() => {
    if (!focarAoRenderizar.current || editando) return
    focarAoRenderizar.current = false
    celulas.current.get(`${posicaoValida.linha}:${posicaoValida.coluna}`)?.focus()
  })

  const problemaPara = (mes: number, campo: CampoNumerico) =>
    problemas.find((p) => p.mes === mes && p.campo === campo)
  const resultadoPara = (mes: number) => resultados.find((r) => r.mes === mes)

  function mover(linha: number, coluna: number) {
    focarAoRenderizar.current = true
    setAtivo({
      linha: Math.max(0, Math.min(totalLinhas - 1, linha)),
      coluna: Math.max(0, Math.min(COLUNAS.length - 1, coluna)),
    })
  }

  /** Tab/Shift+Tab percorrem a planilha linha a linha; nas bordas o foco sai da tabela. */
  function moverSequencial(e: KeyboardEvent, direcao: 1 | -1): boolean {
    const indice = posicaoValida.linha * COLUNAS.length + posicaoValida.coluna + direcao
    if (indice < 0 || indice >= totalLinhas * COLUNAS.length) return false
    e.preventDefault()
    mover(Math.floor(indice / COLUNAS.length), indice % COLUNAS.length)
    return true
  }

  function iniciarEdicao(valorInicial: string, digitando = false) {
    iniciouDigitando.current = digitando
    setRascunho(valorInicial)
    setEditando(true)
  }

  function confirmar() {
    const periodo = periodos[posicaoValida.linha]
    if (periodo) onCommit(periodo.mes, COLUNAS[posicaoValida.coluna].campo, normalizarEntradaMonetaria(rascunho))
    setEditando(false)
  }

  function cancelar() {
    setEditando(false)
    focarAoRenderizar.current = true
  }

  function onKeyDownCelula(e: KeyboardEvent<HTMLTableCellElement>, valorBruto: string) {
    if (editando) return
    const { linha, coluna } = posicaoValida
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        return mover(linha - 1, coluna)
      case 'ArrowDown':
        e.preventDefault()
        return mover(linha + 1, coluna)
      case 'ArrowLeft':
        e.preventDefault()
        return mover(linha, coluna - 1)
      case 'ArrowRight':
        e.preventDefault()
        return mover(linha, coluna + 1)
      case 'Home':
        e.preventDefault()
        return mover(linha, 0)
      case 'End':
        e.preventDefault()
        return mover(linha, COLUNAS.length - 1)
      case 'Tab':
        moverSequencial(e, e.shiftKey ? -1 : 1)
        return
      case 'Enter':
      case 'F2':
        e.preventDefault()
        return iniciarEdicao(valorBruto)
      case 'Backspace':
      case 'Delete':
        e.preventDefault()
        return iniciarEdicao('', true)
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault()
          iniciarEdicao(e.key, true)
        }
    }
  }

  function onKeyDownEditor(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      confirmar()
      mover(posicaoValida.linha + (e.shiftKey ? -1 : 1), posicaoValida.coluna)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      cancelar()
    } else if (e.key === 'Tab') {
      confirmar()
      if (!moverSequencial(e, e.shiftKey ? -1 : 1)) focarAoRenderizar.current = false
    }
  }

  const saldoFinal = resultados.length ? resultados[resultados.length - 1].acumulado : null
  const totais = COLUNAS.map(({ campo }) => {
    const valores = periodos.map((p) => paraNumero(p[campo]))
    return valores.some(Number.isNaN) ? null : valores.reduce((a, b) => a + b, 0)
  })

  return (
    <div className="overflow-hidden rounded-[18px] border border-line bg-surface">
      <div className="scrollbar-thin relative max-h-[min(72vh,680px)] overflow-auto">
        <table
          role="grid"
          aria-label="Planejamento mensal do cenário ativo"
          aria-rowcount={totalLinhas + 2}
          onPaste={(e) => {
            if (editando) return
            const texto = e.clipboardData.getData('text/plain')
            if (!texto) return
            e.preventDefault()
            onColar(posicaoValida.linha, posicaoValida.coluna, lerBlocoColado(texto))
          }}
          className="w-full min-w-[880px] border-separate border-spacing-0 text-[13px]"
        >
          <thead className="sticky top-0 z-20">
            <tr className="text-[11px] text-fg-3">
              <th className="sticky left-0 z-10 bg-surface-muted" aria-hidden="true" />
              <th colSpan={COLUNAS.length} scope="colgroup" className="bg-surface-muted px-3 pt-2.5 text-left font-medium">
                Informado
              </th>
              <th colSpan={2} scope="colgroup" className="bg-derived px-3 pt-2.5 text-left font-medium">
                <span className="inline-flex items-center gap-1">
                  <span className="font-serif italic">ƒ</span> Calculado
                </span>
              </th>
              <th className="bg-surface-muted" aria-hidden="true" />
            </tr>
            <tr className="text-left text-xs text-fg-2">
              <th scope="col" className="sticky left-0 z-10 border-b border-line bg-surface-muted px-4 py-2 font-medium">
                Mês
              </th>
              {COLUNAS.map((c) => (
                <th key={c.campo} scope="col" className="border-b border-line bg-surface-muted px-3 py-2 text-right font-medium">
                  <span className="mr-1 text-fg-3 tabular" aria-label={c.sinal === '+' ? 'entrada' : 'saída'}>
                    {c.sinal}
                  </span>
                  {c.rotulo}
                </th>
              ))}
              <th scope="col" className="border-b border-line bg-derived px-3 py-2 text-right font-medium">
                Fluxo
              </th>
              <th scope="col" className="border-b border-line bg-derived px-3 py-2 text-right font-medium">
                Acumulado
              </th>
              <th scope="col" className="w-10 border-b border-line bg-surface-muted">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {periodos.map((p, linha) => {
              const resultado = resultadoPara(p.mes)
              return (
                <tr key={p.mes} className="group">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-b border-line bg-surface px-4 py-0 text-left font-medium text-fg-2 group-hover:bg-surface-muted"
                  >
                    {rotuloMes(p.mes)}
                  </th>
                  {COLUNAS.map((c, coluna) => {
                    const bruto = p[c.campo]
                    const numero = paraNumero(bruto)
                    const problema = problemaPara(p.mes, c.campo)
                    const eAtivo = posicaoValida.linha === linha && posicaoValida.coluna === coluna
                    const emEdicao = eAtivo && editando
                    const idProblema = problema ? `problema-${p.mes}-${c.campo}` : undefined
                    return (
                      <td
                        key={c.campo}
                        ref={(el) => {
                          if (el) celulas.current.set(`${linha}:${coluna}`, el)
                          else celulas.current.delete(`${linha}:${coluna}`)
                        }}
                        role="gridcell"
                        tabIndex={eAtivo && !editando ? 0 : -1}
                        aria-selected={eAtivo}
                        aria-invalid={problema ? true : undefined}
                        aria-describedby={idProblema}
                        aria-label={`${ROTULO_CAMPO[c.campo]}, ${rotuloMes(p.mes)}: ${Number.isNaN(numero) ? 'valor inválido' : formatarNumero(numero)}`}
                        onFocus={() => {
                          if (!eAtivo) setAtivo({ linha, coluna })
                        }}
                        onClick={() => {
                          if (!emEdicao) {
                            setAtivo({ linha, coluna })
                            iniciarEdicao(bruto)
                          }
                        }}
                        onKeyDown={(e) => onKeyDownCelula(e, bruto)}
                        title={problema?.motivo}
                        className={clsx(
                          'relative h-10 cursor-cell border-b border-line p-0 text-right outline-none',
                          'transition-[background-color,box-shadow] duration-100',
                          problema
                            ? 'bg-negative-soft shadow-[inset_0_0_0_1.5px_var(--negative)]'
                            : 'group-hover:bg-surface-muted hover:!bg-hover',
                          !emEdicao && 'focus:shadow-[inset_0_0_0_1.5px_var(--accent)]',
                          emEdicao && 'shadow-[inset_0_0_0_2px_var(--accent)] !bg-surface',
                        )}
                      >
                        {emEdicao ? (
                          <input
                            autoFocus
                            aria-label={`Editar ${ROTULO_CAMPO[c.campo].toLowerCase()}, ${rotuloMes(p.mes)}`}
                            inputMode="decimal"
                            value={rascunho}
                            onChange={(e) => setRascunho(e.target.value)}
                            onKeyDown={onKeyDownEditor}
                            onBlur={() => editando && confirmar()}
                            onFocus={(e) => {
                              const el = e.currentTarget
                              if (iniciouDigitando.current) el.setSelectionRange(el.value.length, el.value.length)
                              else el.select()
                            }}
                            className="tabular h-full w-full bg-transparent px-3 text-right text-[13px] text-fg outline-none"
                          />
                        ) : (
                          <span
                            className={clsx(
                              'tabular block px-3',
                              problema ? 'text-negative' : numero === 0 ? 'text-fg-3' : 'text-fg',
                            )}
                          >
                            {Number.isNaN(numero) ? bruto || 'vazio' : formatarNumero(numero)}
                          </span>
                        )}
                        {problema && (
                          <>
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute top-0 right-0 h-0 w-0 border-t-[7px] border-l-[7px] border-t-negative border-l-transparent"
                            />
                            <span id={idProblema} className="sr-only">
                              {problema.motivo}
                            </span>
                          </>
                        )}
                      </td>
                    )
                  })}
                  <td role="gridcell" aria-readonly="true" className="border-b border-line bg-derived px-3 text-right">
                    <DerivedValue valor={resultado?.fluxo} />
                  </td>
                  <td role="gridcell" aria-readonly="true" className="border-b border-line bg-derived px-3 text-right">
                    <DerivedValue valor={resultado?.acumulado} destaque />
                  </td>
                  <td className="border-b border-line px-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoverMes(p.mes)}
                      disabled={periodos.length <= 1}
                      aria-label={`Remover ${rotuloMes(p.mes)}`}
                      title={`Remover ${rotuloMes(p.mes)}`}
                      className="focus-ring rounded-md p-1.5 text-fg-3 opacity-0 transition-opacity duration-100 group-hover:opacity-100 hover:bg-negative-soft hover:text-negative focus-visible:opacity-100 disabled:hidden"
                    >
                      <Icon nome="lixeira" className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="text-[13px]">
              <th scope="row" className="sticky left-0 z-10 bg-surface-muted px-4 py-2.5 text-left font-medium text-fg-2">
                Total
              </th>
              {totais.map((t, i) => (
                <td key={COLUNAS[i].campo} className="tabular bg-surface-muted px-3 text-right font-medium text-fg-2">
                  {t === null ? '—' : formatarNumero(t)}
                </td>
              ))}
              <td className="bg-derived px-3 text-right">
                <DerivedValue valor={saldoFinal ?? undefined} />
              </td>
              <td className="bg-derived px-3 text-right">
                <span className="sr-only">Saldo final: </span>
                <DerivedValue valor={saldoFinal ?? undefined} destaque />
              </td>
              <td className="bg-surface-muted" />
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-3 py-2">
        <button
          type="button"
          onClick={onAdicionarMes}
          className="focus-ring inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-accent hover:bg-accent-soft"
        >
          <Icon nome="mais" className="h-4 w-4" />
          Adicionar mês
        </button>
        <p className="hidden items-center gap-3 text-xs text-fg-3 md:flex">
          <span>
            <Kbd>Enter</Kbd> edita e confirma
          </span>
          <span>
            <Kbd>Tab</Kbd> próxima célula
          </span>
          <span>
            <Kbd>Esc</Kbd> cancela
          </span>
          <span>
            <Kbd>←↑→↓</Kbd> navega
          </span>
          <span>
            <Kbd>Ctrl V</Kbd> cola do Excel
          </span>
        </p>
      </div>
    </div>
  )
}

export function Kbd({ children }: { children: string }) {
  return (
    <kbd className="mr-1 inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-line-strong bg-surface px-1 font-mono text-[10.5px] text-fg-2">
      {children}
    </kbd>
  )
}
