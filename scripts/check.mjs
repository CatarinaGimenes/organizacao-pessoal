import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'
import {
  addTask,
  createInitialBoard,
  moveTask,
  removeTask,
  toggleTask,
} from '../src/state/board.js'
import {
  addTransaction,
  calculateSummary,
  calculateDashboardKpis,
  calculateExpenseDistribution,
  calculateMonthlyTotals,
  createInitialTransactions,
  removeTransaction,
  selectTransactions,
} from '../src/state/finance.js'
import { parseAmountToCents } from '../src/utils/currency.js'
import { getFinanceDashboardRange } from '../src/utils/calendar.js'
import {
  addMonthlyEvent,
  addMonthlyGoal,
  createInitialMonthlyData,
  removeMonthlyEvent,
  toggleMonthlyEvent,
  toggleMonthlyGoal,
} from '../src/state/monthly.js'
import { addTodo, createInitialTodos, removeTodo, toggleTodo } from '../src/state/todo.js'
import {
  addStickyNote,
  createInitialStickyNotes,
  removeStickyNote,
  updateStickyNote,
} from '../src/state/stickyNotes.js'

const results = []
const check = (name, ok) => results.push([name, ok])
const textsOf = (board, dayId) =>
  board.find((day) => day.id === dayId).tasks.map((task) => task.text)

function boardWith(lists) {
  let board = createInitialBoard()
  for (const [dayId, texts] of Object.entries(lists)) {
    for (const text of texts) board = addTask(board, dayId, text)
  }
  return board
}

/* ------------------------------------------------- regras de estado */

const initial = createInitialBoard()
check(
  'board inicial tem 7 dias vazios',
  initial.length === 7 && initial.every((day) => day.tasks.length === 0),
)

const added = addTask(initial, 'monday', '  Estudar React  ')
check('adiciona e aparada o texto', textsOf(added, 'monday').join() === 'Estudar React')
check('nova tarefa começa pendente', added[0].tasks[0].done === false)
check('texto vazio é ignorado', addTask(initial, 'monday', '   ') === initial)

const toggled = toggleTask(added, 'monday', added[0].tasks[0].id)
check('concluir marca done', toggled[0].tasks[0].done === true)
check(
  'desconcluir desmarca',
  toggleTask(toggled, 'monday', added[0].tasks[0].id)[0].tasks[0].done === false,
)
check('toggle é imutável', added[0].tasks[0].done === false)

const removed = removeTask(added, 'monday', added[0].tasks[0].id)
check('excluir remove a tarefa', removed[0].tasks.length === 0)

const abc = boardWith({ monday: ['A', 'B', 'C'], friday: ['X'] })
check(
  'mover entre dias (início)',
  textsOf(moveTask(abc, 'monday', abc[0].tasks[0].id, 'friday', 0), 'friday').join() === 'A,X',
)
check(
  'mover entre dias (fim)',
  textsOf(moveTask(abc, 'monday', abc[0].tasks[0].id, 'friday', 1), 'friday').join() === 'X,A',
)
check(
  'mesmo dia: para o fim',
  textsOf(moveTask(abc, 'monday', abc[0].tasks[0].id, 'monday', 3), 'monday').join() === 'B,C,A',
)
check(
  'mesmo dia: para o início',
  textsOf(moveTask(abc, 'monday', abc[0].tasks[2].id, 'monday', 0), 'monday').join() === 'C,A,B',
)
check(
  'soltar sobre tarefa insere antes dela',
  textsOf(moveTask(abc, 'monday', abc[0].tasks[2].id, 'monday', 1), 'monday').join() === 'A,C,B',
)
check('mover tarefa inexistente não altera', moveTask(abc, 'monday', 'nope', 'friday', 0) === abc)
check('estado original preservado', textsOf(abc, 'monday').join() === 'A,B,C')

/* ----------------------------------------------- regras financeiras */

const noTransactions = createInitialTransactions()
check('lista financeira inicia vazia', noTransactions.length === 0)

const gasto = addTransaction(noTransactions, {
  type: 'gasto',
  description: '  Supermercado  ',
  amount: 12550,
  category: 'alimentacao',
})
check(
  'cadastra gasto e apara a descrição',
  gasto.length === 1 && gasto[0].description === 'Supermercado',
)
check(
  'novo gasto mantém tipo e categoria',
  gasto[0].type === 'gasto' && gasto[0].category === 'alimentacao',
)
check('cadastro financeiro é imutável', noTransactions.length === 0)

const gastoInput = { type: 'gasto', description: 'Luz', amount: 500, category: 'contas' }
check('valor zero é ignorado', addTransaction(noTransactions, { ...gastoInput, amount: 0 }) === noTransactions)
check('valor negativo é ignorado', addTransaction(noTransactions, { ...gastoInput, amount: -100 }) === noTransactions)
check('valor não inteiro é ignorado', addTransaction(noTransactions, { ...gastoInput, amount: 10.5 }) === noTransactions)
check('descrição vazia é ignorada', addTransaction(noTransactions, { ...gastoInput, description: '   ' }) === noTransactions)
check(
  'categoria de outro tipo é ignorada (gasto não aceita "salario")',
  addTransaction(noTransactions, { ...gastoInput, category: 'salario' }) === noTransactions,
)
check(
  'tipo inválido é ignorado',
  addTransaction(noTransactions, { ...gastoInput, type: 'dividendo' }) === noTransactions,
)

