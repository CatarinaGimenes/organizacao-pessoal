import { useState } from 'react'
import { ChevronLeft, ChevronRight, Pencil, Trash2, X } from 'lucide-react'
import {
  addMonths,
  getCalendarDays,
  getMonthBounds,
  todayKey,
} from '../../utils/calendar.js'
import styles from './MonthlyPage.module.css'

const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]
const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function EventForm({ date, initial, onSave, onCancel }) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')

  const submit = (event) => {
    event.preventDefault()
    if (title.trim()) onSave({ title, description, date })
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <input
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Título do evento"
        maxLength={140}
        autoFocus={!initial}
      />
      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Descrição (opcional)"
        maxLength={500}
        rows="2"
      />
      <div className={styles.formActions}>
        <button type="submit">{initial ? 'Salvar' : 'Adicionar evento'}</button>
        {initial && (
          <button type="button" className={styles.cancel} onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

function EventList({ events, showDate = false, onToggle, onEdit, onRemove }) {
  if (events.length === 0) return <p className={styles.empty}>Nenhum evento cadastrado.</p>

  return (
    <ul className={styles.items}>
      {events.map((event) => (
        <li key={event.id} className={styles.item} data-done={event.done}>
          {onToggle && (
            <input
              type="checkbox"
              checked={event.done}
              onChange={() => onToggle(event.id)}
              aria-label={`Concluir ${event.title}`}
            />
          )}
          <div className={styles.itemContent}>
            <strong>{event.title}</strong>
            {showDate && <time dateTime={event.date}>{formatEventDate(event.date)}</time>}
            {event.description && <p>{event.description}</p>}
          </div>
          {onEdit && (
            <button type="button" aria-label={`Editar ${event.title}`} onClick={() => onEdit(event)}>
              <Pencil size={15} />
            </button>
          )}
          {onRemove && (
            <button type="button" aria-label={`Excluir ${event.title}`} onClick={() => onRemove(event.id)}>
              <Trash2 size={15} />
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

function formatEventDate(date) {
  const [, month, day] = date.split('-')
  return `${day}/${month}`
}

function MonthlyCalendar({ month, selectedDate, onSelectDate, onChangeMonth, events }) {
  const [year, monthNumber] = month.split('-').map(Number)

  return (
    <section className={styles.calendar} aria-label="Calendário mensal">
      <header className={styles.calendarHeader}>
        <button type="button" aria-label="Mês anterior" onClick={() => onChangeMonth(addMonths(`${month}-01`, -1))}>
          <ChevronLeft size={18} />
        </button>
        <h2>{MONTHS[monthNumber - 1]} {year}</h2>
        <button type="button" aria-label="Próximo mês" onClick={() => onChangeMonth(addMonths(`${month}-01`, 1))}>
          <ChevronRight size={18} />
        </button>
      </header>
      <div className={styles.weekdays}>{WEEKDAYS.map((day) => <span key={day}>{day}</span>)}</div>
      <div className={styles.monthGrid}>
        {getCalendarDays(month).map((item) => {
          const dayEvents = events.filter((event) => event.date === item.date)
          return (
            <button
              key={item.date}
              type="button"
              disabled={!item.inMonth}
              className={styles.day}
              data-current-month={item.inMonth ? 'true' : 'false'}
              data-selected={item.date === selectedDate ? 'true' : 'false'}
              aria-label={`${item.date}${dayEvents.length ? `, ${dayEvents.length} eventos` : ''}`}
              onClick={() => onSelectDate(item.date)}
            >
              <span>{item.day}</span>
              {dayEvents.length > 0 && (
                <span className={styles.dayEvents}>
                  {dayEvents.slice(0, 1).map((event) => (
                    <span key={event.id} title={event.title}>{event.title}</span>
                  ))}
                  {dayEvents.length > 1 && <small>+{dayEvents.length - 1}</small>}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function EventModal({ date, events, onClose, onAdd, onUpdate, onToggle, onRemove }) {
  const [editing, setEditing] = useState(null)
  const saveEvent = (input) => {
    if (editing) onUpdate(editing.id, input)
    else onAdd(input)
    setEditing(null)
  }

  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="monthly-event-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.modalHeader}>
          <div>
            <p className={styles.eyebrow}>Eventos do dia</p>
            <h2 id="monthly-event-modal-title">{formatLongDate(date)}</h2>
          </div>
          <button type="button" aria-label="Fechar eventos" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <EventList
          events={events}
          onToggle={onToggle}
          onEdit={setEditing}
          onRemove={onRemove}
        />
        <EventForm
          date={date}
          initial={editing}
          onSave={saveEvent}
          onCancel={() => setEditing(null)}
        />
      </section>
    </div>
  )
}

function formatLongDate(date) {
  const [year, month, day] = date.split('-').map(Number)
  return `${day} de ${MONTHS[month - 1]} de ${year}`
}

function EventOverview({ month, events }) {
  const today = todayKey()
  const bounds = getMonthBounds(month)
  const todayEvents = month === today.slice(0, 7)
    ? events.filter((event) => event.date === today)
    : []
  const reference = month === today.slice(0, 7) ? today : bounds.start
  const upcoming = [...events]
    .filter((event) => event.date > reference || (month !== today.slice(0, 7) && event.date === reference))
    .sort((left, right) => left.date.localeCompare(right.date) || left.id.localeCompare(right.id))
    .slice(0, 5)

  return (
    <section className={styles.events} aria-label="Visão geral dos eventos">
      <div className={styles.overviewSection}>
        <div className={styles.sectionHeader}>
          <div><h2>Eventos de hoje</h2><p>{formatEventDate(today)}</p></div>
          <span>{todayEvents.length}</span>
        </div>
        <EventList events={todayEvents} showDate={false} />
      </div>
      <div className={styles.overviewSection}>
        <div className={styles.sectionHeader}>
          <div><h2>Próximos eventos</h2><p>Até 5 compromissos</p></div>
          <span>{upcoming.length}</span>
        </div>
        <EventList events={upcoming} showDate />
      </div>
    </section>
  )
}

export default function MonthlyPage({
  month, selectedDate, onSelectDate, onChangeMonth, events, goals,
  onAddEvent, onUpdateEvent, onToggleEvent, onRemoveEvent,
  onAddGoal, onToggleGoal, onRemoveGoal,
}) {
  const [goalTitle, setGoalTitle] = useState('')
  const [modalDate, setModalDate] = useState(null)
  const selectedEvents = modalDate ? events.filter((event) => event.date === modalDate) : []

  const selectDate = (date) => {
    onSelectDate(date)
    setModalDate(date)
  }

  const submitGoal = (event) => {
    event.preventDefault()
    if (goalTitle.trim()) {
      onAddGoal(goalTitle)
      setGoalTitle('')
    }
  }

  return (
    <>
      <header className={styles.header}>
        <div><p className={styles.eyebrow}>Organização pessoal</p><h1>Planejamento Mensal</h1></div>
        <span className={styles.pill}>{events.length} {events.length === 1 ? 'evento' : 'eventos'}</span>
      </header>
      <div className={styles.layout}>
        <MonthlyCalendar
          month={month}
          selectedDate={selectedDate}
          onSelectDate={selectDate}
          onChangeMonth={onChangeMonth}
          events={events}
        />
        <EventOverview month={month} events={events} />
      </div>
      <section className={styles.goals} aria-label="Metas do mês">
        <div className={styles.sectionHeader}>
          <div><h2>Metas do mês</h2><p>Objetivos para {MONTHS[Number(month.slice(5)) - 1]}</p></div>
          <span>{goals.filter((goal) => goal.done).length}/{goals.length}</span>
        </div>
        <form className={styles.goalForm} onSubmit={submitGoal}>
          <input type="text" value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} placeholder="Adicionar uma meta" maxLength={140} />
          <button type="submit">Adicionar</button>
        </form>
        {goals.length === 0 ? <p className={styles.empty}>Nenhuma meta cadastrada.</p> : (
          <ul className={styles.goalList}>
            {goals.map((goal) => (
              <li key={goal.id} data-done={goal.done}>
                <label><input type="checkbox" checked={goal.done} onChange={() => onToggleGoal(goal.id)} /><span>{goal.title}</span></label>
                <button type="button" aria-label={`Excluir meta ${goal.title}`} onClick={() => onRemoveGoal(goal.id)}><Trash2 size={15} /></button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {modalDate && (
        <EventModal
          date={modalDate}
          events={selectedEvents}
          onClose={() => setModalDate(null)}
          onAdd={onAddEvent}
          onUpdate={onUpdateEvent}
          onToggle={onToggleEvent}
          onRemove={onRemoveEvent}
        />
      )}
    </>
  )
}
