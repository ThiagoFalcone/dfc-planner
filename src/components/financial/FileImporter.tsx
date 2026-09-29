import clsx from 'clsx'
import { useId, useRef, useState, type DragEvent } from 'react'
import { ErroImportacao, importarArquivo, type ResultadoImportacao } from '@/lib/importar'
import { paraNumero } from '@/lib/calculos'
import { formatarNumero, rotuloMes } from '@/lib/formato'
import { CAMPOS_NUMERICOS } from '@/types'
import { Icon } from '@/components/ui/Icon'

/**
 * Seleção de arquivo (clique ou arrastar) + leitura e pré-visualização.
 * Não altera nada: só entrega o resultado lido para quem chamou decidir.
 */
export function FileImporter({ onResultado }: { onResultado(r: ResultadoImportacao | null): void }) {
  const id = useId()
  const entrada = useRef<HTMLInputElement>(null)
  const [arrastando, setArrastando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ResultadoImportacao | null>(null)

  async function ler(arquivo: File | undefined) {
    if (!arquivo) return
    setErro(null)
    if (arquivo.size > 2_000_000) {
      setErro('Arquivo maior que 2 MB.')
      onResultado(null)
      return
    }
    try {
      const r = importarArquivo(arquivo.name, await arquivo.text())
      setResultado(r)
      onResultado(r)
    } catch (e) {
      setResultado(null)
      onResultado(null)
      setErro(e instanceof ErroImportacao ? e.message : 'Não foi possível ler o arquivo.')
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setArrastando(false)
    void ler(e.dataTransfer.files[0])
  }

  const invalidos = resultado
    ? resultado.periodos.reduce((n, p) => n + CAMPOS_NUMERICOS.filter((c) => Number.isNaN(paraNumero(p[c])) || paraNumero(p[c]) < 0).length, 0)
    : 0

  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault()
          setArrastando(true)
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={onDrop}
        className={clsx(
          'flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed px-4 py-6 text-center text-[13px] transition-colors',
          arrastando ? 'border-accent bg-accent-soft' : 'border-line-strong hover:bg-hover',
        )}
      >
        <Icon nome="upload" className="h-5 w-5 text-fg-3" />
        <span className="font-medium text-fg">Escolher arquivo ou arrastar aqui</span>
        <span className="text-xs text-fg-3">CSV (exportado pelo app ou planilha) ou JSON exportado pelo DFC Planner</span>
        <input
          ref={entrada}
          id={id}
          type="file"
          accept=".csv,.tsv,.txt,.json,text/csv,application/json"
          className="sr-only"
          onChange={(e) => void ler(e.target.files?.[0])}
        />
      </label>

      {erro && (
        <p role="alert" className="flex items-start gap-2 text-[13px] text-negative">
          <Icon nome="alerta" className="mt-0.5 h-4 w-4 shrink-0" />
          {erro}
        </p>
      )}

      {resultado && (
        <div className="rounded-xl bg-surface-muted px-3.5 py-3 text-[13px]">
          <p className="font-medium text-fg">
            {resultado.periodos.length} meses lidos ({rotuloMes(resultado.periodos[0].mes)} a{' '}
            {rotuloMes(resultado.periodos[resultado.periodos.length - 1].mes)})
          </p>
          <p className="mt-0.5 text-xs text-fg-3">
            Receitas no primeiro mês: {formatarNumero(paraNumero(resultado.periodos[0].receitas) || 0)} · Despesas:{' '}
            {formatarNumero(paraNumero(resultado.periodos[0].despesas) || 0)}
          </p>
          {invalidos > 0 && (
            <p className="mt-1 text-xs text-warning">
              {invalidos} {invalidos === 1 ? 'valor inválido será sinalizado' : 'valores inválidos serão sinalizados'} na
              planilha para correção.
            </p>
          )}
          {resultado.avisos.map((a) => (
            <p key={a} className="mt-1 text-xs text-fg-3">
              {a}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
