# CLAUDE.md — devcs("토스개발자가되") 프로젝트 개발 컨벤션

> 앱인토스 플랫폼 공통 가이드(문서 활용법, TDS 사용법, 검수 체크리스트)는
> [../CLAUDE.md](../CLAUDE.md)를 먼저 참고한다. 이 문서는 devcs 앱에만 해당하는 컨벤션이다.

CS 기초 5지선다 문제를 카드 형태로 풀어보는 앱. 구조와 배포 방식은 [mammamia](../mammamia/CLAUDE.md)를
그대로 따른다 — 프론트는 앱인토스 콘솔이, 백엔드는 Vercel이 각자 따로 호스팅하고 프론트가 HTTPS로
백엔드를 호출한다. 서로 다른 도메인이므로 백엔드 쪽에 CORS 처리가 반드시 있어야 한다 (`backend/proxy.ts` 참고).
DB도 mammamia와 동일하게 **MongoDB + Prisma 6.x**를 쓴다 (Mongo 클러스터는 공유하되 데이터베이스 이름만
`devcs`로 분리 — `backend/.env.example` 참고).

> **폴더명(`devcs`)과 미니앱 표시 이름("토스개발자가되")이 다르다.** "토스개발자가되"는 이름에 "토스"가
> 들어가 상표권/오인 소지로 검수 반려될 수 있다는 리스크가 있다 — 확정 전 채널톡으로 확답을 받을 것.
> `apps-in-toss.config.ts`의 `appName`은 실제 콘솔 등록 slug와 반드시 일치해야 하므로, 콘솔에 앱을
> 등록한 뒤 실제 slug로 갱신해야 한다.

> 로컬에서 mammamia 백엔드와 devcs 백엔드를 동시에 켜두는 경우를 고려해 devcs 백엔드는
> `next dev -p 3010`으로 3000번 포트 충돌을 피한다 (`backend/package.json` 참고). 프론트
> `.env.example`의 `VITE_API_BASE_URL`도 이에 맞춰 `http://localhost:3010`으로 되어 있다.

## 1. 프로젝트 구조

```
devcs/
├── src/                        # 프론트엔드 — 앱인토스 WebView (Vite + React + TS + TDS)
│   ├── lib/
│   │   ├── api.ts                  # 백엔드 fetch 클라이언트 (VITE_API_BASE_URL 기반)
│   │   ├── deviceId.ts             # 로그인 없이 풀이 기록을 남기기 위한 익명 기기 식별자
│   │   └── queries/                # TanStack Query 훅 (mammamia와 동일한 패턴 — 3. 참고)
│   │       ├── keys.ts
│   │       ├── useQuestions.ts
│   │       └── useSolves.ts
│   ├── screens/
│   │   ├── QuizListScreen.tsx      # 카테고리 필터 + 문제 목록 + 풀이 진행률
│   │   └── QuizDetailScreen.tsx    # 문제 카드 → 선택 → 제출 → 정답/해설
│   ├── query-provider.tsx
│   └── App.tsx                     # 라우터 없이 useState로 목록/상세 화면만 전환
│
└── backend/                    # 백엔드 API — Next.js App Router (Vercel 배포)
    ├── app/api/                    # Route Handler. 요청 파싱 + 응답만, 로직은 modules/에 위임
    │   ├── questions/route.ts          # GET — 목록 조회 (정답/해설은 응답에서 제외)
    │   └── solves/route.ts             # GET — 기기별 풀이 기록 / POST — 답 제출 + 채점
    ├── modules/
    │   ├── questions/
    │   │   ├── question.schema.ts
    │   │   ├── question.service.ts
    │   │   └── question.repository.ts
    │   └── solves/
    │       ├── solve.schema.ts
    │       ├── solve.service.ts
    │       └── solve.repository.ts
    ├── data/questions.json         # 시드용 원본 문제 100개 (AI가 직접 작성 — 2. 참고)
    ├── scripts/seed-questions.ts   # data/questions.json → DB upsert (slug 기준, 재실행 안전)
    ├── lib/db.ts                   # PrismaClient 싱글턴
    ├── proxy.ts                    # CORS 처리
    └── prisma/schema.prisma        # MongoDB 커넥터, Prisma 6.x 고정
```

## 2. 문제 콘텐츠 — 저작권/부정경쟁방지법 리스크 관리

