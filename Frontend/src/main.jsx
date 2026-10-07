import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './utils/axiosConfig.js'
import App from './App.jsx'

// Auto-reload on deployment chunk mismatches (stale chunk cache)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error detected, auto-reloading to fetch fresh deployment assets...', event);
  window.location.reload();
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
