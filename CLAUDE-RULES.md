# 프로젝트 코딩 규칙 (Claude Rules)

## 1. 아키텍처 규칙

### 계층 분리 (Layered Architecture)
- **Domain 계층** (`src/domain/`): 외부 의존성 금지. 순수 비즈니스 로직만.
- **Application 계층** (`src/application/`): Domain 사용. Infrastructure 직접 참조 금지.
- **Infrastructure 계층** (`src/infrastructure/`): Domain 인터페이스 구현.
- **의존성 방향**: UI → Application → Domain ← Infrastructure

### DI (Dependency Injection)
- Service 클래스는 생성자에서 Repository 주입받을 것
- `scripts.js`에서 인스턴스 생성 후 `window.appServices`로 노출

## 2. 도메인 모델 규칙

### Value Object (VO)
- 생성자에서 모든 필드 검증
- `Object.freeze(this)` 필수
- setter 금지, 수정 시 새 VO 생성
- 현재 VO 목록: DeceasedInfo, FuneralInfo, BereavedPerson, WreathOrder, GuestbookEntry

### Entity (Obituary)
- Private field (`#id`, `#password` 등) 사용
- 업데이트 메서드는 새 인스턴스 반환 (`_toDataObject()` spread)
- `fromData()` 정적 팩토리 메서드로 역직렬화
- guestbookEntries, wreathOrders는 Object.freeze된 배열

### Repository Interface
- `ObituaryRepositoryInterface.js`의 모든 메서드를 구현체에서 반드시 구현
- 메서드: save, findById, findByDeceasedName, deleteById, findAll, nextId, incrementViewCount, verifyPassword, clearAll

## 3. 프론트엔드 규칙

### HTML 페이지
- 모든 페이지에 `<script src="scripts.js" type="module"></script>` 포함
- 사이드바 링크: 직접 `href` 사용 (절대 `onclick` 핸들러 사용 금지)
- 삭제된 파일 참조 금지: `src/domains/`, `src/infrastructure/ObituaryRepository.js`
- 모든 JS 파일은 UTF-8 인코딩 필수

### 이벤트 리스너
- `addEventListener` 대신 `onclick` 할당 사용 (누적 방지, search-module.js 참고)
- DOM 요소 접근 시 반드시 null 체크

### 전역 서비스 접근
```javascript
// 올바른 사용법
const service = window.appServices.obituaryService;
const wreathService = window.appServices.wreathService;
const guestbookService = window.appServices.guestbookService;
```

### 사용자 알림 (Toast)
- **alert() 사용 금지** → `AppUtils.showToast(message, type)` 사용
- type: 'info' (기본), 'success', 'error', 'warning'
- CSS 클래스 기반: `.toast-message-base`, `.toast-info/success/error/warning`
- 토스트에 `role="status"`, `aria-live="polite"` 자동 적용

### CSS 디자인 토큰
- 하드코딩 색상/간격/크기 금지 → `var(--token-name)` 사용
- 토큰 목록: styles.css `:root` 참조
- preview.html에 중복 `:root` 변수 정의 금지 (styles.css 표준 변수 사용)

### XSS 방지
- 사용자 입력을 DOM에 출력할 때 반드시 `AppUtils.escapeHTML()` 적용
- innerHTML 직접 사용 시 escapeHTML 필수

## 4. 보안 규칙
- 비밀번호는 반드시 bcryptjs로 해싱 후 저장
- 사용자 입력 HTML 이스케이프 필수 (XSS 방지)
- localStorage 데이터는 민감하지 않은 정보만 저장
- 방명록/화환 삭제 시 부고장 비밀번호 검증 필수

## 5. 설정 변경 규칙
- 모든 설정값은 `src/config/app.config.js`에서 관리
- 하드코딩 금지 (매직 넘버 등)
- 배포 환경별 덮어쓰기: `window.__APP_CONFIG__`
- 기능 플래그: WREATH_ENABLED, GUESTBOOK_ENABLED, ADMIN_ENABLED

## 6. 기능 확장 규칙
- 새 VO 추가 시: `src/domain/obituary/vo/` 아래 생성
- 새 서비스 추가 시: `src/application/` 아래 생성 + scripts.js에서 초기화
- 새 페이지 추가 시: 모든 사이드바에 링크 추가
- Feature Flag 패턴: `appConfig.FEATURE_ENABLED` 사용

## 7. 접근성 (ARIA) 규칙
- 뒤로가기 버튼: `aria-label="뒤로 가기"`
- 메뉴 버튼: `aria-label="메뉴 열기"`
- 사이드바 닫기: `role="button" aria-label="메뉴 닫기"`
- 동적 콘텐츠 영역: `aria-live="polite"` 적용
- 새 인터랙티브 요소 추가 시 적절한 aria 속성 필수

## 8. 반응형 디자인 규칙
- 모바일 퍼스트 기본 (max-width: 500px)
- 태블릿 브레이크포인트: 501px ~ 768px (`--container-tablet` 사용)
- 소형 모바일: max-width: 360px
- 미디어 쿼리 중복 금지 (styles.css에 통합 관리)
