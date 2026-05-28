class App {
    constructor() {
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            await db.open();
            console.log('Database initialized');

            player.init();

            ui.init();
            ui.bindPlayerEvents();

            player.on('play', () => ui.updatePlayerUI());
            player.on('pause', () => ui.updatePlayerUI());
            player.on('track_change', () => ui.updatePlayerUI());
            player.on('progress', (data) => ui.updateProgress(data));
            player.on('ended', () => {
                const next = queueManager.getNext();
                if (next) {
                    player.play(next);
                } else {
                    ui.updatePlayerUI();
                }
            });

            player.on('no_source', () => {
                ui.showNotification('Нет доступного источника для воспроизведения', 'error');
            });

            queueManager.on('shuffle_change', (mode) => {
                const btn = document.getElementById('shuffleBtn');
                if (btn) btn.classList.toggle('active', mode);
            });

            queueManager.on('repeat_change', (mode) => {
                const btn = document.getElementById('repeatBtn');
                if (btn) {
                    btn.classList.remove('active');
                    if (mode !== 'none') btn.classList.add('active');
                }
            });

            const stats = await library.getStats();
            console.log('Library stats:', stats);

            this.initialized = true;
            console.log('MusicHub Platform initialized');
        } catch (error) {
            console.error('Initialization error:', error);
            ui.showNotification('Ошибка инициализации платформы', 'error');
        }
    }
}

const app = new App();

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

window.musicHubApp = app;
