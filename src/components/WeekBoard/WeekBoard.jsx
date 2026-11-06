import { useRef, useState } from 'react'
import { getTodayId } from '../../data/week.js'
import DayColumn from '../DayColumn/DayColumn.jsx'
import styles from './WeekBoard.module.css'

/**
 * Grade das 7 colunas e responsável por toda a lógica de drag & drop.
 * O arraste é rastreado em uma ref (fonte da tarefa) e o estado visível
 * guarda apenas o que precisa re-renderizar: tarefa arrastada e coluna-alvo.
 */
export default function WeekBoard({
  board,
  onAdd,
  onToggle,
  onRemove,
  onMove,
}) {
  const dragRef = useRef(null)
  const [draggingTaskId, setDraggingTaskId] = useState(null)
  const [overDayId, setOverDayId] = useState(null)

  const todayId = getTodayId()

  const handleDragStart = (dayId, task) => {
    dragRef.current = { sourceDayId: dayId, taskId: task.id }
    setDraggingTaskId(task.id)
  }

  const handleDragEnd = () => {
    dragRef.current = null
    setDraggingTaskId(null)
    setOverDayId(null)
  }

  const handleDragOver = (event, dayId) => {
    if (!dragRef.current) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    if (overDayId !== dayId) setOverDayId(dayId)
  }

  const handleDragLeave = (event, dayId) => {
    if (event.currentTarget.contains(event.relatedTarget)) return
    setOverDayId((prev) => (prev === dayId ? null : prev))
  }

  const handleDrop = (event, dayId) => {
    event.preventDefault()
    const drag = dragRef.current
    if (!drag) return

    const target = board.find((day) => day.id === dayId)
    if (!target) return

    // Soltar sobre uma tarefa insere antes dela; caso contrário, no fim.
    const hoveredTask = event.target.closest?.('[data-task-id]')
    let index = target.tasks.length
    if (hoveredTask) {
      const found = target.tasks.findIndex(
        (task) => task.id === hoveredTask.dataset.taskId,
      )
      if (found !== -1) index = found
    }

    onMove(drag.sourceDayId, drag.taskId, dayId, index)
    handleDragEnd()
  }

  return (
    <div
      className={styles.board}
      role="group"
      aria-label="Quadro semanal de tarefas"
    >
      {board.map((day) => (
        <div key={day.id} className={styles.slot}>
          <DayColumn
            day={day}
            isToday={day.id === todayId}
            isOver={overDayId === day.id}
            draggingTaskId={draggingTaskId}
            onAdd={onAdd}
            onToggle={onToggle}
            onRemove={onRemove}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        </div>
      ))}
    </div>
  )
}
