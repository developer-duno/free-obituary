/**
 * 관리자 인증 설정 예시
 * 1. 이 파일을 admin.config.js 로 복사
 * 2. 실제 계정 정보 입력 (절대 Git에 커밋하지 마세요)
 * 3. admin.config.js 를 .gitignore 에 추가
 *
 * 실무: 서버 기반 JWT/OAuth 인증으로 대체하세요.
 */
export const adminConfig = {
    enabled: false,
    /** 클라이언트 검증은 보안상 불완전합니다. 서버 API 필수 */
    credentials: {
        username: '',
        passwordHash: '', // bcrypt 해시 (서버에서 검증 권장)
    },
};
