import AddTaskForm from '../AddTaskForm/AddTaskForm.jsx'
import TaskItem from '../TaskItem/TaskItem.jsx'
import styles from './DayColumn.module.css'

/**
 * Coluna de um dia da semana: cabeçalho, lista de tarefas e formulário.
 * Recebe os handlers já "amarrados" ao dia, então não conhece o estado
 * global do board.
 */
export default function DayColumn({
  day,
  isToday,
  isOver,
  draggingTaskId,
  onAdd,
  onToggle,
  onRemove,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}) {
  const doneCount = day.tasks.filter((task) => task.done).length
  const classNames = [
    styles.column,
    isToday ? styles.today : '',
    isOver ? styles.over : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section
      className={classNames}
      aria-label={`Tarefas de ${day.label}`}
      onDragOver={(event) => onDragOver(event, day.id)}
      onDragLeave={(event) => onDragLeave(event, day.id)}
      onDrop={(event) => onDrop(event, day.id)}
    >
      <header className={styles.header}>
        <div className={styles.heading}>
          <h2 className={styles.title}>{day.label}</h2>
          <span className={styles.meta}>
            {doneCount} de {day.tasks.length} concluída
            {day.tasks.length === 1 ? '' : 's'}
          </span>
        </div>
        {isToday && <span className={styles.badge}>Hoje</span>}
      </header>

      {day.tasks.length === 0 ? (
        <p className={styles.empty}>Arraste ou adicione uma tarefa</p>
      ) : (
        <ul className={styles.list}>
          {day.tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isDragging={task.id === draggingTaskId}
              onToggle={(taskId) => onToggle(day.id, taskId)}
              onRemove={(taskId) => onRemove(day.id, taskId)}
              onDragStart={(draggedTask) => onDragStart(day.id, draggedTask)}
              onDragEnd={onDragEnd}
            />
          ))}
        </ul>
      )}

      <AddTaskForm dayLabel={day.label} onAdd={(text) => onAdd(day.id, text)} />
    </section>
  )
}
