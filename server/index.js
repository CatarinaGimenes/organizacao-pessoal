import { createServer } from 'node:http'
import { closeDatabase } from './db.js'
import {
  calculateSummary,
  createTask,
  createTransaction,
  deleteTask,
  deleteTransaction,
  getBoard,
  getCurrentUserId,
  getWeekStart,
  moveTask,
  listTransactions,
  listTransactionsRange,
  listMonthlyData,
  createMonthlyEvent,
  updateMonthlyEvent,
  toggleMonthlyEvent,
  deleteMonthlyEvent,
  createMonthlyGoal,
  toggleMonthlyGoal,
  deleteMonthlyGoal,
  updateTask,
  listGoalBoards,
  createGoalBoard,
  updateGoalBoard,
  deleteGoalBoard,
  createGoal,
  updateGoal,
  deleteGoal,
  createGoalAction,
  updateGoalAction,
  toggleGoalAction,
  deleteGoalAction,
  listTodos,
  createTodo,
  toggleTodo,
  deleteTodo,
  listStickyNotes,
  createStickyNote,
  updateStickyNote,
  deleteStickyNote,
} from './domain.js'

const port = Number(process.env.PORT ?? 3001)

function sendJson(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN ?? '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  })
  response.end(status === 204 ? undefined : JSON.stringify(body))
}

async function readJson(request) {
  let body = ''
  for await (const chunk of request) body += chunk
  if (!body) return {}
  try {
    return JSON.parse(body)
  } catch {
    throw new Error('Corpo JSON inválido')
  }
}

function getPathParts(url) {
  return new URL(url, `http://${process.env.HOST ?? 'localhost'}`).pathname
    .split('/')
    .filter(Boolean)
}

