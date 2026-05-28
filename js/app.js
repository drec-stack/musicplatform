(function() {
    'use strict';

    function showFatalError(message) {
        var loader = document.getElementById('loader');
        if (!loader) return;
        loader.innerHTML = '<div class="loader-error"><h2>Error</h2><p>' + message + '</p><p>Try reloading the page or use a different browser.</p><button onclick="location.reload()">Reload</button></div>';
        document.body.classList.add('error');
    }

    if (!window.indexedDB) {
        showFatalError('Your browser does not support IndexedDB. Please use Chrome, Firefox, Safari or Edge.');
        return;
    }

    var app = {
        initialized: false,

        init: function() {
            if (this.initialized) return;
            var self = this;

            db.open().then(function() {
                player.init();

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
                    ui.showNotification('No playable source available', 'error');
                });

                queueManager.on('shuffle_change', function(mode) {
                    var btn = document.getElementById('shuffleBtn');
                    if (btn) { if (mode) btn.classList.add('active'); else btn.classList.remove('active'); }
                });
                queueManager.on('repeat_change', function(mode) {
                    var btn = document.getElementById('repeatBtn');
                    if (btn) { btn.classList.remove('active'); if (mode !== 'none') btn.classList.add('active'); }
                });

                return ui.init();
            }).then(function() {
                self.initialized = true;
                document.body.classList.add('loaded');
            }).catch(function(err) {
                console.error('Init error:', err);
                showFatalError('Failed to initialize: ' + (err.message || 'Unknown error'));
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
