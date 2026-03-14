# CLAUDE.md - 무료부고장 서비스

## 프로젝트 개요
무료 부고장 생성 웹 서비스. 수익 모델은 근조화환 판매 연결.
- **백엔드 없음**: 순수 프론트엔드, localStorage 기반 데이터 저장
- **ES6 모듈**: `type="module"` 스크립트 로딩
- **비밀번호**: bcryptjs 해싱 (10 salt rounds)

## 아키텍처 (DDD + Clean Architecture)
```
src/
  domain/obituary/          # 도메인 계층
    Obituary.js              # 애그리게이트 루트 엔티티
    ObituaryRepositoryInterface.js  # 리포지토리 인터페이스
    vo/                      # Value Objects (불변, Object.freeze)
      DeceasedInfo.js, FuneralInfo.js, BereavedPerson.js
      WreathOrder.js, GuestbookEntry.js
  application/               # 애플리케이션 서비스 계층
    ObituaryService.js       # 부고 CRUD 비즈니스 로직
    WreathService.js         # 근조화환 주문 로직
    GuestbookService.js      # 방명록(조문 메시지) 로직
    FuneralHallService.js    # 장례식장 검색
  infrastructure/
    persistence/LocalStorageObituaryRepository.js  # 저장소 구현체
  config/app.config.js       # 앱 설정 (window.__APP_CONFIG__ 덮어쓰기 가능)
  common/
    utils.js                 # AppUtils 유틸리티 (showToast, escapeHTML 등)
    password-utils.js        # bcryptjs 해싱/검증
```

## 페이지 구조
| 페이지 | 역할 |
|--------|------|
| index.html | 랜딩 페이지, 템플릿 샘플 보기 |
| write.html | 부고장 작성 폼 |
| preview.html | 부고장 미리보기 + 근조화환 + 방명록 + 조회수 |
| Search.html | 부고장 검색 |
| manage.html | 부고장 수정/삭제 |
| sample.html | 템플릿 샘플 미리보기 |
| etiquette.html | 조문예절 안내 |
| guide.html | 이용안내 |
| faq.html | 자주묻는질문 |
| thanks.html | 감사 페이지 |

## 핵심 규칙

### 데이터 흐름
1. 전역 서비스: `window.appServices.obituaryService` / `wreathService` / `guestbookService`
2. scripts.js에서 서비스 인스턴스 생성 → window 노출
3. 각 페이지 모듈(preview-module.js 등)이 서비스 사용

### 코딩 컨벤션
- **Value Object**: 생성자에서 검증 → `Object.freeze(this)` → 불변
- **Entity 업데이트**: 새 인스턴스 반환 (immutable pattern, `_toDataObject()` spread)
- **Repository**: 인터페이스 → 구현체 패턴 (DI)
- **서비스**: 생성자에서 repository 주입
- **사용자 알림**: `AppUtils.showToast()` 사용 (alert() 사용 금지)
- **사용자 입력 출력**: `AppUtils.escapeHTML()`로 XSS 방지 필수

### CSS 디자인 토큰
styles.css `:root`에 통합 토큰 정의:
- 색상: `--primary-brown`, `--dark-brown`, `--text-brown`, `--accent-brown`, `--bg-brown`
- 간격: `--space-xs`(4px) ~ `--space-xl`(32px)
- 테두리: `--radius-sm`(4px), `--radius-md`(8px), `--radius-lg`(12px)
- 그림자: `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- 글꼴: `--text-xs`(12px) ~ `--text-xl`(20px)
- 컨테이너: `--container-max`(500px), `--container-tablet`(680px)

### 주의사항
- `src/domains/` 디렉토리는 삭제됨 (레거시 코드). 절대 참조하지 말 것
- `src/infrastructure/ObituaryRepository.js`도 삭제됨. `LocalStorageObituaryRepository.js` 사용
- HTML 사이드바 "부고장 작성" 링크는 직접 `href="write.html"` 사용
- `window.templateHandler`는 존재하지 않음. 사용하지 말 것
- 템플릿 이미지: `image/1.jpg` ~ `image/33.jpg`
- localStorage 키: `'obituaryDB'`
- 모든 JS 파일은 UTF-8 인코딩 필수

### 근조화환 기능
- `appConfig.WREATH_ENABLED`: 기능 플래그
- `appConfig.WREATH_VENDOR_URL`: 외부 판매 사이트 URL (현재 비어있음 - 미정)
- preview.html에 "근조화환 보내기" 버튼 + 화환 표시 섹션

### 방명록(조문 메시지) 기능
- `appConfig.GUESTBOOK_ENABLED`: 기능 플래그
- `appConfig.MAX_GUESTBOOK_ENTRIES`: 최대 100개
- `appConfig.MAX_GUESTBOOK_MESSAGE_LENGTH`: 최대 200자
- preview.html에 방명록 입력 폼 + 메시지 목록 (최신순 정렬)
- GuestbookEntry VO: entryId, authorName, relationship, message, createdAt
- 삭제 시 부고장 비밀번호 검증 필요

### 조회수 기능
- preview.html에 "OOO명이 조문하셨습니다" 표시
- Obituary.incrementViewCount()로 카운트 증가
- Repository.incrementViewCount()에서 저장 처리

### 접근성 (ARIA)
- 모든 페이지 뒤로가기/메뉴/닫기 버튼에 aria-label 적용
- 동적 콘텐츠(방명록, 조회수)에 aria-live="polite" 적용
- 토스트 알림에 role="status", aria-live="polite" 적용

## 빌드 / 테스트
- 빌드 도구 없음 (vanilla HTML/JS)
- 정적 파일 서비스로 바로 배포 가능
- node_modules는 bcryptjs 등 브라우저에서 import 용

# 코드 리뷰 기준 (모든 코드 수정 시 적용)

## 필수 체크 항목
- 페이지·컴포넌트 간 연동 무결성
- 클린 코드 & SOLID 원칙 준수
- 프론트↔백엔드 타입 일관성
- 보안: XSS, Injection, 인증 우회 없을 것
- 수정 시 말로 설명 말고 코드로 직접 반영할 것