async function handler(request, response) {
  if (request.method === 'OPTIONS') return sendJson(response, 204, {})

  const parts = getPathParts(request.url)
  const url = new URL(request.url, `http://${process.env.HOST ?? 'localhost'}`)
  const userId = getCurrentUserId(request)

  if (request.method === 'GET' && parts[0] === 'api' && parts[1] === 'health') {
    return sendJson(response, 200, { ok: true })
  }

  if (parts[0] !== 'api') return sendJson(response, 404, { error: 'Rota não encontrada' })

  if (request.method === 'GET' && parts[1] === 'board') {
    return sendJson(response, 200, {
      weekStart: getWeekStart(url.searchParams.get('weekStart')),
      board: getBoard(userId, getWeekStart(url.searchParams.get('weekStart'))),
    })
  }

  if (request.method === 'GET' && parts[1] === 'transactions') {
    const month = url.searchParams.get('month') ?? new Date().toISOString().slice(0, 7)
    const transactions = listTransactions(userId, month)
    return sendJson(response, 200, {
      transactions,
      summary: calculateSummary(transactions),
    })
  }

  if (request.method === 'GET' && parts[1] === 'financial-dashboard') {
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    return sendJson(response, 200, {
      from,
      to,
      transactions: listTransactionsRange(userId, from, to),
    })
  }

  if (request.method === 'GET' && parts[1] === 'monthly') {
    const month = url.searchParams.get('month') ?? new Date().toISOString().slice(0, 7)
    return sendJson(response, 200, listMonthlyData(userId, month))
  }

  if (request.method === 'GET' && parts[1] === 'goals') {
    return sendJson(response, 200, { boards: listGoalBoards(userId) })
  }

  if (request.method === 'GET' && parts[1] === 'todos') {
    return sendJson(response, 200, { todos: listTodos(userId) })
  }
  if (request.method === 'POST' && parts.length === 2 && parts[1] === 'todos') {
    return sendJson(response, 201, { todos: createTodo(userId, await readJson(request)) })
  }
  if (parts[1] === 'todos' && parts[2]) {
    const todoId = parts[2]
    if (request.method === 'PATCH' && parts[3] === 'toggle') {
      return sendJson(response, 200, { todos: toggleTodo(userId, todoId) })
    }
    if (request.method === 'DELETE' && !parts[3]) {
      return sendJson(response, 200, { todos: deleteTodo(userId, todoId) })
    }
  }

  if (request.method === 'GET' && parts[1] === 'sticky-notes') {
    return sendJson(response, 200, { stickyNotes: listStickyNotes(userId) })
  }
  if (request.method === 'POST' && parts.length === 2 && parts[1] === 'sticky-notes') {
    return sendJson(response, 201, { stickyNotes: createStickyNote(userId, await readJson(request)) })
  }
  if (parts[1] === 'sticky-notes' && parts[2]) {
    const noteId = parts[2]
    if (request.method === 'PATCH') {
      return sendJson(response, 200, { stickyNotes: updateStickyNote(userId, noteId, await readJson(request)) })
    }
    if (request.method === 'DELETE') {
      return sendJson(response, 200, { stickyNotes: deleteStickyNote(userId, noteId) })
    }
  }

  if (request.method === 'POST' && parts.length === 2 && parts[1] === 'tasks') {
    const body = await readJson(request)
    return sendJson(response, 201, {
      board: createTask(userId, body),
    })
  }

  if (parts[1] === 'tasks' && parts[2]) {
    const taskId = parts[2]
    if (request.method === 'PATCH' && !parts[3]) {
      return sendJson(response, 200, {
        board: updateTask(userId, taskId, await readJson(request)),
      })
    }
    if (request.method === 'POST' && parts[3] === 'move') {
      const body = await readJson(request)
      return sendJson(response, 200, {
        board: moveTask(userId, taskId, body.targetDayId, body.targetIndex),
      })
    }
    if (request.method === 'DELETE' && !parts[3]) {
      return sendJson(response, 200, {
        board: deleteTask(userId, taskId),
      })
    }
  }

  if (request.method === 'POST' && parts.length === 2 && parts[1] === 'transactions') {
    const body = await readJson(request)
    return sendJson(response, 201, {
      transactions: createTransaction(userId, body),
    })
  }

  if (request.method === 'DELETE' && parts[1] === 'transactions' && parts[2]) {
    const month = url.searchParams.get('month') ?? new Date().toISOString().slice(0, 7)
    return sendJson(response, 200, {
      transactions: deleteTransaction(userId, parts[2], month),
    })
  }

  if (request.method === 'POST' && parts[1] === 'monthly' && parts[2] === 'events') {
    return sendJson(response, 201, { monthly: createMonthlyEvent(userId, await readJson(request)) })
  }
  if (parts[1] === 'monthly' && parts[2] === 'events' && parts[3]) {
    const id = parts[3]
    if (request.method === 'PATCH' && parts[4] === 'toggle') {
      return sendJson(response, 200, { monthly: toggleMonthlyEvent(userId, id) })
    }
    if (request.method === 'PATCH') {
      return sendJson(response, 200, { monthly: updateMonthlyEvent(userId, id, await readJson(request)) })
    }
    if (request.method === 'DELETE') {
      return sendJson(response, 200, { monthly: deleteMonthlyEvent(userId, id, url.searchParams.get('month')) })
    }
  }
  if (request.method === 'POST' && parts[1] === 'monthly' && parts[2] === 'goals') {
    return sendJson(response, 201, { monthly: createMonthlyGoal(userId, await readJson(request)) })
  }
  if (parts[1] === 'monthly' && parts[2] === 'goals' && parts[3]) {
    const id = parts[3]
    if (request.method === 'PATCH' && parts[4] === 'toggle') {
      return sendJson(response, 200, { monthly: toggleMonthlyGoal(userId, id) })
    }
    if (request.method === 'DELETE') {
      return sendJson(response, 200, { monthly: deleteMonthlyGoal(userId, id, url.searchParams.get('month')) })
    }
  }

  if (request.method === 'POST' && parts.length === 3 && parts[1] === 'goals' && parts[2] === 'boards') {
    return sendJson(response, 201, {
      boards: createGoalBoard(userId, await readJson(request)),
    })
  }
  if (parts[1] === 'goals' && parts[2] === 'boards' && parts[3]) {
    const boardId = parts[3]
    if (request.method === 'PATCH') {
      return sendJson(response, 200, {
        boards: updateGoalBoard(userId, boardId, await readJson(request)),
      })
    }
    if (request.method === 'DELETE') {
      return sendJson(response, 200, {
        boards: deleteGoalBoard(userId, boardId),
      })
    }
  }
  if (request.method === 'POST' && parts[1] === 'goals' && parts[2] === 'boards' && parts[3] && parts[4] === 'goals') {
    return sendJson(response, 201, {
      boards: createGoal(userId, parts[3], await readJson(request)),
    })
  }
  if (parts[1] === 'goals' && parts[2] === 'items' && parts[3]) {
    const goalId = parts[3]
    if (request.method === 'PATCH') {
      return sendJson(response, 200, {
        boards: updateGoal(userId, goalId, await readJson(request)),
      })
    }
    if (request.method === 'DELETE') {
      return sendJson(response, 200, {
        boards: deleteGoal(userId, goalId),
      })
    }
  }
  if (request.method === 'POST' && parts[1] === 'goals' && parts[2] === 'items' && parts[3] && parts[4] === 'actions') {
    return sendJson(response, 201, {
      boards: createGoalAction(userId, parts[3], await readJson(request)),
    })
  }
  if (parts[1] === 'goals' && parts[2] === 'actions' && parts[3]) {
    const actionId = parts[3]
    if (request.method === 'PATCH' && parts[4] === 'toggle') {
      return sendJson(response, 200, {
        boards: toggleGoalAction(userId, actionId),
      })
    }
    if (request.method === 'PATCH') {
      return sendJson(response, 200, {
        boards: updateGoalAction(userId, actionId, await readJson(request)),
      })
    }
    if (request.method === 'DELETE') {
      return sendJson(response, 200, {
        boards: deleteGoalAction(userId, actionId),
      })
    }
  }

  return sendJson(response, 404, { error: 'Rota não encontrada' })
}

const server = createServer((request, response) => {
  handler(request, response).catch((error) => {
    const status = /não encontrada|inválid|obrigatóri|deve|Categoria|Tipo|Tarefa|Transação|Evento|Meta|Quadro|Periodicidade|duração|Descrição|Requisitos|ação|TO DO|Post-it|post-it|Cor de/.test(error.message)
      ? 400
      : 500
    sendJson(response, status, { error: error.message })
  })
})

server.listen(port, () => {
  console.log(`Backend disponível em http://localhost:${port}`)
})

function shutdown() {
  server.close(() => {
    closeDatabase()
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
