import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { Sticker, X } from 'lucide-react'
import Calendar from '../Calendar/Calendar.jsx'
import styles from './Sidebar.module.css'

/**
 * Sidebar com a marca "MyPlanner" e a navegação entre telas.
 * Em telas abaixo de 768px vira drawer sobreposto, controlado pelas props
 * `open`/`onClose` (o botão hambúrguer fica na topbar do App).
 * Os itens usam NavLink: o react-router marca `aria-current="page"` sozinho.
 */
function Sidebar({ open, onClose, mode, selectedDate, onSelectDate, onNavigate }) {
  // Fecha o drawer com a tecla ESC — só roda no cliente, seguro para SSR
  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return (
    <>
      {/* Fundo escurecido do drawer (apenas mobile) */}
      <div
        className={styles.backdrop}
        data-visible={open ? 'true' : 'false'}
        aria-hidden="true"
        onClick={onClose}
      />

      <aside
        id="sidebar-menu"
        className={styles.sidebar}
        data-open={open ? 'true' : 'false'}
        aria-label="Menu principal"
      >
        {/* Marca ---------------------------------------------------------------- */}
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            <Sticker size={22} />
          </span>
          <span className={styles.brandName}>MyPlanner</span>
          <button
            type="button"
            className={styles.close}
            aria-label="Fechar menu"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <Calendar
          mode={mode}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          onNavigate={onNavigate}
        />

        {/* Navegação ------------------------------------------------------------ */}
        <nav className={styles.nav} aria-label="Navegação principal">
          <NavLink to="/" end onClick={onClose}>
            Planejamento Semanal
          </NavLink>
          <NavLink to="/financas" onClick={onClose}>
            Planejamento Financeiro
          </NavLink>
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
