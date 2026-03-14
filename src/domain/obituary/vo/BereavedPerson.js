export class BereavedPerson {
    constructor({ relationship, name, phone = null, isRepresentative = false }) {
        if (!relationship || relationship.trim() === '') {
            throw new Error('유가족 관계(BereavedPerson.relationship)는 필수입니다.');
        }
        if (!name || name.trim() === '') {
            throw new Error('유가족 이름(BereavedPerson.name)은 필수입니다.');
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