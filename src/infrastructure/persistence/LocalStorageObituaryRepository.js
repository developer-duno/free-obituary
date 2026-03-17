import { Obituary } from '../../domain/obituary/Obituary.js';
import { ObituaryRepositoryInterface } from '../../domain/obituary/ObituaryRepositoryInterface.js';

const OBITUARY_DB_KEY = 'obituaryDB';
const OBITUARY_DB_BACKUP_KEY = 'obituaryDB_backup';

export class LocalStorageObituaryRepository extends ObituaryRepositoryInterface {
    constructor() {
        super();
        this._initializeDb();
    }

    _initializeDb() {
        if (!localStorage.getItem(OBITUARY_DB_KEY)) {
            localStorage.setItem(OBITUARY_DB_KEY, JSON.stringify([]));
        }
        this._autoCleanup();
    }

    /** Phase 2: 발인일 + 30일 경과 데이터 자동 정리 */
    _autoCleanup() {
        try {
            const obituaries = this._getAllRawData();
            const cleanupDays = 30;
            const now = Date.now();
            const filtered = obituaries.filter(o => {
                const depDate = o.funeralInfo?.departureDate || o.departureDate;
                if (!depDate) return true;
                try {
                    const dep = new Date(String(depDate).replace(/[-.]/g, '/'));
                    if (isNaN(dep.getTime())) return true;
                    return (now - dep.getTime()) < cleanupDays * 24 * 60 * 60 * 1000;
                } catch (e) { return true; }
            });
            if (filtered.length < obituaries.length) {
                this._saveAllRawData(filtered);
            }
        } catch (e) { console.warn('자동 정리 실패:', e); }
    }

    /** S2: localStorage 데이터 스키마 검증 */
    _validateRawData(parsed) {
        if (!Array.isArray(parsed)) return false;
        return parsed.every(item =>
            item && typeof item === 'object' &&
            typeof item.id === 'string' && item.id.length > 0
        );
    }

    /** D1: 저장 전 용량 체크 */
    _checkStorageQuota(dataToStore) {
        try {
            const serialized = JSON.stringify(dataToStore);
            const sizeInMB = new Blob([serialized]).size / (1024 * 1024);
            const estimatedLimit = 4.5; // 안전 마진 포함 (보통 5MB)
            if (sizeInMB > estimatedLimit) {
                throw new Error(
                    '저장 공간이 부족합니다 (' + sizeInMB.toFixed(1) + 'MB/' + estimatedLimit + 'MB). ' +
                    '이전 부고를 정리하거나 사진 크기를 줄여주세요.'
                );
            }
            return serialized;
        } catch (e) {
            if (e.message.includes('저장 공간')) throw e;
            throw new Error('데이터 직렬화 중 오류가 발생했습니다.');
        }
    }

    _getAllRawData() {
        try {
            const rawData = localStorage.getItem(OBITUARY_DB_KEY);
            if (!rawData) return [];
            const parsed = JSON.parse(rawData);

            // S2: 스키마 검증
            if (!this._validateRawData(parsed)) {
                console.warn('localStorage 데이터 형식 오류 감지. 백업 후 빈 배열 반환.');
                localStorage.setItem(OBITUARY_DB_BACKUP_KEY, rawData);
                return [];
            }
            return parsed;
        } catch (error) {
            console.error('localStorage 데이터 파싱 오류:', error);
            // S2: 손상 데이터 백업
            const corrupted = localStorage.getItem(OBITUARY_DB_KEY);
            if (corrupted) {
                localStorage.setItem(OBITUARY_DB_BACKUP_KEY, corrupted);
            }
            return [];
        }
    }

    _saveAllRawData(dataArray) {
        try {
            // D1: 용량 체크 후 저장
            const serialized = this._checkStorageQuota(dataArray);
            localStorage.setItem(OBITUARY_DB_KEY, serialized);
        } catch (error) {
            if (error.name === 'QuotaExceededError' || error.message.includes('저장 공간')) {
                throw new Error('저장 공간이 부족합니다. 이전 부고를 정리하거나 사진 크기를 줄여주세요.');
            }
            console.error('localStorage 저장 오류:', error);
            throw new Error('부고 정보를 저장하는데 실패했습니다: ' + error.message);
        }
    }

    async save(obituary) {
        if (!(obituary instanceof Obituary)) {
            throw new Error('저장할 객체는 Obituary의 인스턴스여야 합니다.');
        }
        const obituaries = this._getAllRawData();
        const index = obituaries.findIndex(o => o.id === obituary.id);
        const dataToSave = obituary._toDataObject();

        // D2: 낙관적 잠금 - updatedAt 비교
        if (index > -1) {
            const existing = obituaries[index];
            if (existing.updatedAt && dataToSave.updatedAt &&
                new Date(existing.updatedAt).getTime() > new Date(dataToSave.updatedAt).getTime()) {
                throw new Error('다른 탭에서 이미 수정되었습니다. 페이지를 새로고침해주세요.');
            }
            dataToSave.updatedAt = new Date().toISOString();
            obituaries[index] = dataToSave;
        } else {
            dataToSave.updatedAt = new Date().toISOString();
            obituaries.push(dataToSave);
        }
        this._saveAllRawData(obituaries);
    }

    async findById(obituaryId) {
        const obituariesRaw = this._getAllRawData();
        const rawData = obituariesRaw.find(o => o.id === obituaryId);
        if (rawData) {
            return Obituary.fromData(rawData);
        }
        return null;
    }

    async findByDeceasedName(deceasedName) {
        const searchTerm = deceasedName.toLowerCase();
        const obituariesRaw = this._getAllRawData();
        const filteredRawData = obituariesRaw.filter(o => {
            const nameToCompare = o.deceasedInfo ? o.deceasedInfo.name : o.deceasedName;
            return nameToCompare && nameToCompare.toLowerCase().includes(searchTerm);
        });
        return filteredRawData.map(rawData => Obituary.fromData(rawData));
    }

    async deleteById(obituaryId) {
        let obituaries = this._getAllRawData();
        const initialLength = obituaries.length;
        obituaries = obituaries.filter(o => o.id !== obituaryId);
        if (obituaries.length < initialLength) {
            this._saveAllRawData(obituaries);
            return true;
        }
        return false;
    }

    async findAll() {
        const obituariesRaw = this._getAllRawData();
        return obituariesRaw.map(rawData => Obituary.fromData(rawData));
    }

    async nextId() {
        return Obituary._generateId();
    }

    async incrementViewCount(obituaryId) {
        const obituary = await this.findById(obituaryId);
        if (obituary) {
            obituary.incrementViewCount();
            await this.save(obituary);
            return true;
        }
        return false;
    }

    async verifyPassword(obituaryId, passwordToVerify) {
        const obituary = await this.findById(obituaryId);
        if (obituary && obituary.verifyPassword(passwordToVerify)) {
            return obituary;
        }
        return null;
    }

    async clearAll() {
        this._saveAllRawData([]);
    }

    /** 저장소 사용량 확인 (KB 단위) */
    getStorageUsage() {
        const data = localStorage.getItem(OBITUARY_DB_KEY) || '';
        return Math.round(new Blob([data]).size / 1024);
    }
}
