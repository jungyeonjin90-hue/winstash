# WinStash

금요일에 1~2분 동안 적은 주간 업무 메모를 AI가 세 가지 커리어 자산으로 바꿔 주는 서비스입니다.

- **Weekly Snippets**: 상사 보고용 주간 업무 요약 (Done / In Progress / Next Week)
- **Brag Sheet**: 성과평가·연봉협상용 성과 시트
- **STAR Portfolio**: 이직·포트폴리오용 STAR 구조 사례

영어 전용 웹앱(`/`, 예전 `/ko` 주소는 영어 페이지로 영구 리다이렉트)과 Chrome 확장 프로그램(`extension/`)으로 구성됩니다.

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 웹 | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| 인증·데이터 | Firebase Auth (Google 로그인), Firestore, Firebase Admin SDK |
| AI | Google Gemini (`lib/gemini.ts`) |
| 결제 | Lemon Squeezy 구독 + 웹훅 |
| 분석 | PostHog, Firebase Analytics |
| 확장 프로그램 | Chrome MV3, Vite + React |

> 이 Next.js 버전은 이전 버전과 API·규칙이 다를 수 있습니다. 코드를 바꾸기 전에 `node_modules/next/dist/docs/`의 해당 문서를 확인하세요 (`AGENTS.md` 참고).

## 시작하기

```bash
npm install
cp .env.local.example .env.local   # 값을 채워 넣으세요
npm run dev                         # http://localhost:3000
```

### 환경 변수

전체 목록과 설명은 [`.env.local.example`](.env.local.example)에 있습니다. 핵심만 정리하면:

| 변수 | 필수 | 설명 |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` | ✅ | Firebase 웹 앱 설정 |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | ✅ (운영) | 서비스 계정. 없으면 운영에서 쿼터·저장·웹훅 API가 **503**을 반환합니다 |
| `GEMINI_API_KEY` | ✅ | 없으면 AI 대신 휴리스틱 결과를 돌려주고 크레딧은 차감하지 않습니다 |
| `LEMON_SQUEEZY_WEBHOOK_SECRET` | ✅ (결제) | 웹훅 서명 검증 |
| `EXTENSION_ALLOWED_ORIGINS` | 권장 | 확장 프로그램 API에 CORS를 허용할 `chrome-extension://<ID>` |
| `TRUST_CF_CONNECTING_IP` | – | Cloudflare를 앞단에 둘 때만 `true` |

로컬에서 서비스 계정 없이 실행하면 서버의 쿼터 확인은 허용(개발 편의) 쪽으로 동작하고, 로그인 사용자의 서버 측 저장은 건너뜁니다.

## 스크립트

| 명령 | 내용 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` / `npm start` | 프로덕션 빌드 / 실행 |
| `npm run lint` | ESLint |
| `npm test` | 아래 테스트 전체 |
| `npm run test:unit` | 서버 모듈 단위 테스트 (네트워크 불필요) |
| `npm run test:rules` | Firestore 보안 규칙 테스트 (에뮬레이터) |
| `npm run test:e2e` | Playwright API·UI E2E (에뮬레이터 + mock Gemini) |

## 테스트

테스트는 **운영 환경에 접근하지 않습니다.**

- 규칙 테스트와 E2E는 Firebase 에뮬레이터(`demo-` 프로젝트)에서 실행됩니다. **Java 11 이상**이 필요합니다 (`firebase-tools`는 Java 17과 호환되도록 v13으로 고정).
- E2E 서버는 포트 3100의 격리된 `next dev`입니다. Admin SDK는 에뮬레이터에, Gemini는 로컬 mock(`e2e/mock-gemini.mjs`)에 연결되고 PostHog는 비활성화됩니다. 3100 포트가 이미 사용 중이면 실패합니다.
- mock Gemini는 입력에 `[mock:fail]`이 있으면 실패하고 `[mock:slow]`가 있으면 응답하지 않습니다. AI 실패·지연 경로를 재현할 때 사용합니다.
- 아직 고치지 않은 알려진 결함은 `knownGap("<ID>")`(E2E) / `gap("<ID>")`(규칙)로 표시되어 "예상된 실패"로 집계됩니다. `STRICT_SECURITY=1 npm test`로 실행하면 실패로 표시됩니다.

```bash
npx playwright install chromium   # 처음 한 번
npm test
```

## 배포

1. Vercel 환경 변수를 설정합니다 (위 표 참고). Preview 환경에도 서비스 계정이 있어야 로그인 사용자 기능을 확인할 수 있습니다.
2. 웹앱 배포와 **같은 시점에** Firestore 보안 규칙을 배포합니다. 서버 코드와 규칙이 서로를 전제로 동작합니다.
   ```bash
   npx firebase deploy --only firestore:rules --project <운영 프로젝트 ID>
   ```

## Chrome 확장 프로그램

```bash
cd extension
npm install
npm run build        # extension/dist 를 chrome://extensions 에서 "압축해제된 확장 프로그램"으로 로드
```

확장 프로그램은 웹앱의 `/auth/extension-connect`로 로그인하고 `/api/extension/status`, `/api/extension/submit`을 호출합니다.

## 디렉터리 구조

```
app/            페이지와 API 라우트 (app/api/*)
components/     UI 컴포넌트 (en/ = 대시보드·랜딩 화면)
context/        AuthContext (로그인·비활성 자동 로그아웃)
lib/            서버/클라이언트 공용 로직
                  serverAuthQuota.ts  토큰 검증·쿼터 예약/환불·계정별 레이트 리밋
                  gemini.ts           Gemini 호출 (타임아웃·예산)
                  transformService.ts 3-way 변환 (영어 출력, 웹·확장 프로그램 공용)
extension/      Chrome 확장 프로그램
e2e/            Playwright E2E 와 mock Gemini 서버
tests/          단위 테스트, Firestore 규칙 테스트
firestore.rules Firestore 보안 규칙
```
