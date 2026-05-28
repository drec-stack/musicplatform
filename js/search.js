class SearchManager {
    constructor() {
        this.lastQuery = '';
        this.searchTimeout = null;
        this.searchCache = new Map();
    }

    async search(query) {
        if (!query || query.trim().length < 2) {
            return null;
        }

        query = query.trim();
        this.lastQuery = query;

        const cacheKey = query.toLowerCase();
        const cached = this.searchCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 60000) {
            return cached.results;
        }

        const activeTokens = services.getActiveServiceTokens();
        
        if (Object.keys(activeTokens).length === 0) {
            return { query, services: {}, isEmpty: true };
        }

        try {
            const results = await api.searchAll(query, activeTokens);
            
            this.searchCache.set(cacheKey, {
                results,
                timestamp: Date.now()
            });

            if (this.searchCache.size > 50) {
                const firstKey = this.searchCache.keys().next().value;
                this.searchCache.delete(firstKey);
            }

            return results;
        } catch (error) {
            console.error('Search failed:', error);
            return { query, services: {}, error: true };
        }
    }

    getSuggestions(query) {
        const history = storage.get('play_history', []);
        if (!query || query.length < 1) return [];
        
        const lowerQuery = query.toLowerCase();
        const suggestions = new Set();
        
        history.forEach(track => {
            if (track.title && track.title.toLowerCase().includes(lowerQuery)) {
                suggestions.add(track.title);
            }
            if (track.artist && track.artist.toLowerCase().includes(lowerQuery)) {
                suggestions.add(track.artist);
            }
        });

        return Array.from(suggestions).slice(0, 5);
    }
}

window.searchManager = new SearchManager();
