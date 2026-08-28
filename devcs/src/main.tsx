import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait'
import './index.css'
import App from './App.tsx'
import { QueryProvider } from './query-provider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TDSMobileAITProvider>
      <QueryProvider>
        <App />
      </QueryProvider>
    </TDSMobileAITProvider>
  </StrictMode>,
)
