export class GuestbookEntry {
    constructor({
        entryId,
        authorName,
        relationship = '',
        message,
        createdAt
    }) {
        if (!authorName || authorName.trim() === '') {
            throw new Error('작성자 이름(GuestbookEntry.authorName)은 필수입니다.');
        }
        if (authorName.trim().length > 20) {
            throw new Error('작성자 이름은 20자 이내로 입력해주세요.');
        }
        if (relationship && relationship.trim().length > 10) {
            throw new Error('관계는 10자 이내로 입력해주세요.');
        }
        if (!message || message.trim() === '') {
            throw new Error('메시지(GuestbookEntry.message)는 필수입니다.');
        }
        if (message.length > 200) {
            throw new Error('메시지는 200자 이내로 작성해주세요.');
        }

        this.entryId = entryId || GuestbookEntry._generateEntryId();
        this.authorName = authorName.trim();
        this.relationship = relationship ? relationship.trim() : '';
        this.message = message.trim();
        this.createdAt = createdAt || new Date();

        Object.freeze(this);
    }

    static _generateEntryId() {
        return 'GB_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    }

    getDisplayString() {
        const rel = this.relationship ? ' (' + this.relationship + ')' : '';
        return this.authorName + rel + ': ' + this.message;
    }
}
