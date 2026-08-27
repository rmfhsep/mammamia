# CLAUDE.md — 앱인토스(Apps in Toss) 미니앱 개발 가이드

이 문서는 Claude(또는 다른 AI 코딩 에이전트)가 앱인토스 미니앱을 개발할 때
참고해야 할 공식 문서 활용법과 TDS(Toss Design System) 사용법을 정리한 프로젝트 지침이다.

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

---

## 6. mammamia 프로젝트 개발 컨벤션

수유실/기저귀교환대 정보를 지도로 보여주는 앱. **레포는 하나(모노레포)지만 배포는 두 갈래**다 —
프론트는 앱인토스 콘솔이, 백엔드는 Vercel이 각자 따로 호스팅하고 프론트가 HTTPS로 백엔드를 호출한다.
서로 다른 도메인이므로 백엔드 쪽에 CORS 처리가 반드시 있어야 한다 (`backend/proxy.ts` 참고).

### 6.1 프로젝트 구조

```
mammamia/
├── src/                        # 프론트엔드 — 앱인토스 WebView (Vite + React + TS + TDS)
│   ├── lib/
│   │   ├── api.ts                  # 백엔드 fetch 클라이언트 (VITE_API_BASE_URL 기반)
│   │   └── queries/                # TanStack Query 훅 — 6.3 참고
│   │       ├── keys.ts
│   │       ├── useCafes.ts
│   │       └── useReports.ts
│   ├── query-provider.tsx      # QueryClientProvider, main.tsx 최상위에 이미 물려 있음
│   └── App.tsx
├── apps-in-toss.config.ts
├── vite.config.ts
│
└── backend/                    # 백엔드 API — Next.js App Router (Vercel 배포)
    ├── app/api/                    # Route Handler. 요청 파싱 + 응답만, 로직은 modules/에 위임
    │   ├── cafes/route.ts
    │   └── reports/route.ts
    ├── modules/                    # 도메인별 모듈 — 6.2 "모듈 아키텍처" 참고
    │   ├── cafes/
    │   │   ├── cafe.schema.ts          # zod 요청/응답 스키마
    │   │   ├── cafe.service.ts         # 비즈니스 로직
    │   │   └── cafe.repository.ts      # Prisma 접근 (이 파일만 prisma.cafe.* 호출)
    │   └── reports/
    │       ├── report.schema.ts
    │       ├── report.service.ts
    │       └── report.repository.ts
    ├── lib/
    │   ├── db.ts                   # PrismaClient 싱글턴 (hot-reload 안전 패턴)
    │   └── geo.ts                  # bounding box / haversine 거리 계산 (도메인 공용 유틸)
    ├── proxy.ts                    # CORS 처리 (Next.js 16부터 middleware.ts → proxy.ts로 개명됨)
    └── prisma/schema.prisma        # MongoDB 커넥터, Prisma 6.x 고정
```

> 원래 참고했던 컨벤션 문서(Next.js 프론트 + Tailwind + `Screen`/`PageFooter`/`CtaButton` 같은
> 커스텀 UI 컴포넌트 세트)는 여기엔 그대로 안 맞는다. 우리 프론트는 Tailwind 대신 **TDS 컴포넌트**를
> 쓰므로(3.1 원칙 참고) 커스텀 UI 레이어를 따로 안 만든다. 아래는 스택에 안 묶이는 원칙만 가져와
> 우리 구조에 맞게 다시 쓴 것이다.

### 6.2 모듈 아키텍처 (백엔드)

- 도메인(카페, 제보, …)마다 `modules/{domain}/`에 스키마·서비스·레포지토리를 한데 모은다.
  기술 레이어(최상위에 controllers/services/models를 따로 두는 방식) 대신 **기능 단위로 묶어서**,
  한 도메인을 고칠 때 여러 최상위 폴더를 오가지 않게 한다.
- `app/api/{domain}/route.ts`는 요청 파싱 + 응답 변환만 하는 얇은 레이어다. 실제 로직(검증, DB 접근,
  비즈니스 규칙)은 반드시 `modules/{domain}/`로 위임한다 — route.ts에 로직이 쌓이면 테스트도
  재사용도 어려워진다.
- `{domain}.repository.ts`가 Prisma를 직접 다루는 유일한 곳이다. `service.ts`나 route handler에서
  `prisma.cafe.findMany(...)`를 직접 부르지 않는다 — DB 접근 방식이 바뀌어도(캐싱 추가 등)
  레포지토리 안에서만 고치면 되게 한다.
- 두 도메인이 겹치는 로직(예: 좌표 거리 계산)이 필요해지면 그때 `lib/`에 공용 유틸로 뽑는다.
  처음부터 공용으로 만들지 않는다 (예: `lib/geo.ts`).

### 6.3 데이터 페칭 — TanStack Query (프론트엔드)

여러 화면이 같은 서버 데이터(카페 목록 등)를 보여준다면 **반드시 TanStack Query로 캐시를 공유**한다.
화면마다 `useState` + `useEffect(fetch)`로 따로 들고 있으면, 한 화면에서 제보를 올려도 다른 화면
(지도, 상세)이 갱신되지 않는 버그가 생긴다.

