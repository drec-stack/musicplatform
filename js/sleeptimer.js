(function() {
    'use strict';
    
    function SleepTimer() {
        this.timerId = null;
        this.remainingSeconds = 0;
        this.isActive = false;
        this.onTickCallbacks = [];
        this.onEndCallbacks = [];
    }
    
    SleepTimer.prototype.set = function(minutes) {
        this.stop();
        
        this.remainingSeconds = minutes * 60;
        this.isActive = true;
        
        var self = this;
        this.timerId = setInterval(function() {
            if (self.remainingSeconds > 0) {
                self.remainingSeconds--;
                self.emitTick();
                
                if (self.remainingSeconds === 0) {
                    self.stop();
                    self.emitEnd();
                }
            }
        }, 1000);
        
        if (window.ui) {
            window.ui.notify('⏰ Sleep timer set for ' + minutes + ' minutes', 'info');
        }
    };
    
    SleepTimer.prototype.stop = function() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        this.isActive = false;
        this.remainingSeconds = 0;
    };
    
    SleepTimer.prototype.getRemaining = function() {
        var mins = Math.floor(this.remainingSeconds / 60);
        var secs = this.remainingSeconds % 60;
        return {
            minutes: mins,
            seconds: secs,
            formatted: mins + ':' + (secs < 10 ? '0' : '') + secs
        };
    };
    
    SleepTimer.prototype.addTime = function(minutes) {
        if (this.isActive) {
            this.remainingSeconds += minutes * 60;
        } else {
            this.set(minutes);
        }
    };
    
    SleepTimer.prototype.emitTick = function() {
        this.onTickCallbacks.forEach(function(cb) {
            cb(this.getRemaining());
        }.bind(this));
    };
    
    SleepTimer.prototype.emitEnd = function() {
        if (window.player) {
            player.pause();
        }
        this.onEndCallbacks.forEach(function(cb) { cb(); });
        if (window.ui) {
            window.ui.notify('💤 Sleep timer: Music paused', 'info');
        }
    };
    
    SleepTimer.prototype.onTick = function(callback) {
        this.onTickCallbacks.push(callback);
    };
    
    SleepTimer.prototype.onEnd = function(callback) {
        this.onEndCallbacks.push(callback);
    };
    
    window.sleepTimer = new SleepTimer();
})();
