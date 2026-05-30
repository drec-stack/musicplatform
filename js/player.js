(function() {
    'use strict';
    
    function Player() {
        this.audio = null;
        this.currentTrack = null;
        this.playing = false;
        this.volume = 0.7;
        this.listeners = {
            play: [],
            pause: [],
            track_change: [],
            progress: [],
            ended: []
        };
        this.init();
    }
    
    Player.prototype.init = function() {
        this.audio = new Audio();
        this.audio.volume = this.volume;
        
        var self = this;
        this.audio.addEventListener('timeupdate', function() {
            if (self.currentTrack && self.audio.duration) {
                self.emit('progress', {
                    currentTime: self.audio.currentTime,
                    duration: self.audio.duration,
                    progress: self.audio.currentTime / self.audio.duration
                });
            }
        });
        
        this.audio.addEventListener('ended', function() {
            self.playing = false;
            self.emit('ended');
        });
    };
    
    Player.prototype.play = function(track) {
        if (!track) return;
        
        this.currentTrack = track;
        this.emit('track_change', track);
        
        if (track.file) {
            this.audio.src = track.file;
            this.audio.play().catch(function(e) {
                console.warn('Play error:', e);
                self.emit('ended');
            });
            this.playing = true;
            this.emit('play');
        } else {
            // Для демо-треков используем симуляцию
            this.playing = true;
            this.emit('play');
            this.simulatePlayback();
        }
    };
    
    Player.prototype.simulatePlayback = function() {
        var self = this;
        var duration = this.currentTrack?.duration || 180;
        var startTime = 0;
        
        if (this.progressInterval) clearInterval(this.progressInterval);
        
        this.progressInterval = setInterval(function() {
            if (self.playing && startTime < duration) {
                startTime++;
                self.emit('progress', {
                    currentTime: startTime,
                    duration: duration,
                    progress: startTime / duration
                });
            } else if (startTime >= duration) {
                self.playing = false;
                self.emit('ended');
                clearInterval(self.progressInterval);
            }
        }, 1000);
    };
    
    Player.prototype.toggle = function() {
        if (!this.currentTrack) return;
        
        if (this.playing) {
            if (this.audio.src && !this.audio.paused) {
                this.audio.pause();
            }
            if (this.progressInterval) clearInterval(this.progressInterval);
            this.playing = false;
            this.emit('pause');
        } else {
            if (this.audio.src && this.audio.paused) {
                this.audio.play();
            } else if (!this.audio.src) {
                this.simulatePlayback();
            }
            this.playing = true;
            this.emit('play');
        }
    };
    
    Player.prototype.seek = function(time) {
        if (this.audio && this.audio.src) {
            this.audio.currentTime = time;
        }
    };
    
    Player.prototype.setVolume = function(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.audio) this.audio.volume = this.volume;
    };
    
    Player.prototype.getDuration = function() {
        return this.audio ? this.audio.duration : (this.currentTrack?.duration || 0);
    };
    
    Player.prototype.fmt = function(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        var mins = Math.floor(seconds / 60);
        var secs = Math.floor(seconds % 60);
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    };
    
    Player.prototype.on = function(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    };
    
    Player.prototype.emit = function(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(function(callback) {
                callback(data);
            });
        }
    };
    
    window.player = new Player();
})();
