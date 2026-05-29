(function() {
    'use strict';
    
    function HotkeysManager() {
        this.init();
    }
    
    HotkeysManager.prototype.init = function() {
        var self = this;
        document.addEventListener('keydown', function(e) {
            // Не реагируем если фокус в поле ввода
            if (document.activeElement && (document.activeElement.tagName === 'INPUT' || 
                document.activeElement.tagName === 'TEXTAREA' || 
                document.activeElement.isContentEditable)) {
                return;
            }
            
            // Пробел — пауза/плей
            if (e.code === 'Space') {
                e.preventDefault();
                player.toggle();
                if (window.ui) ui.notify(player.playing ? '▶ Playing' : '⏸ Paused', 'info');
                return;
            }
            
            // Стрелки — перемотка
            if (e.code === 'ArrowLeft') {
                e.preventDefault();
                var skip = e.shiftKey ? -10 : -5;
                var newTime = Math.max(0, player.getTime() + skip);
                player.seek(newTime);
                if (window.ui) ui.notify((skip > 0 ? '+' : '') + skip + ' sec', 'info');
                return;
            }
            if (e.code === 'ArrowRight') {
                e.preventDefault();
                var skip = e.shiftKey ? 10 : 5;
                var newTime = Math.min(player.getDuration(), player.getTime() + skip);
                player.seek(newTime);
                if (window.ui) ui.notify('+' + skip + ' sec', 'info');
                return;
            }
            
            // Ctrl/Cmd + стрелки — предыдущий/следующий
            if ((e.ctrlKey || e.metaKey) && e.code === 'ArrowLeft') {
                e.preventDefault();
                var prev = queueManager.prev();
                if (prev) player.play(prev);
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.code === 'ArrowRight') {
                e.preventDefault();
                var next = queueManager.next();
                if (next) player.play(next);
                return;
            }
            
            // Ctrl/Cmd + ↑ / ↓ — громкость
            if ((e.ctrlKey || e.metaKey) && e.code === 'ArrowUp') {
                e.preventDefault();
                var newVol = Math.min(1, player.volume + 0.05);
                player.setVolume(newVol);
                var volPercent = Math.round(newVol * 100);
                if (window.ui) ui.notify('🔊 Volume ' + volPercent + '%', 'info');
                var slider = document.getElementById('volumeSlider');
                if (slider) slider.value = newVol * 100;
                return;
            }
            if ((e.ctrlKey || e.metaKey) && e.code === 'ArrowDown') {
                e.preventDefault();
                var newVol = Math.max(0, player.volume - 0.05);
                player.setVolume(newVol);
                var volPercent = Math.round(newVol * 100);
                if (window.ui) ui.notify('🔈 Volume ' + volPercent + '%', 'info');
                var slider = document.getElementById('volumeSlider');
                if (slider) slider.value = newVol * 100;
                return;
            }
            
            // M — выключить звук
            if (e.code === 'KeyM') {
                e.preventDefault();
                if (player.volume > 0) {
                    player._lastVolume = player.volume;
                    player.setVolume(0);
                    if (window.ui) ui.notify('🔇 Muted', 'info');
                } else {
                    player.setVolume(player._lastVolume || 0.7);
                    if (window.ui) ui.notify('🔊 Unmuted', 'info');
                }
                var slider = document.getElementById('volumeSlider');
                if (slider) slider.value = player.volume * 100;
                return;
            }
            
            // L — лайк текущего трека
            if (e.code === 'KeyL') {
                e.preventDefault();
                var track = player.track;
                if (track && window.favorites) {
                    window.favorites.toggle(track);
                    var isFav = window.favorites.isFavorite(track.id);
                    if (window.ui) ui.notify(isFav ? '❤️ Added to favorites' : '♡ Removed from favorites', 'success');
                }
                return;
            }
            
            // R — повторить (repeat)
            if (e.code === 'KeyR') {
                e.preventDefault();
                queueManager.toggleRepeat();
                var mode = queueManager.repeat;
                var modeText = mode === 'none' ? 'Repeat off' : (mode === 'all' ? 'Repeat all' : 'Repeat one');
                if (window.ui) ui.notify('🔄 ' + modeText, 'info');
                return;
            }
            
            // S — перемешать (shuffle)
            if (e.code === 'KeyS') {
                e.preventDefault();
                queueManager.toggleShuffle();
                var isShuffle = queueManager.shuffle;
                if (window.ui) ui.notify(isShuffle ? '🎲 Shuffle on' : '🎲 Shuffle off', 'info');
                return;
            }
            
            // F — полноэкранный режим
            if (e.code === 'KeyF') {
                e.preventDefault();
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                    if (window.ui) ui.notify('⛶ Fullscreen', 'info');
                } else {
                    document.exitFullscreen();
                    if (window.ui) ui.notify('↘️ Exit fullscreen', 'info');
                }
                return;
            }
            
            // Ctrl/Cmd + K — поиск
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyK') {
                e.preventDefault();
                var searchInput = document.getElementById('globalSearch');
                if (searchInput) searchInput.focus();
                return;
            }
            
            // Ctrl/Cmd + H — домой
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyH') {
                e.preventDefault();
                if (window.ui) window.ui.go('home');
                return;
            }
            
            // Esc — закрыть модалку
            if (e.code === 'Escape') {
                var modal = document.getElementById('modal-overlay');
                if (modal && !modal.classList.contains('hidden')) {
                    modal.classList.add('hidden');
                }
                return;
            }
            
            // 0-9 — перемотка на процент (0 = 0%, 1=10%... 9=90%)
            if (e.code >= 'Digit0' && e.code <= 'Digit9') {
                var num = parseInt(e.code.replace('Digit', ''));
                var percent = num === 0 ? 0 : num * 10;
                var duration = player.getDuration();
                if (duration) {
                    player.seek(duration * percent / 100);
                    if (window.ui) ui.notify('⏩ ' + percent + '%', 'info');
                }
                return;
            }
        });
    };
    
    window.hotkeys = new HotkeysManager();
})();
