import { Modal } from '@/components/ui/Modal'
import { Kbd } from '@/components/financial/FinancialTable'

const GRUPOS: Array<{ titulo: string; itens: Array<[string[], string]> }> = [
  {
    titulo: 'Geral',
    itens: [
      [['Ctrl', 'K'], 'Paleta de comandos'],
      [['Ctrl', 'Z'], 'Desfazer a última alteração'],
      [['Ctrl', 'Shift', 'Z'], 'Refazer'],
      [['?'], 'Esta lista de atalhos'],
    ],
  },
  {
    titulo: 'Planilha de planejamento',
    itens: [
      [['Enter'], 'Editar a célula / confirmar e descer'],
      [['Esc'], 'Cancelar a edição'],
      [['Tab'], 'Confirmar e ir para a próxima célula'],
      [['Shift', 'Tab'], 'Célula anterior'],
      [['←↑→↓'], 'Navegar entre células'],
      [['Delete'], 'Apagar e editar a célula'],
      [['Ctrl', 'V'], 'Colar um bloco copiado do Excel ou Sheets'],
    ],
  },
]

export function ShortcutsModal({ aberto, onFechar }: { aberto: boolean; onFechar(): void }) {
  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Atalhos de teclado" descricao="No macOS, use ⌘ no lugar de Ctrl.">
      <div className="flex flex-col gap-5">
        {GRUPOS.map((g) => (
          <section key={g.titulo}>
            <h3 className="mb-1.5 text-xs font-medium text-fg-3">{g.titulo}</h3>
            <dl className="divide-y divide-line">
              {g.itens.map(([teclas, descricao]) => (
                <div key={descricao} className="flex items-center justify-between gap-4 py-2 text-[13px]">
                  <dt className="text-fg-2">{descricao}</dt>
                  <dd className="flex shrink-0 items-center">
                    {teclas.map((t) => (
                      <Kbd key={t}>{t}</Kbd>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Modal>
  )
}
