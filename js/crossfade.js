(function() {
    'use strict';
    
    function CrossfadeManager() {
        this.enabled = false;
        this.duration = 2000;
        this.fadeOutDuration = 1500;
        this.fadeInDuration = 1500;
        this.isFading = false;
    }
    
    CrossfadeManager.prototype.enable = function() {
        this.enabled = true;
        if (window.ui) ui.notify('Crossfade enabled', 'success');
    };
    
    CrossfadeManager.prototype.disable = function() {
        this.enabled = false;
        if (window.ui) ui.notify('Crossfade disabled', 'info');
    };
    
    CrossfadeManager.prototype.setDuration = function(ms) {
        this.duration = Math.max(500, Math.min(10000, ms));
        this.fadeOutDuration = this.duration * 0.7;
        this.fadeInDuration = this.duration * 0.3;
    };
    
    CrossfadeManager.prototype.apply = function(oldTrack, newTrack) {
        var self = this;
        
        if (!this.enabled || !window.player) {
            if (window.player) player.play(newTrack);
            return;
        }
        
        this.isFading = true;
        
        var startVolume = player.volume;
        var fadeOutStart = Date.now();
        
        function fadeOut() {
            var elapsed = Date.now() - fadeOutStart;
            var progress = Math.min(1, elapsed / self.fadeOutDuration);
            var volume = startVolume * (1 - progress);
            player.setVolume(Math.max(0, volume));
            
            if (progress < 1) {
                requestAnimationFrame(fadeOut);
            } else {
                player.setVolume(0);
                player.play(newTrack);
                
                var fadeInStart = Date.now();
                
                function fadeIn() {
                    var elapsed = Date.now() - fadeInStart;
                    var progress = Math.min(1, elapsed / self.fadeInDuration);
                    var volume = startVolume * progress;
                    player.setVolume(volume);
                    
                    if (progress < 1) {
                        requestAnimationFrame(fadeIn);
                    } else {
                        player.setVolume(startVolume);
                        self.isFading = false;
                    }
                }
                
                requestAnimationFrame(fadeIn);
            }
        }
        
        requestAnimationFrame(fadeOut);
    };
    
    CrossfadeManager.prototype.isEnabled = function() {
        return this.enabled;
    };
    
    window.crossfade = new CrossfadeManager();
})();
