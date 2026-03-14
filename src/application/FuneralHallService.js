import { FuneralHallRepository } from '../infrastructure/FuneralHallRepository.js';

export class FuneralHallService {
    #repository;

    constructor() {
        this.#repository = new FuneralHallRepository();
    }

    searchHalls(query) {
        // 여기서 검색어 길이, 형식 등 추가 비즈니스 로직 적용 가능
        if (!query || query.trim().length < 2) { // 예: 최소 2글자 이상일 때만 검색
            // AppUtils.showToast('검색어는 2글자 이상 입력해주세요.', 'warning'); // AppUtils 직접 사용은 서비스 레이어에서 부적절할 수 있음
            console.warn('[FuneralHallService] 검색어는 2글자 이상이어야 합니다.');
            return [];
        }
        return this.#repository.search(query);
    }

    getHallById(id) {
        return this.#repository.getById(id);
    }

    getAllHalls() {
        return this.#repository.getAll();
    }
} 