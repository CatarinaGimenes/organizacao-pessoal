# Instruções para o Copilot

## Comandos

Este é um SPA Vite com React 19, escrito em JavaScript/JSX e sem TypeScript.
O backend usa `node:sqlite`, portanto requer Node.js `>=22.12.0`.

```bash
npm install
npm run dev       # servidor de desenvolvimento
npm run full      # frontend e backend juntos
npm run server    # API Node + SQLite em localhost:3001
npm run lint      # oxlint
npm run check     # verificações funcionais e renderização SSR
npm run build     # build de produção
npm run preview   # visualizar o build
```

Antes de concluir uma alteração, execute nesta ordem:

```bash
npm run lint && npm run check && npm run build
```

`npm run check` é um script ad-hoc, não um framework de testes. Ele executa
todas as verificações de `scripts/check.mjs`; não há runner nem seleção de um
teste individual. As regras de estado podem ser exercitadas diretamente
importando as funções de `src/state/board.js` e `src/state/finance.js`, mas a
verificação oficial continua sendo `npm run check`.

Durante o desenvolvimento, prefira `npm run full` para iniciar os dois
processos juntos. Também é possível manter `npm run server` e `npm run dev` em
terminais separados. O proxy do Vite encaminha `/api` para `localhost:3001`;
o banco persistido fica em `server/data/organizacao.sqlite`.

## Arquitetura

- `src/main.jsx` é o ponto de entrada do navegador: importa o CSS global,
  cria o root React e configura o `BrowserRouter`. É o único local que deve
  acessar `document`, `window` ou `history`.
- `src/App.jsx` é o shell da aplicação. Mantém `useBoard` e `useFinance` no
  nível do App para que o estado carregado da API sobreviva à navegação entre
  `/` (semana) e `/financas` (planejamento financeiro). As páginas recebem
  estado e callbacks por props.
- `src/state/board.js` e `src/state/finance.js` concentram as regras locais
  puras e imutáveis. `src/api/client.js` contém o cliente HTTP; os hooks em
  `src/hooks/` carregam e sincronizam o estado com o backend, sem expor
  endpoints aos componentes.
- `server/index.js` expõe a API HTTP e `server/domain.js` concentra validações
  e operações. `server/db.js` inicializa SQLite com `users`, `weekly_plans`,
  `tasks` e `transactions`; cada registro persistido possui timestamps e
  chaves de usuário. `getCurrentUserId()` é o ponto para conectar autenticação
  futura sem refatorar os relacionamentos.
- `src/data/week.js` define os dias como dados (`DAYS`) e fornece
  `getTodayId()`. `src/data/finance.js` define categorias de gastos e ganhos.
  Componentes devem consumir esses dados em vez de duplicar listas ou regras
  de layout.
- O drag and drop fica inteiro em `src/components/WeekBoard/WeekBoard.jsx`.
  A origem do arraste fica em `dragRef`; o índice é calculado a partir de
  `[data-task-id]`, inserindo antes da tarefa sob o cursor ou no fim da coluna.
- Valores financeiros são sempre inteiros em centavos no estado. Conversão e
  formatação ficam em `src/utils/currency.js`; use `parseAmountToCents()` e
  `formatCurrency()` em vez de fazer contas com valores em reais ou strings
  formatadas.

## Convenções específicas

- A UI, strings de teste e comentários devem permanecer em pt-BR.
- Funções de estado válidas retornam novas estruturas; entradas inválidas ou
  operações sem efeito retornam o mesmo referencial quando esse é o contrato
  existente. Preserve a imutabilidade ao adicionar, concluir, excluir ou mover
  tarefas e ao adicionar/remover transações.
- `moveTask()` recebe o índice calculado antes da remoção. Ao mover dentro do
  mesmo dia para uma posição posterior, o índice de inserção precisa ser
  reduzido em um; mantenha também o clamp para os limites da lista.
- Categorias financeiras são válidas somente para seu tipo (`gasto` ou
  `ganho`). `calculateSummary()` sempre resume todos os registros, ignorando
  filtros de tela, e calcula `saldo` como `ganhos - gastos`.
- Cada lista financeira mantém seu próprio filtro local por categoria; o resumo
  geral não deve ser afetado pelos filtros.
- O render de `App.jsx` precisa continuar seguro para SSR: `scripts/check.mjs`
  carrega o App com Vite, `renderToString` e `MemoryRouter` na rota `/`.
  Não acesse APIs do navegador em escopo de módulo ou durante o render.
- `npm run check` verifica markup exato e invariantes importantes: sete
  colunas/formulários na semana, textos como `Minha Semana` e `Hoje`,
  `aria-label` das tarefas, imutabilidade/movimentação do board, validação e
  somas financeiras, conversão de `1.234,56` para centavos e marcação
  `data-saldo="negativo"`/`"positivo"`. Se uma alteração intencional mudar
  esses contratos, atualize `scripts/check.mjs` junto.
- Os tokens de design ficam em `src/index.css` e os componentes usam CSS
  Modules próprios. `src/App.css` não é importado; os estilos do App ficam em
  `src/App.module.css`.
