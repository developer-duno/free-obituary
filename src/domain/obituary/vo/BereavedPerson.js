export class BereavedPerson {
    constructor({ relationship, name, phone = null, isRepresentative = false }) {
        if (!relationship || relationship.trim() === '') {
            throw new Error('유가족 관계(BereavedPerson.relationship)는 필수입니다.');
        }
        if (relationship.trim().length > 20) {
            throw new Error('유가족 관계는 20자 이내로 입력해주세요.');
        }
        if (!name || name.trim() === '') {
            throw new Error('유가족 이름(BereavedPerson.name)은 필수입니다.');
        }
        if (name.trim().length > 50) {
            throw new Error('유가족 이름은 50자 이내로 입력해주세요.');
        }

        this.relationship = relationship;
        this.name = name;
        this.phone = phone; // 선택적: 연락처
        this.isRepresentative = !!isRepresentative; // 대표 상주 여부 (기본값 false)

        Object.freeze(this);
    }

    // 간단한 정보 반환 메소드
    getInfoString() {
        return `${this.relationship}: ${this.name}${this.phone ? ' (' + this.phone + ')' : ''}`;
    }
} 