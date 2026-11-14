import { useState } from 'react'
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from 'lucide-react'
import styles from './GoalsPage.module.css'

const DURATION_UNITS = [
  { value: 'dias', label: 'dias' },
  { value: 'meses', label: 'meses' },
  { value: 'anos', label: 'anos' },
]

const FREQUENCIES = [
  { value: 'diária', label: 'Diariamente' },
  { value: 'semanal', label: 'Semanalmente' },
  { value: 'mensal', label: 'Mensalmente' },
]

function BoardModal({ board, onSave, onClose }) {
  const [name, setName] = useState(board?.name ?? '')
  const [durationValue, setDurationValue] = useState(board?.durationValue ?? 1)
  const [durationUnit, setDurationUnit] = useState(board?.durationUnit ?? 'meses')

  const submit = (event) => {
    event.preventDefault()
    if (name.trim() && Number(durationValue) > 0) {
      onSave({ name, durationValue: Number(durationValue), durationUnit })
    }
  }

  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="goal-board-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.modalHeader}>
          <div>
            <p className={styles.eyebrow}>Quadro de metas</p>
            <h2 id="goal-board-modal-title">{board ? 'Editar quadro' : 'Criar novo quadro'}</h2>
          </div>
          <button type="button" className={styles.iconButton} aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <form className={styles.form} onSubmit={submit}>
          <label className={styles.field}>
            <span>Nome do quadro</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Minha próxima fase"
              maxLength={120}
              autoFocus
            />
          </label>
          <div className={styles.inlineFields}>
            <label className={styles.field}>
              <span>Duração planejada</span>
              <input
                type="number"
                min="1"
                step="1"
                value={durationValue}
                onChange={(event) => setDurationValue(event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>Unidade</span>
              <select value={durationUnit} onChange={(event) => setDurationUnit(event.target.value)}>
                {DURATION_UNITS.map((unit) => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
              </select>
            </label>
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryButton}>{board ? 'Salvar alterações' : 'Criar quadro'}</button>
            <button type="button" className={styles.secondaryButton} onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function ActionForm({ initial, onSave, onCancel }) {
  const [description, setDescription] = useState(initial?.description ?? '')
  const isCustom = initial?.frequency?.startsWith('personalizada:')
  const [frequency, setFrequency] = useState(isCustom ? 'personalizada' : initial?.frequency ?? 'diária')
  const [customFrequency, setCustomFrequency] = useState(isCustom ? initial.frequency.slice(14) : '')

  const submit = (event) => {
    event.preventDefault()
    const frequencyValue = frequency === 'personalizada'
      ? `personalizada: ${customFrequency.trim()}`
      : frequency
    if (description.trim() && (frequency !== 'personalizada' || customFrequency.trim())) {
      onSave({ description, frequency: frequencyValue })
    }
  }

  return (
    <form className={styles.actionForm} onSubmit={submit}>
      <input
        type="text"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Ex.: Praticar 30 minutos"
        maxLength={300}
        autoFocus
      />
      <select value={frequency} onChange={(event) => setFrequency(event.target.value)}>
        {FREQUENCIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        <option value="personalizada">Personalizada</option>
      </select>
      {frequency === 'personalizada' && (
        <input
          type="text"
          value={customFrequency}
          onChange={(event) => setCustomFrequency(event.target.value)}
          placeholder="Ex.: A cada 15 dias"
          maxLength={80}
        />
      )}
      <div className={styles.formActions}>
        <button type="submit" className={styles.primaryButton}>{initial ? 'Salvar' : 'Adicionar ação'}</button>
        {onCancel && <button type="button" className={styles.secondaryButton} onClick={onCancel}>Cancelar</button>}
      </div>
    </form>
  )
}

function ActionItem({ action, onToggle, onEdit, onRemove }) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <li className={styles.actionItem}>
        <ActionForm
          initial={action}
          onSave={(input) => {
            onEdit(action.id, input)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    )
  }

  return (
    <li className={styles.actionItem} data-done={action.done}>
      <label className={styles.checkLabel}>
        <input type="checkbox" checked={action.done} onChange={() => onToggle(action.id)} />
        <span>{action.description}</span>
      </label>
      <span className={styles.frequency}>{action.frequency.replace('personalizada:', '').trim()}</span>
      <button type="button" className={styles.iconButton} aria-label={`Editar ação ${action.description}`} onClick={() => setEditing(true)}>
        <Pencil size={15} />
      </button>
      <button type="button" className={styles.iconButton} aria-label={`Excluir ação ${action.description}`} onClick={() => onRemove(action.id)}>
        <Trash2 size={15} />
      </button>
    </li>
  )
}

function GoalCard({ goal, onUpdate, onRemove, onAddAction, onUpdateAction, onToggleAction, onRemoveAction }) {
  const [editing, setEditing] = useState(false)
  const [addingAction, setAddingAction] = useState(false)
  const [description, setDescription] = useState(goal.description)
  const [requirements, setRequirements] = useState(goal.requirements)

  const saveGoal = (event) => {
    event.preventDefault()
    if (description.trim()) {
      onUpdate(goal.id, { description, requirements })
      setEditing(false)
    }
  }

  return (
    <article className={styles.goalCard}>
      {editing ? (
        <form className={styles.goalEditForm} onSubmit={saveGoal}>
          <label className={styles.field}>
            <span>Qual é a minha meta?</span>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows="2" maxLength={500} />
          </label>
          <label className={styles.field}>
            <span>O que é necessário para alcançar essa meta?</span>
            <textarea value={requirements} onChange={(event) => setRequirements(event.target.value)} rows="3" maxLength={1000} />
          </label>
          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryButton}>Salvar meta</button>
            <button type="button" className={styles.secondaryButton} onClick={() => setEditing(false)}>Cancelar</button>
          </div>
        </form>
      ) : (
        <>
          <header className={styles.goalHeader}>
            <div>
              <p className={styles.cardEyebrow}>Minha meta</p>
              <h2>{goal.description}</h2>
            </div>
            <div className={styles.cardActions}>
              <button type="button" className={styles.iconButton} aria-label={`Editar meta ${goal.description}`} onClick={() => setEditing(true)}>
                <Pencil size={16} />
              </button>
              <button type="button" className={styles.iconButton} aria-label={`Excluir meta ${goal.description}`} onClick={() => onRemove(goal.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          </header>
          <div className={styles.requirements}>
            <strong>O que é necessário</strong>
            <p>{goal.requirements || 'Nenhum requisito informado.'}</p>
          </div>
        </>
      )}
      <div className={styles.actionsHeader}>
        <div>
          <h3>Planos de ação</h3>
          <span>{goal.actions.length} {goal.actions.length === 1 ? 'ação' : 'ações'}</span>
        </div>
        <button type="button" className={styles.smallButton} onClick={() => setAddingAction((value) => !value)}>
          <Plus size={15} /> Adicionar ação
        </button>
      </div>
      {addingAction && (
        <ActionForm
          onSave={(input) => {
            onAddAction(goal.id, input)
            setAddingAction(false)
          }}
          onCancel={() => setAddingAction(false)}
        />
      )}
      {goal.actions.length === 0 && !addingAction ? (
        <p className={styles.empty}>Adicione ações concretas para avançar nessa meta.</p>
      ) : (
        <ul className={styles.actionList}>
          {goal.actions.map((action) => (
            <ActionItem
              key={action.id}
              action={action}
              onToggle={onToggleAction}
              onEdit={onUpdateAction}
              onRemove={onRemoveAction}
            />
          ))}
        </ul>
      )}
    </article>
  )
}

function GoalForm({ onSave }) {
  const [description, setDescription] = useState('')
  const [requirements, setRequirements] = useState('')

  const submit = (event) => {
    event.preventDefault()
    if (!description.trim()) return
    onSave({ description, requirements })
    setDescription('')
    setRequirements('')
  }

  return (
    <form className={styles.newGoal} onSubmit={submit}>
      <div>
        <p className={styles.cardEyebrow}>Nova meta</p>
        <h2>O que você quer alcançar?</h2>
      </div>
      <label className={styles.field}>
        <span>Qual é a minha meta?</span>
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Descreva o resultado que deseja alcançar" rows="2" maxLength={500} />
      </label>
      <label className={styles.field}>
        <span>O que é necessário para alcançar essa meta?</span>
        <textarea value={requirements} onChange={(event) => setRequirements(event.target.value)} placeholder="Liste conhecimentos, recursos ou condições necessárias" rows="3" maxLength={1000} />
      </label>
      <button type="submit" className={styles.primaryButton}>Adicionar meta</button>
    </form>
  )
}

export default function GoalsPage({
  boards,
  selectedBoard,
  loading,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
  onCreateBoard,
  onUpdateBoard,
  onDeleteBoard,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onAddAction,
  onUpdateAction,
  onToggleAction,
  onDeleteAction,
}) {
  const [boardModal, setBoardModal] = useState(null)

  if (loading) return <p className={styles.status}>Carregando seus quadros...</p>
  if (!selectedBoard) return <p className={styles.status}>Não foi possível carregar um quadro de metas.</p>

  const confirmDeleteBoard = () => {
    if (boards.length > 1 && window.confirm('Excluir este quadro e todas as suas metas?')) onDeleteBoard()
  }

  return (
    <>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Organização pessoal</p>
          <h1>Planejamento de Metas</h1>
          <p className={styles.subtitle}>Transforme seus planos em próximos passos possíveis.</p>
        </div>
        <button type="button" className={styles.primaryButton} onClick={() => setBoardModal('new')}>
          <Plus size={17} /> Criar novo quadro
        </button>
      </header>

      <section className={styles.boardBar} aria-label="Quadro selecionado">
        <button type="button" className={styles.arrowButton} aria-label="Quadro anterior" disabled={!canGoPrevious} onClick={onPrevious}>
          <ChevronLeft size={22} />
        </button>
        <div className={styles.boardInfo}>
          <span className={styles.boardCounter}>Quadro {boards.findIndex((board) => board.id === selectedBoard.id) + 1} de {boards.length}</span>
          <h2>{selectedBoard.name}</h2>
          <span>Prazo: {selectedBoard.durationValue} {selectedBoard.durationUnit}</span>
        </div>
        <div className={styles.boardControls}>
          <button type="button" className={styles.iconButton} aria-label="Editar quadro" onClick={() => setBoardModal(selectedBoard)}>
            <Pencil size={16} />
          </button>
          <button type="button" className={styles.iconButton} aria-label="Excluir quadro" onClick={confirmDeleteBoard} disabled={boards.length === 1}>
            <Trash2 size={16} />
          </button>
        </div>
        <button type="button" className={styles.arrowButton} aria-label="Próximo quadro" disabled={!canGoNext} onClick={onNext}>
          <ChevronRight size={22} />
        </button>
      </section>

      <GoalForm onSave={onAddGoal} />
      <section className={styles.goalsSection} aria-label="Metas do quadro">
        <div className={styles.sectionHeader}>
          <div><p className={styles.eyebrow}>Acompanhe seu progresso</p><h2>Metas deste quadro</h2></div>
          <span>{selectedBoard.goals.length} {selectedBoard.goals.length === 1 ? 'meta' : 'metas'}</span>
        </div>
        {selectedBoard.goals.length === 0 ? (
          <p className={styles.empty}>Nenhuma meta cadastrada neste quadro.</p>
        ) : (
          <div className={`${styles.goalList} ${selectedBoard.goals.length === 1 ? styles.singleGoalList : ''}`}>
            {selectedBoard.goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onUpdate={onUpdateGoal}
                onRemove={(id) => {
                  if (window.confirm('Excluir esta meta e seus planos de ação?')) onDeleteGoal(id)
                }}
                onAddAction={onAddAction}
                onUpdateAction={onUpdateAction}
                onToggleAction={onToggleAction}
                onRemoveAction={(id) => {
                  if (window.confirm('Excluir este plano de ação?')) onDeleteAction(id)
                }}
              />
            ))}
          </div>
        )}
      </section>

      {boardModal && (
        <BoardModal
          board={boardModal === 'new' ? null : boardModal}
          onClose={() => setBoardModal(null)}
          onSave={(input) => {
            if (boardModal === 'new') onCreateBoard(input)
            else onUpdateBoard(input)
            setBoardModal(null)
          }}
        />
      )}
    </>
  )
}
