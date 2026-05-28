(function() {
    'use strict';

    function StorageManager() {
        this.prefix = 'musichub_';
        this.cache = {};
        this.ok = false;
        try {
            var t = '__test__';
            localStorage.setItem(t, t);
            localStorage.removeItem(t);
            this.ok = true;
        } catch(e) {}
        if (this.ok) this.loadCache();
    }

    StorageManager.prototype.loadCache = function() {
        var keys = ['settings', 'connected_services', 'play_history', 'favorites', 'queue', 'spotify_auth', 'spotify_auth_state', 'youtube_config', 'soundcloud_config', 'current_page'];
        var self = this;
        for (var i = 0; i < keys.length; i++) {
            (function(k) {
                try {
                    var raw = localStorage.getItem(self.prefix + k);
                    if (raw) self.cache[k] = JSON.parse(raw);
                } catch(e) {}
            })(keys[i]);
        }
    };

    StorageManager.prototype.get = function(key, def) {
        if (this.cache.hasOwnProperty(key)) {
            var v = this.cache[key];
            return (v !== null && v !== undefined) ? v : (def !== undefined ? def : null);
        }
        if (this.ok) {
            try {
                var raw = localStorage.getItem(this.prefix + key);
                if (raw) { var p = JSON.parse(raw); this.cache[key] = p; return p; }
            } catch(e) {}
        }
        return def !== undefined ? def : null;
    };

    StorageManager.prototype.set = function(key, value) {
        this.cache[key] = value;
        if (this.ok) {
            try { localStorage.setItem(this.prefix + key, JSON.stringify(value)); } catch(e) {}
        }
    };

    StorageManager.prototype.remove = function(key) {
        delete this.cache[key];
        if (this.ok) localStorage.removeItem(this.prefix + key);
    };

    StorageManager.prototype.addToHistory = function(track) {
        var h = this.get('play_history', []);
        h.unshift({
            id: track.id, title: track.title, artist: track.artist, album: track.album || '',
            cover: track.cover || null, duration: track.duration || 0, source: track.source,
            sourceColor: track.sourceColor || null, isLocal: track.isLocal || false, timestamp: Date.now()
        });
        if (h.length > 500) h.length = 500;
        this.set('play_history', h);
    };

    StorageManager.prototype.isFavorite = function(id, source) {
        var f = this.get('favorites', []);
        for (var i = 0; i < f.length; i++) { if (f[i].id === id && f[i].source === source) return true; }
        return false;
    };

    StorageManager.prototype.addToFavorites = function(track) {
        var f = this.get('favorites', []);
        for (var i = 0; i < f.length; i++) { if (f[i].id === track.id && f[i].source === track.source) return false; }
        f.unshift({ id: track.id, title: track.title, artist: track.artist, cover: track.cover || null, duration: track.duration || 0, source: track.source, addedAt: Date.now() });
        this.set('favorites', f);
        return true;
    };

    StorageManager.prototype.removeFromFavorites = function(id, source) {
        var f = this.get('favorites', []);
        var n = [];
        for (var i = 0; i < f.length; i++) { if (!(f[i].id === id && f[i].source === source)) n.push(f[i]); }
        this.set('favorites', n);
    };

    window.storage = new StorageManager();
})();
