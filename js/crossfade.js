(function() {
    'use strict';
    
    function CrossfadeManager() {
        this.enabled = true;
        this.duration = 2000; // 2 секунды
        this.nextAudio = null;
        this.isCrossfading = false;
        this.loadSettings();
        this.patchPlayer();
    }
    
    CrossfadeManager.prototype.loadSettings = function() {
        var saved = storage.get('crossfade_enabled');
        if (saved !== undefined) this.enabled = saved;
        var savedDuration = storage.get('crossfade_duration');
        if (savedDuration) this.duration = savedDuration;
    };
    
    CrossfadeManager.prototype.saveSettings = function() {
        storage.set('crossfade_enabled', this.enabled);
        storage.set('crossfade_duration', this.duration);
    };
    
    CrossfadeManager.prototype.patchPlayer = function() {
        var self = this;
        var originalPlay = player.play;
        
        player.play = function(track) {
            if (!self.enabled || !player.playing || !player.audio) {
                return originalPlay.call(this, track);
            }
            
            // Кроссфейд активен
            self.startCrossfade(track, function() {
                originalPlay.call(player, track);
            });
        };
    };
    
    CrossfadeManager.prototype.startCrossfade = function(newTrack, callback) {
        if (this.isCrossfading) return;
        
        this.isCrossfading = true;
        var oldAudio = player.audio;
        var oldVolume = player.volume;
        
        // Создаём новый аудиоэлемент для следующего трека
        this.nextAudio = new Audio();
        this.nextAudio.volume = 0;
        
        // Загружаем следующий трек
        var self = this;
        var loadNext = function() {
            if (newTrack.isLocal) {
                db.getAudioFile(newTrack.id).then(function(f) {
                    if (f && f.blob) {
                        self.nextAudio.src = URL.createObjectURL(f.blob);
                        self.nextAudio.load();
                        self.nextAudio.addEventListener('canplay', startFade);
                    }
                });
            } else if (newTrack.preview) {
                self.nextAudio.src = newTrack.preview;
                self.nextAudio.load();
                self.nextAudio.addEventListener('canplay', startFade);
            } else if (newTrack.streamUrl) {
                self.nextAudio.src = newTrack.streamUrl;
                self.nextAudio.load();
                self.nextAudio.addEventListener('canplay', startFade);
            } else {
                callback();
                self.isCrossfading = false;
            }
        };
        
        var startFade = function() {
            var startTime = Date.now();
            var fadeStep = 20; // шаг в мс
            var steps = self.duration / fadeStep;
            var volumeStepOld = oldVolume / steps;
            var volumeStepNew = 1 / steps;
            
            var interval = setInterval(function() {
                var elapsed = Date.now() - startTime;
                var progress = Math.min(1, elapsed / self.duration);
                
                if (oldAudio) oldAudio.volume = Math.max(0, oldVolume - (progress * oldVolume));
                if (self.nextAudio) self.nextAudio.volume = progress;
                
                if (progress >= 1) {
                    clearInterval(interval);
                    oldAudio.pause();
                    oldAudio.volume = oldVolume;
                    
                    // Переключаемся на новый аудио
                    player.audio = self.nextAudio;
                    player.audio.volume = oldVolume;
                    player.audio.play();
                    
                    self.nextAudio = null;
                    self.isCrossfading = false;
                    callback();
                }
            }, fadeStep);
        };
        
        loadNext();
    };
    
    CrossfadeManager.prototype.toggle = function() {
        this.enabled = !this.enabled;
        this.saveSettings();
        if (window.ui) ui.notify(this.enabled ? '🎵 Crossfade on' : '🎵 Crossfade off', 'info');
    };
    
    CrossfadeManager.prototype.setDuration = function(ms) {
        this.duration = Math.min(5000, Math.max(500, ms));
        this.saveSettings();
        if (window.ui) ui.notify('Crossfade duration: ' + (this.duration / 1000) + 's', 'info');
    };
    
    window.crossfade = new CrossfadeManager();
})();
