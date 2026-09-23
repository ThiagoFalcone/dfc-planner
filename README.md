# DFC Planner: Planejador de Fluxo de Caixa

Trabalho de Engenharia Econômica (SENAI FATESG), Opção 3 do desafio "Desenvolvimento
de aplicações de apoio à decisão com agentes de IA": um workspace de planejamento de
fluxo de caixa que ajuda a decidir **quanto capital é necessário** para lançar um
projeto e **quando o investimento se recupera**.

**Equipe:** _(preencher nomes)_ · **Turma:** _(preencher)_
**Tecnologia:** React 19 + TypeScript + Vite, Tailwind CSS v4, Recharts, Vitest.

## O que a aplicação faz

Núcleo exigido pela atividade:

- Planilha editável de receitas, despesas, investimentos, tributos pagos e residual,
  mês a mês (mês 0 em diante), com navegação por teclado e colagem direta de uma
  planilha (Excel/Sheets).
- Calcula fluxo e acumulado de cada mês, o maior déficit, a necessidade de capital e o
  mês de recuperação do investimento.
- Diagrama de fluxo de caixa (barras) e gráfico do acumulado, com destaque para o pico
  de déficit, a zona de déficit e o mês de recuperação.
- Compara cenários lado a lado, com premissas declaradas em texto para cada um e uma
  matriz de diferenças objetivas.
- Análise de sensibilidade: identifica o menor percentual de queda de receita, aumento
  de despesa ou atraso nas receitas que faz a recuperação deixar de ocorrer no
  horizonte informado, além de um simulador "e se" interativo e um gráfico de tornado
  mostrando qual premissa mais pesa na decisão.
- Trata entradas inválidas sem travar: campo vazio ou valor negativo é sinalizado por
  célula, e indicadores/gráficos/exportação ficam desabilitados até a correção.
- Exporta os dados (entradas, premissas e resultados) em CSV ou JSON, e gera um
  relatório executivo imprimível (PDF).

Extensões além do mínimo da atividade, construídas sobre o mesmo núcleo de cálculo:

- **Múltiplos planejamentos**: criar, abrir, renomear, duplicar e excluir
  planejamentos inteiros, cada um com seus próprios cenários e histórico.
- **Cenários livres**: até 6 cenários por planejamento (não mais fixo em três),
  criados em branco, duplicados ou derivados de outro com uma variação percentual.
- **Importação de dados**: upload ou arrastar um arquivo CSV/JSON para dentro de um
  cenário, além de colar um bloco copiado de uma planilha.
- **Desfazer/refazer** (Ctrl+Z / Ctrl+Shift+Z) sobre qualquer alteração.
- **Valor do dinheiro no tempo**: VPL, TIR e payback descontado a partir de uma TMA
  informada por cenário, como leitura complementar aos indicadores em caixa corrente.
- **Rastreabilidade e auditoria local**: histórico de alterações por planejamento
  (quem, quando, de que valor para que valor), com filtros e exportação.
- Tela de login/cadastro (autenticação simulada, ver seção abaixo) como base de
  produto, a pedido da equipe. **Não faz parte dos requisitos da disciplina.**

## Como executar localmente

