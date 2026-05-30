(function() {
    'use strict';
    
    // Функция ошибки
    function showError(message) {
        var loader = document.getElementById('loader');
        if (loader) {
            loader.innerHTML = '<div class="loader-error"><h2>Ошибка</h2><p>' + message + '</p><button onclick="location.reload()">Перезагрузить</button></div>';
        }
        document.body.classList.add('error');
    }
    
    // Проверка поддержки IndexedDB
    if (!window.indexedDB) {
        showError('Ваш браузер не поддерживает IndexedDB. Пожалуйста, используйте Chrome, Firefox, Safari или Edge.');
        return;
    }
    
    // ДЕМО-ТРЕКИ
    var DEMO_TRACKS = [
        { id: 'demo-1', title: 'Midnight Dreams', artist: 'Electronic Beats', album: 'Night Sessions', duration: 214, source: 'demo', favorite: false, dateAdded: Date.now() - 86400000 },
        { id: 'demo-2', title: 'Urban Flow', artist: 'City Lights', album: 'Metropolis', duration: 183, source: 'demo', favorite: false, dateAdded: Date.now() - 172800000 },
        { id: 'demo-3', title: 'Chill Session', artist: 'Lofi Study', album: 'Relaxation', duration: 245, source: 'demo', favorite: false, dateAdded: Date.now() - 259200000 },
        { id: 'demo-4', title: 'Rock Anthem', artist: 'The Thunder', album: 'Revolution', duration: 198, source: 'demo', favorite: false, dateAdded: Date.now() - 345600000 },
        { id: 'demo-5', title: 'Jazz Evening', artist: 'Smooth Trio', album: 'Late Night Jazz', duration: 312, source: 'demo', favorite: false, dateAdded: Date.now() - 432000000 },
        { id: 'demo-6', title: 'Acoustic Sunrise', artist: 'Folk Guitarist', album: 'Morning Melodies', duration: 267, source: 'demo', favorite: false, dateAdded: Date.now() - 518400000 },
        { id: 'demo-7', title: 'Deep House', artist: 'Club Mixer', album: 'Nightlife', duration: 356, source: 'demo', favorite: false, dateAdded: Date.now() - 604800000 },
        { id: 'demo-8', title: 'Smooth R&B', artist: 'Soul Singer', album: 'Urban Soul', duration: 234, source: 'demo', favorite: false, dateAdded: Date.now() - 691200000 }
    ];
    
    var app = { 
        ready: false, 
        init: function() {
            if (this.ready) return;
            var self = this;
            
            // Ждём загрузки UI
            function waitForUI() {
                if (window.ui && typeof window.ui.init === 'function') {
                    // Открываем БД и создаём демо-треки
                    db.open()
                        .then(function() {
                            return db.getAllTracks();
                        })
                        .then(function(tracks) {
                            if (tracks.length === 0) {
                                console.log('Создание демо-треков...');
                                var promises = [];
                                for (var i = 0; i < DEMO_TRACKS.length; i++) {
                                    promises.push(db.saveTrack(DEMO_TRACKS[i]));
                                }
                                return Promise.all(promises);
                            }
                            return Promise.resolve();
                        })
                        .then(function() {
                            // Инициализируем плеер
                            if (window.player) {
                                player.init();
                                player.on('play', function() { if (window.ui) ui.updatePlayerUI(); });
                                player.on('pause', function() { if (window.ui) ui.updatePlayerUI(); });
                                player.on('track_change', function() { if (window.ui) ui.updatePlayerUI(); });
                                player.on('progress', function(d) { if (window.ui) ui.updateProgress(d); });
                                player.on('ended', function() {
                                    if (window.queueManager) {
                                        var n = queueManager.next();
                                        if (n && window.player) player.play(n);
                                    }
                                });
                            }
                            
                            // Запускаем UI
                            return window.ui.init();
                        })
                        .then(function() {
                            self.ready = true;
                            document.body.classList.add('loaded');
                            console.log('MusicHub готов!');
                        })
                        .catch(function(e) {
                            console.error('Ошибка:', e);
                            showError('Ошибка инициализации: ' + (e.message || 'Неизвестная ошибка'));
                        });
                } else {
                    setTimeout(waitForUI, 50);
                }
            }
            
            waitForUI();
        }
    };
    
    // Запуск после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { app.init(); });
    } else {
        app.init();
    }
    
    window.musicHubApp = app;
})();
