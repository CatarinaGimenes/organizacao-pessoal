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
  updateTask,
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

  return sendJson(response, 404, { error: 'Rota não encontrada' })
}

const server = createServer((request, response) => {
  handler(request, response).catch((error) => {
    const status = /não encontrada|inválid|obrigatóri|deve|Categoria|Tipo|Tarefa|Transação/.test(error.message)
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
