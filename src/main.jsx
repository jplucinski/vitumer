import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { migrateLegacyStorageKeys } from './constants/storageKeys.ts'
import { registerGsap } from './utils/gsap.ts'

registerGsap()

migrateLegacyStorageKeys()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
