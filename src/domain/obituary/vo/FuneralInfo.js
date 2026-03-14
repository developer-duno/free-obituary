export class FuneralInfo {
    constructor({
        funeralHallName,    // 장례식장명
        funeralHallAddress, // 장례식장 주소
        funeralHallPhone,   // 장례식장 전화번호
        room,               // 호실
        departureDate,      // 발인일 (YYYY-MM-DD 형식 권장)
        departureTime,      // 발인시간 (HH:MM 형식 권장)
        cemetery,           // 장지
        coffinDate,         // 입관일 (YYYY-MM-DD 형식 권장, 선택적)
        coffinTime          // 입관시간 (HH:MM 형식 권장, 선택적)
    }) {
        // 필수 값에 대한 유효성 검사는 Obituary Entity 또는 Application Service에서 수행 가능
        // 여기서는 단순 할당 위주로.
        this.funeralHallName = funeralHallName;
        this.funeralHallAddress = funeralHallAddress;
        this.funeralHallPhone = funeralHallPhone;
        this.room = room;
        this.departureDate = departureDate;
        this.departureTime = departureTime;
        this.cemetery = cemetery;
        this.coffinDate = coffinDate;
        this.coffinTime = coffinTime;

        Object.freeze(this);
    }

    // 주소 포맷팅이나 지도 URL 생성과 같은 로직 추가 가능
    getFormattedDepartureDateTime() {
        if (!this.departureDate) return '';
        let dateTimeString = this.departureDate; // YYYY-MM-DD
        if (this.departureTime) {
            dateTimeString += ` ${this.departureTime}`;
        }
        // 실제 사용 시에는 AppUtils.formatDateTimeDetailed 같은 유틸리티 함수 사용 권장
        return dateTimeString; 
    }

    getFormattedCoffinDateTime() {
        if (!this.coffinDate) return '';
        let dateTimeString = this.coffinDate;
        if (this.coffinTime) {
            dateTimeString += ` ${this.coffinTime}`;
        }
        return dateTimeString;
    }
} 