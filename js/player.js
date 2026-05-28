class PlayerManager {
    constructor() {
        this.audio = new Audio();
        this.audioContext = null;
        this.analyser = null;
        this.currentTrack = null;
        this.isPlaying = false;
        this.volume = 0.7;
        this.progressInterval = null;
        this.listeners = [];
        this.equalizer = null;
        this.eqSettings = {
            bass: 0,
            mid: 0,
            treble: 0
        };
    }

    init() {
        this.audio.volume = this.volume;
        this.setupAudioContext();

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

    setupAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            
            const source = this.audioContext.createMediaElementSource(this.audio);
            
            this.equalizer = {
                bass: this.audioContext.createBiquadFilter(),
                mid: this.audioContext.createBiquadFilter(),
                treble: this.audioContext.createBiquadFilter()
            };

            this.equalizer.bass.type = 'lowshelf';
            this.equalizer.bass.frequency.value = 200;
            this.equalizer.bass.gain.value = this.eqSettings.bass;

            this.equalizer.mid.type = 'peaking';
            this.equalizer.mid.frequency.value = 1000;
            this.equalizer.mid.Q.value = 0.5;
            this.equalizer.mid.gain.value = this.eqSettings.mid;

            this.equalizer.treble.type = 'highshelf';
            this.equalizer.treble.frequency.value = 4000;
            this.equalizer.treble.gain.value = this.eqSettings.treble;

            source
                .connect(this.equalizer.bass)
                .connect(this.equalizer.mid)
                .connect(this.equalizer.treble)
                .connect(this.analyser)
                .connect(this.audioContext.destination);
        } catch (e) {
            console.warn('AudioContext setup failed, using basic playback');
            this.audioContext = null;
        }
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
                const audioFile = await db.getAudioFile(track.id);
                if (audioFile && audioFile.blob) {
                    const url = URL.createObjectURL(audioFile.blob);
                    this.audio.src = url;
                } else {
                    this.notifyListeners('no_source');
                    return;
                }
            } else if (track.sourceUrl) {
                this.audio.src = track.sourceUrl;
            } else if (track.preview) {
                this.audio.src = track.preview;
            } else {
                this.notifyListeners('no_source');
                return;
            }

            await this.audio.play();
            
            if (track.id) {
                const currentTrack = await db.getTrack(track.id);
                if (currentTrack) {
                    await db.updateTrack(track.id, {
                        playCount: (currentTrack.playCount || 0) + 1,
                        lastPlayed: Date.now()
                    });
                }
            }
            
            storage.addToHistory({
                ...track,
                timestamp: Date.now()
            });

            this.notifyListeners('track_change', track);
        } catch (err) {
            console.error('Playback failed:', err);
            this.notifyListeners('error', err);
        }
    }

    togglePlay() {
        if (!this.audio) return;
        if (this.isPlaying) {
            this.audio.pause();
        } else {
            this.audio.play().catch(err => {
                console.error('Resume failed:', err);
            });
        }
    }

    pause() {
        if (this.audio) this.audio.pause();
    }

    resume() {
        if (this.audio && this.currentTrack) {
            this.audio.play().catch(() => {});
        }
    }

    seek(time) {
        if (this.audio) this.audio.currentTime = time;
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        if (this.audio) this.audio.volume = this.volume;
        this.notifyListeners('volume_change', this.volume);
    }

    setEQ(bass, mid, treble) {
        this.eqSettings = { bass, mid, treble };
        if (this.equalizer) {
            this.equalizer.bass.gain.value = bass;
            this.equalizer.mid.gain.value = mid;
            this.equalizer.treble.gain.value = treble;
        }
    }

    getAudioData() {
        if (!this.analyser) return null;
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        return dataArray;
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