const salario = addTransaction(gasto, {
  type: 'ganho',
  description: 'Salário',
  amount: 300000,
  category: 'salario',
})
check(
  'cadastra ganho com categoria da lista de ganhos',
  salario.length === 2 && salario[1].type === 'ganho' && salario[1].category === 'salario',
)
check(
  'removeTransaction exclui pelo id',
  removeTransaction(salario, gasto[0].id).length === 1,
)
check(
  'remover id inexistente mantém o referencial',
  removeTransaction(salario, 'nope') === salario,
)

check('seleção por tipo pega todos os gastos', selectTransactions(salario, 'gasto').length === 1)
check(
  'seleção sem filtro devolve todos do tipo',
  selectTransactions(salario, 'ganho', 'all').length === 1,
)
check(
  'filtro por categoria devolve só a categoria pedida',
  selectTransactions(
    addTransaction(salario, { type: 'gasto', description: 'Cinema', amount: 6000, category: 'lazer' }),
    'gasto',
    'lazer',
  ).every((transaction) => transaction.category === 'lazer'),
)
check(
  'filtro por categoria sem correspondência devolve lista vazia',
  selectTransactions(salario, 'gasto', 'saude').length === 0,
)

const positive = calculateSummary(salario)
check(
  'resumo soma gastos e ganhos em centavos',
  positive.gastos === 12550 && positive.ganhos === 300000,
)
check('saldo = ganhos - gastos', positive.saldo === 287450)
check('saldo negativo quando gastos > ganhos', calculateSummary(gasto).saldo === -12550)
check('resumo de lista vazia é zero', calculateSummary(noTransactions).saldo === 0)
check(
  'leitura de valor no formato brasileiro',
  parseAmountToCents('1.234,56') === 123456 &&
    parseAmountToCents('12,34') === 1234 &&
    parseAmountToCents('12.34') === 1234 &&
    parseAmountToCents('abc') === 0,
)
const dashboardTransactions = [
  { type: 'gasto', category: 'contas', amount: 10000, occurredOn: '2026-01-03' },
  { type: 'gasto', category: 'transporte', amount: 2500, occurredOn: '2026-01-04' },
  { type: 'gasto', category: 'lazer', amount: 5000, occurredOn: '2026-02-04' },
  { type: 'gasto', category: 'investimentos', amount: 20000, occurredOn: '2026-02-10' },
  { type: 'ganho', category: 'salario', amount: 100000, occurredOn: '2026-01-01' },
  { type: 'ganho', category: 'renda-extra', amount: 15000, occurredOn: '2026-02-01' },
]
const dashboardKpis = calculateDashboardKpis(dashboardTransactions, 'lazer')
check('categoria transporte é válida', addTransaction(noTransactions, {
  type: 'gasto', description: 'Ônibus', amount: 1200, category: 'transporte',
}).length === 1)
check('dashboard soma gasto por categoria', dashboardKpis.totalByCategory === 5000)
check('dashboard soma outras fontes de renda', dashboardKpis.otherIncome === 15000)
check('dashboard soma investimentos', dashboardKpis.invested === 20000)
check('dashboard soma gastos não essenciais', dashboardKpis.nonEssential === 5000)
check('dashboard agrupa despesas por categoria', calculateExpenseDistribution(dashboardTransactions).length === 4)
check(
  'dashboard preenche meses anuais sem movimentação',
  calculateMonthlyTotals(dashboardTransactions, '2026').length === 12 &&
    calculateMonthlyTotals(dashboardTransactions, '2026')[11].gastos === 0,
)
check(
  'dashboard anual usa ano atual até hoje',
  getFinanceDashboardRange('2026-11-13', 'annual', '2026-11-13').end === '2026-11-13',
)
check(
  'dashboard anual usa ano encerrado completo',
  getFinanceDashboardRange('2024-06-01', 'annual', '2026-11-13').end === '2024-12-31',
)

/* ----------------------------------------------- regras mensais */
const monthly = createInitialMonthlyData()
const monthlyWithEvent = addMonthlyEvent(monthly, {
  title: '  Reunião  ',
  description: 'Pauta',
  date: '2026-11-13',
})
check('planejamento mensal inicia vazio', monthly.events.length === 0 && monthly.goals.length === 0)
check('evento mensal apara título', monthlyWithEvent.events[0].title === 'Reunião')
check('evento mensal é imutável', monthly.events.length === 0)
check('toggle de evento mensal', toggleMonthlyEvent(monthlyWithEvent, monthlyWithEvent.events[0].id).events[0].done)
check('remove evento mensal', removeMonthlyEvent(monthlyWithEvent, monthlyWithEvent.events[0].id).events.length === 0)
const monthlyWithGoal = addMonthlyGoal(monthly, { title: 'Ler um livro' })
check('meta mensal e toggle', toggleMonthlyGoal(monthlyWithGoal, monthlyWithGoal.goals[0].id).goals[0].done)

