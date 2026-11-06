import React from 'react'
import { renderToString } from 'react-dom/server'
import { createServer } from 'vite'
import {
  addTask,
  createInitialBoard,
  moveTask,
  removeTask,
  toggleTask,
} from '../src/state/board.js'

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
  const html = renderToString(React.createElement(App))

  check('título presente', html.includes('Minha Semana'))
  check('7 colunas renderizadas', (html.match(/aria-label="Tarefas de /g) ?? []).length === 7)
  check('dia de hoje destacado', html.includes('>Hoje<'))
  check('7 formulários de adicionar', (html.match(/type="text"/g) ?? []).length === 7)
  check('estado vazio visível', html.includes('Arraste ou adicione uma tarefa'))
  check('resumo de tarefas', html.includes('tarefas concluídas'))
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
