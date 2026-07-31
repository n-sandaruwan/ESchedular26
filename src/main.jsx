import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initRealtimeCloudSync } from './data/firebaseSync'

// Initialize Realtime Cloud Sync across all devices
initRealtimeCloudSync();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
