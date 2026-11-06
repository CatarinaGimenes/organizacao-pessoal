# Minha Semana — Organização Pessoal

Site de organização pessoal com um **board semanal** na página inicial: 7 colunas
(de segunda a domingo) para adicionar, concluir, excluir e arrastar tarefas.

## Funcionalidades

- 🗓️ Board com 7 colunas: segunda-feira a domingo
- ✅ Checkbox para marcar a conclusão de uma tarefa (texto riscado + visual esmaecido)
- ➕ Adicionar tarefas por coluna (botão ou `Enter`)
- 🗑️ Excluir tarefas
- 🖱️ Arrastar tarefas entre dias e reordenar dentro do mesmo dia
- 📍 Destaque da coluna do dia atual
- 📊 Resumo de tarefas concluídas no cabeçalho
- 📱 Layout responsivo: 7 colunas em telas largas, rolagem horizontal em tablets,
  colunas empilhadas no celular
- 🎨 Paleta rosa pastel + verde pastel + neutros, bordas arredondadas e espaçamentos
  confortáveis

## Como rodar

```bash
npm install
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção
npm run preview  # visualiza o build
npm run lint     # verifica o código com oxlint
npm run check    # verifica regras de estado + renderização (21 verificações)
```

## Estrutura

```
src/
├── App.jsx / App.module.css        # página (cabeçalho + board)
├── index.css                       # reset e design tokens (cores, raios, espaços)
├── data/week.js                    # definição dos 7 dias (dados, não layout)
├── state/board.js                  # regras de estado (funções puras e imutáveis)
├── hooks/useBoard.js               # estado em memória + handlers memoizados
├── utils/id.js                     # gerador de id de tarefas
└── components/
    ├── WeekBoard/                  # grade das colunas + lógica de drag & drop
    ├── DayColumn/                  # cabeçalho, lista e formulário do dia
    ├── TaskItem/                   # checkbox, texto, arrastar e excluir
    └── AddTaskForm/                # formulário de nova tarefa
```

Cada componente possui seu próprio arquivo `.module.css`.

## Como está organizado o código

- **Estado isolado**: as regras (adicionar, concluir, excluir, mover) ficam em
  `src/state/board.js` como funções puras; `useBoard` só conecta isso ao React.
  Isso permite trocar a persistência (localStorage, API) sem tocar nos componentes.
- **Dados separados do layout**: os dias vêm de `src/data/week.js` — renomear,
  reordenar ou adicionar colunas é uma mudança em um único arquivo.
- **Tokens globais**: cores, espaçamentos, raios e sombras são variáveis CSS em
  `src/index.css`, o que mantém o visual consistente e fácil de ajustar.

## Expansões futuras planejadas

- Persistência das tarefas (`localStorage` ou sincronização com nuvem)
- Subtarefas, prazos, tarefas recorrentes e prioridades
- Filtros e busca
- Categorias/cor por tipo de tarefa
- Edição do texto de uma tarefa existente