Requer Node.js 20+ e npm.

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`. Não há serviços pagos, backend ou variáveis de ambiente
necessárias: tudo roda localmente, inclusive a "conta" de usuário (ver abaixo).

Outros comandos:

```bash
npm run build     # build de produção (roda o typecheck antes)
npm run preview   # serve a build de produção localmente
npm run test      # roda os testes automatizados (Vitest)
```

## Login (autenticação simulada)

Não é necessário cadastro: use a conta de demonstração já preenchida na tela de
login, com o botão "Usar a conta de demonstração".

- **E-mail:** `demo@dfcplanner.app`
- **Senha:** `demo1234`

Cadastro e login não chamam nenhum servidor: os dados ficam apenas no `localStorage`
do navegador (ver `src/auth/mockAuthService.ts`). Essa camada foi escrita atrás de uma
interface (`AuthService`, em `src/auth/types.ts`), pensada para ser trocada por um
backend real no futuro sem alterar nenhuma tela. Basta trocar a instância exportada em
`src/auth/AuthContext.tsx`.

## Dados de exemplo

Ao entrar pela primeira vez, o sistema já cria um planejamento com o caso de
referência do EduTask, fornecido no enunciado da atividade (ver `modelo_calculos.md`
para a tabela completa e a conferência manual). O mesmo exemplo pode ser recarregado a
qualquer momento pelo botão "Carregar exemplo". Resultado esperado: maior déficit de
R$ 28.000 (mês 3), saldo final de R$ 8.000, recuperação no mês 6, reproduzido
automaticamente pelos testes.

## Indicadores: o que cada um significa

| Indicador | Significado |
|---|---|
| Maior déficit | O menor valor do acumulado ao longo do horizonte, em módulo: o "fundo do poço" do caixa. |
| Necessidade de capital | `max(0, −min(acumulado))`, ou seja, quanto capital cobriria esse déficit, sem reserva adicional. |
| Mês de recuperação | Primeiro mês, após o início do déficit, em que o acumulado volta a ser ≥ 0. "Não recupera no horizonte" quando isso não acontece nos meses informados. |
| Saldo final do horizonte | Acumulado no último mês da tabela. |

Esses quatro indicadores permanecem em caixa corrente, como pede a Opção 3. A página
Resultados também mostra, em painel separado e claramente identificado como
complementar, VPL, TIR e payback descontado quando uma TMA é informada no cenário
(ver `src/lib/financeiro.ts`) — isso nunca substitui os indicadores acima.

Fórmulas completas, convenções de sinal e casos de borda: `modelo_calculos.md`.

## Testes e evidências

```bash
npm run test
```

71 testes automatizados (Vitest), cobrindo:

- `src/lib/calculos.test.ts` (15 testes, núcleo obrigatório da Opção 3): fórmula do
  fluxo, o caso de referência completo do EduTask, cenário sem recuperação, alteração
  isolada de uma premissa, a regra "saldo zero antes do primeiro desembolso não é
  recuperação", entradas inválidas e ausência total de déficit.
- `src/lib/financeiro.test.ts`, `src/lib/simulacao.test.ts`, `src/lib/importar.test.ts`,
  `src/lib/formato.test.ts`: as bibliotecas complementares (VPL/TIR, simulador "e se",
  importação de arquivos, formatação).
- `src/services/audit/auditRepository.test.ts`,
  `src/services/planner/plannerRepository.test.ts`: persistência local, isolamento por
  usuário e migração automática do formato de dados anterior.
- `src/App.test.tsx`: fluxo de ponta a ponta (login, edição de célula, cálculo,
  auditoria, logout, persistência entre sessões).

Todos os 71 testes passam (`npx vitest run`). O caso do EduTask também foi conferido
manualmente, linha a linha, em `modelo_calculos.md`: essa é a conferência independente
do agente de IA exigida no Passo 3 da atividade.

## Estrutura do projeto

```
src/
  auth/            Autenticação simulada (login, cadastro, sessão) e sua interface
  audit/           Contexto React da auditoria (histórico de alterações)
  theme/           Tema claro/escuro/sistema
  domain/          Tipos e fábricas do domínio (cenário, planejamento, auditoria)
  services/        Persistência local: storage, planejamentos e auditoria
  components/
    ui/            Botão, campo de texto, popover, modal, glass: primitivos reutilizáveis
    financial/     Planilha, KPIs, gráficos de apoio, insights, importação
    charts/        Gráficos de fluxo, acumulado, comparação e tornado (Recharts)
    app/           Barra superior, navegação, paleta de comandos, modais de app
    audit/         Linha do tempo e filtros da auditoria
  data/            Dados de referência do EduTask e cenário em branco
  hooks/           usePlanner: estado do planejamento aberto e suas operações
  lib/             calculos.ts (núcleo puro, intocado), sensibilidade.ts, simulacao.ts,
                   financeiro.ts, importar.ts, exportar.ts, formato.ts, insights.ts
  pages/
    auth/          Telas de login e cadastro
    planner/       Planejamento, Resultados, Cenários, Sensibilidade, Auditoria,
                   Planejamentos (lista) e Relatório (impressão)
  types.ts         Tipos do domínio de cálculo
requisitos.md          Requisitos numerados com critério de aceitação
modelo_calculos.md     Variáveis, unidades, fórmulas, convenções, caso conferido à mão
registro_ia.md         Interações com o agente de IA usado no desenvolvimento
relatorio_decisao.md   Modelo do relatório de decisão (até 2 páginas)
```

## Limitações

- Os quatro indicadores obrigatórios não descontam os fluxos a valor presente (isso é
  o modelo da Opção 1); a Opção 3 soma os valores em caixa corrente, como pede o
  enunciado. VPL/TIR/payback descontado existem como leitura complementar opcional.
- A necessidade de capital não inclui custo de captação (juros) sobre o valor
  levantado.
- Autenticação é simulada (localStorage): não é um sistema de contas real.
- Auditoria é local ao navegador, não é uma trilha inviolável; ver o aviso na própria
  tela de Histórico e auditoria.
- A análise de sensibilidade e o simulador variam entradas em percentuais fixos; não
  fazem otimização nem buscam automaticamente o pior cenário.

## O que ainda falta fazer manualmente (equipe, antes da entrega)

Ver a seção final de `registro_ia.md`: conferência independente de um segundo cenário
(sem usar a aplicação), execução do projeto por outro integrante seguindo só este
README, e preenchimento de `relatorio_decisao.md` com o cenário real apresentado.

## Licença

Distribuído sob a licença MIT (ver `LICENSE`). O código pode ser reutilizado
livremente; os dados de referência do EduTask pertencem ao enunciado da disciplina.
