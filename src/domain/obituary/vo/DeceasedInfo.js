export class DeceasedInfo {
    constructor({
        name,       // 고인명 (필수)
        age,        // 나이
        title,      // 직함/호칭
        gender,     // 성별 (예: 'male', 'female', 'other')
        deathDate,  // 별세일 (YYYY-MM-DD 형식 권장, 필수)
        deathTime,  // 별세시간 (HH:MM 형식 권장)
        deathExpression = '', // 별세표현 (별세/영면/서거 등)
        nameHanja = '' // 한자 이름
    }) {
        if (!name || name.trim() === '') {
            throw new Error('고인명(DeceasedInfo.name)은 필수입니다.');
        }
        if (!deathDate) {
            throw new Error('별세일(DeceasedInfo.deathDate)은 필수입니다.');
        }

        this.name = name;
        
        // age 타입/범위 검증
        if (age !== undefined && age !== null && age !== '') {
            const numAge = Number(age);
            if (isNaN(numAge) || numAge < 0 || numAge > 200) {
                throw new Error('나이(DeceasedInfo.age)는 0~200 사이의 숫자여야 합니다.');
            }
            this.age = numAge;
        } else {
            this.age = age;
        }
        
        this.title = title;
        
        // gender 검증
        const VALID_GENDERS = ['male', 'female', ''];
        if (gender && !VALID_GENDERS.includes(gender)) {
            console.warn(`알 수 없는 gender 값: ${gender}, 빈 값으로 대체`);
            this.gender = '';
        } else {
            this.gender = gender || '';
        }
        this.deathDate = deathDate; // Date 객체로 변환하거나 유효성 검사 강화 가능
        this.deathTime = deathTime;
        this.deathExpression = deathExpression;
        this.nameHanja = nameHanja || '';

        // 불변성을 위해 Object.freeze 사용 (얕은 불변성)
        Object.freeze(this);
    }

    // 필요시 getter 또는 정보 조합 메소드 추가
    getFullNameWithTitle() {
        return `${this.title ? this.title + ' ' : ''}${this.name}`;
    }
} 