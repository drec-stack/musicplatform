(function() {
    'use strict';

    function PlayerManager() {
        this.audio = null;
        this.currentTrack = null;
        this.isPlaying = false;
        this.volume = 0.7;
        this.progressInterval = null;
        this.listeners = [];
    }

    PlayerManager.prototype.init = function() {
        this.audio = new Audio();
        this.audio.volume = this.volume;
        var self = this;

        this.audio.addEventListener('play', function() {
            self.isPlaying = true;
            self.startProgressTracking();
            self.notifyListeners('play');
        });

        this.audio.addEventListener('pause', function() {
            self.isPlaying = false;
            self.stopProgressTracking();
            self.notifyListeners('pause');
        });

        this.audio.addEventListener('ended', function() {
            self.isPlaying = false;
            self.stopProgressTracking();
            self.notifyListeners('ended');
        });

        this.audio.addEventListener('error', function(e) {
            self.notifyListeners('error', e);
        });

        this.audio.addEventListener('loadedmetadata', function() {
            self.notifyListeners('loaded');
        });
    };

    PlayerManager.prototype.play = function(track) {
        if (!track) return;

        if (this.currentTrack && this.currentTrack.id === track.id) {
            this.togglePlay();
            return;
        }

        this.currentTrack = track;
        var self = this;

        if (track.isLocal) {
            db.getAudioFile(track.id).then(function(audioFile) {
                if (audioFile && audioFile.blob) {
                    var url = URL.createObjectURL(audioFile.blob);
                    self.audio.src = url;
                    self.audio.play().catch(function() {});
                    self.afterPlay(track);
                } else {
                    self.notifyListeners('no_source');
                }
            }).catch(function() {
                self.notifyListeners('no_source');
            });
        } else if (track.streamUrl) {
            var clientId = services.services.soundcloud.clientId;
            this.audio.src = track.streamUrl + '?client_id=' + (clientId || '');
            this.audio.play().catch(function() {});
            this.afterPlay(track);
        } else if (track.preview) {
            this.audio.src = track.preview;
            this.audio.play().catch(function() {});
            this.afterPlay(track);
        } else if (track.sourceUrl) {
            this.audio.src = track.sourceUrl;
            this.audio.play().catch(function() {});
            this.afterPlay(track);
        } else {
            this.notifyListeners('no_source');
        }
    };

    PlayerManager.prototype.afterPlay = function(track) {
        var self = this;
        if (track.id) {
            db.getTrack(track.id).then(function(existing) {
                if (existing) {
                    db.updateTrack(track.id, {
                        playCount: (existing.playCount || 0) + 1,
                        lastPlayed: Date.now()
                    });
                }
            }).catch(function() {});
        }

        storage.addToHistory({
            id: track.id,
            title: track.title,
            artist: track.artist,
            album: track.album,
            cover: track.cover,
            duration: track.duration,
            source: track.source,
            isLocal: track.isLocal
        });

        this.notifyListeners('track_change', track);
    };

    PlayerManager.prototype.togglePlay = function() {
        if (!this.audio) return;
        if (this.isPlaying) {
            this.audio.pause();
        } else {
            this.audio.play().catch(function() {});
        }
    };

    PlayerManager.prototype.pause = function() {
        if (this.audio) this.audio.pause();
    };

    PlayerManager.prototype.seek = function(time) {
        if (this.audio) this.audio.currentTime = time;
    };

    PlayerManager.prototype.setVolume = function(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.audio) this.audio.volume = this.volume;
        this.notifyListeners('volume_change', this.volume);
    };

    PlayerManager.prototype.getCurrentTime = function() {
        return this.audio ? this.audio.currentTime : 0;
    };

    PlayerManager.prototype.getDuration = function() {
        return this.audio ? this.audio.duration : 0;
    };

    PlayerManager.prototype.getProgress = function() {
        if (!this.audio || !this.audio.duration) return 0;
        return this.audio.currentTime / this.audio.duration;
    };

    PlayerManager.prototype.startProgressTracking = function() {
        this.stopProgressTracking();
        var self = this;
        this.progressInterval = setInterval(function() {
            self.notifyListeners('progress', {
                currentTime: self.getCurrentTime(),
                duration: self.getDuration(),
                progress: self.getProgress()
            });
        }, 200);
    };

    PlayerManager.prototype.stopProgressTracking = function() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    };

    PlayerManager.prototype.on = function(event, callback) {
        this.listeners.push({ event: event, callback: callback });
    };

    PlayerManager.prototype.notifyListeners = function(event, data) {
        for (var i = 0; i < this.listeners.length; i++) {
            if (this.listeners[i].event === event) {
                this.listeners[i].callback(data);
            }
        }
    };

    PlayerManager.prototype.formatTime = function(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        var mins = Math.floor(seconds / 60);
        var secs = Math.floor(seconds % 60);
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    };

    window.player = new PlayerManager();
})();
