import { WreathOrder } from '../domain/obituary/vo/WreathOrder.js';

export class WreathService {
    constructor(obituaryRepository) {
        if (!obituaryRepository) {
            throw new Error('ObituaryRepository는 필수입니다.');
        }
        this.obituaryRepository = obituaryRepository;
    }

    async addWreathOrder(obituaryId, wreathOrderData) {
        if (!obituaryId) {
            throw new Error('부고 ID는 필수입니다.');
        }
        if (!wreathOrderData) {
            throw new Error('화환 주문 데이터는 필수입니다.');
        }

        const obituary = await this.obituaryRepository.findById(obituaryId);
        if (!obituary) {
            throw new Error('해당 부고를 찾을 수 없습니다.');
        }

        const wreathOrder = new WreathOrder({
            ...wreathOrderData,
            orderedAt: wreathOrderData.orderedAt || new Date().toISOString()
        });

        const updatedObituary = obituary.addWreathOrder(wreathOrder);
        await this.obituaryRepository.save(updatedObituary);
        return updatedObituary;
    }

    async getWreathOrders(obituaryId) {
        if (!obituaryId) {
            throw new Error('부고 ID는 필수입니다.');
        }

        const obituary = await this.obituaryRepository.findById(obituaryId);
        if (!obituary) {
            throw new Error('해당 부고를 찾을 수 없습니다.');
        }

        return obituary.wreathOrders || [];
    }

    async removeWreathOrder(obituaryId, orderId, password) {
        if (!obituaryId || !orderId) {
            throw new Error('부고 ID와 주문 ID는 필수입니다.');
        }

        const obituary = await this.obituaryRepository.findById(obituaryId);
        if (!obituary) {
            throw new Error('해당 부고를 찾을 수 없습니다.');
        }

        if (!obituary.verifyPassword(password)) {
            throw new Error('비밀번호가 일치하지 않습니다.');
        }

        const updatedObituary = obituary.removeWreathOrder(orderId);
        await this.obituaryRepository.save(updatedObituary);
        return updatedObituary;
    }

    /**
     * 외부 결제 시스템 연동 스텁 (향후 webhook/API 콜백에서 호출)
     * 외부 화환 판매 사이트의 결제 완료 데이터를 받아 WreathOrder로 변환 후 저장
     */
    async processExternalWreathOrder(obituaryId, externalOrderData) {
        if (!obituaryId || !externalOrderData) {
            throw new Error('부고 ID와 외부 주문 데이터는 필수입니다.');
        }

        const wreathOrderData = {
            senderName: externalOrderData.senderName,
            senderMessage: externalOrderData.message || '',
            wreathType: externalOrderData.productName || '근조화환',
            price: externalOrderData.amount || 0,
            orderedAt: externalOrderData.paidAt || new Date().toISOString(),
            status: 'confirmed',
            vendorOrderRef: externalOrderData.orderId || null,
            imageUrl: externalOrderData.productImageUrl || null
        };

        return this.addWreathOrder(obituaryId, wreathOrderData);
    }
}
