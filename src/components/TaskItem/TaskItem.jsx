import styles from './TaskItem.module.css'

/**
 * Uma tarefa: checkbox de conclusão, texto, alça de arraste e exclusão.
 * O arraste parte da alça (`.handle`) para não interferir na interação
 * com o checkbox e com o texto.
 */
export default function TaskItem({
  task,
  isDragging,
  onToggle,
  onRemove,
  onDragStart,
  onDragEnd,
}) {
  const checkboxId = `task-${task.id}`

  const handleDragStart = (event) => {
    const item = event.currentTarget.closest('[data-task-id]')
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', task.id)
    if (item) event.dataTransfer.setDragImage(item, 12, 12)
    onDragStart(task)
  }

  return (
    <li
      className={[
        styles.item,
        task.done ? styles.done : '',
        isDragging ? styles.dragging : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-task-id={task.id}
    >
      <input
        id={checkboxId}
        type="checkbox"
        className={styles.checkbox}
        checked={task.done}
        onChange={() => onToggle(task.id)}
      />
      <label htmlFor={checkboxId} className={styles.text}>
        {task.text}
      </label>

      <span className={styles.actions}>
        <span
          className={styles.handle}
          draggable
          onDragStart={handleDragStart}
          onDragEnd={onDragEnd}
          title="Arraste para mover a tarefa"
          aria-hidden="true"
        >
          ⠿
        </span>
        <button
          type="button"
          className={styles.remove}
          onClick={() => onRemove(task.id)}
          aria-label={`Excluir tarefa: ${task.text}`}
        >
          ×
        </button>
      </span>
    </li>
  )
}
