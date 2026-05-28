class PlayerManager {
    constructor() {
        this.audio = null;
        this.currentTrack = null;
        this.isPlaying = false;
        this.volume = 0.7;
        this.progressInterval = null;
        this.listeners = [];
    }

    init() {
        this.audio = new Audio();
        this.audio.volume = this.volume;

        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.startProgressTracking();
            this.notifyListeners('play');
        });

        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.stopProgressTracking();
            this.notifyListeners('pause');
        });

        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.stopProgressTracking();
            this.notifyListeners('ended');
        });

        this.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.notifyListeners('error', e);
        });

        this.audio.addEventListener('loadedmetadata', () => {
            this.notifyListeners('loaded');
        });
    }

    play(track) {
        if (!track) return;

        if (this.currentTrack && this.currentTrack.id === track.id && 
            this.currentTrack.source === track.source) {
            this.togglePlay();
            return;
        }

        this.currentTrack = track;

        if (track.preview) {
            this.audio.src = track.preview;
            this.audio.play().catch(err => {
                console.error('Playback failed:', err);
            });
        } else if (track.streamUrl) {
            const url = track.streamUrl;
            const clientId = services.services.soundcloud.clientId;
            this.audio.src = `${url}?client_id=${clientId}`;
            this.audio.play().catch(err => {
                console.error('Playback failed:', err);
            });
        } else {
            this.notifyListeners('no_source');
            return;
        }

        storage.addToHistory(track);
        this.notifyListeners('track_change', track);
    }

    togglePlay() {
        if (!this.audio) return;
        if (this.isPlaying) {
            this.audio.pause();
        } else {
            this.audio.play().catch(err => {
                console.error('Playback failed:', err);
            });
        }
    }

    pause() {
        if (this.audio) {
            this.audio.pause();
        }
    }

    resume() {
        if (this.audio && this.currentTrack) {
            this.audio.play().catch(err => {
                console.error('Resume failed:', err);
            });
        }
    }

    seek(time) {
        if (this.audio) {
            this.audio.currentTime = time;
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.audio) {
            this.audio.volume = this.volume;
        }
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
        this.progressInterval = setInterval(() => {
            this.notifyListeners('progress', {
                currentTime: this.getCurrentTime(),
                duration: this.getDuration(),
                progress: this.getProgress()
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
        this.listeners.push({ event, callback });
    }

    off(event, callback) {
        this.listeners = this.listeners.filter(
            l => !(l.event === event && l.callback === callback)
        );
    }

    notifyListeners(event, data) {
        this.listeners
            .filter(l => l.event === event)
            .forEach(l => l.callback(data));
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

window.player = new PlayerManager();
