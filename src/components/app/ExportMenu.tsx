import { Icon } from '@/components/ui/Icon'
import { MenuItem, MenuLabel, MenuSeparator, Popover } from '@/components/ui/Popover'

export type FormatoExportacao = 'csv' | 'json' | 'pdf'

/** Exportação do cenário ativo: dados (CSV/JSON) e relatório executivo para imprimir ou salvar em PDF. */
export function ExportMenu({ disponivel, onExportar }: { disponivel: boolean; onExportar(f: FormatoExportacao): void }) {
  const motivo = disponivel ? undefined : 'Corrija os valores pendentes'
  return (
    <Popover
      rotulo="Exportar"
      largura="w-72"
      trigger={(props) => (
        <button
          {...props}
          type="button"
          className="focus-ring inline-flex h-9 items-center gap-2 rounded-[10px] border border-line-strong bg-surface px-3 text-[13px] font-medium text-fg hover:bg-surface-muted"
        >
          <Icon nome="download" className="h-4 w-4" />
          Exportar
          <Icon nome="chevron" className="h-3.5 w-3.5 text-fg-3" />
        </button>
      )}
    >
      {(fechar) => (
        <>
          <MenuLabel>Cenário ativo</MenuLabel>
          <MenuItem
            icone={<Icon nome="planejamento" className="h-4 w-4" />}
            desabilitado={!disponivel}
            descricao={motivo ?? 'Entradas, fluxo e acumulado por mês'}
            onSelect={() => {
              fechar()
              onExportar('csv')
            }}
          >
            Planilha CSV
          </MenuItem>
          <MenuItem
            icone={<Icon nome="arquivo" className="h-4 w-4" />}
            desabilitado={!disponivel}
            descricao={motivo ?? 'Premissas, proveniência, resultados e indicadores'}
            onSelect={() => {
              fechar()
              onExportar('json')
            }}
          >
            JSON estruturado
          </MenuItem>
          <MenuSeparator />
          <MenuLabel>Relatório</MenuLabel>
          <MenuItem
            icone={<Icon nome="impressora" className="h-4 w-4" />}
            desabilitado={!disponivel}
            descricao={motivo ?? 'Indicadores, gráficos, premissas e leitura, para imprimir ou salvar em PDF'}
            onSelect={() => {
              fechar()
              onExportar('pdf')
            }}
          >
            Relatório executivo (PDF)
          </MenuItem>
        </>
      )}
    </Popover>
  )
}
