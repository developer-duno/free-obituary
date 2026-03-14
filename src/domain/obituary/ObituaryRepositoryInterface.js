export class ObituaryRepositoryInterface {
    /**
     * 부고 정보를 저장하거나 업데이트합니다.
     * @param {Obituary} obituary - 저장할 Obituary 엔티티 인스턴스.
     * @returns {Promise<void>}
     */
    async save(obituary) {
        throw new Error("메소드가 구현되지 않았습니다: save");
    }

    /**
     * ID로 부고 정보를 조회합니다.
     * @param {string} obituaryId - 조회할 부고의 ID.
     * @returns {Promise<Obituary|null>} Obituary 엔티티 인스턴스 또는 null.
     */
    async findById(obituaryId) {
        throw new Error("메소드가 구현되지 않았습니다: findById");
    }

    /**
     * 고인명으로 부고 정보를 검색합니다.
     * @param {string} deceasedName - 검색할 고인명.
     * @returns {Promise<Obituary[]>} Obituary 엔티티 인스턴스의 배열.
     */
    async findByDeceasedName(deceasedName) {
        throw new Error("메소드가 구현되지 않았습니다: findByDeceasedName");
    }

    /**
     * ID로 부고 정보를 삭제합니다.
     * @param {string} obituaryId - 삭제할 부고의 ID.
     * @returns {Promise<boolean>} 삭제 성공 시 true.
     */
    async deleteById(obituaryId) {
        throw new Error("메소드가 구현되지 않았습니다: deleteById");
    }

    /**
     * 모든 부고 정보를 조회합니다.
     * @returns {Promise<Obituary[]>} 모든 Obituary 엔티티 인스턴스의 배열.
     */
    async findAll() {
        throw new Error("메소드가 구현되지 않았습니다: findAll");
    }

    /**
     * 다음 ID를 생성합니다.
     * @returns {Promise<string>} 생성된 새 ID.
     */
    async nextId() {
        throw new Error("메소드가 구현되지 않았습니다: nextId");
    }

    /**
     * 부고의 조회수를 증가시킵니다.
     * @param {string} obituaryId - 부고 ID.
     * @returns {Promise<boolean>} 성공 시 true.
     */
    async incrementViewCount(obituaryId) {
        throw new Error("메소드가 구현되지 않았습니다: incrementViewCount");
    }

    /**
     * 부고의 비밀번호를 검증하고, 일치 시 Obituary 엔티티를 반환합니다.
     * @param {string} obituaryId - 부고 ID.
     * @param {string} passwordToVerify - 검증할 비밀번호.
     * @returns {Promise<Obituary|null>} 비밀번호 일치 시 Obituary, 불일치 시 null.
     */
    async verifyPassword(obituaryId, passwordToVerify) {
        throw new Error("메소드가 구현되지 않았습니다: verifyPassword");
    }

    /**
     * 모든 부고 데이터를 삭제합니다. (관리자 전용)
     * @returns {Promise<void>}
     */
    async clearAll() {
        throw new Error("메소드가 구현되지 않았습니다: clearAll");
    }
}
