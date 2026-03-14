export class FuneralHallService {
    #apiUrl;
    #cache;

    constructor() {
        this.#apiUrl = '/api/funeral-halls';
        this.#cache = new Map();
    }

    async searchHalls(query) {
        if (!query || query.trim().length < 2) {
            return [];
        }
        const key = query.trim().toLowerCase();
        if (this.#cache.has(key)) {
            return this.#cache.get(key);
        }

        try {
            const params = new URLSearchParams({ query: query.trim(), page: '1' });
            const response = await fetch(this.#apiUrl + '?' + params);
            if (!response.ok) {
                console.error('[FuneralHallService] API error:', response.status);
                return [];
            }
            const data = await response.json();
            const results = data.results || [];

            // cache (max 20)
            if (this.#cache.size >= 20) {
                const oldest = this.#cache.keys().next().value;
                this.#cache.delete(oldest);
            }
            this.#cache.set(key, results);
            return results;
        } catch (error) {
            console.error('[FuneralHallService] fetch error:', error);
            return [];
        }
    }
}
