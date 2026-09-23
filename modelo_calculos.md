# Modelo de cálculo: Planejador de Fluxo de Caixa (Opção 3)

Base: Aula 5 (Fluxo de Caixa: Fundamentos e Aplicação em Projetos de Software) e
Atividade Aula 5. Implementação em `src/lib/calculos.ts`, testada em
`src/lib/calculos.test.ts`.

## Moeda, unidade de tempo e horizonte

- **Moeda:** Real (R$). Todos os valores de entrada e saída estão nessa moeda; não há
  conversão de câmbio no modelo.
- **Unidade de tempo:** mês. O mês 0 representa o instante do investimento inicial /
  lançamento do projeto; não é "antes do projeto começar", é o próprio marco zero.
- **Horizonte mínimo:** do mês 0 ao mês 6 (sete períodos), conforme pedido pelo
  enunciado. A interface permite estender o horizonte adicionando meses.
- Entradas anuais e mensais não são misturadas: todos os campos desta aplicação são
  mensais.

## Variáveis de entrada (por mês k)

| Variável | Significado | Sinal ao digitar | Origem |
|---|---|---|---|
| `receitas[k]` | Recebimentos previstos no mês | Sempre ≥ 0 | Estimativa da equipe ou dado documentado |
| `despesas[k]` | Despesas de operação pagas no mês | Sempre ≥ 0 (o sinal negativo é aplicado pela fórmula, não pelo usuário) | Estimativa/orçamento |
| `investimentos[k]` | Desembolsos de capital (aquisição de ativos, setup) no mês | Sempre ≥ 0 | Orçamento do projeto |
| `tributos[k]` | Tributos pagos no mês (**valor absoluto em R$, não uma alíquota**) | Sempre ≥ 0 | Estimativa com taxa hipotética declarada, se aplicável |
| `residual[k]` | Valor residual recebido no mês (ex.: devolução de capital de giro, venda de ativo) | Sempre ≥ 0 | Premissa do cenário |

Nesta opção o pseudocódigo do enunciado já trata tributos como um valor monetário
lançado diretamente no fluxo (`... − tributos[k] ...`), diferente da Opção 2, que
aplica uma alíquota sobre a receita. Não há, portanto, campo de "taxa" nesta tela:
apenas valores em R$.

## Regra de cálculo

```
fluxo[k]     = receitas[k] − despesas[k] − investimentos[k] − tributos[k] + residual[k]
acumulado[k] = Σ fluxo[j], para j de 0 até k
```

`necessidade_capital = max(0, −min(acumulado))`
(o maior déficit em módulo, ou zero se o acumulado nunca fica negativo).

**Regra de recuperação:** após o primeiro mês em que `acumulado[k] < 0`, localiza-se o
primeiro mês posterior em que `acumulado[k] ≥ 0`. Um acumulado zero **antes** desse
primeiro déficit (por exemplo, um mês 0 sem nenhum lançamento) não conta como
recuperação: só é "recuperação" um retorno a zero ou mais depois de ter ficado
negativo. Se o acumulado nunca fica negativo, a pergunta "quando recupera" não se
aplica (não há o que recuperar). Se fica negativo e nunca mais volta a ≥ 0 dentro do
horizonte informado, o sistema informa explicitamente "não recupera no horizonte";
nunca trava nem inventa um mês.

## Precisão e apresentação

- Comparações monetárias usam tolerância de R$ 0,01 (constante `TOLERANCIA` em
  `calculos.ts`); o arredondamento acontece só na apresentação (`arredondar`), nunca
  durante os somatórios intermediários.
- Não há conversão para "menor inteiro de clientes" nesta opção (isso é específico da
  Opção 2, margem/equilíbrio de clientes); a Opção 3 trabalha só com valores
  monetários.

## Registro de cada desembolso uma única vez

Investimento inicial (mês 0) e despesas de operação são lançados em campos separados
e nunca somados automaticamente como se um fosse consequência do outro: o modelo não
presume que todo gasto inicial vira um "ativo contábil" nem duplica um mesmo
desembolso em duas colunas.

## Depreciação

