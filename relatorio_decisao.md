# Relatório de decisão: Planejador de Fluxo de Caixa

**Equipe:** Thiago Matheus Pinheiro, João Vítor Mamede, Gabriel Viana Nunes ·
**Turma:** Engenharia de Software, 8º período · **Data:** 29/09/2026

## Problema

Uma software house já opera um produto SaaS e avalia lançar um módulo pago novo
("Relatórios Avançados") como add-on dentro do produto existente. O time de
engenharia precisa saber quanto capital é necessário para sustentar o
desenvolvimento e a operação do módulo até ele se pagar sozinho, e em que mês (se
algum) esse investimento se recupera — para decidir se lança agora, adia, ou reserva
mais capital antes de começar.

## Cenário analisado

Horizonte de 7 meses (mês 0 a mês 6). Investimento inicial de R$ 18.000 no mês 0 (um
desenvolvedor sênior dedicado por ~6 semanas, mais ferramentas). Despesas de
operação constantes de R$ 2.000/mês do mês 1 ao mês 6 (infraestrutura de nuvem e
suporte adicional). O módulo entra em *early access* no fim do mês 1; a partir do
mês 2, receita de assinatura a R$ 300/cliente/mês, com adoção estimada de 10, 20,
30, 45 e 60 clientes pagantes nos meses 2 a 6, respectivamente (premissa da equipe,
inspirada em curvas típicas de adoção inicial de SaaS B2B — **não é um dado de
mercado real**, é uma estimativa para fins do exercício). Tributos com alíquota
hipotética de 10% sobre a receita, editável e declarada aqui (não representa uma
alíquota legal real, conforme exigido pelo enunciado). Sem valor residual: o
investimento inicial é inteiramente consumido em desenvolvimento, não há ativo a
devolver no fim do horizonte.

| Mês | Receitas | Despesas | Investimento | Tributos | Residual | Fluxo | Acumulado |
|---|---|---|---|---|---|---|---|
| 0 | 0 | 0 | 18.000 | 0 | 0 | −18.000 | −18.000 |
| 1 | 0 | 2.000 | 0 | 0 | 0 | −2.000 | −20.000 |
| 2 | 3.000 | 2.000 | 0 | 300 | 0 | 700 | −19.300 |
| 3 | 6.000 | 2.000 | 0 | 600 | 0 | 3.400 | −15.900 |
| 4 | 9.000 | 2.000 | 0 | 900 | 0 | 6.100 | −9.800 |
| 5 | 13.500 | 2.000 | 0 | 1.350 | 0 | 10.150 | 350 |
| 6 | 18.000 | 2.000 | 0 | 1.800 | 0 | 14.200 | 14.550 |

Cenário reproduzível na aplicação: planejamento "Lançamento do módulo Relatórios
Avançados (apresentação)". Calculado à mão e depois conferido na interface real —
ver `evidencias_teste.md`.

## Indicadores calculados

| Indicador | Valor |
|---|---|
| Maior déficit | R$ 20.000 (mês 1) |
| Necessidade de capital | R$ 20.000 |
| Mês de recuperação | Mês 5 |
| Saldo final do horizonte | R$ 14.550 |

## Alternativa defendida

Com as premissas declaradas, o projeto recupera o investimento dentro do próprio
horizonte de 7 meses avaliado, exigindo uma reserva de capital de R$ 20.000 para
atravessar o período de déficit (meses 0 a 4). Isso favorece lançar o módulo agora,
**desde que** esse capital esteja de fato disponível antes do início e a curva de
adoção estimada (10→60 clientes em 5 meses) seja minimamente realista. A aplicação
não avalia o custo de captar esse valor (juros), só o tamanho do déficit a cobrir.

## Principal risco

A análise de sensibilidade da própria aplicação (variando uma entrada por vez,
mantendo as demais fixas) aponta três limiares até a recuperação deixar de ocorrer
dentro do horizonte de 7 meses:

- **Atraso de apenas 1 mês no início das receitas** já é suficiente para eliminar a
  recuperação dentro do horizonte — este é o risco mais tangível dos três, porque um
  atraso de lançamento de um mês é um evento comum e plausível (ciclo de vendas mais
  lento, atraso técnico, aprovação de compliance do cliente).
- Uma queda de 30% na receita mensal projetada.
- Um aumento de 122% nas despesas mensais projetadas.

O risco mais relevante para a decisão é, portanto, **o cronograma de lançamento**, não
o tamanho da receita ou da despesa — a aplicação tolera bem erros de estimativa de
valor, mas tolera muito pouco atraso de cronograma.

## Condição que mudaria a decisão

Se o lançamento em early access atrasar 1 mês ou mais além do previsto (fim do mês
1), ou se a receita mensal ficar 30% ou mais abaixo do projetado, ou se as despesas
de operação subirem 122% ou mais acima do projetado, o investimento deixa de se
recuperar dentro deste horizonte de 7 meses, e a decisão deveria ser reavaliada:
adiar o lançamento até o cronograma estar mais garantido, revisar o escopo do
módulo para reduzir o investimento inicial, ou estender o horizonte de análise antes
de decidir.

---

_Nenhuma afirmação acima é uma garantia sobre o futuro. São leituras condicionadas
às premissas declaradas neste documento e em `modelo_calculos.md`, válidas apenas
para o horizonte e os valores informados._
