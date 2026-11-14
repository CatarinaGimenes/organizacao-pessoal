import { useState } from 'react'
import { CalendarDays, Check, ChevronRight, DollarSign, GripVertical, Plus, StickyNote, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getCategories } from '../../data/finance.js'
import { getTodayId } from '../../data/week.js'
import { parseAmountToCents } from '../../utils/currency.js'
import { todayKey } from '../../utils/calendar.js'
import styles from './DashboardPage.module.css'

function formatToday(date) {
  const [, month, day] = date.split('-')
  return `${day}/${month}`
}

function TodayTasks({ day, onToggle }) {
  return (
    <section className={`${styles.card} ${styles.todayCard}`} aria-labelledby="dashboard-tasks-title">
      <header className={styles.cardHeader}>
        <div>
          <p className={styles.cardEyebrow}>Planejamento semanal · {formatToday(todayKey())}</p>
          <h2 id="dashboard-tasks-title">Tarefas de hoje</h2>
        </div>
        <Link className={styles.textLink} to="/semanal">Ver semana <ChevronRight size={15} /></Link>
      </header>
      {day?.tasks.length ? (
        <ul className={styles.taskList}>
          {day.tasks.map((task) => (
            <li key={task.id} className={styles.taskItem} data-done={task.done}>
              <button
                type="button"
                className={styles.checkButton}
                aria-label={task.done ? `Desmarcar tarefa ${task.text}` : `Concluir tarefa ${task.text}`}
                aria-pressed={task.done}
                onClick={() => onToggle(day.id, task.id)}
              >
                {task.done && <Check size={15} />}
              </button>
              <span>{task.text}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.emptyState}>
          <CalendarDays size={22} />
          <p>Nenhuma tarefa planejada para hoje.</p>
          <Link to="/semanal">Planejar meu dia</Link>
        </div>
      )}
    </section>
  )
}

function TodayEvents({ events }) {
  return (
    <section className={styles.card} aria-labelledby="dashboard-events-title">
      <header className={styles.cardHeader}>
        <div>
          <p className={styles.cardEyebrow}>Planejamento mensal · {formatToday(todayKey())}</p>
          <h2 id="dashboard-events-title">Eventos de hoje</h2>
        </div>
        <Link className={styles.textLink} to="/mensal">Ver agenda <ChevronRight size={15} /></Link>
      </header>
      {events.length ? (
        <ul className={styles.eventList}>
          {events.map((event) => (
            <li key={event.id} className={styles.eventItem}>
              <span className={styles.eventDot} aria-hidden="true" />
              <div>
                <strong>{event.title}</strong>
                {event.description && <p>{event.description}</p>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.emptyState}>
          <CalendarDays size={22} />
          <p>Nenhum compromisso agendado para hoje.</p>
        </div>
      )}
    </section>
  )
}

function TodoList({ todos, onAdd, onToggle, onRemove }) {
  const [title, setTitle] = useState('')

  const submit = (event) => {
    event.preventDefault()
    if (!title.trim()) return
    onAdd(title)
    setTitle('')
  }

  return (
    <section className={styles.card} aria-labelledby="dashboard-todos-title">
      <header className={styles.cardHeader}>
        <div>
          <p className={styles.cardEyebrow}>Lista pessoal</p>
          <h2 id="dashboard-todos-title">TO DOs</h2>
        </div>
        <span className={styles.count}>{todos.length}</span>
      </header>
      <form className={styles.inlineForm} onSubmit={submit}>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Adicionar pendência..."
          maxLength={200}
          aria-label="Novo TO DO"
        />
        <button type="submit" className={styles.iconAction} aria-label="Adicionar TO DO" disabled={!title.trim()}>
          <Plus size={18} />
        </button>
      </form>
      {todos.length ? (
        <ul className={styles.todoList}>
          {todos.map((todo) => (
            <li key={todo.id} className={styles.todoItem} data-done={todo.done}>
              <button
                type="button"
                className={styles.checkButton}
                aria-label={todo.done ? `Desmarcar TO DO ${todo.title}` : `Concluir TO DO ${todo.title}`}
                aria-pressed={todo.done}
                onClick={() => onToggle(todo.id)}
              >
                {todo.done && <Check size={15} />}
              </button>
              <span>{todo.title}</span>
              <button type="button" className={styles.removeButton} aria-label={`Excluir TO DO ${todo.title}`} onClick={() => onRemove(todo.id)}>
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.mutedEmpty}>Sua lista pessoal está vazia.</p>
      )}
    </section>
  )
}

function QuickExpense({ onAdd }) {
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(getCategories('gasto')[0].id)
  const amountInCents = parseAmountToCents(amount)
  const canSubmit = description.trim() && amountInCents > 0

  const submit = (event) => {
    event.preventDefault()
    if (!canSubmit) return
    onAdd({ type: 'gasto', description, amount: amountInCents, category, occurredOn: todayKey() })
    setDescription('')
    setAmount('')
  }

  return (
    <section className={`${styles.card} ${styles.expenseCard}`} aria-labelledby="dashboard-expense-title">
      <header className={styles.cardHeader}>
        <div>
          <p className={styles.cardEyebrow}>Ação rápida</p>
          <h2 id="dashboard-expense-title">Registrar gasto</h2>
        </div>
        <DollarSign size={22} aria-hidden="true" />
      </header>
      <form className={styles.expenseForm} onSubmit={submit}>
        <label>
          <span>Descrição</span>
          <input type="text" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ex.: Café" maxLength={140} />
        </label>
        <label>
          <span>Valor (R$)</span>
          <input type="text" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0,00" />
        </label>
        <label>
          <span>Categoria</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {getCategories('gasto').map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <button type="submit" className={styles.primaryButton} disabled={!canSubmit}>Salvar gasto</button>
      </form>
      <Link className={styles.secondaryLink} to="/financas">Abrir planejamento financeiro <ChevronRight size={15} /></Link>
    </section>
  )
}

function StickyBoard({ notes, onAdd, onUpdate, onRemove }) {
  const [content, setContent] = useState('')
  const [color, setColor] = useState('yellow')
  const [draggingId, setDraggingId] = useState(null)
  const maxNoteY = notes.reduce((max, note) => Math.max(max, note.positionY), 0)
  const muralMinHeight = Math.max(300, maxNoteY * 4 + 180)

  const submit = (event) => {
    event.preventDefault()
    if (!content.trim()) return
    const offset = (notes.length % 4) * 7
    onAdd({ content, color, positionX: 6 + offset, positionY: 8 + (notes.length % 3) * 8 })
    setContent('')
  }

  const drop = (event) => {
    event.preventDefault()
    const noteId = event.dataTransfer.getData('text/plain')
    const board = event.currentTarget.getBoundingClientRect()
    const positionX = ((event.clientX - board.left) / board.width) * 100
    const positionY = Math.min(65, Math.max(0, ((event.clientY - board.top) / board.height) * 100))
    if (noteId) onUpdate(noteId, { positionX, positionY })
    setDraggingId(null)
  }

  return (
    <section className={`${styles.card} ${styles.muralCard}`} aria-labelledby="dashboard-notes-title">
      <header className={styles.cardHeader}>
        <div>
          <p className={styles.cardEyebrow}>Mural pessoal</p>
          <h2 id="dashboard-notes-title">Post-its</h2>
        </div>
        <StickyNote size={22} aria-hidden="true" />
      </header>
      <div
        className={styles.mural}
        style={{ minHeight: `${muralMinHeight}px` }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={drop}
      >
        {notes.length ? notes.map((note) => (
          <article
            key={note.id}
            className={`${styles.note} ${styles[`note${note.color[0].toUpperCase()}${note.color.slice(1)}`] ?? ''}`}
            style={{ left: `${note.positionX}%`, top: `${Math.min(note.positionY, 65)}%` }}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('text/plain', note.id)
              setDraggingId(note.id)
            }}
            onDragEnd={() => setDraggingId(null)}
            data-dragging={draggingId === note.id}
          >
            <div className={styles.noteHeader}>
              <GripVertical size={15} aria-hidden="true" />
              <select aria-label={`Cor do post-it ${note.id}`} value={note.color} onChange={(event) => onUpdate(note.id, { color: event.target.value })}>
                <option value="yellow">Amarelo</option>
                <option value="pink">Rosa</option>
                <option value="blue">Azul</option>
                <option value="green">Verde</option>
                <option value="orange">Laranja</option>
              </select>
              <button type="button" aria-label="Excluir post-it" onClick={() => onRemove(note.id)}><Trash2 size={14} /></button>
            </div>
            <textarea
              defaultValue={note.content}
              aria-label="Conteúdo do post-it"
              maxLength={500}
              onBlur={(event) => onUpdate(note.id, { content: event.target.value })}
            />
          </article>
        )) : (
          <div className={styles.muralEmpty}>
            <StickyNote size={26} />
            <p>Crie um post-it para deixar uma ideia à vista.</p>
          </div>
        )}
      </div>
      <form className={styles.noteForm} onSubmit={submit}>
        <input type="text" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Escreva um lembrete..." maxLength={500} aria-label="Novo post-it" />
        <select value={color} onChange={(event) => setColor(event.target.value)} aria-label="Cor do novo post-it">
          <option value="yellow">Amarelo</option>
          <option value="pink">Rosa</option>
          <option value="blue">Azul</option>
          <option value="green">Verde</option>
          <option value="orange">Laranja</option>
        </select>
        <button type="submit" className={styles.primaryButton} disabled={!content.trim()}>Criar post-it</button>
      </form>
    </section>
  )
}

export default function DashboardPage({
  board,
  events,
  todos,
  notes,
  onToggleTask,
  onAddTodo,
  onToggleTodo,
  onRemoveTodo,
  onAddNote,
  onUpdateNote,
  onRemoveNote,
  onAddTransaction,
}) {
  const todayId = getTodayId()
  const today = board.find((day) => day.id === todayId)
  const todayEvents = events.filter((event) => event.date === todayKey())

  return (
    <>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Organização pessoal</p>
          <h1>Painel Geral</h1>
          <p className={styles.subtitle}>Tudo o que merece sua atenção, reunido em um só lugar.</p>
        </div>
        <span className={styles.datePill}>{formatToday(todayKey())}</span>
      </header>
      <div className={styles.dashboardGrid}>
        <TodayTasks day={today} onToggle={onToggleTask} />
        <TodayEvents events={todayEvents} />
        <TodoList todos={todos} onAdd={onAddTodo} onToggle={onToggleTodo} onRemove={onRemoveTodo} />
        <QuickExpense onAdd={onAddTransaction} />
        <StickyBoard notes={notes} onAdd={onAddNote} onUpdate={onUpdateNote} onRemove={onRemoveNote} />
      </div>
    </>
  )
}
