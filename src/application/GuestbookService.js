import { GuestbookEntry } from '../domain/obituary/vo/GuestbookEntry.js';
import { appConfig } from '../config/app.config.js';

export class GuestbookService {
    constructor(obituaryRepository) {
        if (!obituaryRepository) {
            throw new Error('ObituaryRepository는 필수입니다.');
        }
        this.obituaryRepository = obituaryRepository;
    }

    async addGuestbookEntry(obituaryId, entryData) {
        if (!obituaryId) throw new Error('부고 ID는 필수입니다.');
        if (!entryData) throw new Error('방명록 데이터는 필수입니다.');

        // D5: 입력 검증
        if (!entryData.authorName || typeof entryData.authorName !== 'string' || entryData.authorName.trim().length === 0) {
            throw new Error('이름은 필수입니다.');
        }
        if (entryData.authorName.length > 50) {
            throw new Error('이름은 50자 이하여야 합니다.');
        }
        if (!entryData.message || typeof entryData.message !== 'string' || entryData.message.trim().length === 0) {
            throw new Error('메시지는 필수입니다.');
        }
        if (entryData.message.length > (appConfig.MAX_GUESTBOOK_MESSAGE_LENGTH || 200)) {
            throw new Error('메시지는 ' + (appConfig.MAX_GUESTBOOK_MESSAGE_LENGTH || 200) + '자 이하여야 합니다.');
        }

        const obituary = await this.obituaryRepository.findById(obituaryId);
        if (!obituary) throw new Error('해당 부고를 찾을 수 없습니다.');

        // D5: 최대 개수 제한 적용
        const maxEntries = appConfig.MAX_GUESTBOOK_ENTRIES || 100;
        if (obituary.guestbookEntries && obituary.guestbookEntries.length >= maxEntries) {
            throw new Error('방명록은 최대 ' + maxEntries + '개까지만 등록할 수 있습니다.');
        }

        const entry = new GuestbookEntry({
            authorName: entryData.authorName.trim(),
            relationship: entryData.relationship ? entryData.relationship.trim() : '',
            message: entryData.message.trim(),
            entryId: entryData.entryId,
            createdAt: new Date()
        });

        const updatedObituary = obituary.addGuestbookEntry(entry);
        await this.obituaryRepository.save(updatedObituary);
        return updatedObituary;
    }

    async getGuestbookEntries(obituaryId) {
        if (!obituaryId) throw new Error('부고 ID는 필수입니다.');
        const obituary = await this.obituaryRepository.findById(obituaryId);
        if (!obituary) throw new Error('해당 부고를 찾을 수 없습니다.');
        return obituary.guestbookEntries || [];
    }

    async removeGuestbookEntry(obituaryId, entryId, password) {
        if (!obituaryId || !entryId) throw new Error('부고 ID와 메시지 ID는 필수입니다.');

        const obituary = await this.obituaryRepository.findById(obituaryId);
        if (!obituary) throw new Error('해당 부고를 찾을 수 없습니다.');

        if (!obituary.verifyPassword(password)) {
            throw new Error('비밀번호가 일치하지 않습니다.');
        }

        const updatedObituary = obituary.removeGuestbookEntry(entryId);
        await this.obituaryRepository.save(updatedObituary);
        return updatedObituary;
    }
}
