# 무료부고장 코드 분석 및 SaaS 수준 개선 가이드

## 1. 성능 병목 지점

### 1.1 localStorage 동기 I/O
- **위치**: `LocalStorageObituaryRepository._getAllRawData()`, `_saveAllRawData()`
- **문제**: 매 요청마다 전체 배열을 JSON.parse/stringify → 데이터 증가 시 메인 스레드 블로킹
- **개선**: IndexedDB로 마이그레이션, 또는 Web Worker에서 처리

### 1.2 템플릿 그리드 33개 이미지 동시 로드
- **위치**: `template-selector.js` `_initTemplateGrid()`
- **문제**: 33개 이미지를 한 번에 로드 → 초기 렌더 지연
- **개선**: 가상 스크롤(Virtual Scroll), Intersection Observer로 lazy load, 또는 페이지네이션

### 1.3 조회수 증가 시 전체 저장
- **위치**: `LocalStorageObituaryRepository.incrementViewCount()`
- **문제**: 조회수 1 증가마다 전체 배열을 다시 저장
- **개선**: 배치 업데이트, 또는 별도 키로 조회수만 저장

### 1.4 DOM 직접 조작 과다
- **위치**: `Search.html` `displayObituariesTable()`, `showObituaryDetail()`
- **문제**: innerHTML 대량 할당, 이벤트 리스너 개별 등록
- **개선**: DocumentFragment, 이벤트 위임(event delegation)

### 1.5 스타일 동적 주입
- **위치**: `funeral-hall-search.js`, `form-validation.js`
- **문제**: 런타임에 `<style>` 태그 생성 → 리플로우 유발
- **개선**: CSS 파일로 분리, 또는 Critical CSS 인라인

### 1.6 addTouchFeedback 전역 버튼 스캔
- **위치**: `utils.js` `addTouchFeedback()`
- **문제**: `querySelectorAll('button, .button, ...')`로 모든 버튼에 리스너 등록
- **개선**: 이벤트 위임으로 document 단일 리스너

---

## 2. 보안 취약점

### 2.1 🔴 치명적: 관리자 비밀번호 하드코딩
- **위치**: `Search.html` 601-602행
```javascript
const adminUsername = "kyh11kyh";
const adminPassword = "rladbsgh79!!";
```
- **위험**: 소스코드 노출 시 전체 관리 권한 탈취
- **조치**: 즉시 제거, 서버 기반 인증(JWT/OAuth) 도입

### 2.2 🔴 치명적: 비밀번호 평문 저장
- **위치**: `ObituaryService.js` 40행, `Obituary.js` verifyPassword
- **문제**: `hashedPassword = obituaryData.password` (해싱 생략)
- **조치**: bcrypt/argon2 등으로 해싱 후 저장

### 2.3 🟠 높음: XSS (innerHTML 사용)
- **위치**: 
  - `funeral-hall-search.js` 574행: `hall.name`, `hall.address` 미이스케이프
  - `sample.html` 1060행: `data.obituaryText` 직접 innerHTML
  - `Search.html` 1011행: `obituary.bereavedList` 직접 삽입
- **조치**: `escapeHTML()` 적용 또는 `textContent` 사용

### 2.4 🟠 높음: localStorage 데이터 무결성 없음
- **문제**: 클라이언트에서 JSON 조작 가능, 위변조 검증 없음
- **조치**: 서버 저장 시 서명/해시 검증

### 2.5 🟡 중간: sessionStorage에 민감 정보
- **위치**: `EditModeManager`, `selectedTemplate` 등
- **문제**: 탭 간 공유 불가, XSS 시 탈취 가능
- **조치**: 민감 정보는 메모리만 사용, 짧은 TTL

### 2.6 🟡 중간: CSRF 대응 없음
- **문제**: 폼 제출 시 토큰 검증 없음
- **조치**: 서버 API 도입 시 CSRF 토큰 적용

---

## 3. 확장성 관점 문제점

### 3.1 단일 저장소 한계
- **문제**: localStorage 5~10MB 제한, 기기별 데이터
- **영향**: 다중 기기/다중 사용자 불가
- **해결**: 백엔드 API + DB (PostgreSQL/MongoDB)

### 3.2 검색 성능
- **위치**: `findByDeceasedName()` - 배열 전체 순회
- **문제**: O(n) 선형 검색, 인덱스 없음
- **해결**: 서버 측 full-text search 또는 Elasticsearch

### 3.3 이미지 저장
- **문제**: Base64 portraitImage → localStorage 용량 급증
- **해결**: 별도 스토리지(S3, Cloudinary) + URL 저장

### 3.4 모놀리식 구조
- **문제**: 페이지별 HTML + 인라인 스크립트 혼재
- **해결**: SPA(React/Vue) 또는 MPA + 공통 컴포넌트

### 3.5 설정 하드코딩
- **위치**: `IMAGE_PATH`, `totalImages`, `MAX_ACCOUNTS` 등
- **해결**: 환경 변수(.env) 또는 설정 API

---

## 4. 실무 배포 기준 리팩토링 체크리스트

| 항목 | 현재 | 목표 |
|------|------|------|
| 빌드 도구 | 없음 | Vite/Webpack |
| 환경 변수 | 없음 | .env 분리 |
| 에러 추적 | console.log | Sentry 등 |
| 로깅 | console | 구조화 로깅 |
| 테스트 | 없음 | Jest/Vitest |
| CI/CD | 없음 | GitHub Actions |
| 보안 헤더 | 없음 | CSP, X-Frame-Options |
| API | 없음 | REST/GraphQL |

---

## 5. SaaS 수준 개선 로드맵

### Phase 1: 긴급 보안 패치 (1주)
1. 관리자 인증 하드코딩 제거
2. 비밀번호 bcrypt 해싱 적용
3. innerHTML 사용처 escapeHTML 적용

### Phase 2: 백엔드 도입 (2~4주)
1. Node.js/Express 또는 Next.js API
2. PostgreSQL + Prisma ORM
3. JWT 기반 인증
4. 파일 업로드(S3) 연동

### Phase 3: 프론트엔드 현대화 (2~3주)
1. Vite + React/Vue 마이그레이션
2. 상태관리 (Zustand/Pinia)
3. API 클라이언트 (axios + interceptors)

### Phase 4: 인프라 (1~2주)
1. Docker 컨테이너화
2. AWS/GCP 배포
3. 모니터링 (CloudWatch, Datadog)

---

## 6. 참고: 수정 대상 파일 목록

- `Search.html` - 관리자 인증, innerHTML
- `ObituaryService.js` - 비밀번호 해싱
- `Obituary.js` - verifyPassword 로직
- `funeral-hall-search.js` - XSS 방지
- `sample.html` - innerHTML
- `utils.js` - setText isHtml 파라미터 검토
