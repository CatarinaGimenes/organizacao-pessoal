import { useCallback, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import styles from './App.module.css'
import Sidebar from './components/Sidebar/Sidebar.jsx'
import WeekPage from './pages/Week/WeekPage.jsx'
import FinancePage from './pages/Finance/FinancePage.jsx'
import { useBoard } from './hooks/useBoard.js'
import { useFinance } from './hooks/useFinance.js'
import { getMonthKey, getWeekStart, todayKey } from './utils/calendar.js'

/**
 * Shell do aplicativo: topbar, sidebar e conteúdo roteado.
 * Os hooks ficam AQUI (e não dentro das páginas) porque o estado é só em
 * memória — se vivessem nas páginas, navegar entre telas perdia os dados.
 */
function App() {
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const location = useLocation()
  const mode = location.pathname === '/financas' ? 'month' : 'week'
  const weekStart = getWeekStart(selectedDate)
  const month = getMonthKey(selectedDate)
  const { board, addTask, toggleTask, removeTask, moveTask, error: boardError } = useBoard(weekStart)
  const {
    transactions,
    addTransaction,
    removeTransaction,
    error: financeError,
  } = useFinance(month, selectedDate)
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = useCallback(() => setMenuOpen(false), [])

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

      <Sidebar
        open={menuOpen}
        onClose={closeMenu}
        mode={mode}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onNavigate={setSelectedDate}
      />

      <main className={styles.main}>
        <div className={styles.content}>
          {(boardError || financeError) && (
            <p className={styles.error} role="alert">
              Não foi possível sincronizar os dados. Tente novamente.
            </p>
          )}
          <Routes>
            <Route
              path="/"
              element={
                <WeekPage
                  board={board}
                  onAdd={addTask}
                  onToggle={toggleTask}
                  onRemove={removeTask}
                  onMove={moveTask}
                  weekStart={weekStart}
                />
              }
            />
            <Route
              path="/financas"
              element={
                <FinancePage
                  transactions={transactions}
                  onAdd={addTransaction}
                  onRemove={removeTransaction}
                  selectedDate={selectedDate}
                />
              }
            />
            {/* Qualquer rota desconhecida volta para a semana */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App
