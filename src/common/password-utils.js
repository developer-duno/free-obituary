/**
 * 비밀번호 해싱/검증 유틸 (bcrypt 기반)
 * - 신규 저장: 해시 후 저장
 * - 기존 평문 데이터: 점진적 마이그레이션 지원
 */
import bcrypt from 'bcryptjs'; // npm install bcryptjs

const BCRYPT_ROUNDS = 10;
const BCRYPT_PREFIX = '$2';

/** bcrypt 해시인지 여부 */
export function isHashed(value) {
    return typeof value === 'string' && value.startsWith(BCRYPT_PREFIX);
}

/** 비밀번호 해싱 (비동기) */
export async function hashPassword(plainPassword) {
    if (!plainPassword || typeof plainPassword !== 'string') {
        throw new Error('유효한 비밀번호가 필요합니다.');
    }
    return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
}

/** 비밀번호 해싱 (동기 - Worker 권장) */
export function hashPasswordSync(plainPassword) {
    if (!plainPassword || typeof plainPassword !== 'string') {
        throw new Error('유효한 비밀번호가 필요합니다.');
    }
    return bcrypt.hashSync(plainPassword, BCRYPT_ROUNDS);
}

/**
 * 비밀번호 검증 (해시/평문 모두 지원 - 마이그레이션용)
 * @param {string} plainPassword - 사용자 입력
 * @param {string} stored - 저장된 값 (해시 또는 평문)
 */
export async function verifyPassword(plainPassword, stored) {
    if (!plainPassword || !stored) return false;
    if (isHashed(stored)) {
        return bcrypt.compare(plainPassword, stored);
    }
    // 평문 비밀번호 폴백 제거 - 보안 취약점
    console.warn('해싱되지 않은 비밀번호 감지. 마이그레이션이 필요합니다.');
    return false;
}

/** 동기 버전 */
export function verifyPasswordSync(plainPassword, stored) {
    if (!plainPassword || !stored) return false;
    if (isHashed(stored)) {
        return bcrypt.compareSync(plainPassword, stored);
    }
    console.warn('해싱되지 않은 비밀번호 감지. 마이그레이션이 필요합니다.');
    return false;
}

/** 평문 비밀번호를 해시로 마이그레이션 */
export async function migratePasswordIfNeeded(stored) {
    if (!stored || isHashed(stored)) return stored;
    return hashPassword(stored);
}
