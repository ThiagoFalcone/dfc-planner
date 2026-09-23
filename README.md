# DFC Planner — Planejador de Fluxo de Caixa

Trabalho de Engenharia Econômica (SENAI FATESG) — Opção 3 do desafio "Desenvolvimento
de aplicações de apoio à decisão com agentes de IA": um planejador de fluxo de caixa
que ajuda a decidir **quanto capital é necessário** para lançar um projeto e **quando
o investimento se recupera**.

**Equipe:** _(preencher nomes)_ · **Turma:** _(preencher)_
**Tecnologia:** React 19 + TypeScript + Vite, Tailwind CSS v4, Recharts, Vitest.

## O que a aplicação faz

- Tabela editável de receitas, despesas, investimentos, tributos pagos e residual,
  mês a mês (mês 0 em diante).
- Calcula fluxo e acumulado de cada mês, o maior déficit, a necessidade de capital e o
  mês de recuperação do investimento.
- Diagrama de fluxo de caixa (barras) e gráfico do acumulado, com destaque para o pico
  de déficit e o mês de recuperação.
- Compara três cenários (pessimista, base, otimista) lado a lado, com premissas
  declaradas em texto para cada um.
- Análise de sensibilidade: identifica o menor percentual de queda de receita (ou
  aumento de despesa) que faz a recuperação deixar de ocorrer no horizonte informado.
- Exporta os dados (entradas, premissas e resultados) em CSV ou JSON.
- Tela de login/cadastro (autenticação simulada, ver seção abaixo) como base de
  produto, a pedido da equipe — **não faz parte dos requisitos da disciplina**.

## Como executar localmente

Requer Node.js 20+ e npm.

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`. Não há serviços pagos, backend ou variáveis de ambiente
necessárias — tudo roda localmente, inclusive a "conta" de usuário (ver abaixo).

Outros comandos:

```bash
npm run build     # build de produção (roda o typecheck antes)
npm run preview   # serve a build de produção localmente
npm run test      # roda os testes automatizados (Vitest)
```

## Login (autenticação simulada)

Não é necessário cadastro: use a conta de demonstração já preenchida na tela de
login (botão "Preencher com conta de demonstração") —

- **E-mail:** `demo@dfcplanner.app`
- **Senha:** `demo1234`

Cadastro e login não chamam nenhum servidor: os dados ficam apenas no `localStorage`
do navegador (ver `src/auth/mockAuthService.ts`). Essa camada foi escrita atrás de uma
interface (`AuthService`, em `src/auth/types.ts`) justamente para poder ser trocada
por um backend real no futuro sem alterar nenhuma tela — troque a instância exportada
em `src/auth/AuthContext.tsx`.

## Dados de exemplo

O botão "Carregar exemplo" preenche a tabela com o caso de referência do EduTask,
fornecido no enunciado da atividade (ver `modelo_calculos.md` para a tabela completa e
a conferência manual). Resultado esperado: maior déficit de R$ 28.000 (mês 3), saldo
final de R$ 8.000, recuperação no mês 6 — reproduzido automaticamente pelos testes.

## Indicadores — o que cada um significa

| Indicador | Significado |
|---|---|
| Maior déficit | O menor valor do acumulado ao longo do horizonte, em módulo — o "fundo do poço" do caixa. |
| Necessidade de capital | `max(0, −min(acumulado))` — quanto capital cobriria esse déficit, sem reserva adicional. |
| Mês de recuperação | Primeiro mês, após o início do déficit, em que o acumulado volta a ser ≥ 0. "Não recupera no horizonte" quando isso não acontece nos meses informados. |
| Saldo final do horizonte | Acumulado no último mês da tabela. |

Fórmulas completas, convenções de sinal e casos de borda: `modelo_calculos.md`.

## Testes e evidências

```bash
npm run test
```

15 testes automatizados em `src/lib/calculos.test.ts`, cobrindo:

- Caso normal e caso limite da fórmula do fluxo.
- O caso de referência completo do EduTask (fluxo/acumulado mês a mês, maior déficit,
  necessidade de capital, saldo final, mês de recuperação).
- Cenário desfavorável (receita insuficiente → "não recupera no horizonte", sem
  travar o programa).
- Alteração de uma premissa (variar o residual) e o efeito isolado no saldo final.
- A regra "saldo zero antes do primeiro desembolso não representa recuperação".
- Entradas inválidas: campo vazio (NaN), valor negativo digitado por engano, receita
  zero em todos os meses.
- Ausência total de déficit no horizonte.

Todos os 15 testes passam (`npx vitest run` → `15 passed`). O caso do EduTask também
foi conferido manualmente, linha a linha, em `modelo_calculos.md` — essa é a
conferência independente do agente de IA exigida no Passo 3 da atividade.

## Estrutura do projeto

```
src/
  auth/            Autenticação simulada (login, cadastro, sessão) e sua interface
  components/
    ui/            Botão, campo de texto, cartão, alerta — primitivos reutilizáveis
    planner/       Tabela mensal, indicadores, gráficos, comparação, interpretação
  data/            Dados de referência do EduTask e cenário em branco
  hooks/           usePlanner — estado dos três cenários e suas operações
  lib/             calculos.ts (núcleo puro), sensibilidade.ts, exportar.ts, formato.ts
  pages/           Telas de login/cadastro e a tela principal do planejador
  types.ts         Tipos do domínio
requisitos.md          Requisitos numerados com critério de aceitação
modelo_calculos.md     Variáveis, unidades, fórmulas, convenções, caso conferido à mão
registro_ia.md         Interações com o agente de IA usado no desenvolvimento
relatorio_decisao.md   Modelo do relatório de decisão (até 2 páginas)
```

## Limitações

- O cálculo não desconta os fluxos a valor presente (isso é o modelo da Opção 1); a
  Opção 3 soma os valores em caixa corrente, como pede o enunciado.
- A necessidade de capital não inclui custo de captação (juros) sobre o valor
  levantado.
- Autenticação é simulada (localStorage) — não é um sistema de contas real.
- Comparação de cenários é fixa em três (pessimista, base, otimista); não há edição
  do número de cenários pela interface.
- A análise de sensibilidade varia uma entrada por vez, em passos de 1%; não faz
  otimização nem varia múltiplas entradas simultaneamente.

## O que ainda falta fazer manualmente (equipe, antes da entrega)

Ver a seção final de `registro_ia.md`: conferência independente de um segundo cenário
(sem usar a aplicação), execução do projeto por outro integrante seguindo só este
README, e preenchimento de `relatorio_decisao.md` com o cenário real apresentado.
