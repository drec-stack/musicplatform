(function() {
    'use strict';
    
    function FavoritesManager() {
        this.favorites = [];
        this.load();
    }
    
    FavoritesManager.prototype.load = function() {
        try {
            var saved = localStorage.getItem('musichub_favorites');
            if (saved) this.favorites = JSON.parse(saved);
        } catch(e) {}
    };
    
    FavoritesManager.prototype.save = function() {
        try {
            localStorage.setItem('musichub_favorites', JSON.stringify(this.favorites));
        } catch(e) {}
    };
    
    FavoritesManager.prototype.isFavorite = function(trackId) {
        return this.favorites.some(function(f) { return f.id === trackId; });
    };
    
    FavoritesManager.prototype.add = function(track) {
        if (this.isFavorite(track.id)) return false;
        this.favorites.unshift({
            id: track.id,
            title: track.title,
            artist: track.artist,
            cover: track.cover,
            duration: track.duration,
            source: track.source,
            addedAt: Date.now()
        });
        this.save();
        this.emit('change', { action: 'add', track: track });
        return true;
    };
    
    FavoritesManager.prototype.remove = function(trackId) {
        var len = this.favorites.length;
        this.favorites = this.favorites.filter(function(f) { return f.id !== trackId; });
        if (len !== this.favorites.length) {
            this.save();
            this.emit('change', { action: 'remove', trackId: trackId });
            return true;
        }
        return false;
    };
    
    FavoritesManager.prototype.toggle = function(track) {
        if (this.isFavorite(track.id)) {
            return this.remove(track.id);
        } else {
            return this.add(track);
        }
    };
    
    FavoritesManager.prototype.getAll = function() {
        return this.favorites;
    };
    
    FavoritesManager.prototype.getTracks = function() {
        var self = this;
        var promises = this.favorites.map(function(f) {
            return db.getTrack(f.id).then(function(track) {
                return track || f;
            });
        });
        return Promise.all(promises);
    };
    
    // Event emitter
    FavoritesManager.prototype.events = [];
    FavoritesManager.prototype.on = function(e, cb) { this.events.push({e:e, cb:cb}); };
    FavoritesManager.prototype.emit = function(e, d) {
        for(var i=0;i<this.events.length;i++) {
            if(this.events[i].e === e) this.events[i].cb(d);
        }
    };
    
    window.favorites = new FavoritesManager();
})();
