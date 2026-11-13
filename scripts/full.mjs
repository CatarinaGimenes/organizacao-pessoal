import { spawn } from 'node:child_process'

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const children = [
  spawn(npmCommand, ['run', 'server'], { stdio: 'inherit' }),
  spawn(npmCommand, ['run', 'dev'], { stdio: 'inherit' }),
]

let shuttingDown = false
let exitCode = 0

function stopChildren(signal = 'SIGTERM') {
  for (const child of children) {
    if (!child.killed) child.kill(signal)
  }
}

function finish(code = 0) {
  if (shuttingDown) return
  shuttingDown = true
  exitCode = code
  stopChildren()
}

for (const child of children) {
  child.on('error', (error) => {
    console.error(`Não foi possível iniciar um processo: ${error.message}`)
    finish(1)
  })

  child.on('exit', (code, signal) => {
    if (shuttingDown) return
    const unexpectedCode = code ?? (signal ? 1 : 0)
    if (unexpectedCode !== 0) {
      console.error(`Um processo encerrou inesperadamente (${signal ?? `código ${code}`}).`)
      finish(unexpectedCode)
    }
  })
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => finish(0))
}

let remaining = children.length
for (const child of children) {
  child.on('close', () => {
    remaining -= 1
    if (remaining === 0) process.exit(exitCode)
  })
}
