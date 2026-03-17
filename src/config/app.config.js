/**
 * 애플리케이션 설정 (SaaS/실무 배포용)
 * - 환경별 설정 분리
 * - 민감 정보는 window.__APP_CONFIG__ 또는 빌드 시 주입
 */
const DEFAULT_CONFIG = {
    IMAGE_PATH: 'image/',
    TOTAL_TEMPLATES: 33,
    MAX_ACCOUNTS: 10,
    DEBOUNCE_DELAY: 300,
    MIN_SEARCH_LENGTH: 2,
    PASSWORD_MIN_LENGTH: 4,
    /** 관리자 인증: 서버 API 연동 전까지 비활성화 권장 */
    ADMIN_ENABLED: false,
    /** 빌드 시 또는 window.__APP_CONFIG__ 로 덮어쓰기 */
    API_BASE_URL: '',
    /** 근조화환 기능 설정 */
    WREATH_ENABLED: true,
    WREATH_VENDOR_URL: 'https://flowerpartners.co.kr/products?cat=%EA%B7%BC%EC%A1%B0%ED%99%94%ED%99%98',
    WREATH_VENDOR_PARAM_KEY: 'obituaryId',
    WREATH_TYPES: ['근조화환 3단', '근조화환 2단', '근조바구니', '근조란'],
    MAX_WREATH_DISPLAY: 50,
    /** 방명록(조문 메시지) 설정 */
    GUESTBOOK_ENABLED: true,
    MAX_GUESTBOOK_ENTRIES: 100,
    MAX_GUESTBOOK_MESSAGE_LENGTH: 200,
    /** 부고 자동 만료 설정 (발인일 기준) */
    OBITUARY_EXPIRY_DAYS: 7,
    OBITUARY_CLEANUP_DAYS: 30,
};

function getConfig() {
    const overrides = (typeof window !== 'undefined' && window.__APP_CONFIG__) || {};
    return { ...DEFAULT_CONFIG, ...overrides };
}

// TODO: Object.freeze(appConfig) 적용하여 런타임 변조 방지
export const appConfig = getConfig();
export default appConfig;
