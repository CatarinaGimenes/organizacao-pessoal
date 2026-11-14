import { useCallback, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import styles from './App.module.css'
import Sidebar from './components/Sidebar/Sidebar.jsx'
import WeekPage from './pages/Week/WeekPage.jsx'
import FinancePage from './pages/Finance/FinancePage.jsx'
import FinanceDashboardPage from './pages/FinanceDashboard/FinanceDashboardPage.jsx'
import MonthlyPage from './pages/Monthly/MonthlyPage.jsx'
import GoalsPage from './pages/Goals/GoalsPage.jsx'
import DashboardPage from './pages/Dashboard/DashboardPage.jsx'
import { useBoard } from './hooks/useBoard.js'
import { useFinance } from './hooks/useFinance.js'
import { useFinanceDashboard } from './hooks/useFinanceDashboard.js'
import { useMonthly } from './hooks/useMonthly.js'
import { useGoals } from './hooks/useGoals.js'
import { useTodos } from './hooks/useTodos.js'
import { useStickyNotes } from './hooks/useStickyNotes.js'
import { getMonthKey, getWeekStart, todayKey } from './utils/calendar.js'

/**
 * Shell do aplicativo: topbar, sidebar e conteúdo roteado.
 * Os hooks ficam AQUI (e não dentro das páginas) porque o estado é só em
 * memória — se vivessem nas páginas, navegar entre telas perdia os dados.
 */
function App() {
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [monthlyMonth, setMonthlyMonth] = useState(getMonthKey(todayKey()))
  const [monthlySelectedDate, setMonthlySelectedDate] = useState(todayKey)
  const location = useLocation()
  const mode = location.pathname === '/financas' || location.pathname === '/visualizacao-financeira'
    ? 'month'
    : 'week'
  const weekStart = getWeekStart(selectedDate)
  const month = getMonthKey(selectedDate)
  const { board, addTask, toggleTask, removeTask, moveTask, error: boardError } = useBoard(weekStart)
  const {
    transactions,
    addTransaction,
    removeTransaction,
    error: financeError,
  } = useFinance(month, selectedDate)
  const [dashboardPeriod, setDashboardPeriod] = useState('monthly')
  const dashboard = useFinanceDashboard(selectedDate, dashboardPeriod)
  const monthly = useMonthly(monthlyMonth)
  const dashboardMonthly = useMonthly(getMonthKey(todayKey()))
  const goals = useGoals()
  const todos = useTodos()
  const stickyNotes = useStickyNotes()
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
        hideCalendar={location.pathname === '/' || location.pathname === '/mensal' || location.pathname === '/metas'}
      />

      <main className={styles.main}>
        <div className={styles.content}>
          {(boardError || financeError || monthly.error || dashboardMonthly.error || goals.error || dashboard.error || todos.error || stickyNotes.error) && (
            <p className={styles.error} role="alert">
              Não foi possível sincronizar os dados. Tente novamente.
            </p>
          )}
          <Routes>
            <Route
              path="/"
              element={
                <DashboardPage
                  board={board}
                  events={dashboardMonthly.events}
                  todos={todos.todos}
                  notes={stickyNotes.notes}
                  onToggleTask={toggleTask}
                  onAddTodo={todos.addTodo}
                  onToggleTodo={todos.toggleTodo}
                  onRemoveTodo={todos.removeTodo}
                  onAddNote={stickyNotes.addStickyNote}
                  onUpdateNote={stickyNotes.updateStickyNote}
                  onRemoveNote={stickyNotes.removeStickyNote}
                  onAddTransaction={addTransaction}
                />
              }
            />
            <Route
              path="/semanal"
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
            <Route
              path="/visualizacao-financeira"
              element={
                <FinanceDashboardPage
                  selectedDate={selectedDate}
                  period={dashboardPeriod}
                  onPeriodChange={setDashboardPeriod}
                  transactions={dashboard.transactions}
                  range={dashboard.range}
                  loading={dashboard.loading}
                />
              }
            />
            <Route
              path="/mensal"
              element={
                <MonthlyPage
                  month={monthlyMonth}
                  selectedDate={monthlySelectedDate.slice(0, 7) === monthlyMonth
                    ? monthlySelectedDate
                    : `${monthlyMonth}-01`}
                  onSelectDate={setMonthlySelectedDate}
                  onChangeMonth={(nextDate) => {
                    const nextMonth = getMonthKey(nextDate)
                    setMonthlyMonth(nextMonth)
                    setMonthlySelectedDate(nextDate)
                  }}
                  events={monthly.events}
                  goals={monthly.goals}
                  onAddEvent={monthly.addEvent}
                  onUpdateEvent={monthly.updateEvent}
                  onToggleEvent={monthly.toggleEvent}
                  onRemoveEvent={monthly.removeEvent}
                  onAddGoal={monthly.addGoal}
                  onToggleGoal={monthly.toggleGoal}
                  onRemoveGoal={monthly.removeGoal}
                />
              }
            />
            <Route
              path="/metas"
              element={
                <GoalsPage
                  boards={goals.boards}
                  selectedBoard={goals.selectedBoard}
                  loading={goals.loading}
                  canGoPrevious={goals.canGoPrevious}
                  canGoNext={goals.canGoNext}
                  onPrevious={goals.previousBoard}
                  onNext={goals.nextBoard}
                  onCreateBoard={goals.createBoard}
                  onUpdateBoard={goals.updateBoard}
                  onDeleteBoard={goals.deleteBoard}
                  onAddGoal={goals.addGoal}
                  onUpdateGoal={goals.updateGoal}
                  onDeleteGoal={goals.deleteGoal}
                  onAddAction={goals.addAction}
                  onUpdateAction={goals.updateAction}
                  onToggleAction={goals.toggleAction}
                  onDeleteAction={goals.deleteAction}
                />
              }
            />
            {/* Qualquer rota desconhecida volta para o painel */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App
