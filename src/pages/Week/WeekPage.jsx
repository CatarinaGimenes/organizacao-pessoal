import WeekBoard from '../../components/WeekBoard/WeekBoard.jsx'
import styles from './WeekPage.module.css'

/**
 * Tela do Planejamento Semanal: cabeçalho com o resumo de tarefas + quadro.
 * O estado vem de fora (o hook `useBoard` vive no App para sobreviver à
 * navegação entre telas); aqui só renderizamos.
 */
function WeekPage({ board, onAdd, onToggle, onRemove, onMove }) {
  const total = board.reduce((count, day) => count + day.tasks.length, 0)
  const done = board.reduce(
    (count, day) => count + day.tasks.filter((task) => task.done).length,
    0,
  )

  return (
    <>
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
        onAdd={onAdd}
        onToggle={onToggle}
        onRemove={onRemove}
        onMove={onMove}
      />
    </>
  )
}

export default WeekPage
