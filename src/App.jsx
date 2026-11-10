import { useCallback, useState } from 'react'
import { Menu, X } from 'lucide-react'
import styles from './App.module.css'
import Sidebar from './components/Sidebar/Sidebar.jsx'
import WeekBoard from './components/WeekBoard/WeekBoard.jsx'
import { useBoard } from './hooks/useBoard.js'

function App() {
  const { board, addTask, toggleTask, removeTask, moveTask } = useBoard()
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = useCallback(() => setMenuOpen(false), [])

  const total = board.reduce((count, day) => count + day.tasks.length, 0)
  const done = board.reduce(
    (count, day) => count + day.tasks.filter((task) => task.done).length,
    0,
  )

  return (
    <div className={styles.app}>
      {/* Topbar mobile: botão hambúrguer (escondido em ≥768px) --------------- */}
      <div className={styles.topbar}>
        <button
          type="button"
          className={styles.menuButton}
          aria-expanded={menuOpen}
          aria-controls="sidebar-menu"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <Sidebar open={menuOpen} onClose={closeMenu} />

      <main className={styles.main}>
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
      </main>
    </div>
  )
}

export default App
