import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ColorSchemeArea } from '@toss/tds-mobile'
import { TDSMobileAITProvider } from '@toss/tds-mobile-ait'
import './index.css'
import App from './App.tsx'
import { QueryProvider } from './query-provider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TDSMobileAITProvider>
      {/* devcs와 동일하게 다크 전용 컨셉이라 강제한다 — TDS는 prefers-color-scheme이 아니라
          앱이 내려주는 UserAgent로 라이트/다크를 판단하므로 ColorSchemeArea가 필요하다. */}
      <ColorSchemeArea theme="dark">
        <QueryProvider>
          <App />
        </QueryProvider>
      </ColorSchemeArea>
    </TDSMobileAITProvider>
  </StrictMode>,
)
