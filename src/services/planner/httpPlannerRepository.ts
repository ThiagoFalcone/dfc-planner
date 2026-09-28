import type { EstadoPlanner, ResumoProjeto } from '@/domain/scenario/types'
import { ApiError, apiFetch } from '@/lib/httpClient'

/**
 * Implementação real de persistência de planejamentos, consumindo a API.
 * Mesma forma do repositório local (listar/ativoId/definirAtivo/carregar/
 * salvar/excluir), agora assíncrona e sem parâmetro de usuário (o servidor
 * já sabe quem é, pelo token).
 */
export interface RepositorioProjetosAsync {
  listar(): Promise<ResumoProjeto[]>
  ativoId(): Promise<string | null>
  definirAtivo(id: string): Promise<void>
  carregar(id: string): Promise<EstadoPlanner | null>
  salvar(estado: EstadoPlanner): Promise<void>
  excluir(id: string): Promise<void>
}

export function criarRepositorioHttpProjetos(): RepositorioProjetosAsync {
  return {
    listar: () => apiFetch<ResumoProjeto[]>('/projetos'),

    async ativoId() {
      const resposta = await apiFetch<{ projetoId: string | null }>('/projetos/ativo')
      return resposta.projetoId
    },

    async definirAtivo(id) {
      await apiFetch('/projetos/ativo', { method: 'PUT', body: JSON.stringify({ projetoId: id }) })
    },

    async carregar(id) {
      try {
        return await apiFetch<EstadoPlanner>(`/projetos/${id}`)
      } catch (erro) {
        if (erro instanceof ApiError && erro.status === 404) return null
        throw erro
      }
    },

    async salvar(estado) {
      try {
        await apiFetch(`/projetos/${estado.id}`, { method: 'PUT', body: JSON.stringify(estado) })
      } catch (erro) {
        if (erro instanceof ApiError && erro.status === 404) {
          await apiFetch('/projetos', { method: 'POST', body: JSON.stringify(estado) })
          return
        }
        throw erro
      }
    },

    async excluir(id) {
      await apiFetch(`/projetos/${id}`, { method: 'DELETE' })
    },
  }
}
