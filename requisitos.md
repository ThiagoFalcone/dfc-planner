# Requisitos: Planejador de Fluxo de Caixa (Opção 3)

Engenharia Econômica · SENAI FATESG · Desenvolvimento de aplicações de apoio à decisão com agentes de IA

## Usuário e decisão

**Usuário:** um profissional de engenharia de software (ou a equipe de um projeto) que
precisa decidir se e quando lançar um produto, com base no fluxo de caixa projetado.

**Decisão apoiada:** quanto capital é necessário para sustentar o projeto até ele se
pagar, e em que mês (se algum) o investimento se recupera.

**Caso fictício de referência:** dados do EduTask fornecidos pelo enunciado, mês 0 a
mês 6, investimento inicial de R$ 6.000 no mês 0, despesas mensais decrescentes,
receitas a partir do mês 4 e valor residual de R$ 5.000 no mês 6. Resultado esperado:
maior déficit de R$ 28.000 (mês 3), saldo final de R$ 8.000, recuperação no mês 6.

## Produto mínimo viável

Uma tela que permite editar receitas, despesas, investimentos, tributos pagos e valor
residual mês a mês, calcula fluxo e acumulado, mostra o maior déficit, a necessidade de
capital e o mês de recuperação, e compara três cenários (pessimista, base, otimista).

---

## Requisitos funcionais

Cada requisito tem um critério de aceitação no formato **entrada → ação → resultado
observável**.

### RF01: Cadastro e login (extensão de produto, mock)

- **Entrada:** nome, e-mail, senha (cadastro); e-mail e senha (login).
- **Ação:** usuário preenche o formulário e envia.
- **Resultado observável:** sessão criada e persistida no navegador (localStorage);
  usuário é redirecionado para `/app`. E-mail duplicado no cadastro, ou credenciais
  incorretas no login, geram mensagem de erro sem navegar.
- Conta de demonstração pré-cadastrada: `demo@dfcplanner.app` / `demo1234`.
- **Não é um requisito da atividade de Engenharia Econômica**: foi incluído a pedido
  do usuário para servir de base de um produto completo; a lógica de autenticação é
  isolada (`src/auth/`) atrás de uma interface (`AuthService`) para poder ser trocada
  por um backend real sem alterar as telas.

### RF02: Entradas editáveis por mês (obrigatório)

- **Entrada:** tabela com uma linha por mês (mês 0 até pelo menos o mês 6), cinco
  colunas editáveis: recebimentos, despesas pagas, investimentos, tributos pagos,
  residual.
- **Ação:** usuário digita um valor numérico em qualquer célula.
- **Resultado observável:** fluxo e acumulado daquele mês (e dos meses seguintes) são
  recalculados imediatamente. É possível adicionar e remover meses (mínimo de um mês).

### RF03: Exemplo pronto para carregar (obrigatório)

- **Entrada:** botão "Carregar exemplo".
- **Ação:** usuário clica.
- **Resultado observável:** a tabela é preenchida com os dados de referência do
  EduTask (ver `dados/exemploEdutask` em `modelo_calculos.md`) e os indicadores batem
  com o resultado esperado do enunciado.

### RF04: Cálculo do fluxo e do acumulado (obrigatório)

- **Entrada:** os cinco campos de um mês, todos numéricos e válidos.
- **Ação:** o sistema aplica `fluxo[k] = receitas[k] − despesas[k] − investimentos[k] −
  tributos[k] + residual[k]` e soma os fluxos de 0 até k para o acumulado.
- **Resultado observável:** a coluna "Fluxo" e "Acumulado" da tabela exibem os valores
  calculados, com tolerância de R$ 0,01 em relação ao caso de referência.

### RF05: Indicadores (obrigatório)

- **Entrada:** a série de fluxos e acumulados calculada (RF04).
- **Ação:** o sistema identifica o menor valor de acumulado (maior déficit), aplica
  `necessidade_capital = max(0, −min(acumulado))` e localiza o primeiro mês, após o
  início do déficit, em que o acumulado volta a ser ≥ 0 (recuperação).
- **Resultado observável:** quatro indicadores exibidos: maior déficit (com o mês em
  que ocorre), necessidade de capital, mês de recuperação (ou aviso de que não ocorre
  no horizonte) e saldo final do horizonte.

### RF06: Diagrama de fluxo de caixa e gráfico do acumulado (obrigatório)

- **Entrada:** a série de resultados (RF04).
- **Ação:** o sistema renderiza um gráfico de barras do fluxo por mês (azul para
  positivo, vermelho para negativo) e um gráfico de área/linha do acumulado, com
  destaque para o mês do maior déficit e o mês de recuperação.
- **Resultado observável:** os gráficos refletem exatamente os valores da tabela;
  passar o mouse sobre um ponto mostra o valor daquele mês.

### RF07: Comparação de três cenários (obrigatório)

- **Entrada:** três cenários editáveis independentemente (pessimista, base, otimista),
  cada um com sua própria tabela e premissas declaradas em texto.
- **Ação:** usuário edita qualquer um dos três cenários.
- **Resultado observável:** uma tabela e um gráfico sobrepondo o acumulado dos três
  cenários, mais um texto interpretando qual cenário tem menor necessidade de capital
  e qual recupera mais cedo, sem linguagem de certeza sobre o futuro.

### RF08: Análise de sensibilidade (obrigatório)

- **Entrada:** o cenário ativo.
- **Ação:** o sistema varia apenas a receita (e, separadamente, apenas a despesa) em
  incrementos de 1%, mantendo as demais entradas fixas, até identificar o menor
  percentual que faz a recuperação deixar de ocorrer no horizonte.
- **Resultado observável:** texto indicando esse percentual-limite (ou informando que
  a decisão não é sensível a essa variável no horizonte considerado).

### RF09: Tratamento de entradas inválidas (obrigatório)

- **Entrada:** um campo numérico deixado vazio, ou um valor negativo digitado por
  engano (o sinal já é aplicado pela fórmula).
- **Ação:** o sistema valida antes de calcular.
- **Resultado observável:** mensagem de erro específica por campo, exibida junto à
  célula (borda vermelha); os indicadores, gráficos e exportação ficam desabilitados
  até a correção. **Nenhum resultado é produzido com dados inválidos.**

### RF10: Exportação (obrigatório)

- **Entrada:** um cenário com todos os campos válidos.
- **Ação:** usuário clica em "Exportar CSV" ou "Exportar JSON".
- **Resultado observável:** arquivo baixado contendo entradas, premissas declaradas e
  saídas (fluxo, acumulado, indicadores) do cenário ativo.

### RF11: Execução local (obrigatório)

- **Entrada:** repositório clonado.
- **Ação:** `npm install && npm run dev`.
- **Resultado observável:** aplicação disponível em `http://localhost:5173`, sem
  dependência de serviços pagos ou de rede além dos pacotes do projeto.

---

## Extensões opcionais (fora do escopo mínimo)

- Editar o número de cenários (hoje fixo em três).
- Persistir cenários em backend real (a camada `AuthService`/dados já está isolada
  para isso).
- Internacionalização (hoje só português/Real).
- Relatório de decisão em PDF gerado a partir da tela (hoje é um documento à parte,
  `relatorio_decisao.md`, preenchido manualmente pela equipe).

## Convenções (obrigatórias em todos os cálculos)

Ver `modelo_calculos.md` para unidades, sinais, tratamento do mês zero e limites de
validade.
