var app = {
    initialized: false,
    init: async function() {
        if (this.initialized) return;
        try {
            await db.open();
            console.log('Database initialized');
            player.init();
            await ui.init();
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
                ui.showNotification('Нет доступного источника для воспроизведения', 'error');
            });
            queueManager.on('shuffle_change', function(mode) {
                var btn = document.getElementById('shuffleBtn');
                if (btn) btn.classList.toggle('active', mode);
            });
            queueManager.on('repeat_change', function(mode) {
                var btn = document.getElementById('repeatBtn');
                if (btn) { btn.classList.remove('active'); if (mode !== 'none') btn.classList.add('active'); }
            });
            this.initialized = true;
            console.log('MusicHub Platform initialized');
        } catch (error) {
            console.error('Initialization error:', error);
            ui.showNotification('Ошибка инициализации', 'error');
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    app.init();
});

window.musicHubApp = app;
