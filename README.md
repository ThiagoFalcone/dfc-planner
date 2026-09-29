# DFC Planner: Planejador de Fluxo de Caixa

Trabalho de Engenharia Econômica (SENAI FATESG), Opção 3 do desafio "Desenvolvimento
de aplicações de apoio à decisão com agentes de IA": um workspace de planejamento de
fluxo de caixa que ajuda a decidir **quanto capital é necessário** para lançar um
projeto e **quando o investimento se recupera**.

**Equipe:** Thiago Matheus Pinheiro, João Vítor Mamede, Gabriel Viana Nunes · **Turma:** Engenharia de Software, 8º período
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
- Tela de login/cadastro (autenticação real, contra o backend, ver seção abaixo)
  como base de produto, a pedido da equipe. **Não faz parte dos requisitos da
  disciplina.**

## Como executar localmente

Requer Node.js 20+, Python 3.12+ e PostgreSQL instalado localmente (sem Docker).
São dois processos rodando lado a lado: o backend (FastAPI, porta 8000) e o
frontend (Vite, porta 5173). Configure o backend primeiro (seção abaixo), depois:

```bash
cp .env.example .env
npm install
npm run dev
```

Abra `http://localhost:5173`.

Outros comandos:

```bash
npm run build     # build de produção (roda o typecheck antes)
npm run preview   # serve a build de produção localmente
npm run test      # roda os testes automatizados (Vitest)
```

## Backend

O backend é uma API real (FastAPI + PostgreSQL) — não há mais dados simulados no
navegador.

1. Instale o PostgreSQL localmente e crie o banco:

   ```bash
   createdb dfc_planner
   ```

2. Copie o arquivo de variáveis de ambiente do backend e ajuste se necessário
   (usuário/senha do banco, chave do JWT):

   ```bash
   cp backend/.env.example backend/.env
   ```

3. Instale as dependências Python (em um virtualenv, se preferir):

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

4. Rode a migração para criar as tabelas:

   ```bash
   alembic upgrade head
   ```

5. Suba o servidor:

   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

A conta de demonstração (`demo@dfcplanner.app` / `demo1234`) não existe mais por
padrão: agora é preciso se cadastrar de verdade na tela de cadastro do frontend.

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

90 testes automatizados (Vitest) no frontend, cobrindo:

- `src/lib/calculos.test.ts` (17 testes, núcleo obrigatório da Opção 3): fórmula do
  fluxo, o caso de referência completo do EduTask, cenário sem recuperação, alteração
  isolada de uma premissa, a regra "saldo zero antes do primeiro desembolso não é
  recuperação", o caso "saldo volta a ficar negativo depois de recuperar", entradas
  inválidas e ausência total de déficit.
- `src/lib/financeiro.test.ts`, `src/lib/simulacao.test.ts`, `src/lib/importar.test.ts`,
  `src/lib/formato.test.ts`: as bibliotecas complementares (VPL/TIR, simulador "e se",
  importação de arquivos, formatação).
- `src/services/audit/httpAuditRepository.test.ts`,
  `src/services/planner/httpPlannerRepository.test.ts`: as chamadas HTTP contra o
  backend real (criação com fallback PUT→POST, exclusão, extração do projeto ativo,
  envio sem campos forjados de id/timestamp/usuário).
- `src/App.test.tsx`: fluxo de ponta a ponta (login, edição de célula, cálculo,
  auditoria, logout, persistência entre sessões).

Todos os 90 testes do frontend passam (`npx vitest run`). O backend tem sua própria
suíte, com 30 testes automatizados (Pytest — health, security, deps, auth, schemas,
projetos, auditoria, models), rodada com `pytest -v` a partir de `backend/`; todos
passam. O caso do EduTask também foi conferido manualmente, linha a linha, em
`modelo_calculos.md`: essa é a conferência independente do agente de IA exigida no
Passo 3 da atividade.

Evidência de teste no formato entrada/resultado esperado/resultado obtido/situação,
exigido pela atividade: `evidencias_teste.md`. Exemplo de arquivo exportado pela
aplicação (CSV e JSON, gerados de verdade, não escritos à mão): pasta
`exemplos-exportados/`.

## Estrutura do projeto

```
src/
  auth/            Autenticação (login, cadastro, sessão) contra a API real e sua interface
  audit/           Contexto React da auditoria (histórico de alterações)
  theme/           Tema claro/escuro/sistema
  domain/          Tipos e fábricas do domínio (cenário, planejamento, auditoria)
  services/        Persistência via HTTP contra o backend (planejamentos e
                   auditoria) e storage local (sessão e tema)
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
evidencias_teste.md    Evidências de teste: entrada, esperado, obtido e situação
exemplos-exportados/   CSV e JSON de exemplo, gerados pela própria aplicação

backend/
  app/routers/     Rotas da API: auth, projetos, auditoria
  alembic/         Migrações do banco de dados (PostgreSQL)
  tests/           Testes automatizados do backend (Pytest)
```

## Limitações

- Os quatro indicadores obrigatórios não descontam os fluxos a valor presente (isso é
  o modelo da Opção 1); a Opção 3 soma os valores em caixa corrente, como pede o
  enunciado. VPL/TIR/payback descontado existem como leitura complementar opcional.
- A necessidade de capital não inclui custo de captação (juros) sobre o valor
  levantado.
- A análise de sensibilidade e o simulador variam entradas em percentuais fixos; não
  fazem otimização nem buscam automaticamente o pior cenário.
- Fora de escopo deliberadamente, por serem características de produto real e não
  de entrega acadêmica: recuperação de senha por e-mail, verificação de e-mail,
  rate limiting/proteção contra força bruta, backups formais, monitoramento em
  produção e hospedagem remota — tudo roda localmente.

## O que ainda falta fazer manualmente (equipe, antes da entrega)

A conferência independente de um segundo cenário (calculado à mão e comparado com a
aplicação pela interface real) já foi feita — ver `evidencias_teste.md`, seção
"Segunda conferência independente". Falta à equipe: pedir para outro integrante
executar o projeto seguindo só este README, e preencher `relatorio_decisao.md` com o
cenário real apresentado (hoje ele só tem os dados de exemplo do EduTask, como
modelo). Ver também a seção final de `registro_ia.md`.

## Licença

Distribuído sob a licença MIT (ver `LICENSE`). O código pode ser reutilizado
livremente; os dados de referência do EduTask pertencem ao enunciado da disciplina.
