# Evidências de teste

Cada linha abaixo é um teste automatizado que **realmente foi executado**
(`npx vitest run`) contra o núcleo de cálculo da Opção 3
(`src/lib/calculos.ts`, cobertura completa em `src/lib/calculos.test.ts`).
"Resultado obtido" não foi transcrito de memória: é o valor que a suíte
efetivamente retornou nesta execução — reproduza com o comando abaixo.

```bash
npm run test
```

Situação em **2026-09-29**: **90/90 testes passando** (13 arquivos), 0 falhas.
Comando usado para obter cada "resultado obtido" desta tabela:
`npx vitest run src/lib/calculos.test.ts`.

## Núcleo de cálculo (Opção 3) — `src/lib/calculos.test.ts`

| # | Categoria exigida | Teste (arquivo:linha) | Entrada | Resultado esperado | Resultado obtido | Situação |
|---|---|---|---|---|---|---|
| 1 | Caso normal | `calculos.test.ts:20` — fórmula do fluxo | receitas 10.000; despesas 4.000; investimentos 2.000; tributos 500; residual 0 | fluxo = 3.500 | fluxo = 3.500 | ✅ Aprovado |
| 2 | Caso limite | `calculos.test.ts:32` — todos os componentes zero | receitas, despesas, investimentos, tributos, residual = 0 | fluxo = 0 | fluxo = 0 | ✅ Aprovado |
| 3 | Caso normal (referência do enunciado) | `calculos.test.ts:49-77` — caso EduTask completo | Tabela mês 0–6 do EduTask (ver `modelo_calculos.md`) | maior déficit R$ 28.000 (mês 3); necessidade de capital R$ 28.000; saldo final R$ 8.000; recuperação no mês 6 | maior déficit R$ 28.000 (mês 3); necessidade de capital R$ 28.000; saldo final R$ 8.000; recuperação no mês 6 | ✅ Aprovado |
| 4 | Cenário desfavorável | `calculos.test.ts:82` — receita zerada a partir do mês 4 | Tabela do EduTask com `receitas = 0` do mês 4 em diante | `mesRecuperacao = null`; `houveDeficit = true`; saldo final negativo | `mesRecuperacao = null`; `houveDeficit = true`; saldo final negativo | ✅ Aprovado |
| 5 | Alteração de premissa | `calculos.test.ts:96` — aumento do residual do mês 6 | Caso EduTask com `residual[6]` alterado de 5.000 para 25.000 | acumulado do mês 6 sobe exatamente +20.000; meses 0–5 inalterados | acumulado do mês 6 sobe exatamente +20.000; meses 0–5 inalterados | ✅ Aprovado |
| 6 | Entrada inválida (campo vazio) | `calculos.test.ts:124` — `validarPeriodos` | receitas = `NaN` (campo vazio) | 1 problema sinalizado: mês 0, campo `receitas` | 1 problema sinalizado: mês 0, campo `receitas` | ✅ Aprovado |
| 7 | Entrada inválida (negativo) | `calculos.test.ts:132` — `validarPeriodos` | despesas = -100 | 1 problema sinalizado: campo `despesas` | 1 problema sinalizado: campo `despesas` | ✅ Aprovado |
| 8 | Caso limite | `calculos.test.ts:140` — receita zero em todos os meses | 2 meses, receitas = 0, despesas = 1.000 e 500 | necessidade de capital = 1.500; `mesRecuperacao = null` | necessidade de capital = 1.500; `mesRecuperacao = null` | ✅ Aprovado |
| 9 | Pegadinha do enunciado — recuperação | `calculos.test.ts:110-120` — saldo zero antes do primeiro desembolso | Mês 0 (tudo zero) → Mês 1 (déficit -5.000) → Mês 2 (recupera para 0) | `mesRecuperacao = 2` (o zero do mês 0 **não** conta) | `mesRecuperacao = 2` | ✅ Aprovado |
| 10 | Cenário desfavorável (reincidência) | `calculos.test.ts` — reincide negativo após recuperar | Mês 0 (déficit -5.000) → Mês 1 (recupera para 0) → Mês 2 (déficit -3.000 de novo) | `mesRecuperacao = 1`; `reincideNegativoAposRecuperacao = true` | `mesRecuperacao = 1`; `reincideNegativoAposRecuperacao = true` | ✅ Aprovado |
| 11 | Alteração de premissa (estável) | `calculos.test.ts` — recuperação sem reincidência | Mês 0 (déficit -5.000) → Mês 1 (recupera para 0) → Mês 2 (+1.000) | `mesRecuperacao = 1`; `reincideNegativoAposRecuperacao = false` | `mesRecuperacao = 1`; `reincideNegativoAposRecuperacao = false` | ✅ Aprovado |

Cobre as 5 categorias exigidas pelo enunciado (caso normal, limite, entrada
inválida, cenário desfavorável, alteração de premissa), com **11 verificações
automatizadas** do núcleo de cálculo — acima do mínimo de 3 pedido — mais as
duas pegadinhas do enunciado testadas explicitamente (#9 e #10).

## Conferência independente do agente (sem executar a aplicação)

Além da suíte automatizada, o caso de referência do EduTask foi conferido à
mão, linha a linha, sem depender do código: ver `modelo_calculos.md`, seção
"Caso conferido manualmente (independente do agente de IA)". Essa é a
verificação exigida no Passo 3 da atividade.

## Arquivo exportado pela aplicação (evidência)

`exemplos-exportados/exemplo-edutask.csv` e
`exemplos-exportados/exemplo-edutask.json` — gerados executando de verdade
`exportarCSV`/`exportarJSON` (`src/lib/exportar.ts`) contra o cenário de
referência do EduTask, não escritos à mão. Contêm entradas (períodos),
premissas (descrição + proveniência) e saídas (resultados + indicadores),
conforme exigido.

## Pendente (fora do escopo desta suíte automatizada)

Conforme já registrado em `registro_ia.md` e no README, falta à equipe:
resolver um segundo cenário próprio à mão (diferente do EduTask) e comparar
com o resultado da aplicação — essa é a segunda conferência independente,
exigida além da automatizada e da conferência do caso de referência já feita.