CS 문제·해설을 외부 블로그/카드뉴스에서 그대로 긁어와 게시하면 저작권법 위반, 그리고 한국에서는
부정경쟁방지법(타인이 상당한 노력으로 만든 성과물 무단 사용) 리스크가 모두 있다. 그래서
`backend/data/questions.json`의 100문항은 **AI가 CS 기초 개념(자료구조/알고리즘/네트워크/운영체제/
데이터베이스/웹/기타)을 바탕으로 원본으로 작성**했다 — 특정 블로그·강의·카드뉴스의 문장을 그대로
가져온 것이 아니다. 개념 자체(예: "이진 탐색은 O(log n)이다")는 저작권 보호 대상이 아니므로, 문제를
추가할 때도 이 원칙을 지킨다.

- 콘텐츠를 추가/확장할 때 우선순위: ① 직접 새로 작성(AI 초안 + 사람 검수) → ② 공신력 있는 1차 출처를
  참고해 재구성(공식 문서, RFC, 표준 스펙, 오픈소스 라이선스 코드 주석 등 — 사실을 참고하되 문장은
  새로 씀) → ③ 명시적으로 CC0/퍼블릭 도메인/오픈 라이선스가 걸린 문제 은행이 있다면 라이선스 조건을
  지키며 사용.
- 특정 자격증(정보처리기사 등) 기출문제는 출제 기관(한국산업인력공단 등)이 저작권을 갖고 있어,
  문항을 그대로 옮겨오면 안 된다. "그 기출이 다루는 개념"만 참고해서 새 문제로 재구성해야 한다.
- 스크래핑성 수집(자동으로 블로그/카드뉴스 원문을 긁어오는 것)은 하지 않는다. 도입하기 전에
  반드시 사람이 저작권/라이선스를 확인한다.

## 3. 도메인 모델 & 익명 사용자 식별

- 로그인 기능이 없으므로, "누가 어떤 문제를 풀었는지"는 `src/lib/deviceId.ts`가 최초 방문 시
  `localStorage`에 발급해두는 `deviceId`(UUID)로 구분한다. 앱을 지우거나 localStorage를 지우면
  풀이 기록도 초기화된다 — 로그인 붙일 계획이 생기면 그때 서버 계정과 매핑하는 마이그레이션이 필요하다.
- `Question.answerIndex`/`explanation`은 `GET /api/questions` 응답에 절대 포함하지 않는다
  (`question.service.ts`의 `listQuestions` 참고) — 풀기 전에 정답이 네트워크 탭에 노출되면 안 되기
  때문이다. 정답/해설은 `POST /api/solves`로 제출한 뒤 응답으로만, 또는 이미 푼 문제라면
  `GET /api/solves`로만 내려준다(자기가 이미 푼 문제에 한해서만).
- `Solve`는 `(deviceId, questionId)` 복합 유니크 키로 upsert한다 — 같은 문제를 다시 풀면 마지막
  제출로 결과가 갱신된다(기록을 여러 개 쌓지 않는다).

## 4. 나머지 컨벤션

모듈 아키텍처, TanStack Query 사용법, import 순서, props 정의, 재사용 훅/유틸, 커밋 컨벤션, Prisma
Mongo 버전 고정(`prisma@6.19.3`)·`proxy.ts` 네이밍·Route Handler params가 Promise인 것 등 스택 관련
주의사항은 [mammamia/CLAUDE.md](../mammamia/CLAUDE.md)와 완전히 동일하다 — devcs는 그 패턴을 그대로
복제해서 시작했으므로 중복 서술하지 않는다.

## 5. 배포 체크리스트 (아직 안 한 것)

- [ ] 앱인토스 콘솔에 실제로 앱 등록 (표시 이름 "토스개발자가되" 확정 전 채널톡 확답 필수 — 위 참고)
- [ ] `apps-in-toss.config.ts`의 `appName`을 콘솔 등록 slug로 갱신
- [ ] Vercel에 `devcs/backend`를 Root Directory로 하는 새 프로젝트 생성, `DATABASE_URL` 환경변수 등록
      (mammamia와 같은 Mongo 클러스터를 쓰더라도 database 이름은 `devcs`로 분리)
- [ ] `backend/proxy.ts`의 `allowedOrigins`를 실제 등록된 도메인으로 확정
- [ ] `cd devcs/backend && npm run seed`로 `data/questions.json` 100문항 시드
