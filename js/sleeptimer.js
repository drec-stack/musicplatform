(function() {
    'use strict';
    
    function SleepTimer() {
        this.active = false;
        this.endTime = null;
        this.timerInterval = null;
        this.init();
    }
    
    SleepTimer.prototype.init = function() {
        this.createButton();
    };
    
    SleepTimer.prototype.createButton = function() {
        var playerRight = document.querySelector('.player-right');
        if (playerRight && !document.getElementById('sleepTimerBtn')) {
            var btn = document.createElement('button');
            btn.id = 'sleepTimerBtn';
            btn.className = 'btn-icon';
            btn.title = 'Sleep timer';
            btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
            btn.addEventListener('click', function() { this.showMenu(); }.bind(this));
            playerRight.appendChild(btn);
        }
    };
    
    SleepTimer.prototype.showMenu = function() {
        var options = [
            { label: 'Off', minutes: 0 },
            { label: '5 minutes', minutes: 5 },
            { label: '10 minutes', minutes: 10 },
            { label: '15 minutes', minutes: 15 },
            { label: '30 minutes', minutes: 30 },
            { label: '60 minutes', minutes: 60 },
            { label: 'End of current track', minutes: 'track' }
        ];
        
        var items = options.map(function(opt) {
            return {
                label: opt.label,
                action: function() { this.setTimer(opt.minutes); }.bind(this)
            };
        }.bind(this));
        
        if (window.contextMenu) {
            window.contextMenu.show(window.event ? window.event.clientX : 0, 
                                   window.event ? window.event.clientY : 0, items);
        }
    };
    
    SleepTimer.prototype.setTimer = function(minutes) {
        this.cancel();
        
        if (minutes === 0) {
            if (window.ui) ui.notify('Sleep timer off', 'info');
            return;
        }
        
        if (minutes === 'track') {
            this.setEndOfTrack();
            return;
        }
        
        this.active = true;
        this.endTime = Date.now() + (minutes * 60 * 1000);
        this.startCountdown();
        
        if (window.ui) ui.notify('⏰ Sleep timer: ' + minutes + ' minutes', 'success');
    };
    
    SleepTimer.prototype.setEndOfTrack = function() {
        var self = this;
        this.active = true;
        
        var checkTrackEnd = function() {
            if (!player.playing) {
                self.cancel();
                return;
            }
            
            var remaining = player.getDuration() - player.getTime();
            if (remaining <= 0.5) {
                self.stopPlayback();
            } else {
                setTimeout(checkTrackEnd, 500);
            }
        };
        
        checkTrackEnd();
        if (window.ui) ui.notify('⏰ Sleep timer: end of track', 'success');
    };
    
    SleepTimer.prototype.startCountdown = function() {
        var self = this;
        this.timerInterval = setInterval(function() {
            if (!self.active) {
                clearInterval(self.timerInterval);
                return;
            }
            
            var remaining = self.endTime - Date.now();
            if (remaining <= 0) {
                self.stopPlayback();
            } else {
                self.showNotification(remaining);
            }
        }, 60000); // Каждую минуту
    };
    
    SleepTimer.prototype.showNotification = function(remaining) {
        var minutes = Math.ceil(remaining / 60000);
        if (minutes === 1) {
            if (window.ui) ui.notify('⏰ Sleep timer: 1 minute remaining', 'info');
        } else if (minutes <= 5 && minutes % 5 === 0) {
            if (window.ui) ui.notify('⏰ Sleep timer: ' + minutes + ' minutes remaining', 'info');
        }
    };
    
    SleepTimer.prototype.stopPlayback = function() {
        if (player.playing) {
            player.audio.pause();
            if (window.ui) ui.notify('💤 Sleep timer: playback stopped', 'info');
        }
        this.cancel();
    };
    
    SleepTimer.prototype.cancel = function() {
        this.active = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.endTime = null;
    };
    
    window.sleepTimer = new SleepTimer();
})();
