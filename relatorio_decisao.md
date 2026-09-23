# Relatório de decisão: Planejador de Fluxo de Caixa

> **Modelo/template.** Os números abaixo são os do exemplo de referência (EduTask)
> fornecido no enunciado, para ilustrar o formato. A equipe deve substituir pelo
> cenário que realmente analisou para a apresentação, mantendo a estrutura de até
> duas páginas.

**Equipe:** _(preencher)_ · **Turma:** _(preencher)_ · **Data:** _(preencher)_

## Problema

Uma equipe pretende lançar um produto e precisa saber quanto capital é necessário
para sustentar o projeto até ele se pagar, e em que mês (se algum) o investimento se
recupera, para decidir se lança agora, adia, ou busca capital adicional antes de
começar.

## Cenário analisado

Horizonte de 7 meses (mês 0 a mês 6). Investimento inicial de R$ 6.000 no mês 0;
despesas de operação de R$ 6.000 a R$ 8.000 por mês; receitas começam no mês 4
(R$ 12.000) e crescem até R$ 22.000 no mês 6; residual de R$ 5.000 recebido no mês 6.
Tributos considerados zero neste teste (dado do enunciado). Dados fictícios de
simulação, usados como referência; ver `modelo_calculos.md` para a tabela completa.

## Indicadores calculados

| Indicador | Valor |
|---|---|
| Maior déficit | R$ 28.000 (mês 3) |
| Necessidade de capital | R$ 28.000 |
| Mês de recuperação | Mês 6 |
| Saldo final do horizonte | R$ 8.000 |

## Alternativa defendida

Com as premissas declaradas, o projeto recupera o investimento dentro do próprio
horizonte de 7 meses avaliado, exigindo uma reserva de capital de R$ 28.000 para
atravessar o período de déficit (meses 0 a 5). Isso favorece lançar o projeto agora,
**desde que** esse capital esteja de fato disponível antes do início. A aplicação
não avalia o custo de captar esse valor, só o tamanho do déficit a cobrir.

## Principal risco

A análise de sensibilidade indica que uma queda de aproximadamente 16% nas receitas
mensais (mantendo despesas e investimento inalterados), ou um aumento de cerca de 19%
nas despesas mensais, já seria suficiente para que a recuperação deixasse de ocorrer
dentro deste horizonte de 7 meses. O maior risco identificado é, portanto, a receita
projetada a partir do mês 4 não se confirmar na velocidade prevista.

## Condição que mudaria a decisão

Se a receita real ficar 16% ou mais abaixo do projetado a partir do mês 4, ou se as
despesas de operação subirem 19% ou mais acima do projetado, o investimento deixa
de se recuperar dentro deste horizonte, e a decisão deveria ser reavaliada (adiar o
lançamento, revisar o escopo para reduzir despesa, ou estender o horizonte de análise
antes de decidir).

---

_Nenhuma afirmação acima é uma garantia sobre o futuro. São leituras condicionadas
às premissas declaradas neste documento e em `modelo_calculos.md`, válidas apenas
para o horizonte e os valores informados._
