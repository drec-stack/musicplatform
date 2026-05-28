class StorageManager {
    constructor() {
        this.prefix = 'musichub_';
        this.memoryCache = new Map();
        this.available = this.checkAvailability();
        this.loadAllToMemory();
    }

    checkAvailability() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    loadAllToMemory() {
        if (!this.available) return;
        const keys = [
            'settings',
            'connected_services',
            'play_history',
            'favorites',
            'queue',
            'spotify_auth',
            'youtube_config',
            'soundcloud_config'
        ];
        keys.forEach(key => {
            const raw = localStorage.getItem(this.prefix + key);
            if (raw) {
                try {
                    this.memoryCache.set(key, JSON.parse(raw));
                } catch (e) {
                    this.memoryCache.set(key, null);
                }
            }
        });
    }

    get(key, defaultValue = null) {
        if (this.memoryCache.has(key)) {
            return this.memoryCache.get(key);
        }
        if (this.available) {
            const raw = localStorage.getItem(this.prefix + key);
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    this.memoryCache.set(key, parsed);
                    return parsed;
                } catch (e) {
                    return defaultValue;
                }
            }
        }
        return defaultValue;
    }

    set(key, value) {
        this.memoryCache.set(key, value);
        if (this.available) {
            try {
                localStorage.setItem(this.prefix + key, JSON.stringify(value));
            } catch (e) {
                this.clearOldHistory();
                try {
                    localStorage.setItem(this.prefix + key, JSON.stringify(value));
                } catch (e2) {
                    console.error('Storage full, cannot save:', key);
                }
            }
        }
    }

    remove(key) {
        this.memoryCache.delete(key);
        if (this.available) {
            localStorage.removeItem(this.prefix + key);
        }
    }

    clearOldHistory() {
        const history = this.get('play_history', []);
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const fresh = history.filter(item => item.timestamp > thirtyDaysAgo);
        this.set('play_history', fresh);
    }

    addToHistory(track) {
        const history = this.get('play_history', []);
        const entry = {
            ...track,
            timestamp: Date.now()
        };
        history.unshift(entry);
        if (history.length > 500) {
            history.length = 500;
        }
        this.set('play_history', history);
    }

    addToFavorites(track) {
        const favorites = this.get('favorites', []);
        const exists = favorites.find(f => f.id === track.id && f.source === track.source);
        if (!exists) {
            favorites.unshift({
                ...track,
                addedAt: Date.now()
            });
            this.set('favorites', favorites);
            return true;
        }
        return false;
    }

    removeFromFavorites(trackId, source) {
        let favorites = this.get('favorites', []);
        favorites = favorites.filter(f => !(f.id === trackId && f.source === source));
        this.set('favorites', favorites);
    }

    isFavorite(trackId, source) {
        const favorites = this.get('favorites', []);
        return favorites.some(f => f.id === trackId && f.source === source);
    }
}

window.storage = new StorageManager();
