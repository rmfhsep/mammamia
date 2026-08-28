# CLAUDE.md — ainews 프로젝트 개발 컨벤션

> 앱인토스 플랫폼 공통 가이드는 [../CLAUDE.md](../CLAUDE.md)를 먼저 참고한다. 이 문서는 ainews 앱에만
> 해당하는 컨벤션이다. 구조/배포 방식은 [devcs](../devcs/CLAUDE.md)를 그대로 따른다 — 프론트는 앱인토스
> 콘솔, 백엔드는 Vercel, DB는 MongoDB + Prisma 6.x (자체 Atlas 클러스터).

IT 개발자·데이터 분석가를 위한 국내외 아티클을 큐레이션해서 피드로 보여주는 앱. **원문을 스크래핑해서
복제하지 않는다** — 이게 이 앱의 가장 중요한 설계 원칙이다.

## 1. 콘텐츠 수집 원칙 (반드시 지킬 것)

- 사이트를 직접 크롤링(HTML 파싱)하지 않는다. 각 매체가 공식으로 제공하는 **RSS/Atom 피드**만 읽는다
  (`backend/data/sources.ts`에 소스 목록). RSS는 매체가 배포를 위해 스스로 공개한 채널이라 스크래핑과는
  법적 성격이 다르다.
- **국내 소스**(요즘IT, GeekNews, 토스/카카오/네이버 기술 블로그): 제목과 RSS가 제공하는 공식 요약
  (description) 필드를 그대로 쓴다. 본문 전체를 가져오지 않는다.
- **해외 소스**(OpenAI, Hugging Face, Google DeepMind 등): **절대 번역하지 않는다.** RSS의 짧은 공식
  요약만 "사실관계 재료"로 Claude API(`modules/ingest/summarize.ts`)에 전달해서, 문장·제목·구조를 완전히
  새로 쓴 한국어 브리프를 만든다. 번역이나 원문 표현을 살짝 바꾼 의역은 여전히 2차적저작물작성권
  침해라 안 된다 — 정말로 "사실만 보고 새로 쓴 것"이어야 한다. `summarize.ts`의 프롬프트를 고칠 때도
  이 원칙을 유지할 것.
- 원문 전체를 우리 DB/화면에 저장·노출하지 않는다. 사용자가 탭하면 항상 `originalUrl`로 이동시켜
  (`openURL` SDK 함수) 실제 콘텐츠는 원 사이트에서 읽게 한다 — 우리는 인덱스/큐레이션만 한다.
- 새 소스를 추가하고 싶으면 `backend/data/sources.ts`에 RSS 주소만 추가하면 된다. 크롤러를 새로
  짤 필요는 없다 — 없으면 그 매체는 (아직) RSS를 안 주는 것이니, 임의로 HTML을 긁지 말고 다른 방법을
  찾거나 보류한다.

## 2. 수집 파이프라인

```
backend/
├── data/sources.ts              # RSS 소스 목록 (국내/해외, 카테고리)
├── modules/
│   ├── ingest/
│   │   ├── rss.ts                   # RSS/Atom 파싱
│   │   ├── summarize.ts             # 해외 소스용 Claude 요약 (번역 아님 — 1. 참고)
│   │   └── ingest.service.ts        # 소스 순회 + 중복 제거 + DB 저장
│   └── articles/
│       ├── article.schema.ts
│       ├── article.repository.ts
│       └── article.service.ts
├── app/api/
│   ├── articles/route.ts            # GET — 프론트가 읽는 피드 API
│   └── cron/ingest/route.ts         # Vercel Cron이 주기적으로 호출 (vercel.json 참고)
└── vercel.json                      # crons 설정 (Hobby 플랜은 하루 1회 제한)
```

- `ANTHROPIC_API_KEY`가 없으면 해외 소스 수집이 실패한다 — Vercel 프로젝트 환경변수에 등록 필수.
- `CRON_SECRET`은 Vercel이 Cron 요청에 자동으로 실어 보내는 값과 대조해서, 외부에서 `/api/cron/ingest`를
  함부로 호출 못 하게 막는다.
- 로컬에서 수동으로 한 번 돌려보고 싶으면 `cd backend && npm run ingest`.

## 3. 나머지 컨벤션

모듈 아키텍처, TanStack Query 사용법, import 순서, 커밋 컨벤션, Prisma Mongo 버전 고정, `proxy.ts`
네이밍 등은 [devcs/CLAUDE.md](../devcs/CLAUDE.md)와 동일하다. 프론트는 devcs와 같은 다크 전용 TDS
컨셉(`ColorSchemeArea theme="dark"`)을 그대로 쓰되, 화면 구조는 더 단순하다 — 퀴즈처럼 목록→상세 흐름이
없고, 카드를 탭하면 바로 외부 브라우저로 나간다(`openURL`).

## 4. 배포 체크리스트

- [ ] 앱인토스 콘솔에 `ainews` 앱 등록
- [ ] Vercel에 `ainews/backend`를 Root Directory로 하는 새 프로젝트 생성
- [ ] `DATABASE_URL`, `ANTHROPIC_API_KEY` 환경변수 등록 (`CRON_SECRET`은 Vercel Cron 연결 시 자동 생성)
- [ ] `backend/proxy.ts`의 `allowedOrigins`를 실제 등록 도메인으로 확정
- [ ] `vercel.json`의 cron 스케줄이 Vercel 플랜(Hobby/Pro)에서 허용되는지 확인
