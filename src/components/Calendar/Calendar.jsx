import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  addDays,
  addMonths,
  getCalendarDays,
  getMonthKey,
  getWeekStart,
  todayKey,
} from '../../utils/calendar.js'
import styles from './Calendar.module.css'

const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]
const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export default function Calendar({ selectedDate, mode, onSelectDate, onNavigate }) {
  const monthKey = getMonthKey(selectedDate)
  const [year, month] = monthKey.split('-').map(Number)
  const today = todayKey()
  const selectedWeekStart = mode === 'week' ? getWeekStart(selectedDate) : null
  const selectedWeekEnd = selectedWeekStart ? addDays(selectedWeekStart, 6) : null

  return (
    <section className={styles.calendar} aria-label="Calendário">
      <header className={styles.header}>
        <button type="button" className={styles.arrow} aria-label="Mês anterior" onClick={() => onNavigate(addMonths(`${monthKey}-01`, -1))}>
          <ChevronLeft size={16} />
        </button>
        <strong>{MONTHS[month - 1]} {year}</strong>
        <button type="button" className={styles.arrow} aria-label="Próximo mês" onClick={() => onNavigate(addMonths(`${monthKey}-01`, 1))}>
          <ChevronRight size={16} />
        </button>
      </header>
      <button type="button" className={styles.today} onClick={() => onSelectDate(today)}>Hoje</button>
      <div className={styles.weekdays} aria-hidden="true">
        {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className={styles.grid}>
        {getCalendarDays(monthKey).map((item) => {
          const selected = mode === 'month'
            ? item.date.slice(0, 7) === monthKey && item.date === selectedDate
            : item.date === selectedDate
          const inSelectedWeek = selectedWeekStart
            && item.date >= selectedWeekStart
            && item.date <= selectedWeekEnd
          return (
            <button
              key={item.date}
              type="button"
              className={styles.day}
              data-current-month={item.inMonth ? 'true' : 'false'}
              data-selected={selected ? 'true' : 'false'}
              data-selected-week={inSelectedWeek ? 'true' : 'false'}
              data-today={item.date === today ? 'true' : 'false'}
              aria-label={`Selecionar ${item.date}`}
              aria-pressed={selected}
              onClick={() => onSelectDate(item.date)}
            >
              {item.day}
            </button>
          )
        })}
      </div>
    </section>
  )
}
