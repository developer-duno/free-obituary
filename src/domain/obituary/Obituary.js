import { DeceasedInfo } from './vo/DeceasedInfo.js';
import { FuneralInfo } from './vo/FuneralInfo.js';
import { BereavedPerson } from './vo/BereavedPerson.js';
import { WreathOrder } from './vo/WreathOrder.js';
import { GuestbookEntry } from './vo/GuestbookEntry.js';
import { verifyPasswordSync } from '../../common/password-utils.js';

export class Obituary {
    #id; // Private field for ID
    #password; // Private field for password (실제 사용 시 해시된 값 저장)
    #createdAt;
    #updatedAt;
    #isPublished;
    #viewCount;

    constructor({
        id,
        deceasedInfo,       // DeceasedInfo 인스턴스
        funeralInfo,        // FuneralInfo 인스턴스
        bereaved = [],      // BereavedPerson 인스턴스의 배열
        additionalInfo = '', // 추가 안내 (상주 말씀)
        password,           // 관리용 비밀번호 (필수)
        selectedTemplate,   // 선택된 템플릿 번호
        portraitImage = null, // 영정 사진 데이터 (Base64 또는 URL)
        viewCount = 0,      // 조회수
        isPublished = false,
        createdAt,
        updatedAt,
        messageContent = '', // 상주 말씀 내용
        messageType = '',   // 메시지 타입 (템플릿/직접)
        accountInfo = null, // 부의금 계좌 정보 배열
        wreathOrders = [],  // WreathOrder
        guestbookEntries = [] // GuestbookEntry 인스턴스의 배열 (근조화환 주문)
    }) {
        if (!(deceasedInfo instanceof DeceasedInfo)) {
            throw new Error('deceasedInfo는 DeceasedInfo의 인스턴스여야 합니다.');
        }
        if (!(funeralInfo instanceof FuneralInfo)) {
            throw new Error('funeralInfo는 FuneralInfo의 인스턴스여야 합니다.');
        }
        if (!password || password.trim() === '') {
            throw new Error('비밀번호는 필수입니다.');
        }
        if (bereaved.some(b => !(b instanceof BereavedPerson))) {
            throw new Error('bereaved 배열의 모든 요소는 BereavedPerson의 인스턴스여야 합니다.');
        }
        if (wreathOrders.some(w => !(w instanceof WreathOrder))) {
            throw new Error('wreathOrders 배열의 모든 요소는 WreathOrder의 인스턴스여야 합니다.');
        }
        if (guestbookEntries.some(g => !(g instanceof GuestbookEntry))) {
            throw new Error('guestbookEntries 배열의 모든 요소는 GuestbookEntry의 인스턴스여야 합니다.');
        }

        this.#id = id || Obituary._generateId();
        this.deceasedInfo = deceasedInfo; // 이미 불변 객체
        this.funeralInfo = funeralInfo;   // 이미 불변 객체
        this.bereaved = Object.freeze([...bereaved]); // 배열 자체는 불변으로, 요소는 이미 불변
        this.additionalInfo = additionalInfo;
        this.#password = password; // 실제 저장 전 해싱 필요
        this.selectedTemplate = selectedTemplate;
        this.portraitImage = portraitImage;
        this.messageContent = messageContent;
        this.messageType = messageType;
        this.accountInfo = accountInfo;
        this.#viewCount = viewCount;
        this.wreathOrders = Object.freeze([...wreathOrders]);
        this.guestbookEntries = Object.freeze([...guestbookEntries]);

        this.#isPublished = isPublished;
        this.#createdAt = createdAt || new Date();
        this.#updatedAt = updatedAt || new Date();
    }