/* ----------------------------------------------- regras do painel */
const todos = createInitialTodos()
const todoAdded = addTodo(todos, { title: '  Comprar café  ' })
check('TO DO apara o título', todoAdded[0].title === 'Comprar café')
check('TO DO é imutável', todos.length === 0)
check('TO DO alterna conclusão', toggleTodo(todoAdded, todoAdded[0].id)[0].done)
check('TO DO remove pelo id', removeTodo(todoAdded, todoAdded[0].id).length === 0)

const notes = createInitialStickyNotes()
const noteAdded = addStickyNote(notes, { content: '  Ideia importante  ', color: 'yellow' })
check('post-it apara o conteúdo', noteAdded[0].content === 'Ideia importante')
check('post-it é imutável', notes.length === 0)
check(
  'post-it atualiza conteúdo e posição',
  updateStickyNote(noteAdded, noteAdded[0].id, { content: 'Nova ideia', positionX: 30 })[0].positionX === 30,
)
check('post-it remove pelo id', removeStickyNote(noteAdded, noteAdded[0].id).length === 0)

/* ------------------------------------------------------------- render */

const server = await createServer({
  configFile: false,
  root: process.cwd(),
  logLevel: 'error',
  server: { middlewareMode: true },
  appType: 'custom',
})

try {
  const { default: App } = await server.ssrLoadModule('/src/App.jsx')
  // O App exige contexto de roteamento; a rota "/" renderiza a tela semanal,
  // então as asserções abaixo continuam válidas.
  const html = renderToString(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/'] },
      React.createElement(App),
    ),
  )

  check('Painel Geral renderiza na rota inicial', html.includes('Painel Geral'))
  check('tarefas de hoje no painel', html.includes('Tarefas de hoje'))
  check('eventos de hoje no painel', html.includes('Eventos de hoje'))
  check('lista de TO DOs no painel', html.includes('TO DOs'))
  check('mural de post-its no painel', html.includes('Post-its'))
  check('gasto rápido usa a data atual sem pedir data', !html.includes('type="date"'))

  const weeklyHtml = renderToString(
    React.createElement(MemoryRouter, { initialEntries: ['/semanal'] }, React.createElement(App)),
  )
  check('Planejamento Semanal renderiza na nova rota', weeklyHtml.includes('Minha Semana'))
  check('7 colunas renderizadas', (weeklyHtml.match(/aria-label="Tarefas de /g) ?? []).length === 7)
  check('dia de hoje destacado', weeklyHtml.includes('>Hoje<'))
  check('7 formulários de adicionar', (weeklyHtml.match(/type="text"/g) ?? []).length === 7)
  check('estado vazio visível', weeklyHtml.includes('Arraste ou adicione uma tarefa'))
  check('resumo de tarefas', weeklyHtml.includes('tarefas concluídas'))

  const monthlyHtml = renderToString(
    React.createElement(MemoryRouter, { initialEntries: ['/mensal'] }, React.createElement(App)),
  )
  check('rota mensal renderiza calendário e metas', monthlyHtml.includes('Planejamento Mensal') && monthlyHtml.includes('Metas do mês'))

  const goalsHtml = renderToString(
    React.createElement(MemoryRouter, { initialEntries: ['/metas'] }, React.createElement(App)),
  )

  const financeDashboardHtml = renderToString(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/visualizacao-financeira'] },
      React.createElement(App),
    ),
  )
  check(
    'rota de visualização financeira renderiza',
    financeDashboardHtml.includes('Visualização Financeira') || financeDashboardHtml.includes('Carregando movimentações'),
  )
  check(
    'rota de metas renderiza carregamento',
    goalsHtml.includes('Carregando seus quadros') || goalsHtml.includes('Planejamento de Metas'),
  )

  // Regra de cor do saldo — componente isolado, fora do roteamento.
  const { default: FinanceSummary } = await server.ssrLoadModule(
    '/src/components/Finance/FinanceSummary/FinanceSummary.jsx',
  )
  const negativeSaldo = renderToString(
    React.createElement(FinanceSummary, {
      summary: { gastos: 50000, ganhos: 10000, saldo: -40000 },
    }),
  )
  const positiveSaldo = renderToString(
    React.createElement(FinanceSummary, {
      summary: { gastos: 10000, ganhos: 50000, saldo: 40000 },
    }),
  )
  check(
    'saldo negativo é marcado como negativo (vermelho)',
    negativeSaldo.includes('data-saldo="negativo"'),
  )
  check(
    'saldo positivo é marcado como positivo (verde)',
    positiveSaldo.includes('data-saldo="positivo"'),
  )
} finally {
  await server.close()
}

/* ------------------------------------------------------------- saída */

let failed = 0
for (const [name, ok] of results) {
  console.log(`${ok ? '✓' : '✗'} ${name}`)
  if (!ok) failed += 1
}
console.log(`\n${results.length - failed}/${results.length} verificações passaram`)
if (failed > 0) process.exitCode = 1
