# CLAUDE.md — 앱인토스(Apps in Toss) 미니앱 개발 가이드

이 문서는 Claude(또는 다른 AI 코딩 에이전트)가 앱인토스 미니앱을 개발할 때
참고해야 할 공식 문서 활용법과 TDS(Toss Design System) 사용법을 정리한 **모노레포 공통 지침**이다.
`toss-miniapp/`은 여러 앱인토스 미니앱을 함께 담는 모노레포 루트이며, 앱은 각자
`toss-miniapp/{app-name}/` 아래에 독립된 프로젝트로 존재한다 (0. 참고).

앱마다 스택/도메인 특화 컨벤션이 다를 수 있으므로, 각 앱 디렉토리에는 별도의 `CLAUDE.md`가 있고
그 문서가 이 루트 문서보다 우선한다(더 구체적인 내용). 예: [mammamia/CLAUDE.md](mammamia/CLAUDE.md)

---

## 0. 모노레포 구조

```
toss-miniapp/
├── CLAUDE.md                # 이 문서 — 앱인토스/TDS 공통 가이드
├── mammamia/                 # 앱 1: 수유실/기저귀교환대 지도
│   ├── CLAUDE.md                # mammamia 전용 컨벤션
│   ├── src/                     # 프론트 (앱인토스 WebView)
│   └── backend/                 # 백엔드 (Vercel 배포, Next.js)
├── devcs/                    # 앱 2: CS 5지선다 퀴즈 ("토스개발자가되")
│   ├── CLAUDE.md                # devcs 전용 컨벤션
│   ├── src/                     # 프론트 (앱인토스 WebView)
│   └── backend/                 # 백엔드 (Vercel 배포, Next.js + MongoDB)
└── {다음 앱}/                 # 앱 3, 4, ... 여기에 같은 패턴으로 추가
```

- 앱마다 `package.json`(과 필요하면 `backend/package.json`)을 독립적으로 갖는다. 워크스페이스로
  묶어 의존성을 공유하지 않는다 — 앱들은 배포도, 런타임도 서로 안 겹치므로 공유할 이유가 생기기
  전까지는 완전히 분리된 프로젝트로 둔다.
- 앱 간에 실제로 중복되는 코드(예: 앱인토스 SDK 공통 래퍼, 공용 TDS 패턴)가 생기면 그때
  `toss-miniapp/packages/`로 뽑는다. 처음부터 공용 패키지를 만들지 않는다.
- 각 앱의 프론트/백엔드 배포 설정(Vercel Root Directory, `ait deploy` 실행 경로 등)은
  앱 디렉토리 기준 상대경로로 다시 잡아야 한다 — 앱을 옮기거나 새로 추가할 때 반드시 확인.

---

## 1. 프로젝트 개요

앱인토스(Apps in Toss)는 파트너사가 만든 서비스를 토스 앱 안에서
'앱인앱(App-in-App)' 형태로 노출하는 플랫폼이다.
WebView 또는 React Native(Granite 프레임워크) 기반으로 개발하며,
SDK 연동 → 빌드 결과물 업로드 → 검수 → 출시 순으로 진행된다.

---

## 2. 공식 문서 활용법

### 2.1 문서 사이트
- 메인 개발자센터: https://developers-apps-in-toss.toss.im
- TDS(디자인 시스템) 상세 문서: https://tossmini-docs.toss.im/tds-mobile (WebView)
  / https://tossmini-docs.toss.im/tds-react-native (React Native)
- 개발자 커뮤니티: https://techchat-apps-in-toss.toss.im

### 2.2 문서를 코드/텍스트로 바로 가져오는 법
GitBook 기반이라 페이지 URL 뒤에 `.md`를 붙이면 마크다운 원문을 그대로 받을 수 있다.

```
https://developers-apps-in-toss.toss.im/ai-vibe-coding        (HTML)
https://developers-apps-in-toss.toss.im/ai-vibe-coding/intro.md  (Markdown 원문)
```

전체 문서 인덱스가 필요하면:
- `https://developers-apps-in-toss.toss.im/llms.txt` (인덱스)
- `https://developers-apps-in-toss.toss.im/llms-full.txt` (전체 문서 통짜 export, 비용 큼 — 필요할 때만)
- `https://developers-apps-in-toss.toss.im/sitemap.md` (페이지 경로 탐색용)

### 2.3 문서에 직접 질문하기 (ask 파라미터)
페이지에 원하는 답이 없을 때, GitBook의 질의 인터페이스를 GET 요청으로 바로 쓸 수 있다.

```
GET https://developers-apps-in-toss.toss.im/{page}.md?ask=<질문>&goal=<최종목표>
```
- `ask`: 구체적이고 자연어로 된 단일 질문
- `goal` (선택): 최종적으로 하려는 작업. 답변을 목적에 맞게 조정해줌

### 2.4 MCP 연결 (권장, AI 에이전트 작업 시 필수급)
문서를 짐작하지 않고 정확히 참고하도록 아래 두 MCP를 연결한다.

```
# 문서 검색 MCP
https://developers-apps-in-toss.toss.im/~gitbook/mcp

# 콘솔 작업 MCP (워크스페이스/미니앱/검수/번들/인앱결제/인앱광고 조작)
URL: https://mcp.toss.im/adapters/apps-in-toss-console/mcp
Client ID: mcp-gateway
```
연결 후 `apps-in-toss`, `apps-in-toss-docs`가 MCP 목록에 보이면 정상.
콘솔 MCP는 최초 연결 시 인증(로그인)이 필요하다.

