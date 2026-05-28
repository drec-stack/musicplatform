(function() {
    'use strict';

    var app = {
        initialized: false,
        init: function() {
            if (this.initialized) return;
            var self = this;
            
            db.open().then(function() {
                player.init();
                ui.init();
                
                player.on('play', function() { ui.updatePlayerUI(); });
                player.on('pause', function() { ui.updatePlayerUI(); });
                player.on('track_change', function() { ui.updatePlayerUI(); });
                player.on('progress', function(data) { ui.updateProgress(data); });
                player.on('ended', function() {
                    var next = queueManager.getNext();
                    if (next) player.play(next);
                    else ui.updatePlayerUI();
                });
                player.on('no_source', function() {
                    ui.showNotification('No audio source available', 'error');
                });

                queueManager.on('shuffle_change', function(mode) {
                    var btn = document.getElementById('shuffleBtn');
                    if (btn) {
                        if (mode) btn.classList.add('active');
                        else btn.classList.remove('active');
                    }
                });

                queueManager.on('repeat_change', function(mode) {
                    var btn = document.getElementById('repeatBtn');
                    if (btn) {
                        btn.classList.remove('active');
                        if (mode !== 'none') btn.classList.add('active');
                    }
                });

                self.initialized = true;
            }).catch(function(error) {
                document.getElementById('loader').innerHTML = 
                    '<div style="text-align:center;padding:40px;color:#ef4444;">' +
                    '<h2>Ошибка загрузки</h2>' +
                    '<p>' + error.message + '</p>' +
                    '<p>Попробуйте обновить страницу или используйте другой браузер</p>' +
                    '</div>';
            });
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { app.init(); });
    } else {
        app.init();
    }

    window.musicHubApp = app;
})();
