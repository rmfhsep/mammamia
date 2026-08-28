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
      {/* 이 앱은 다크 전용 컨셉이라 기기/OS 설정과 무관하게 TDS 다크 테마를 강제한다.
          TDS는 브라우저의 prefers-color-scheme이 아니라 앱이 내려주는 UserAgent로 라이트/다크를
          판단하므로, ColorSchemeArea 없이는 (WebView 밖 테스트 환경 포함) 라이트로 고정된다. */}
      <ColorSchemeArea theme="dark">
        <QueryProvider>
          <App />
        </QueryProvider>
      </ColorSchemeArea>
    </TDSMobileAITProvider>
  </StrictMode>,
)
