# CLAUDE.md — mammamia 프로젝트 개발 컨벤션

> 앱인토스 플랫폼 공통 가이드(문서 활용법, TDS 사용법, 검수 체크리스트)는
> [../CLAUDE.md](../CLAUDE.md)를 먼저 참고한다. 이 문서는 mammamia 앱에만 해당하는 컨벤션이다.

수유실/기저귀교환대 정보를 지도로 보여주는 앱. **이 앱 안에서도 프론트/백엔드 배포는 두 갈래**다 —
프론트는 앱인토스 콘솔이, 백엔드는 Vercel이 각자 따로 호스팅하고 프론트가 HTTPS로 백엔드를 호출한다.
서로 다른 도메인이므로 백엔드 쪽에 CORS 처리가 반드시 있어야 한다 (`backend/proxy.ts` 참고).

> `toss-miniapp/` 모노레포로 옮겨오면서 이 앱은 `toss-miniapp/mammamia/` 아래로 이동했다.
> Vercel 프로젝트("backend")의 **Root Directory 설정을 `backend`에서 `toss-miniapp/mammamia/backend`로
> 갱신해야** 자동배포가 다시 붙는다(대시보드에서 수동으로 변경 — 코드로는 못 고침).
> 앱인토스 배포(`ait deploy`)는 CI 연동이 없어 로컬에서 `toss-miniapp/mammamia/` 안에서
> 그대로 실행하면 된다.

## 1. 프로젝트 구조

```
mammamia/
├── src/                        # 프론트엔드 — 앱인토스 WebView (Vite + React + TS + TDS)
│   ├── lib/
│   │   ├── api.ts                  # 백엔드 fetch 클라이언트 (VITE_API_BASE_URL 기반)
│   │   └── queries/                # TanStack Query 훅 — 3. 참고
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
    ├── modules/                    # 도메인별 모듈 — 2. "모듈 아키텍처" 참고
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
> 쓰므로(루트 CLAUDE.md 3.1 원칙 참고) 커스텀 UI 레이어를 따로 안 만든다. 아래는 스택에 안 묶이는
> 원칙만 가져와 우리 구조에 맞게 다시 쓴 것이다.

## 2. 모듈 아키텍처 (백엔드)

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

## 3. 데이터 페칭 — TanStack Query (프론트엔드)

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

## 4. Import 순서

```tsx
// 1. 외부 라이브러리
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. 내부 유틸 / API 클라이언트
import { apiFetch } from '@/lib/api';

// 3. TDS 컴포넌트
import { Button } from '@toss/tds-mobile';
```

## 5. Props 정의

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

## 6. 재사용 가능한 훅 & 유틸 함수

- 화면 전용 로직(그 화면에서만 쓰는 상태·핸들러)은 컴포넌트 파일 안에 그대로 둔다. 두 곳 이상에서
  같은 로직이 필요해지면 그때 `src/lib/`로 추출한다(조기 추출 금지).
- 새 유틸/포맷 함수를 만들기 전에 `src/lib/`, 백엔드는 `lib/`에 이미 있는지 먼저 찾는다.
- 재사용 훅·유틸에는 JSDoc으로 용도를 한 줄 남긴다(파라미터가 타입만으로 알 수 없는 조건·기본값을
  가질 때는 `@param`도). 화면 전용 로컬 함수에는 굳이 달지 않는다.

## 7. 환경변수

| 위치 | 변수 | 용도 |
| --- | --- | --- |
| `mammamia/` (프론트) | `VITE_API_BASE_URL` | 백엔드 API 베이스 URL (로컬: `http://localhost:3000`, 배포: Vercel 도메인) |
| `mammamia/backend/` | `DATABASE_URL` | MongoDB Atlas 연결 문자열 |

두 `.env`는 모두 커밋하지 않는다(`.env.example`만 커밋). Vercel 배포 시 `DATABASE_URL`은
Vercel 프로젝트 환경변수로 등록한다.

## 8. 커밋 컨벤션

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

## 9. 스택 버전 관련 주의사항 (직접 겪은 함정)

- **MongoDB는 Prisma 7 미지원.** npm의 `prisma`/`@prisma/client` `latest` 태그가 7.x(SQL 전용
  클라이언트 경로)를 가리켜도, Mongo 프로젝트는 반드시 **Prisma 6.x에 고정**한다
  (`backend/package.json`에 `6.19.3`으로 고정돼 있음). `npm i prisma@latest` 같은 걸 무심코
  돌리지 않는다.
- **Next.js 16부터 `middleware.ts`가 `proxy.ts`로 이름이 바뀌었다.** export 함수명도 `middleware`
  → `proxy`. CORS 등 요청 가로채기 로직은 `backend/proxy.ts`에 있다.
- Route Handler의 동적 세그먼트 params는 Promise다: `const { id } = await ctx.params`.
