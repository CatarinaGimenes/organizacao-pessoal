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
npm run full     # frontend e backend juntos
npm run server   # API + SQLite em http://localhost:3001
npm run build    # build de produção
npm run preview  # visualiza o build
npm run lint     # verifica o código com oxlint
npm run check    # verifica regras de estado + renderização (21 verificações)
```

Para iniciar frontend e backend juntos, use `npm run full`. Como alternativa,
execute `npm run server` em um terminal e `npm run dev` em outro. O Vite
encaminha `/api` para o backend em `localhost:3001`. O banco
SQLite é criado em `server/data/organizacao.sqlite` e esse arquivo não deve
ser versionado. O backend usa `node:sqlite` e requer Node.js `>=22.12.0`.

## Estrutura

```
src/
├── App.jsx / App.module.css        # página (cabeçalho + board)
├── index.css                       # reset e design tokens (cores, raios, espaços)
├── data/week.js                    # definição dos 7 dias (dados, não layout)
├── state/board.js                  # regras de estado (funções puras e imutáveis)
├── hooks/useBoard.js               # sincronização da semana com a API
├── api/client.js                   # cliente HTTP dos endpoints do backend
├── utils/id.js                     # gerador de id de tarefas
└── components/
    ├── WeekBoard/                  # grade das colunas + lógica de drag & drop
    ├── DayColumn/                  # cabeçalho, lista e formulário do dia
    ├── TaskItem/                   # checkbox, texto, arrastar e excluir
    └── AddTaskForm/                # formulário de nova tarefa
```

`server/` fica na raiz do projeto e contém a API Node e a persistência SQLite.

Cada componente possui seu próprio arquivo `.module.css`.

## Como está organizado o código

- **Estado isolado**: as regras locais (adicionar, concluir, excluir, mover)
  ficam em `src/state/board.js` como funções puras. `useBoard` sincroniza a UI
  com a API, e o backend persiste os dados em SQLite.
- **Dados separados do layout**: os dias vêm de `src/data/week.js` — renomear,
  reordenar ou adicionar colunas é uma mudança em um único arquivo.
- **Tokens globais**: cores, espaçamentos, raios e sombras são variáveis CSS em
  `src/index.css`, o que mantém o visual consistente e fácil de ajustar.
- **Backend preparado para usuários**: `server/db.js` cria `users`,
  `weekly_plans`, `tasks` e `transactions` com chaves do usuário, datas de
  criação/atualização e relacionamentos. `getCurrentUserId()` em
  `server/domain.js` é o ponto de substituição para autenticação futura.

## Expansões futuras planejadas

- Subtarefas, prazos, tarefas recorrentes e prioridades
- Filtros e busca
- Categorias/cor por tipo de tarefa
- Autenticação e autorização por usuário
