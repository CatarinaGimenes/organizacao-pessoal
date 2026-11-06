import styles from './App.module.css'
import WeekBoard from './components/WeekBoard/WeekBoard.jsx'
import { useBoard } from './hooks/useBoard.js'

function App() {
  const { board, addTask, toggleTask, removeTask, moveTask } = useBoard()

  const total = board.reduce((count, day) => count + day.tasks.length, 0)
  const done = board.reduce(
    (count, day) => count + day.tasks.filter((task) => task.done).length,
    0,
  )

  return (
    <div className={styles.app}>
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Organização pessoal</p>
            <h1 className={styles.title}>Minha Semana</h1>
          </div>
          <p className={styles.summary}>
            <strong className={styles.summaryNumber}>{done}</strong> de{' '}
            <strong className={styles.summaryNumber}>{total}</strong>{' '}
            {total === 1 ? 'tarefa concluída' : 'tarefas concluídas'}
          </p>
        </header>

        <WeekBoard
          board={board}
          onAdd={addTask}
          onToggle={toggleTask}
          onRemove={removeTask}
          onMove={moveTask}
        />
      </div>
    </div>
  )
}

export default App