### 2.5 전체 개발 흐름 요약
1. 기획 — AI에게 아이디어 설명 → 정책 적합성 확인 + 화면/기능 정리 요청
2. 미니앱 생성 — 콘솔 등록 (앱인토스 콘솔 MCP 또는 `npx create-ait-app <app-name>`)
3. 기능 개발 — SDK/문서 참고해 기능 구현, 외부 저장소(Supabase/Firebase/Cloudflare) 필요 시 연동
4. 테스트 — `.ait` 번들 업로드 → QR 또는 푸시로 실제 토스 앱에서 테스트
5. 검수 요청 → 승인 → 콘솔에서 '출시하기' 클릭 (반영까지 약 1시간)

---

## 3. TDS(Toss Design System) 사용법

### 3.1 원칙
- **가능하면 항상 TDS 컴포넌트를 우선 사용한다.** 커스텀 UI를 직접 만들지 않는 것이 원칙.
  → 일관된 UX 보장, 개발 속도 3~5배 향상.
- 🔴 표시 컴포넌트: 디자인 커스텀 불가 (반드시 지정된 형태 그대로 사용)
- 🌈 표시 컴포넌트: 별도 개발 문서가 없어 직접 구현 필요
- TDS는 토스 자산이며, **앱인토스 서비스 제공 목적 범위 내에서만** 사용 가능한 제한적 라이선스다.
  (별도 상업적 재배포/타 서비스 전용 등은 불가 — 라이선스 페이지 확인)

### 3.2 설치

**WebView(React) 프로젝트**
```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install @apps-in-toss/web-framework @toss/tds-mobile
npx ait init
```

**React Native(Granite) 프로젝트**
```bash
npm create granite-app
cd my-granite-app
npm install @apps-in-toss/framework @toss/tds-react-native
npx ait init
```

### 3.3 컴포넌트 문서 위치
- 개발자센터 요약본(핵심 11종): `/design/components.md`
- 실제 코드 레벨 상세 문서(30종 이상): https://tossmini-docs.toss.im/tds-mobile/components/{컴포넌트명}/
  - 파운데이션: Colors, Typography
  - 대표 컴포넌트: Badge, Border, BottomCTA, Button, Checkbox, Dialog(Alert/Confirm), Modal, Toast,
    TextField, TextArea, SplitTextField, ListRow, ListHeader, Tab, Top, BottomSheet, Keypad(Number/Alphabet/FullSecure),
    Segmented Control, Slider, Stepper, Switch, Skeleton, Loader, Rating, Progress Bar/Stepper, Result 등
  - 유틸리티 훅: `useDialog`, `useToast`, `useBottomSheet`
  - 마이그레이션: `@toss-design-system` → `@toss/tds-mobile`, v1 → v2

### 3.4 사용 예시 (Button)
```tsx
import { Button } from '@toss/tds-mobile';

<Button color="primary" variant="fill" size="large" display="full">
  시작하기
</Button>

<Button color="danger" variant="weak" loading>
  처리 중
</Button>
```
- `color`: primary | danger | light | dark
- `variant`: fill(강조) | weak(보조)
- `display`: inline | block | full
- `size`: small | medium | large | xlarge
- 색상 커스터마이징은 props가 아니라 CSS 변수로 (`--button-color`, `--button-background-color` 등)
- 접근성: 아이콘만 있는 버튼은 반드시 `aria-label` 추가, 링크로 쓸 땐 `as="a"` + `href` 필수

### 3.5 디자인 단계 도구
- 피그마 TDS Mobile UI Kit (라이선스 동의 필요)
- 앱빌더: 콘솔 내 '디자인' 메뉴 → 설치 없이 웹에서 TDS 컴포넌트로 화면 구성, 개발자 모드 토글로 코드 확인 가능
- 필요한 컴포넌트가 없으면 채널톡으로 요청 가능 (예: 지도 등)

---

## 4. 참고 링크 모음
- 개발자센터 홈: https://developers-apps-in-toss.toss.im
- 바이브 코딩 가이드: https://developers-apps-in-toss.toss.im/ai-vibe-coding
- API·SDK 개요: https://developers-apps-in-toss.toss.im/documentation
- 미니앱 테스트: https://developers-apps-in-toss.toss.im/guide/operation/toss
- 미니앱 출시: https://developers-apps-in-toss.toss.im/development/deploy.html
- TDS Mobile(WebView): https://tossmini-docs.toss.im/tds-mobile
- TDS React Native: https://tossmini-docs.toss.im/tds-react-native
- 개발자 커뮤니티: https://techchat-apps-in-toss.toss.im

---

## 5. AI 에이전트 작업 시 체크리스트
- [ ] 앱인토스 문서 MCP(`~gitbook/mcp`), 콘솔 MCP 연결 및 인증 완료했는가?
- [ ] 새 화면/기능을 만들 때 커스텀 UI 대신 TDS 컴포넌트를 먼저 검토했는가?
- [ ] 🔴 컴포넌트를 임의로 커스텀하지 않았는가?
- [ ] 정책/가이드 위반 여부를 사전에 확인했는가? (검수 반려 예방)
- [ ] 테스트 환경과 실제 배포 환경의 도메인 차이(CORS 등)를 확인했는가?
  - 실서비스: `https://<appName>.apps.tossmini.com`
  - QR 테스트: `https://<appName>.private-apps.tossmini.com`
- [ ] 여러 앱이 있는 모노레포이므로, 지금 작업 중인 앱이 어느 `toss-miniapp/{app-name}/`인지
      명확히 하고 그 앱의 `CLAUDE.md`도 함께 확인했는가?
