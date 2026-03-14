import { funeralHallRawData } from './funeral-halls-db.js';

const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 10;
const MAX_CACHE_SIZE = 20;

export class FuneralHallRepository {
    #funeralHalls = [];
    #nameIndex = new Map();
    #addressIndex = new Map();
    #regionIndex = new Map();
    #searchCache = new Map();

    constructor() {
        this.#funeralHalls = funeralHallRawData.map(hall => ({...hall})); // 데이터 복사본 사용
        this.#buildSearchIndices();
    }

    #addToIndex(index, key, hall) {
        if (!index.has(key)) {
            index.set(key, []);
        }
        const halls = index.get(key);
        if (!halls.some(h => h.id === hall.id)) {
            halls.push(hall);
        }
    }

    #buildSearchIndices() {
        this.#nameIndex.clear();
        this.#addressIndex.clear();
        this.#regionIndex.clear();

        this.#funeralHalls.forEach(hall => {
            if (hall.name) {
                const nameLower = hall.name.toLowerCase();
                this.#addToIndex(this.#nameIndex, nameLower, hall); // 전체 이름
                nameLower.split(/\s+/).forEach(word => { // 단어 단위
                    if (word.length >= MIN_QUERY_LENGTH) {
                        this.#addToIndex(this.#nameIndex, word, hall);
                    }
                });
            }
            if (hall.address) {
                const addressLower = hall.address.toLowerCase();
                addressLower.split(/[\s,]+/).forEach(word => { // 주소 단어 단위
                    if (word.length >= MIN_QUERY_LENGTH) {
                        this.#addToIndex(this.#addressIndex, word, hall);
                    }
                });
            }
            if (hall.region) {
                const regionLower = hall.region.toLowerCase();
                this.#addToIndex(this.#regionIndex, regionLower, hall); // 지역명
            }
        });
    }

    #performSearch(searchText) {
        const resultMap = new Map();

        const searchInIndex = (text, index, weight) => {
            const tokens = text.split(/\s+/);
            tokens.forEach(token => {
                if (token.length < MIN_QUERY_LENGTH) return;
                for (const [key, halls] of index.entries()) {
                    if (key.includes(token)) {
                        const matchScore = key === token ? weight * 1.5 : weight; // 정확히 일치 시 가중치 더 부여
                        halls.forEach(hall => {
                            if (resultMap.has(hall.id)) {
                                resultMap.get(hall.id).score += matchScore;
                            } else {
                                resultMap.set(hall.id, { hall: hall, score: matchScore });
                            }
                        });
                    }
                }
            });
        };

        searchInIndex(searchText, this.#nameIndex, 2);       // 이름 가중치 2
        searchInIndex(searchText, this.#addressIndex, 1);    // 주소 가중치 1
        searchInIndex(searchText, this.#regionIndex, 1.5);   // 지역 가중치 1.5

        return Array.from(resultMap.values()) // .values()를 사용하여 {hall, score} 객체 배열로 바로 변환
            .sort((a, b) => b.score - a.score) // 점수 내림차순 정렬
            .map(entry => entry.hall) // hall 객체만 추출
            .slice(0, MAX_RESULTS);
    }

    #cacheResults(query, results) {
        if (this.#searchCache.size >= MAX_CACHE_SIZE) {
            const oldestKey = this.#searchCache.keys().next().value;
            this.#searchCache.delete(oldestKey);
        }
        this.#searchCache.set(query, [...results]); // 결과 복사본 저장
    }

    search(query) {
        if (!query || typeof query !== 'string' || query.trim().length < MIN_QUERY_LENGTH) {
            return [];
        }
        const searchText = query.toLowerCase().trim();

        if (this.#searchCache.has(searchText)) {
            return this.#searchCache.get(searchText);
        }

        const results = this.#performSearch(searchText);
        this.#cacheResults(searchText, results);
        return results;
    }

    getById(id) {
        if (!id) return null;
        return this.#funeralHalls.find(hall => hall.id === id) || null;
    }

    getAll() {
        return [...this.#funeralHalls]; // 전체 데이터 복사본 반환
    }
    
    clearCache() {
        this.#searchCache.clear();
    }

    rebuildIndices() {
        this.#buildSearchIndices();
    }
} 