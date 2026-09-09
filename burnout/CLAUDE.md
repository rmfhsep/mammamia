# CLAUDE.md — burnout("회사 불지르기") 프로젝트 개발 컨벤션

> 앱인토스 플랫폼 공통 가이드(문서 활용법, TDS 사용법, 검수 체크리스트)는
> [../CLAUDE.md](../CLAUDE.md)를 먼저 참고한다. 이 문서는 burnout 앱에만 해당하는 컨벤션이다.

회사 주소를 입력하면 카카오 로드뷰로 그 건물을 띄우고, 탭으로 무기(성냥→화염병→수류탄→바주카)를
던져 불태우는 스트레스 해소용 미니 게임. "바탕화면 부수기"류 클릭 이펙트 게임 컨셉을 로드뷰 위에
얹은 것이다.

> **폴더명(`burnout`)과 미니앱 표시 이름("회사 불지르기")이 다르다.** devcs 사례([devcs/CLAUDE.md](../devcs/CLAUDE.md))처럼
> `apps-in-toss.config.ts`의 `appName`은 콘솔에 실제로 등록한 slug와 반드시 일치해야 하므로, 콘솔 등록 후 갱신한다.

## 0. 정책 리스크 — 검수 반려 예방 (중요)

"불지르기/화염병/수류탄/바주카"라는 소재 자체가 폭력·방화를 직접적으로 묘사하는 것으로 보일 수 있어
다른 두 앱(mammamia, devcs)보다 검수 반려 리스크가 크다. 출시 전에 **반드시** 확인할 것:

- [ ] 앱인토스 콘솔/채널톡에 소재 적합성 사전 확답 요청 (실사 로드뷰 건물을 "불태우는" 연출이 정책상
      허용되는지 — 실존 건물 특정이 문제 될 수 있음)
