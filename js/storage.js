class StorageManager {
    constructor() {
        this.prefix = 'musichub_';
        this.memoryCache = new Map();
        this.available = this.checkAvailability();
        if (this.available) {
            this.loadAllToMemory();
        }
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
        const keys = [
            'settings',
            'connected_services',
            'play_history',
            'favorites',
            'queue',
            'spotify_auth',
            'spotify_auth_state',
            'youtube_config',
            'soundcloud_config',
            'current_page'
        ];
        keys.forEach(key => {
            try {
                const raw = localStorage.getItem(this.prefix + key);
                if (raw) {
                    this.memoryCache.set(key, JSON.parse(raw));
                }
            } catch (e) {
                this.memoryCache.set(key, null);
            }
        });
    }

    get(key, defaultValue = null) {
        if (this.memoryCache.has(key)) {
            const val = this.memoryCache.get(key);
            return val !== null && val !== undefined ? val : defaultValue;
        }
        if (this.available) {
            try {
                const raw = localStorage.getItem(this.prefix + key);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    this.memoryCache.set(key, parsed);
                    return parsed;
                }
            } catch (e) {}
        }
        return defaultValue;
    }

    set(key, value) {
        this.memoryCache.set(key, value);
        if (this.available) {
            try {
                localStorage.setItem(this.prefix + key, JSON.stringify(value));
            } catch (e) {
                console.warn('Storage set failed:', key, e);
            }
        }
    }

    remove(key) {
        this.memoryCache.delete(key);
        if (this.available) {
            localStorage.removeItem(this.prefix + key);
        }
    }

    addToHistory(track) {
        const history = this.get('play_history', []);
        history.unshift({
            id: track.id,
            title: track.title,
            artist: track.artist,
            album: track.album || '',
            cover: track.cover || null,
            duration: track.duration || 0,
            source: track.source,
            sourceColor: track.sourceColor || null,
            isLocal: track.isLocal || false,
            timestamp: Date.now()
        });
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
                id: track.id,
                title: track.title,
                artist: track.artist,
                album: track.album || '',
                cover: track.cover || null,
                duration: track.duration || 0,
                source: track.source,
                sourceColor: track.sourceColor || null,
                isLocal: track.isLocal || false,
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
