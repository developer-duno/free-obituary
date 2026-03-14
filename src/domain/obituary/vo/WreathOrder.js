export class WreathOrder {
    constructor({
        orderId,
        senderName,
        senderMessage = '',
        wreathType,
        price = 0,
        orderedAt,
        status = 'confirmed',
        vendorOrderRef = null,
        imageUrl = null
    }) {
        if (!senderName || senderName.trim() === '') {
            throw new Error('보내시는 분 이름(WreathOrder.senderName)은 필수입니다.');
        }
        if (!wreathType || wreathType.trim() === '') {
            throw new Error('화환 종류(WreathOrder.wreathType)는 필수입니다.');
        }
        if (!orderedAt) {
            throw new Error('주문일시(WreathOrder.orderedAt)는 필수입니다.');
        }

        const validStatuses = ['pending', 'confirmed', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new Error(`유효하지 않은 주문 상태입니다: ${status}`);
        }

        this.orderId = orderId || WreathOrder._generateOrderId();
        this.senderName = senderName;
        this.senderMessage = senderMessage;
        this.wreathType = wreathType;
        this.price = price;
        this.orderedAt = orderedAt;
        this.status = status;
        this.vendorOrderRef = vendorOrderRef;
        this.imageUrl = imageUrl;

        Object.freeze(this);
    }

    static _generateOrderId() {
        return 'WO_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    }

    getDisplayString() {
        return `${this.wreathType} - ${this.senderName}`;
    }
}
