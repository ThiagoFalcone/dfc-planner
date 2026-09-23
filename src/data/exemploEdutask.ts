import type { Cenario } from '@/types'

/**
 * Dados de referência fornecidos no enunciado (EduTask, opção 3), usados como
 * "carregar exemplo" na interface e como fixture dos testes automatizados.
 * Valores em reais. Tributos iguais a zero neste teste. O valor residual de
 * R$ 5.000 no mês 6 é mantido como premissa do exemplo fornecido nas aulas
 * (capital de giro inicial de R$ 3.000 + complemento — ver modelo_calculos.md).
 *
 * Resultado esperado: maior déficit R$ 28.000 (mês 3), saldo final R$ 8.000,
 * recuperação no mês 6.
 */
export const cenarioExemploEdutask: Cenario = {
  id: 'exemplo-edutask',
  nome: 'Exemplo EduTask (referência do enunciado)',
  descricaoPremissas:
    'Dados de teste fornecidos pela disciplina. Tributos = 0 em todos os meses. Residual de R$ 5.000 no mês 6, mantido como premissa do material de aula (sem devolução automática superior ao giro investido).',
  periodos: [
    { mes: 0, receitas: 0, despesas: 0, investimentos: 6000, tributos: 0, residual: 0 },
    { mes: 1, receitas: 0, despesas: 8000, investimentos: 0, tributos: 0, residual: 0 },
    { mes: 2, receitas: 0, despesas: 8000, investimentos: 0, tributos: 0, residual: 0 },
    { mes: 3, receitas: 0, despesas: 6000, investimentos: 0, tributos: 0, residual: 0 },
    { mes: 4, receitas: 12000, despesas: 6000, investimentos: 0, tributos: 0, residual: 0 },
    { mes: 5, receitas: 18000, despesas: 7000, investimentos: 0, tributos: 0, residual: 0 },
    { mes: 6, receitas: 22000, despesas: 8000, investimentos: 0, tributos: 0, residual: 5000 },
  ],
}

/** Modelo em branco para começar um cenário novo: mês 0 a 6, tudo zerado. */
export function criarCenarioEmBranco(id: string, nome: string): Cenario {
  return {
    id,
    nome,
    descricaoPremissas: '',
    periodos: Array.from({ length: 7 }, (_, mes) => ({
      mes,
      receitas: 0,
      despesas: 0,
      investimentos: 0,
      tributos: 0,
      residual: 0,
    })),
  }
}
