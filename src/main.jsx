import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ThemeProvider } from './components/ThemeProvider'
import { registerServiceWorker, setupInstallPrompt } from './utils/serviceWorker'
import './index.css'

// Setup PWA install prompt
setupInstallPrompt();

// Register service worker for offline support
if (import.meta.env.PROD) {
  registerServiceWorker().catch(console.error);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
)
