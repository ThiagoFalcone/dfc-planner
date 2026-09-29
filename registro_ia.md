# Registro de interações com o agente de IA

**Agente utilizado:** Claude (Sonnet), operando com acesso a terminal, editor de
arquivos e navegador headless neste ambiente de desenvolvimento.
**Integrante responsável por todas as interações abaixo:** Thiago Matheus.

Cada entrada segue: data, objetivo, prompt (resumido quando muito longo), arquivos
alterados, verificação realizada, decisão humana.

---

### 1. 2026-09-23: Escolha da opção do desafio e do escopo inicial

**Objetivo:** decidir qual das cinco opções do desafio construir e definir a stack.

**Prompt utilizado (resumo):** "Podemos fazer em TS e react com um funcionamento de
ponta... primeiro o front-end e já faz para ter a base pro back... tela de login e
afins."

**Ação do agente:** leu o PDF do enunciado (12 páginas) e, por não haver opção
declarada, apresentou uma pergunta estruturada com as cinco opções do desafio e uma
segunda pergunta sobre o escopo do login (mock funcional vs. nenhum login).

**Verificação humana:** nenhuma ambiguidade restante; a resposta definiu
explicitamente a Opção 3 (Planejador de fluxo de caixa) e "mock funcional" de login.

**Decisão humana:** aceito. Opção 3 escolhida; login como mock funcional com
localStorage, estruturado para permitir troca por um backend real depois.

---

### 2. 2026-09-23: Verificação de conteúdo oculto/disfarçado no PDF do enunciado

**Objetivo:** o integrante pediu explicitamente para checar se o PDF fornecido pelo
professor continha algum texto escrito em fonte ou cor diferente, uma possível
"pegadinha" para identificar quem usou IA no trabalho.

**Prompt utilizado:** "tentar à qualquer pegadinha de coisa escrita em fonte ou cor
diferente" / "de colocar uma palavra x ou algo dentro do texto pra ele saber quem fez
com ia e quem não fez".

**Ação do agente:** escreveu e executou um script Python (PyMuPDF) que extraiu os 635
trechos de texto do PDF com cor, tamanho e fonte de cada um; verificou também
metadados, camadas opcionais (OCG), modo de renderização de texto (invisível),
anotações, links e os 16 arquivos XML embutidos no PDF.

**Resultado:** todos os 635 trechos usam a mesma cor preta padrão e fontes normais
(Calibri, Calibri-Bold, CambriaMath, SymbolMT); nenhuma cor, fonte ou tamanho fora do
padrão; nenhuma camada oculta, texto invisível ou anotação; os 16 arquivos embutidos
são as fórmulas MathML já visíveis no documento (equações do pseudocódigo), sem
conteúdo adicional.

**Verificação humana:** relatado ao integrante em texto simples, sem alarde; nada
suspeito encontrado.

**Decisão humana:** aceito. Seguir o desenvolvimento normalmente.

---

### 3. 2026-09-23: Implementação do núcleo de cálculo a partir do pseudocódigo do enunciado

**Objetivo:** implementar `fluxo[k]`, `acumulado[k]`, `necessidade_capital` e a regra
de recuperação exatamente como especificado nas páginas 3 e 9–10 do PDF, sem inventar
fórmulas.

**Prompt (interno ao agente, ao planejar o trabalho):** transcrever o pseudocódigo do
enunciado em funções puras e testáveis, cobrindo os casos "que não podem quebrar o
programa" (receita zero, campos vazios, ausência de recuperação).

**Arquivos alterados:** `src/types.ts`, `src/lib/calculos.ts`,
`src/data/exemploEdutask.ts`, `src/lib/calculos.test.ts`.

**Verificação realizada:** 15 testes automatizados (`npx vitest run`), incluindo o
caso de referência completo do EduTask (maior déficit R$ 28.000 no mês 3, saldo final
R$ 8.000, recuperação no mês 6) e a conferência manual linha a linha registrada em
`modelo_calculos.md`. Todos os 15 testes passaram na primeira execução após a
implementação.

**Decisão humana:** aceito sem alteração; os resultados batem com o teste de
referência do enunciado.

---

### 4. 2026-09-23: Correção de configuração após erro de build (sugestão da IA corrigida)

