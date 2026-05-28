class PlayerManager {
    constructor() {
        this.audio = null;
        this.audioContext = null;
        this.currentTrack = null;
        this.isPlaying = false;
        this.volume = 0.7;
        this.progressInterval = null;
        this.listeners = [];
    }

    init() {
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
            console.error('Audio error:', e);
            self.notifyListeners('error', e);
        });

        this.audio.addEventListener('loadedmetadata', function() {
            self.notifyListeners('loaded');
        });
    }

    async play(track) {
        if (!track) return;

        if (this.currentTrack && this.currentTrack.id === track.id) {
            this.togglePlay();
            return;
        }

        this.currentTrack = track;

        try {
            if (track.isLocal) {
                var audioFile = await db.getAudioFile(track.id);
                if (audioFile && audioFile.blob) {
                    var url = URL.createObjectURL(audioFile.blob);
                    this.audio.src = url;
                } else {
                    this.notifyListeners('no_source');
                    return;
                }
            } else if (track.streamUrl) {
                var clientId = services.services.soundcloud.clientId;
                this.audio.src = track.streamUrl + '?client_id=' + (clientId || '');
            } else if (track.preview) {
                this.audio.src = track.preview;
            } else if (track.sourceUrl) {
                this.audio.src = track.sourceUrl;
            } else {
                this.notifyListeners('no_source');
                return;
            }

            var self = this;
            await this.audio.play();

            if (track.id) {
                var currentTrack = await db.getTrack(track.id);
                if (currentTrack) {
                    await db.updateTrack(track.id, {
                        playCount: (currentTrack.playCount || 0) + 1,
                        lastPlayed: Date.now()
                    });
                }
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
        } catch (err) {
            console.error('Playback failed:', err);
        }
    }

    togglePlay() {
        if (!this.audio) return;
        if (this.isPlaying) {
            this.audio.pause();
        } else {
            this.audio.play().catch(function() {});
        }
    }

    pause() {
        if (this.audio) this.audio.pause();
    }

    seek(time) {
        if (this.audio) this.audio.currentTime = time;
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.audio) this.audio.volume = this.volume;
        this.notifyListeners('volume_change', this.volume);
    }

    getCurrentTime() {
        return this.audio ? this.audio.currentTime : 0;
    }

    getDuration() {
        return this.audio ? this.audio.duration : 0;
    }

    getProgress() {
        if (!this.audio || !this.audio.duration) return 0;
        return this.audio.currentTime / this.audio.duration;
    }

    startProgressTracking() {
        this.stopProgressTracking();
        var self = this;
        this.progressInterval = setInterval(function() {
            self.notifyListeners('progress', {
                currentTime: self.getCurrentTime(),
                duration: self.getDuration(),
                progress: self.getProgress()
            });
        }, 200);
    }

    stopProgressTracking() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    on(event, callback) {
        this.listeners.push({ event: event, callback: callback });
    }

    notifyListeners(event, data) {
        for (var i = 0; i < this.listeners.length; i++) {
            if (this.listeners[i].event === event) {
                this.listeners[i].callback(data);
            }
        }
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        var mins = Math.floor(seconds / 60);
        var secs = Math.floor(seconds % 60);
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    }
}

window.player = new PlayerManager();
