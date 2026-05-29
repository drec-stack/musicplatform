(function() {
    'use strict';
    
    function FavoritesManager() {
        this.favorites = [];
        this.listeners = { change: [] };
        this.load();
    }
    
    FavoritesManager.prototype.load = function() {
        var self = this;
        var saved = storage.get('favorites', []);
        this.favorites = saved;
        
        // Обновляем из базы данных
        db.getAllTracks().then(function(tracks) {
            tracks.forEach(function(track) {
                if (track.favorite && !self.favorites.includes(track.id)) {
                    self.favorites.push(track.id);
                }
            });
            self.save();
        });
    };
    
    FavoritesManager.prototype.save = function() {
        storage.set('favorites', this.favorites);
        this.emit('change', this.favorites);
    };
    
    FavoritesManager.prototype.toggle = function(track) {
        if (!track) return;
        
        var index = this.favorites.indexOf(track.id);
        if (index === -1) {
            this.favorites.push(track.id);
            track.favorite = true;
        } else {
            this.favorites.splice(index, 1);
            track.favorite = false;
        }
        
        db.saveTrack(track);
        this.save();
    };
    
    FavoritesManager.prototype.isFavorite = function(trackId) {
        return this.favorites.includes(trackId);
    };
    
    FavoritesManager.prototype.getAll = function() {
        return this.favorites;
    };
    
    FavoritesManager.prototype.getTracks = function() {
        var self = this;
        return db.getAllTracks().then(function(tracks) {
            return tracks.filter(function(track) {
                return self.favorites.includes(track.id);
            });
        });
    };
    
    FavoritesManager.prototype.remove = function(trackId) {
        var index = this.favorites.indexOf(trackId);
        if (index !== -1) {
            this.favorites.splice(index, 1);
            this.save();
        }
    };
    
    FavoritesManager.prototype.on = function(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    };
    
    FavoritesManager.prototype.emit = function(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(function(callback) {
                callback(data);
            });
        }
    };
    
    window.favorites = new FavoritesManager();
})();