**Objetivo:** configurar TypeScript + Vitest no mesmo `vite.config.ts`.

**O que a IA sugeriu inicialmente:** `baseUrl: "."` no `tsconfig.app.json` e
`defineConfig` importado do pacote `vite` (em vez de `vitest/config`) para adicionar a
chave `test`.

**Erro encontrado ao executar `npx tsc -b`:**
`TS5101: Option 'baseUrl' is deprecated` e
`TS2769: Object literal may only specify known properties, and 'test' does not exist
in type 'UserConfigExport'`.

**Verificação:** build falhou de fato (não foi apenas hipotético); o agente executou
o comando, leu o erro completo e investigou a causa antes de alterar qualquer coisa.

**Correção aplicada:** removido `baseUrl` do `tsconfig.app.json` (mantendo apenas
`paths`, que não depende dele nesta versão do TypeScript); trocado o import de
`defineConfig` em `vite.config.ts` para vir de `'vitest/config'`, que estende o tipo
de configuração do Vite com a chave `test`.

**Arquivos alterados:** `tsconfig.app.json`, `vite.config.ts`.

**Resultado confirmado:** `npx tsc -b` e `npm run build` passam sem erros ou avisos
depois da correção.

**Decisão humana:** aceito; a correção resolveu o erro relatado pelo compilador, sem
alterar comportamento da aplicação.

---

### 5. 2026-09-23: Análise de sensibilidade automatizada (Passo 7)

