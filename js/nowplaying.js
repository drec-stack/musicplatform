(function() {
    'use strict';
    
    function NowPlaying() {
        this.currentTrack = null;
        this.listeners = { change: [] };
        
        if (window.player) {
            player.on('track_change', function(track) {
                this.setTrack(track);
            }.bind(this));
        }
    }
    
    NowPlaying.prototype.setTrack = function(track) {
        this.currentTrack = track;
        this.updateNowPlaying();
        this.emit('change', track);
    };
    
    NowPlaying.prototype.getTrack = function() {
        return this.currentTrack;
    };
    
    NowPlaying.prototype.updateNowPlaying = function() {
        if (!this.currentTrack) return;
        
        // Обновляем метаданные страницы
        document.title = this.currentTrack.title + ' - ' + this.currentTrack.artist + ' | MusicHub';
        
        // Обновляем favicon анимированным (опционально)
        // this.animateFavicon();
    };
    
    NowPlaying.prototype.getNextTracks = function(count) {
        if (!window.queueManager) return [];
        
        var queue = queueManager.getAll();
        var currentIndex = queue.findIndex(function(t) {
            return t.id === this.currentTrack?.id;
        }.bind(this));
        
        if (currentIndex === -1) return [];
        
        return queue.slice(currentIndex + 1, currentIndex + 1 + (count || 5));
    };
    
    NowPlaying.prototype.getPreviousTracks = function(count) {
        if (!window.queueManager) return [];
        
        var queue = queueManager.getAll();
        var currentIndex = queue.findIndex(function(t) {
            return t.id === this.currentTrack?.id;
        }.bind(this));
        
        if (currentIndex <= 0) return [];
        
        return queue.slice(Math.max(0, currentIndex - (count || 5)), currentIndex);
    };
    
    NowPlaying.prototype.on = function(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    };
    
    NowPlaying.prototype.emit = function(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(function(callback) {
                callback(data);
            });
        }
    };
    
    window.nowPlaying = new NowPlaying();
})();