- [ ] `AddressScreen`에 이미 넣어둔 면책 문구("스트레스 해소용 가상 시뮬레이션이에요. 실제 방화는
      절대 안 돼요")를 임의로 제거하지 않는다 — 콘텐츠 톤을 순화하는 안전장치다.
- [ ] 이펙트 톤은 만화적/과장된 파티클(이모지, 색색의 불꽃)로 유지하고, 사실적인 화재·인명 피해를
      연상시키는 사진/영상 소재는 넣지 않는다.
- [ ] 실존 회사 건물을 특정해 공개적으로 "불태우는" 스크린샷을 앱 홍보에 사용하지 않는다(초상권/
      건물 소유자 관련 분쟁 소지).

## 1. 프로젝트 구조

```
burnout/
└── src/
    ├── lib/
    │   ├── kakao.ts             # loadKakaoMaps, geocodeAddress, findNearestPanoId
    │   └── storage.ts           # Storage(기기 로컬) 래퍼 — getJSON/setJSON, 브라우저 폴백 포함
    ├── game/
    │   ├── weapons.ts           # 무기 정의(id, 데미지, 쿨다운, 해금 레벨)
    │   ├── progress.ts          # GameProgress 타입 + 기본값 + 저장 키
    │   └── particles.ts         # EffectEngine — 캔버스 파티클(불꽃/스파크/연기/파편) + 그을음 + 화면 흔들림
    ├── hooks/
    │   ├── useGameProgress.ts   # 레벨/선택 무기를 Storage와 동기화
    │   └── useRewardedAd.ts     # loadFullScreenAd/showFullScreenAd 래퍼 (리워드 광고)
    ├── types/kakao-maps.d.ts    # 카카오맵 SDK 타입 보강 (Roadview, RoadviewClient, services.Geocoder)
    └── screens/
        ├── AddressScreen.tsx    # 주소 입력 → 지오코딩 → 로드뷰 파노 ID 탐색
        ├── BurnScreen.tsx       # 메인 게임 화면(HUD, 무기 선택, 레벨업, 전소 연출)
        └── burn/
            ├── RoadviewLayer.tsx  # 카카오 로드뷰를 배경 레이어로 렌더링
            └── EffectCanvas.tsx   # 탭 감지 + 파티클 렌더 루프(requestAnimationFrame)
```

백엔드가 없다 — mammamia/devcs와 달리 서버 저장이 필요 없는 로컬 진행상황(레벨, 선택 무기)만 다루므로
**`Storage`(앱인토스 SDK의 기기 로컬 저장소) 하나로 충분**하다. 앱을 지우거나 기기를 바꾸면 진행상황도
초기화된다 — 계정 연동이 필요해지면 그때 mammamia 패턴(Vercel + MongoDB)을 가져온다.

## 2. "3D 건물"을 구현한 방식

카카오 로드뷰는 실사 파노라마 사진이라 실제 건물의 3D 지오메트리 데이터가 없다. 그래서:

- `RoadviewLayer`가 카카오맵 SDK의 `kakao.maps.Roadview`(파노라마 실사 뷰)를 배경 전체에 띄운다.
- 그 위에 `EffectCanvas`(2D `<canvas>`)가 절대 위치로 겹쳐져서 탭 지점에 불꽃/폭발 파티클을 그린다.
- `BurnScreen`은 `mode: 'aiming' | 'playing'` 두 단계로 나뉜다(기본값 `aiming`).
  - **aiming**: `RoadviewLayer`에 `interactive` prop을 켜서 로드뷰 자체의 드래그 회전/이동(카카오
    기본 내비게이션 화살표 포함)을 그대로 쓸 수 있게 한다. `EffectCanvas`는 아예 마운트하지 않아서
    입력을 가로채지 않는다. 사용자가 원하는 건물·각도를 직접 찾도록 하는 단계다.
  - **playing**: "이 각도에서 불지르기 시작" 버튼을 누르면 전환된다. `RoadviewLayer`의 `panoId`/
    `position` props가 바뀌지 않으므로(`RoadviewLayer.tsx`의 useEffect는 `panoId`에만 의존) 같은
    `Roadview` 인스턴스가 그대로 유지되고, `interactive`만 꺼져서(`pointer-events: none`) 방금
    맞춘 화면이 그대로 얼어붙는다 — 파노라마를 다시 불러오거나 위치를 재계산하지 않는다. 이때
    `EffectCanvas`를 새로 마운트해 탭 입력을 받기 시작한다.
  - 상단의 "🎯 각도 다시" 버튼으로 언제든 `aiming`으로 되돌아갈 수 있다(이때 `burnProgress`는
    0으로 리셋 — `EffectCanvas`가 언마운트되며 파티클 엔진도 함께 버려지므로 그을음 자국이 이전
    각도에 남아있지 않다).
- 카카오맵 3D 건물 레이어나 Three.js 가상 3D 건물 같은 대안은 검토했지만 채택하지 않았다 — 실제
  건물 사실감(로드뷰가 제일 높음)과 개발 난이도를 함께 고려한 결정이다. 자세한 대안 비교는 이 기능을
  기획할 때 나눈 대화 맥락 참고.

## 3. 게임 진행 모델

- **게이지 = 레벨업 XP.** "건물을 다 태우면 정복 완료" 같은 건물별 완료 상태는 없다. 무기로 탭할
  때마다 `weapon.damage`만큼 `progress.levelXp`가 쌓이고(`useGameProgress.addXp`),
  `requiredXpForLevel(level)`(`src/game/weapons.ts`)에 도달하면 자동으로 레벨업 + 다음 레벨 무기
  자동 장착까지 한 번에 처리된다(`useGameProgress`의 `applyXp`). 레벨이 오를수록
  `requiredXpForLevel`이 기하급수로 늘어나(`100 * 1.9^(level-1)`) 다음 레벨업이 점점 힘들어진다 —
  의도된 밸런스다.
- **광고 = 즉시 레벨업 단축권.** 리워드 광고를 보면 현재 레벨에 남은 xp를 그 자리에서 채워
  레벨업시킨다(`useGameProgress.instantLevelUp` = `requiredXpForLevel(level) - levelXp`만큼
  `applyXp` 재사용). 광고가 레벨업의 유일한 수단이 아니라 "그라인딩이 힘들어질 때 쓰는 지름길"이라는
  게 핵심 — 탭으로도 얼마든지 레벨업할 수 있다.
- 레벨/xp/선택 무기(`GameProgress`)는 전부 `Storage`에 영구 저장된다(주소를 바꿔도 안 초기화됨) —
  건물별 상태가 아니라 플레이어 진행상황이기 때문이다. `BurnScreen`은 `progress.level`이 이전
  렌더보다 올라갔을 때만(`prevLevelRef` 비교) 레벨업 토스트를 띄운다 — 탭으로 올랐든 광고로 올랐든
  경로에 상관없이 동일하게 동작한다.
- 무기 해금 레벨: 성냥(Lv.1, 기본) → 화염병(Lv.2) → 수류탄(Lv.3) → 권총(Lv.4) → 기관총(Lv.5) →
  바주카(Lv.6, `MAX_LEVEL`). 데미지가 항상 레벨 순으로 커지는 건 아니다(권총 16 < 수류탄 22) —
  후반 무기일수록 "타격당 데미지"보다 "연사 속도(DPS)"로 강해지는 쪽도 있어서 무기마다 플레이
  감각이 다르게 설계했다(느리고 강한 수류탄/바주카 vs 빠르고 가벼운 권총/기관총).
  `MAX_LEVEL`(=만렙)에 도달하면 게이지/광고 버튼을 숨기고 "🏆 최고 레벨 달성" 안내만 보여준다.
  무기를 추가/조정하려면 `src/game/weapons.ts`의 `WEAPONS` 배열과 `requiredXpForLevel`만 고치면
  된다 — 레벨업 로직과 HUD는 이 배열을 순회하므로 자동으로 반영된다. 다만 무기를 새로 추가할 땐
  `particles.ts`의 `CHARACTER_LIFE_MS`/`CHARACTER_TRIGGER_FRACTION`/`actionArmAngle`/
  `drawWeaponProp`/`triggerImpact`와 `WeaponIcon.tsx`에도 해당 `WeaponId` case를 추가해야 한다 —
  `Record<WeaponId, …>` 타입들이라 빠뜨리면 타입 에러로 바로 걸린다.

## 3-1. 졸라맨 액션 (`EffectEngine`의 `CharacterAnim`)

탭하면 즉시 파티클이 터지는 대신, 그 자리에 작은 졸라맨이 무기를 손에 든 채 나타나 무기별 동작
(성냥 긋기 → 들어올리기, 화염병/수류탄 winding-up 후 던지기 — 던진 뒤엔 손이 빔, 권총/기관총 조준 후
발사 — 총은 계속 손에 들려 있음, 바주카 어깨에 걸치고 반동)을 짧게 연기한 뒤(`CHARACTER_LIFE_MS`),
동작 중 정해진 시점(`CHARACTER_TRIGGER_FRACTION`)에 실제 발화/폭발 이펙트가 터진다
(`EffectEngine.triggerImpact`). `onHit`(xp 적립)은 탭 즉시 호출되고, 이 지연은 순수하게 시각 연출용
이다 — 게임 진행에는 영향 없음. 팔 각도는 `actionArmAngle(weaponId, t)`가 시간(t: 0~1)에 따라
도(degree) 단위로 반환하는 순수 함수라, 동작을 다듬을 땐 이 함수만 건드리면 된다.

손에 든 무기 소품은 `drawWeaponProp`이 손 위치(handX,handY)와 팔 방향 단위벡터(dirX,dirY)만으로
계산해서 그린다 — 캔버스 회전 변환(`ctx.rotate`) 대신 벡터 연산으로 직접 좌표를 구하는 방식이라
이해하기 쉽다. 화면 하단 무기 툴바(`WeaponIcon.tsx`)도 이모지 대신 같은 스타일의 라인아트 SVG를
쓴다 — 총 계열 이모지는 플랫폼마다 렌더링이 크게 달라서(iOS는 🔫를 장난감 물총으로 표시) 툴바
아이콘과 캔버스 소품이 서로 다른 그림으로 보이는 문제를 피하려는 의도적 선택이다.

스틱/이미지 에셋 없이 캔버스 `lineTo`/`arc`만으로 그린다 — 로드뷰 사진 위에서도 잘 보이도록 흰색
굵은 선을 먼저 깔고 그 위에 어두운 선을 겹쳐 그리는 이중 스트로크(`strokeSegment`)를 쓴다.

## 3-2. 건물이 점점 부서지는 것처럼 보이게 하기 (`EffectEngine`의 손상 누적)

카카오 로드뷰는 실사 사진이라 실제 픽셀을 깨거나 변형할 수 없다(우리 캔버스가 아니라 카카오 SDK가
그리는 별도 레이어). 대신 `EffectEngine`이 `totalDamage`(이 화면에 지금까지 때려박은 데미지 총합,
`triggerImpact` 시점에 누적)를 기준으로 오버레이를 점점 더 지저분하게 만들어 "부서지는" 인상을 준다:

- **균열(`cracks`)**: 생성자에서 `generateCracks()`로 지그재그 선 14개를 0~1 정규화 좌표로 미리
  만들어두고, 각자 `revealAt`(요구 데미지)이 40~900 사이에 흩어져 있다. `totalDamage`가 그 값을
  넘으면 `drawCracks`가 그 균열을 그리기 시작한다 — 정규화 좌표라 캔버스 리사이즈에도 깨지지 않는다.
- **파편(`makeFallingDebris`)**: 데미지가 40을 넘으면 화면 위쪽에서 잔해가 주기적으로 떨어지기
  시작한다. 간격은 `3200 - totalDamage * 2.4`(최소 350ms)라 두들길수록 점점 더 자주 떨어진다.
  기존 `debris` 파티클 종류를 그대로 재사용해서(중력도 이미 있음) 새 타입을 안 만들었다.
- **연무(`drawHaze`)**: 데미지 30~1200 구간에서 화면 위쪽에 어두운 그라디언트가 서서히 짙어진다
  (최대 불투명도 0.35로 캡 — 로드뷰 자체가 안 보일 정도로 덮으면 안 된다).
- 세 가지 모두 **센 무기일수록 빨리 나타난다** — 바주카(데미지 55)로 16방이면 균열이 전부
  드러나지만 성냥(데미지 4)으로는 225방 가까이 걸린다. 레벨업으로 강한 무기를 얻는 보상이
  "건물이 눈에 띄게 더 빨리 박살난다"로 바로 체감되게 하려는 의도다.
- `totalDamage`/`cracks`는 **이 화면(뷰) 한정**이다 — `EffectCanvas`가 `mode === 'playing'`일 때만
  마운트되므로, "🎯 각도 다시"로 조준 모드로 돌아가거나 다른 주소를 고르면 `EffectEngine` 인스턴스
  자체가 버려지고 다음 진입 시 새 인스턴스(손상 0)로 시작한다 — 레벨/XP처럼 영구 저장되는 값이
  아니다.

## 4. 리워드 광고 연동 (`useRewardedAd`)

- `isSupported`는 `!import.meta.env.DEV && Boolean(AD_GROUP_ID) && loadFullScreenAd.isSupported()`다
  — **`npm run dev`(브라우저 로컬)에서는 무조건 false로 강제한다.** `@apps-in-toss/devtools`가
  `vite dev`에서 `@apps-in-toss/web-framework`를 모킹하는데, 그 목의 `loadFullScreenAd.isSupported()`는
  항상 `true`를 돌려주면서도 `showFullScreenAd`는 `clicked` → `dismissed`만 쏘고 **`userEarnedReward`는
  절대 안 쏜다**(`node_modules/@apps-in-toss/devtools/dist/mock/3x.js`의 `showFullScreenAd$1` 직접
  확인 — `userEarnedReward`를 실제로 쏘는 목은 별개 API인 `GoogleAdMob.showAppsInTossAdMob`뿐이다).
  `import.meta.env.DEV` 체크 없이 두면 로컬에서 버튼을 눌러도 1.5초쯤 조용히 로딩만 돌다 보상 없이
  끝나버려서(토스트도, 폴백 다이얼로그도 없이) 마치 고장난 것처럼 보인다 — 실제로 한 번 겪은 회귀다.
  `vite build`(QR 테스트/배포)는 `NODE_ENV=production`이라 모킹이 꺼지므로 실제 브릿지의
  `isSupported()`를 그대로 신뢰해도 된다.
- `isSupported`가 false면(로컬 개발이거나, adGroupId가 없거나, 진짜로 미지원 환경이거나)
  `onFail('unsupported')`로 빠진다. `BurnScreen`은 이 경우 `useDialog().openConfirm`으로 "테스트
  모드: 광고 없이 레벨업할까요?" 확인 다이얼로그를 띄워 로컬 개발 중에도 레벨업 플로우를 끝까지
  테스트할 수 있게 해뒀다 — 로컬에서 광고 관련 동작을 확인하려면 **이 다이얼로그 경로가 유일한
  방법**이다(위에서 설명했듯 로컬 브라우저에서 실제(목) 광고 SDK 플로우를 타는 경로는 없다).
- **QR 테스트(실기기)에서 광고 SDK 플로우를 직접 보려면** `.env.local`의 `VITE_AD_GROUP_ID`를
  앱인토스 공식 테스트 ID `ait-ad-test-rewarded-id`로 채워둔다(이미 채워져 있음) — 실기기 빌드는
  모킹이 꺼지고 `import.meta.env.DEV`도 false이므로, 이 값이 있으면 진짜 테스트 광고 노출 →
  `userEarnedReward` 플로우를 그대로 탈 수 있다. **실제 adGroupId로 개발 단계에서 테스트하면 정책
  위반으로 불이익을 받을 수 있다고 문서에 명시돼 있으므로** 절대 실제 ID를 `.env.local`에 넣지
  않는다 — 출시 빌드(`.env.production`)에만 앱인토스 콘솔에서 발급받은 진짜 `adGroupId`를 넣는다.
- 광고 시청 완료는 `showFullScreenAd`의 `userEarnedReward` 이벤트로만 판정한다(`dismissed`는 그냥
  닫힌 것 — 레벨업 안 시킴). 도중에 끄면 보상 없음.

### 4-1. 광고 정책 확인 결과 (2026-09-08, [공식 문서](https://developers-apps-in-toss.toss.im/documentation/common/monetization/iaa/interstitial-rewarded-ad) 기준)

- "userEarnedReward 이벤트가 발생했을 때만 리워드를 지급하세요. dismissed만으로는 지급하면 안돼요" —
  이미 위 구현이 그대로 지키고 있음(재확인 완료, 추가 조치 불필요).
- "광고 소비를 보상과 직접 연결하는 구조 금지" / "클릭 보상성 문구·이벤트 연동 금지" 조항이 있지만,
  문맥상 배너/전면광고를 편법으로 보상 미끼로 쓰는 걸 막으려는 규정으로 판단된다 — 공식 리워드 광고
  API(`userEarnedReward`)로 정식 보상을 주는 우리 플로우는 이 문서가 직접 안내하는 정상 사용법이라
  해당 없다고 보고 있다. 단, 이건 문서를 문맥으로 해석한 결론이라 확답은 아니다 — 대량 트래픽이 붙기
  전에 앱인토스 채널톡으로 "리워드 광고로 게임 내 레벨업 보상 주는 게 정책상 맞는지" 한 번 더
  확인받는 걸 권장한다.
- "광고는 반드시 'Ad' 표기를 유지해야 함"은 광고 콘텐츠 자체(재생 영상)에 붙는 배지라 SDK가
  처리하는 부분이지, 우리 쪽 트리거 버튼 문구와는 별개다.
- **광고 시청 전 사전 고지 의무는 이 문서에 명시돼 있지 않다**(있다/없다 확답 없음) — 그래도 일반
  리워드 광고 업계 관행(사용자가 탭하기 전에 "광고를 보면 보상을 받는다"는 걸 알 수 있어야 함)을
  따라 버튼 문구에서 "광고"라는 단어를 절대 빼지 않는다. `handleRequestLevelUp` 버튼 문구를
  "레벨업 바로 하기"처럼 광고 언급 없이 줄이자는 제안이 나온 적 있는데, 위 이유로 반려하고 "광고
  보고 레벨업 바로 하기"로 유지했다 — 다시 손댈 때도 "광고"는 남겨둘 것.

## 5. 로드뷰 탐색 실패 처리

`findNearestPanoId`(`src/lib/kakao.ts`)는 반경 50m → 300m → 1000m 순으로 넓혀가며 최대 3번 재시도한다.
그래도 못 찾으면 `null`을 반환하고, `AddressScreen`은 토스트로 "이 주소 근처에는 로드뷰가 없어요"를
띄운 뒤 그대로 주소 입력 화면에 남는다(신축 건물, 로드뷰 미촬영 지역 등에서 발생 가능).

## 6. 나머지 컨벤션

Import 순서, Props 정의, 재사용 훅/유틸 추출 기준, 커밋 컨벤션은 [mammamia/CLAUDE.md](../mammamia/CLAUDE.md)
4~8절과 동일하게 따른다 — 다만 이 앱은 백엔드/TanStack Query가 없으므로 3절(데이터 페칭)은 해당 없음.

## 7. 배포 체크리스트 (아직 안 한 것)

- [ ] 0절의 정책 리스크 사전 확인부터 완료
- [ ] 앱인토스 콘솔에 앱 등록 후 `apps-in-toss.config.ts`의 `appName`을 실제 slug로 갱신
- [x] 카카오 JS 키는 mammamia와 같은 키(`e92d2d986f4408a07958379256846298`)를 재사용하기로 함 —
      `.env.local`에 이미 채워져 있다(커밋 안 됨, `.env.example` 참고). 키 자체는 도메인 단위로
      허용 목록을 관리하므로 여러 앱에서 같이 써도 된다.
- [ ] 카카오 디벨로퍼스 콘솔 → 이 앱(mammamia와 동일 애플리케이션) → 플랫폼 → Web 사이트 도메인에
      burnout의 로컬 개발 origin(`http://localhost:5173` 등, 실제 `vite dev` 포트 확인)과 배포 도메인
      (`*.apps.tossmini.com`, `*.private-apps.tossmini.com`)을 추가 등록해야 한다 — mammamia에 등록된
      도메인이 burnout에 자동으로 적용되지 않는다. 등록 전에는 로드뷰/지오코더 호출이 도메인 불일치로
      실패한다.
- [ ] mammamia와 카카오 앱(및 호출 쿼터)을 공유한다는 점 인지 — 두 앱의 로드뷰/지오코더 호출량이
      같은 일일 한도를 나눠 쓴다. 트래픽이 늘면 쿼터 여유를 보고 키를 분리할지 판단한다.
- [ ] 배포용 `.env.production`도 같은 방식으로 채워 넣는다 (`.env.example` 참고, 커밋 안 함).
- [ ] 앱인토스 콘솔에서 전면(리워드) 광고 `adGroupId` 발급 → `VITE_AD_GROUP_ID`에 등록
- [ ] 실기기(토스 앱 QR 테스트)에서 로드뷰 렌더링, 탭 파티클, 리워드 광고, 햅틱, `Storage` 저장이
      실제로 동작하는지 확인 — 이 네 가지는 로컬 브라우저(`vite dev`)에서는 검증 불가능한 네이티브
      브릿지 의존 기능이다.
