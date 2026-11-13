# AGENTS.md

Vite + React 19 SPA (JS/JSX, sem TypeScript). UI e comentários em **pt-BR** —
mantenha textos, strings de teste e comentários em português.

## Comandos

```bash
npm run lint     # oxlint (único linter; sem Prettier/formatter)
npm run check    # suite de verificação — NÃO há vitest/jest; isto é o "teste"
npm run build    # build de produção (vite build)
npm run dev      # dev server
npm run full     # frontend e backend juntos
npm run server   # API Node + SQLite em localhost:3001
```

Ordem de verificação antes de concluir: `npm run lint` → `npm run check` →
`npm run build`.

## `npm run check` (scripts/check.mjs) — o mais importante

É um script ad-hoc, não um framework. Dois efeitos colaterais que causam erros:

1. **Renderiza `App.jsx` via SSR** (Vite `ssrLoadModule` + `renderToString`),
   envolvido num `MemoryRouter` com a rota inicial `/` — o `App` exige
   contexto de roteamento (`react-router-dom`) e `/` renderiza a tela
   semanal. Componentes devem permanecer seguros para SSR: nada de `window`,
   `document`, `localStorage` em escopo de módulo ou durante o render. Só
   `src/main.jsx` pode tocar no DOM (é onde vive o `BrowserRouter`).
2. **Afirma strings/markup exatos da UI.** Quebrar qualquer uma destas muda
   exige atualizar `scripts/check.mjs` junto:
   - `aria-label="Tarefas de "` (7×) e `type="text"` (7×) — contados no HTML
     da rota `/`; a tela financeira não renderiza ali, então os inputs dela
     não entram na contagem
   - `>Hoje<`, `Minha Semana`, `Arraste ou adicione uma tarefa`,
     `tarefas concluídas`
   - `data-saldo="negativo"` / `data-saldo="positivo"` (regra de cor do
     saldo, renderizada pelo `FinanceSummary` isolado)
   - imutabilidade e casos de `moveTask` (mover para frente no mesmo dia
     ajusta o índice em `-1`)
   - regras financeiras: validação/imutabilidade de `addTransaction`,
     `removeTransaction`, filtro de `selectTransactions`, somas de
     `calculateSummary` (saldo = ganhos - gastos, em centavos) e
     `parseAmountToCents` (`'1.234,56'` → `123456`)

Não existe CI nem outro test runner — `check` é a única verificação funcional.

## Arquitetura (não óbvia pelos nomes)

- **Toda regra de estado é pura e imutável** em `src/state/board.js`
  (`addTask`, `toggleTask`, `removeTask`, `moveTask`, `createInitialBoard`)
  e `src/state/finance.js` (`addTransaction`, `removeTransaction`,
  `selectTransactions`, `calculateSummary`). Nunca coloque lógica de negócio
  em componentes ou nos hooks.
- **`src/hooks/useBoard.js` e `src/hooks/useFinance.js` são só glue React**:
  carregam e sincronizam o estado com `src/api/client.js`; os componentes não
  conhecem endpoints. A persistência fica no backend SQLite.
- **Os hooks vivem no `App`, não nas páginas**: o estado é só em memória, então
  instanciá-los dentro das páginas faria a navegação perder os dados.
- **Roteamento via `react-router-dom`**: `BrowserRouter` em `src/main.jsx`,
  rotas em `App.jsx` (`/` = semana, `/financas` = planejamento financeiro).
  Telas ficam em `src/pages/`, e a Sidebar usa `NavLink` (o `aria-current` é
  automático).
- **Dinheiro é CENTAVOS (inteiro)** em todo o estado; a formatação
  (`Intl` pt-BR) fica em `src/utils/currency.js` (`formatCurrency`,
  `parseAmountToCents`). Nunca some reais com vírgula.
- **Categorias financeiras são dados, não layout**: `src/data/finance.js` —
  cada lista tem seu próprio filtro por categoria (estado local em
  `TransactionList`), e o resumo é sempre geral (ignora os filtros).
- **Drag & drop vive inteiro em `WeekBoard.jsx`**: fonte do arraste numa ref
  (`dragRef`), estado visível só guarda tarefa arrastada + coluna-alvo. O
  índice de destino sai de `event.target.closest('[data-task-id]')` (soltar
  sobre uma tarefa insere antes dela; senão, no fim).
- **Dias são dados, não layout**: `src/data/week.js` (`DAYS` + `getTodayId`,
  com `jsDay` onde domingo = 0). Renomear/reordenar/adicionar colunas é só
  este arquivo — mas `check` espera exatamente 7 colunas.
- **Tokens de design** (cores, raios, espaços) são variáveis CSS em
  `src/index.css`. Cada componente tem seu próprio `.module.css`.
- **`src/App.css` é resto morto**: não é importado em lugar nenhum. Os
  estilos reais do App estão em `App.module.css`.
- **Backend**: `server/index.js` expõe a API HTTP e `server/domain.js`
  concentra validação e operações de domínio. `server/db.js` inicializa o
  SQLite e o schema com `users`, `weekly_plans`, `tasks` e `transactions`.
  Todas as entidades persistidas têm `created_at`/`updated_at`, expostos pela
  API como `createdAt`/`updatedAt`; `getCurrentUserId()` é o ponto de extensão
  para autenticação futura.