- 리소스별 쿼리/뮤테이션 훅은 `src/lib/queries/use{Resource}.ts`에 모은다 (`useCafes.ts`, `useReports.ts`).
- 쿼리 키는 문자열을 직접 쓰지 말고 `src/lib/queries/keys.ts`의 `queryKeys`에 추가해서 가져다 쓴다.
  여러 파일에서 같은 키를 정확히 참조해야 `invalidateQueries`가 제대로 동작하는데, 문자열을 직접
  쓰면 오타로 캐시가 갈라진다.
- 조회는 `useQuery`, 서버 상태를 바꾸는 요청은 `use{Action}Mutation`으로 분리한다
  (`useCreateReportMutation`처럼).
- 뮤테이션 성공 시 관련 쿼리를 `onSuccess`에서 무효화한다. 응답에 최신 값이 바로 들어있으면
  `setQueryData`로 즉시 반영하고, 그렇지 않으면 `invalidateQueries`로 리페치를 트리거한다.
- 로딩 상태는 `isLoading`보다 **`!query.data`를 로딩 조건으로 쓰는 편이 더 명확**하다. `enabled`
  옵션으로 쿼리를 꺼둔 상태에서는 `isLoading`이 `false`로 나와 로딩 UI가 잠깐 안 보이는 함정이 있다.
- 서버 API 응답 타입은 그 데이터를 가져오는 훅 파일 하나에서만 정의한다 (예: `Cafe` 타입은
  `useCafes.ts`). 다른 파일은 거기서 import해서 쓰고, 페이지마다 복붙해서 중복 정의하지 않는다.

### 6.4 Import 순서

```tsx
// 1. 외부 라이브러리
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. 내부 유틸 / API 클라이언트
import { apiFetch } from '@/lib/api';

// 3. TDS 컴포넌트
import { Button } from '@toss/tds-mobile';
```

### 6.5 Props 정의

```tsx
// 1~2개: 인라인
function CafeMarker({ cafe, onClick }: { cafe: Cafe; onClick: () => void }) {}

// 3개 이상: named 인터페이스/타입
type CafeCardProps = {
  cafe: Cafe;
  selected: boolean;
  onSelect: (id: string) => void;
};
function CafeCard({ cafe, selected, onSelect }: CafeCardProps) {}
```

### 6.6 재사용 가능한 훅 & 유틸 함수

- 화면 전용 로직(그 화면에서만 쓰는 상태·핸들러)은 컴포넌트 파일 안에 그대로 둔다. 두 곳 이상에서
  같은 로직이 필요해지면 그때 `src/lib/`로 추출한다(조기 추출 금지).
- 새 유틸/포맷 함수를 만들기 전에 `src/lib/`, 백엔드는 `lib/`에 이미 있는지 먼저 찾는다.
- 재사용 훅·유틸에는 JSDoc으로 용도를 한 줄 남긴다(파라미터가 타입만으로 알 수 없는 조건·기본값을
  가질 때는 `@param`도). 화면 전용 로컬 함수에는 굳이 달지 않는다.

### 6.7 환경변수

| 위치 | 변수 | 용도 |
| --- | --- | --- |
| 루트 (프론트) | `VITE_API_BASE_URL` | 백엔드 API 베이스 URL (로컬: `http://localhost:3000`, 배포: Vercel 도메인) |
| `backend/` | `DATABASE_URL` | MongoDB Atlas 연결 문자열 |

두 `.env`는 모두 커밋하지 않는다(`.env.example`만 커밋). Vercel 배포 시 `DATABASE_URL`은
Vercel 프로젝트 환경변수로 등록한다.

### 6.8 커밋 컨벤션

```
타입: 내용
```

| 타입       | 설명             |
| ---------- | ---------------- |
| `feat`     | 새로운 기능      |
| `fix`      | 버그 수정        |
| `hotfix`   | 긴급 수정        |
| `style`    | CSS/스타일 수정  |
| `refactor` | 리팩토링         |
| `chore`    | 빌드, 설정, 기타 |

예시: `feat: 카페 반경 검색 API 추가`

### 6.9 스택 버전 관련 주의사항 (직접 겪은 함정)

- **MongoDB는 Prisma 7 미지원.** npm의 `prisma`/`@prisma/client` `latest` 태그가 7.x(SQL 전용
  클라이언트 경로)를 가리켜도, Mongo 프로젝트는 반드시 **Prisma 6.x에 고정**한다
  (`backend/package.json`에 `6.19.3`으로 고정돼 있음). `npm i prisma@latest` 같은 걸 무심코
  돌리지 않는다.
- **Next.js 16부터 `middleware.ts`가 `proxy.ts`로 이름이 바뀌었다.** export 함수명도 `middleware`
  → `proxy`. CORS 등 요청 가로채기 로직은 `backend/proxy.ts`에 있다.
- Route Handler의 동적 세그먼트 params는 Promise다: `const { id } = await ctx.params`.
