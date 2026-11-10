import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// O BrowserRouter mora aqui (e só aqui): este é o único arquivo que toca no DOM,
// então o acesso a `window`/`history` fica fora do alcance do render SSR do check.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