    // --- Getters ---
    get id() { return this.#id; }
    get createdAt() { return this.#createdAt; }
    get updatedAt() { return this.#updatedAt; }
    get isPublished() { return this.#isPublished; }
    get viewCount() { return this.#viewCount; }
    // password getter는 보안상 제공하지 않거나, 해시된 값만 제공

    // --- Private Static Methods ---
    static _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    // --- Public Methods (Commands) ---
    publish() {
        if (this.#isPublished) {
            // console.warn('이미 발행된 부고입니다.');
            return this; // 또는 예외 발생
        }
        this.#isPublished = true;
        this.#updatedAt = new Date();
        return this; // 메소드 체이닝을 위해 this 반환
    }

    unpublish() {
        if (!this.#isPublished) {
            return this;
        }
        this.#isPublished = false;
        this.#updatedAt = new Date();
        return this;
    }

    // 정보 업데이트 메소드들은 새로운 Obituary 인스턴스를 반환하도록 변경 (불변성 패턴)
    updateDeceasedInfo(newDeceasedInfoData) {
        return new Obituary({
            ...this._toDataObject(), // 현재 상태 복사
            deceasedInfo: new DeceasedInfo(newDeceasedInfoData),
            updatedAt: new Date()
        });
    }

    updateFuneralInfo(newFuneralInfoData) {
        return new Obituary({
            ...this._toDataObject(),
            funeralInfo: new FuneralInfo(newFuneralInfoData),
            updatedAt: new Date()
        });
    }

    updateBereaved(newBereavedDataArray) {
        const newBereaved = newBereavedDataArray.map(b => new BereavedPerson(b));
        return new Obituary({
            ...this._toDataObject(),
            bereaved: newBereaved,
            updatedAt: new Date()
        });
    }
    
    updateAdditionalInfo(newAdditionalInfo) {
        return new Obituary({
            ...this._toDataObject(),
            additionalInfo: newAdditionalInfo,
            updatedAt: new Date()
        });
    }

    updatePortraitImage(newPortraitImage) {
         return new Obituary({
            ...this._toDataObject(),
            portraitImage: newPortraitImage,
            updatedAt: new Date()
        });
    }

    updateTemplate(newTemplate) {
        return new Obituary({
            ...this._toDataObject(),
            selectedTemplate: newTemplate,
            updatedAt: new Date()
        });
    }

    updateMessageContent(newMessageContent, newMessageType) {
        return new Obituary({
            ...this._toDataObject(),
            messageContent: newMessageContent,
            messageType: newMessageType || this.messageType,
            updatedAt: new Date()
        });
    }

    updateAccountInfo(newAccountInfo) {
        return new Obituary({
            ...this._toDataObject(),
            accountInfo: newAccountInfo,
            updatedAt: new Date()
        });
    }

    // --- 근조화환 관련 메서드 ---
    addWreathOrder(wreathOrder) {
        if (!(wreathOrder instanceof WreathOrder)) {
            throw new Error('WreathOrder의 인스턴스여야 합니다.');
        }
        return new Obituary({
            ...this._toDataObject(),
            wreathOrders: [...this.wreathOrders, wreathOrder],
            updatedAt: new Date()
        });
    }

    removeWreathOrder(orderId) {
        return new Obituary({
            ...this._toDataObject(),
            wreathOrders: this.wreathOrders.filter(w => w.orderId !== orderId),
            updatedAt: new Date()
        });
    }

    // --- 방명록 관련 메서드 ---
    addGuestbookEntry(entry) {
        if (!(entry instanceof GuestbookEntry)) {
            throw new Error('GuestbookEntry의 인스턴스여야 합니다.');
        }
        return new Obituary({
            ...this._toDataObject(),
            guestbookEntries: [...this.guestbookEntries, entry],
            updatedAt: new Date()
        });
    }

    removeGuestbookEntry(entryId) {
        return new Obituary({
            ...this._toDataObject(),
            guestbookEntries: this.guestbookEntries.filter(g => g.entryId !== entryId),
            updatedAt: new Date()
        });
    }

    // 비밀번호 변경 (주의: 새 비밀번호는 해싱 필요)
    changePassword(newPassword) {
        if (!newPassword || newPassword.trim() === '') {
            throw new Error('새 비밀번호는 비워둘 수 없습니다.');
        }
        // 실제로는 newPassword를 해싱한 후 저장해야 함
        const updatedObituary = new Obituary({ ...this._toDataObject(), updatedAt: new Date() });
        updatedObituary.#password = newPassword; // 직접 할당 (내부적 변경)
        return updatedObituary;
    }

    verifyPassword(passwordToVerify) {
        return verifyPasswordSync(passwordToVerify, this.#password);
    }

    incrementViewCount() {
        // 직접 변경 대신 새로운 인스턴스 반환 방식은 조회수에 부적합할 수 있음.
        // Repository에서 처리하거나, 이 메소드가 호출된 후 save가 이루어진다고 가정.
        this.#viewCount += 1;
        // this.#updatedAt = new Date(); // 조회수 변경은 updatedAt에 영향을 주지 않을 수 있음
        return this; 
    }

    /** 부고 만료 여부 확인 (발인일 + expiryDays일 경과) */
    isExpired(expiryDays = 7) {
        const depDate = this.funeralInfo?.departureDate;
        if (!depDate) return false;
        try {
            const departure = typeof depDate === 'string'
                ? new Date(depDate.replace(/[-.]/g, '/'))
                : depDate instanceof Date ? depDate : null;
            if (!departure || isNaN(departure.getTime())) return false;
            const expiryDate = new Date(departure.getTime() + expiryDays * 24 * 60 * 60 * 1000);
            return new Date() > expiryDate;
        } catch (e) { return false; }
    }

    // --- Data Transfer Object (DTO) / Plain Object Conversion ---
    // Repository 저장을 위한 순수 데이터 객체 반환
    _toDataObject() {
        return {
            id: this.#id,
            deceasedInfo: this.deceasedInfo, // DeceasedInfo 인스턴스 그대로 전달 (JSON 직렬화 시 객체로 변환됨)
            funeralInfo: this.funeralInfo,   // FuneralInfo 인스턴스 그대로 전달
            bereaved: [...this.bereaved],    // BereavedPerson 인스턴스 배열 복사
            additionalInfo: this.additionalInfo,
            password: this.#password, // 해싱된 비밀번호
            selectedTemplate: this.selectedTemplate,
            portraitImage: this.portraitImage,
            messageContent: this.messageContent,
            messageType: this.messageType,
            accountInfo: this.accountInfo,
            isPublished: this.#isPublished,
            viewCount: this.#viewCount,
            createdAt: this.#createdAt,
            updatedAt: this.#updatedAt,
            wreathOrders: [...this.wreathOrders],
            guestbookEntries: [...this.guestbookEntries]
        };
    }
    
    // 저장소에서 데이터를 읽어와 Obituary 인스턴스를 생성하는 정적 팩토리 메소드
    static fromData(data) {
        if (!data) throw new Error('Obituary.fromData: 데이터가 제공되지 않았습니다.');
        
        const deceasedInfo = new DeceasedInfo(data.deceasedInfo || 
            { name: data.deceasedName, age: data.age, title: data.title, gender: data.gender, deathDate: data.deathDate, deathTime: data.deathTime } // 이전 구조 호환성
        );
        const funeralInfo = new FuneralInfo(data.funeralInfo || 
            { funeralHallName: data.funeralHallName, funeralHallAddress: data.funeralHallAddress, funeralHallPhone: data.funeralHallPhone, room: data.room, departureDate: data.departureDate, departureTime: data.departureTime, cemetery: data.cemetery, coffinDate: data.coffinDate, coffinTime: data.coffinTime}
        );
        const bereaved = (data.bereaved || []).map(b => new BereavedPerson(b));
        const wreathOrders = (data.wreathOrders || []).map(w => new WreathOrder({ ...w, orderedAt: w.orderedAt ? new Date(w.orderedAt) : new Date() }));
        const guestbookEntries = (data.guestbookEntries || []).map(g => new GuestbookEntry({ ...g, createdAt: g.createdAt ? new Date(g.createdAt) : new Date() }));

        return new Obituary({
            id: data.id,
            deceasedInfo: deceasedInfo,
            funeralInfo: funeralInfo,
            bereaved: bereaved,
            additionalInfo: data.additionalInfo,
            password: data.password,
            selectedTemplate: data.selectedTemplate,
            portraitImage: data.portraitImage,
            messageContent: data.messageContent || '',
            messageType: data.messageType || '',
            accountInfo: data.accountInfo || null,
            isPublished: data.isPublished === undefined ? true : data.isPublished, // 이전 데이터는 발행된 것으로 간주
            viewCount: data.viewCount || 0,
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
            wreathOrders: wreathOrders,
            guestbookEntries: guestbookEntries
        });
    }
}

// ES6 모듈 방식으로 export
// CommonJS나 window 전역 노출은 애플리케이션 진입점(entry point)이나 번들러 설정에서 관리 