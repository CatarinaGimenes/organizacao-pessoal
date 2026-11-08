# AGENTS.md

Vite + React 19 SPA (JS/JSX, sem TypeScript). UI e comentários em **pt-BR** —
mantenha textos, strings de teste e comentários em português.

## Comandos

```bash
npm run lint     # oxlint (único linter; sem Prettier/formatter)
npm run check    # suite de verificação — NÃO há vitest/jest; isto é o "teste"
npm run build    # build de produção (vite build)
npm run dev      # dev server
```

Ordem de verificação antes de concluir: `npm run lint` → `npm run check` →
`npm run build`.

## `npm run check` (scripts/check.mjs) — o mais importante

É um script ad-hoc, não um framework. Dois efeitos colaterais que causam erros:

1. **Renderiza `App.jsx` via SSR** (Vite `ssrLoadModule` + `renderToString`).
   Componentes devem permanecer seguros para SSR: nada de `window`, `document`,
   `localStorage` em escopo de módulo ou durante o render. Só `src/main.jsx`
   pode tocar no DOM.
2. **Afirma strings/markup exatos da UI.** Quebrar qualquer uma destas muda
   exige atualizar `scripts/check.mjs` junto:
   - `aria-label="Tarefas de "` (7×), `type="text"` (7×)
   - `>Hoje<`, `Minha Semana`, `Arraste ou adicione uma tarefa`,
     `tarefas concluídas`
   - imutabilidade e casos de `moveTask` (mover para frente no mesmo dia
     ajusta o índice em `-1`)

Não existe CI nem outro test runner — `check` é a única verificação funcional.

## Arquitetura (não óbvia pelos nomes)

- **Toda regra de estado é pura e imutável** em `src/state/board.js`
  (`addTask`, `toggleTask`, `removeTask`, `moveTask`, `createInitialBoard`).
  Nunca coloque lógica de negócio em componentes ou no hook.
- **`src/hooks/useBoard.js` é só glue React**: estado em memória
  (`useState`), sem persistência. Adicionar localStorage/API é alterar apenas
  este arquivo — componentes não mudam.
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
