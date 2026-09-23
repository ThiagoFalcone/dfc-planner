import { useCallback, useMemo, useState } from 'react'
import {
  calcularIndicadores,
  calcularResultados,
  paraNumero,
  validarPeriodos,
} from '@/lib/calculos'
import { cenarioExemploEdutask, criarCenarioEmBranco } from '@/data/exemploEdutask'
import type {
  CampoInvalido,
  Cenario,
  IndicadoresFluxoCaixa,
  Periodo,
  PeriodoInput,
  ResultadoPeriodo,
} from '@/types'

function periodoParaInput(p: Periodo): PeriodoInput {
  return {
    mes: p.mes,
    receitas: String(p.receitas),
    despesas: String(p.despesas),
    investimentos: String(p.investimentos),
    tributos: String(p.tributos),
    residual: String(p.residual),
  }
}

function cenarioParaInput(c: Cenario): CenarioEditavel {
  return {
    id: c.id,
    nome: c.nome,
    descricaoPremissas: c.descricaoPremissas,
    periodos: c.periodos.map(periodoParaInput),
  }
}

export interface CenarioEditavel {
  id: string
  nome: string
  descricaoPremissas: string
  periodos: PeriodoInput[]
}

export interface CenarioComputado {
  editavel: CenarioEditavel
  periodosNumericos: Periodo[]
  problemas: CampoInvalido[]
  resultados: ResultadoPeriodo[]
  indicadores: IndicadoresFluxoCaixa | null
}

function computar(editavel: CenarioEditavel): CenarioComputado {
  const periodosNumericos: Periodo[] = editavel.periodos.map((p) => ({
    mes: p.mes,
    receitas: paraNumero(p.receitas),
    despesas: paraNumero(p.despesas),
    investimentos: paraNumero(p.investimentos),
    tributos: paraNumero(p.tributos),
    residual: paraNumero(p.residual),
  }))
  const problemas = validarPeriodos(periodosNumericos)
  if (problemas.length > 0) {
    return { editavel, periodosNumericos, problemas, resultados: [], indicadores: null }
  }
  const resultados = calcularResultados(periodosNumericos)
  const indicadores = calcularIndicadores(resultados)
  return { editavel, periodosNumericos, problemas, resultados, indicadores }
}

function variarReceitas(cenario: Cenario, id: string, nome: string, percentual: number, descricaoPremissas: string): Cenario {
  return {
    id,
    nome,
    descricaoPremissas,
    periodos: cenario.periodos.map((p) => ({
      ...p,
      receitas: Math.round(p.receitas * (1 + percentual / 100) * 100) / 100,
    })),
  }
}

const CENARIOS_INICIAIS: CenarioEditavel[] = [
  cenarioParaInput({ ...cenarioExemploEdutask, id: 'base', nome: 'Cenário base' }),
  cenarioParaInput(
    variarReceitas(
      cenarioExemploEdutask,
      'pessimista',
      'Cenário pessimista',
      -20,
      'Igual ao cenário base, com receitas 20% menores (demanda mais lenta que o previsto). Demais entradas inalteradas.',
    ),
  ),
  cenarioParaInput(
    variarReceitas(
      cenarioExemploEdutask,
      'otimista',
      'Cenário otimista',
      20,
      'Igual ao cenário base, com receitas 20% maiores (adoção mais rápida que o previsto). Demais entradas inalteradas.',
    ),
  ),
]


export function usePlanner() {
  const [cenarios, setCenarios] = useState<CenarioEditavel[]>(CENARIOS_INICIAIS)
  const [cenarioAtivoId, setCenarioAtivoId] = useState('base')

  const computados = useMemo(() => cenarios.map(computar), [cenarios])
  const ativo = computados.find((c) => c.editavel.id === cenarioAtivoId) ?? computados[0]

  const atualizarCampo = useCallback(
    (cenarioId: string, mes: number, campo: keyof Omit<PeriodoInput, 'mes'>, valor: string) => {
      setCenarios((atual) =>
        atual.map((c) =>
          c.id !== cenarioId
            ? c
            : {
                ...c,
                periodos: c.periodos.map((p) => (p.mes === mes ? { ...p, [campo]: valor } : p)),
              },
        ),
      )
    },
    [],
  )

  const adicionarMes = useCallback((cenarioId: string) => {
    setCenarios((atual) =>
      atual.map((c) => {
        if (c.id !== cenarioId) return c
        const proximoMes = c.periodos.length
          ? Math.max(...c.periodos.map((p) => p.mes)) + 1
          : 0
        return {
          ...c,
          periodos: [
            ...c.periodos,
            {
              mes: proximoMes,
              receitas: '0',
              despesas: '0',
              investimentos: '0',
              tributos: '0',
              residual: '0',
            },
          ],
        }
      }),
    )
  }, [])

  const removerMes = useCallback((cenarioId: string, mes: number) => {
    setCenarios((atual) =>
      atual.map((c) =>
        c.id !== cenarioId ? c : { ...c, periodos: c.periodos.filter((p) => p.mes !== mes) },
      ),
    )
  }, [])

  const carregarExemplo = useCallback((cenarioId: string) => {
    setCenarios((atual) =>
      atual.map((c) =>
        c.id !== cenarioId
          ? c
          : {
              ...c,
              periodos: cenarioExemploEdutask.periodos.map(periodoParaInput),
              descricaoPremissas: cenarioExemploEdutask.descricaoPremissas,
            },
      ),
    )
  }, [])

  const zerarCenario = useCallback((cenarioId: string) => {
    setCenarios((atual) =>
      atual.map((c) => {
        if (c.id !== cenarioId) return c
        const vazio = criarCenarioEmBranco(c.id, c.nome)
        return { ...c, periodos: vazio.periodos.map(periodoParaInput), descricaoPremissas: '' }
      }),
    )
  }, [])

  const atualizarPremissas = useCallback((cenarioId: string, texto: string) => {
    setCenarios((atual) =>
      atual.map((c) => (c.id !== cenarioId ? c : { ...c, descricaoPremissas: texto })),
    )
  }, [])

  const aplicarVariacaoPercentual = useCallback(
    (cenarioId: string, baseId: string, percentualReceita: number) => {
      setCenarios((atual) => {
        const base = atual.find((c) => c.id === baseId)
        if (!base) return atual
        return atual.map((c) =>
          c.id !== cenarioId
            ? c
            : {
                ...c,
                periodos: base.periodos.map((p) => ({
                  ...p,
                  receitas: String(
                    Math.round(paraNumero(p.receitas) * (1 + percentualReceita / 100) * 100) /
                      100 || 0,
                  ),
                })),
              },
        )
      })
    },
    [],
  )

  return {
    cenarios: computados,
    cenarioAtivo: ativo,
    cenarioAtivoId,
    setCenarioAtivoId,
    atualizarCampo,
    adicionarMes,
    removerMes,
    carregarExemplo,
    zerarCenario,
    atualizarPremissas,
    aplicarVariacaoPercentual,
  }
}
