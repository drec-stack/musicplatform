(function() {
    'use strict';

    function StorageManager() {
        this.prefix = 'musichub_';
        this.memoryCache = {};
        this.available = this.checkAvailability();
        if (this.available) {
            this.loadAllToMemory();
        }
    }

    StorageManager.prototype.checkAvailability = function() {
        try {
            var test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    };

    StorageManager.prototype.loadAllToMemory = function() {
        var keys = [
            'settings', 'connected_services', 'play_history', 'favorites',
            'queue', 'spotify_auth', 'spotify_auth_state', 'youtube_config',
            'soundcloud_config', 'current_page'
        ];
        var self = this;
        for (var i = 0; i < keys.length; i++) {
            (function(key) {
                try {
                    var raw = localStorage.getItem(self.prefix + key);
                    if (raw) {
                        self.memoryCache[key] = JSON.parse(raw);
                    }
                } catch (e) {
                    self.memoryCache[key] = null;
                }
            })(keys[i]);
        }
    };

    StorageManager.prototype.get = function(key, defaultValue) {
        if (this.memoryCache.hasOwnProperty(key)) {
            var val = this.memoryCache[key];
            return (val !== null && val !== undefined) ? val : (defaultValue !== undefined ? defaultValue : null);
        }
        if (this.available) {
            try {
                var raw = localStorage.getItem(this.prefix + key);
                if (raw) {
                    var parsed = JSON.parse(raw);
                    this.memoryCache[key] = parsed;
                    return parsed;
                }
            } catch (e) {}
        }
        return defaultValue !== undefined ? defaultValue : null;
    };

    StorageManager.prototype.set = function(key, value) {
        this.memoryCache[key] = value;
        if (this.available) {
            try {
                localStorage.setItem(this.prefix + key, JSON.stringify(value));
            } catch (e) {
                // localStorage переполнен
            }
        }
    };

    StorageManager.prototype.remove = function(key) {
        delete this.memoryCache[key];
        if (this.available) {
            localStorage.removeItem(this.prefix + key);
        }
    };

    StorageManager.prototype.addToHistory = function(track) {
        var history = this.get('play_history', []);
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
    };

    StorageManager.prototype.addToFavorites = function(track) {
        var favorites = this.get('favorites', []);
        for (var i = 0; i < favorites.length; i++) {
            if (favorites[i].id === track.id && favorites[i].source === track.source) {
                return false;
            }
        }
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
    };

    StorageManager.prototype.removeFromFavorites = function(trackId, source) {
        var favorites = this.get('favorites', []);
        var newFavorites = [];
        for (var i = 0; i < favorites.length; i++) {
            if (!(favorites[i].id === trackId && favorites[i].source === source)) {
                newFavorites.push(favorites[i]);
            }
        }
        this.set('favorites', newFavorites);
    };

    StorageManager.prototype.isFavorite = function(trackId, source) {
        var favorites = this.get('favorites', []);
        for (var i = 0; i < favorites.length; i++) {
            if (favorites[i].id === trackId && favorites[i].source === source) {
                return true;
            }
        }
        return false;
    };

    window.storage = new StorageManager();
})();