**Objetivo:** implementar a análise de sensibilidade pedida no enunciado ("variem
apenas uma entrada por vez para identificar um limite que altere a decisão"), com
números calculados em vez de apenas texto qualitativo.

**Ação do agente:** implementou `src/lib/sensibilidade.ts`, que varia a receita (e,
separadamente, a despesa) em passos de 1%, mantendo as demais entradas fixas, até o
menor percentual em que a recuperação deixa de ocorrer no horizonte informado.

**Verificação realizada:** conferido no dashboard renderizado (captura de tela) para
o cenário base do EduTask: o sistema aponta que uma queda de 16% nas receitas, ou um
aumento de 19% nas despesas, já eliminam a recuperação dentro do horizonte de 7
meses. Checado manualmente: com queda de 16%, a receita do mês 6 cai de R$ 22.000
para R$ 18.480, o que reduz o fluxo daquele mês e mantém o acumulado abaixo de zero.

**Decisão humana:** aceito.

---

### 6. 2026-09-23: Verificação visual da interface (login, cadastro, validação, mobile)

**Objetivo:** conferir que a interface renderiza corretamente e que a regra "campo
vazio não produz resultado" (RF09) funciona de ponta a ponta, não só na função pura.

**Ação do agente:** subiu a build de produção localmente (`vite preview`) e usou um
navegador headless (Playwright) para: (1) capturar a tela de login; (2) autenticar com
a conta de demonstração e capturar o dashboard preenchido com o exemplo do EduTask;
(3) apagar um campo obrigatório e capturar o estado de erro; (4) repetir em viewport
mobile (390×844).

**Verificação realizada:** as capturas confirmam que os indicadores, gráficos e
exportação somem quando há campo inválido (em vez de mostrar um resultado incorreto),
que a mensagem de erro aponta o mês e o campo certos, e que o layout se adapta ao
celular sem quebrar (tabela com rolagem horizontal). Sem erros relevantes no console
do navegador (os dois avisos de rede eram só a fonte do Google Fonts, bloqueada pela
política de rede do ambiente de desenvolvimento; não afeta a aplicação).

**Decisão humana:** aceito.

---

### 7. 2026-09-23: Redesign completo da interface e extensões de produto sobre o núcleo de cálculo

**Objetivo:** reconstruir o front-end como um workspace financeiro (identidade
visual própria, tema claro/escuro, glassmorphism controlado, navegação por comando)
e adicionar funcionalidades de produto (múltiplos planejamentos, cenários livres,
importação de dados, desfazer/refazer, análise de VPL/TIR/payback descontado,
simulador de sensibilidade, relatório executivo em PDF), sem alterar o núcleo de
cálculo obrigatório da Opção 3.

**Prompt utilizado (resumo):** pedido para redesenhar todo o front-end seguindo um
direcional detalhado de identidade visual, depois "fazer tudo de uma vez" incluindo
as melhorias discutidas (VPL/TIR, CRUD de planejamentos, importação de dados,
desfazer, colar do Excel), com a exigência explícita de manter os indicadores e as
fórmulas de `calculos.ts` intocados.

**Ação do agente:** reescreveu a camada de apresentação (tokens de design,
componentes de UI, tabela em formato de planilha, gráficos, páginas) e criou
módulos novos e isolados do núcleo de cálculo: `src/lib/financeiro.ts` (VPL, TIR,
payback descontado, todos calculados a partir da mesma série de `calcularResultados`
de `calculos.ts`, nunca reimplementando a fórmula do fluxo), `src/lib/simulacao.ts`
(simulador "e se" e análise de tornado), `src/lib/importar.ts` (leitura de CSV/JSON
e colagem de planilha) e `src/services/planner/plannerRepository.ts` (CRUD de
planejamentos em `localStorage`, com migração automática do formato anterior).

**Verificação realizada:** `npx tsc -b` sem erros; `npx vitest run` com 71 testes
passando, incluindo os 15 testes originais do caso de referência EduTask
(inalterados) e 56 testes novos para as bibliotecas e repositórios adicionados;
`npm run build` sem erros; conferência visual no navegador (headless) nos temas
claro e escuro, em desktop e celular, incluindo a colagem de valores na planilha, o
cálculo de VPL/TIR, o gráfico de sensibilidade (tornado) e o relatório imprimível.
Durante essa verificação dois problemas reais foram encontrados e corrigidos: o
gráfico de tornado não desenhava as barras de todas as premissas (limitação do
Recharts ao empilhar barras com `dataKey` como função em vez de uma chave do
objeto de dados) e a planilha causava rolagem horizontal da página inteira no
celular (elementos com texto oculto para leitores de tela escapavam do contêiner
de rolagem por falta de `position: relative` nele).

**Decisão humana:** aceito. Autorizada a publicação do código em repositório Git
próprio, organizado com o fluxo `main` / `develop` / `feature/*` (gitflow).

---

### 8. 2026-09-29: Segunda conferência independente, digitada na interface real

**Integrante responsável por esta interação:** João Vítor Mamede (sessão separada das
interações 1–7 acima, que foram conduzidas por Thiago Matheus).

**Objetivo:** cumprir a segunda conferência independente exigida no Passo 3 (a
primeira, do caso EduTask, já estava em `modelo_calculos.md`): um cenário próprio,
diferente do exemplo, calculado à mão e comparado com o resultado da aplicação.

**Ação do agente:** calculou à mão, antes de abrir a aplicação, um cenário fictício
com tributos ≠ 0 em todos os meses (termo da fórmula que o EduTask nunca exercita,
já que lá tributos = 0) e residual só no mês 6: maior déficit R$ 14.400 (mês 2),
recuperação no mês 5, saldo final R$ 13.600. Usou a extensão Claude em Chrome para
abrir a aplicação de verdade (`localhost:5173`), criar um planejamento novo em
branco e digitar célula a célula os mesmos valores na planilha da UI — não pela API
nem pelas funções de teste.

**Verificação realizada:** os quatro indicadores exibidos pela aplicação (capital
necessário, maior déficit, recuperação, saldo final) e o fluxo/acumulado de cada mês
na grade bateram exatamente com os valores calculados à mão. Registro completo,
incluindo a tabela mês a mês e a premissa registrada no cenário, em
`evidencias_teste.md`, seção "Segunda conferência independente".

**Decisão humana:** aceito.

---

## O que ainda depende de conferência manual da equipe (não feito pela IA)

Para cumprir integralmente o Passo 3 e o Passo 8 da atividade, a equipe ainda precisa,
antes da entrega:

1. Pedir para outra pessoa (fora de quem programou) executar o projeto **só com o
   README**, sem ajuda, e registrar se conseguiu.
2. Preencher o cabeçalho do relatório de decisão (`relatorio_decisao.md`) com o
   cenário realmente analisado pela equipe para a apresentação.

> A conferência independente de um segundo cenário (item que estava aqui) já foi
> feita — ver interação #8 abaixo e `evidencias_teste.md`.