Como o modelo registra diretamente recebimentos e pagamentos de caixa (regime de
caixa), depreciação **não** é somada como receita nem subtraída como despesa: ela só
apareceria em uma conversão de resultado contábil para caixa, que não é o que este
formulário faz (o dado de entrada já é o fluxo de caixa em si).

## Caso conferido manualmente (independente do agente de IA)

Dados de referência (EduTask, valores em reais, tributos = 0 em todos os meses):

| Mês | Receitas | Despesas | Invest. | Residual | Fluxo | Acumulado |
|---|---|---|---|---|---|---|
| 0 | 0 | 0 | 6.000 | 0 | −6.000 | −6.000 |
| 1 | 0 | 8.000 | 0 | 0 | −8.000 | −14.000 |
| 2 | 0 | 8.000 | 0 | 0 | −8.000 | −22.000 |
| 3 | 0 | 6.000 | 0 | 0 | −6.000 | −28.000 |
| 4 | 12.000 | 6.000 | 0 | 0 | 6.000 | −22.000 |
| 5 | 18.000 | 7.000 | 0 | 0 | 11.000 | −11.000 |
| 6 | 22.000 | 8.000 | 0 | 5.000 | 19.000 | 8.000 |

Conferência linha a linha (soma acumulada), independente da aplicação:

- Mês 0: 0 − 0 − 6.000 − 0 + 0 = **−6.000** ✓.
- Mês 1: acumulado anterior (−6.000) + (0 − 8.000) = **−14.000** ✓.
- Mês 2: −14.000 + (0 − 8.000) = **−22.000** ✓.
- Mês 3: −22.000 + (0 − 6.000) = **−28.000** ✓ → maior déficit, necessidade de capital
  = R$ 28.000.
- Mês 4: −28.000 + (12.000 − 6.000) = **−22.000** ✓ (ainda negativo).
- Mês 5: −22.000 + (18.000 − 7.000) = **−11.000** ✓ (ainda negativo).
- Mês 6: −11.000 + (22.000 − 8.000 + 5.000) = **8.000** ✓ → primeiro mês com acumulado
  ≥ 0 depois do déficit iniciado no mês 0 → **recuperação no mês 6**.

Esse resultado bate com o informado no enunciado (maior déficit R$ 28.000, saldo final
R$ 8.000, recuperação no mês 6) e é reproduzido automaticamente pelos testes em
`src/lib/calculos.test.ts` (bloco "caso de referência EduTask").

> **Sobre o capital de giro de R$ 3.000 mencionado no material:** o enunciado orienta
> manter o residual total informado (R$ 5.000) para reproduzir o teste, sem supor
> devolução automática superior ao giro investido. Nesta aplicação o residual do mês
> 6 é um campo de entrada explícito; a equipe deve declarar, na premissa do cenário,
> a composição desse valor (por exemplo: R$ 3.000 de capital de giro devolvido +
> R$ 2.000 de outro valor residual) quando for justificar o cenário na apresentação.

## Casos que não podem quebrar o programa

| Caso | Tratamento nesta aplicação |
|---|---|
| Receita zero em todos os meses | Calcula normalmente; necessidade de capital = soma das saídas não cobertas. |
| Campo obrigatório vazio | `validarPeriodos` sinaliza o campo (mês + nome do campo); indicadores não são calculados até a correção (RF09). |
| Ausência de recuperação | `encontrarRecuperacao` retorna `null` e a interface informa "não recupera no horizonte", nunca lança erro. |
| Valor negativo digitado por engano | Sinalizado como inválido (o sinal já é aplicado pela fórmula). |
| Acumulado zero apenas no mês inicial | Não conta como recuperação: só conta um retorno a zero **depois** do primeiro déficit. |

## Limites de validade deste modelo

- Não desconta os fluxos a valor presente (isso é o modelo da Opção 1, de VP/VF/VPL);
  aqui os valores são somados em caixa corrente, como pede o enunciado da Opção 3.
- Não simula juros sobre a necessidade de capital (o valor informado é o pico do
  déficit, sem custo de captação).
- Assume que todos os valores de um mês ocorrem "dentro" daquele mês, sem
  distribuição diária.
