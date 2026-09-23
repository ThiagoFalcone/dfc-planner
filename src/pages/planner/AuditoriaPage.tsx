import { useMemo, useState } from 'react'
import { useAudit } from '@/audit/AuditContext'
import { useAgora } from '@/hooks/useAgora'
import { exportarHistoricoJSON } from '@/lib/exportar'
import { Button } from '@/components/ui/Button'
import { Surface } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { Modal } from '@/components/ui/Modal'
import { AuditTimeline } from '@/components/audit/AuditTimeline'
import { AuditFilters, FILTROS_INICIAIS, aplicarFiltros, type FiltrosAuditoria } from '@/components/audit/AuditFilters'

export function AuditoriaPage() {
  const { eventos, limpar } = useAudit()
  const agora = useAgora(60_000)
  const [filtros, setFiltros] = useState<FiltrosAuditoria>(FILTROS_INICIAIS)
  const [confirmarLimpeza, setConfirmarLimpeza] = useState(false)

  const filtrados = useMemo(() => aplicarFiltros(eventos, filtros, agora), [eventos, filtros, agora])
  const contagem = useMemo(() => {
    const base = aplicarFiltros(eventos, filtros, agora, true)
    const porCategoria: Record<string, number> = { todas: base.length }
    for (const e of base) porCategoria[e.category] = (porCategoria[e.category] ?? 0) + 1
    return porCategoria
  }, [eventos, filtros, agora])

  const filtrando = JSON.stringify(filtros) !== JSON.stringify(FILTROS_INICIAIS)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-3 rounded-[18px] border border-line bg-surface-muted px-4 py-3.5 text-[13px] leading-relaxed text-fg-2">
        <Icon nome="escudo" className="mt-0.5 h-4 w-4 shrink-0 text-fg-3" />
        <p>
          <span className="font-medium text-fg">Registro local, não inviolável.</span> Os eventos ficam no armazenamento
          deste navegador e podem ser apagados por quem tem acesso a ele. Servem para rastrear o trabalho — o que mudou,
          quando e de quanto para quanto. Uma trilha de auditoria confiável exige gravação em servidor.
        </p>
      </div>

      <Surface className="p-5">
        <AuditFilters filtros={filtros} onChange={setFiltros} eventos={eventos} contagemPorCategoria={contagem} />
      </Surface>

      <Surface aria-labelledby="titulo-linha-tempo" className="px-5 pt-4 pb-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="titulo-linha-tempo" className="text-[15px] font-semibold tracking-[-0.01em] text-fg">
            {filtrados.length} {filtrados.length === 1 ? 'evento' : 'eventos'}
            {filtrando && <span className="font-normal text-fg-3"> de {eventos.length}</span>}
          </h2>
          <div className="flex items-center gap-1.5">
            {filtrando && (
              <Button size="sm" variant="ghost" onClick={() => setFiltros(FILTROS_INICIAIS)}>
                Limpar filtros
              </Button>
            )}
            <Button size="sm" variant="secondary" disabled={filtrados.length === 0} onClick={() => exportarHistoricoJSON(filtrados)}>
              <Icon nome="download" className="h-4 w-4" />
              Exportar histórico
            </Button>
            <Button size="sm" variant="ghost" className="text-negative" onClick={() => setConfirmarLimpeza(true)}>
              Apagar histórico
            </Button>
          </div>
        </div>

        {filtrados.length === 0 ? (
          <p className="py-12 text-center text-[13px] text-fg-3">
            {eventos.length === 0 ? 'Nenhuma alteração registrada ainda.' : 'Nenhum evento corresponde aos filtros.'}
          </p>
        ) : (
          <AuditTimeline eventos={filtrados} agora={agora} />
        )}
      </Surface>

      <Modal
        aberto={confirmarLimpeza}
        onFechar={() => setConfirmarLimpeza(false)}
        titulo="Apagar o histórico local?"
        descricao="Todos os eventos deste navegador serão removidos. Fica registrado um único evento informando a limpeza — por isso o histórico nunca parece contínuo quando não é."
        rodape={
          <>
            <Button size="sm" variant="ghost" onClick={() => setConfirmarLimpeza(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                limpar()
                setFiltros(FILTROS_INICIAIS)
                setConfirmarLimpeza(false)
              }}
            >
              Apagar histórico
            </Button>
          </>
        }
      />
    </div>
  )
}
