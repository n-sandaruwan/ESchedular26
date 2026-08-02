import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initRealtimeCloudSync } from './data/firebaseSync'
import { createEmergencyLocalSnapshot } from './data/backupRestore'

// Initialize Realtime Cloud Sync across all devices & take rolling emergency snapshot
initRealtimeCloudSync();
createEmergencyLocalSnapshot();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
