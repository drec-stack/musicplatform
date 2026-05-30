(function() {
    'use strict';
    
    function err(m) { 
        var l = document.getElementById('loader'); 
        if(!l) return; 
        l.innerHTML = '<div class="loader-error"><h2>Error</h2><p>' + m + '</p><button onclick="location.reload()">Reload</button></div>'; 
        document.body.classList.add('error'); 
    }
    
    if (!window.indexedDB) { 
        err('IndexedDB not supported. Use Chrome, Firefox, Safari or Edge.'); 
        return; 
    }
    
    // ДЕМО-ТРЕКИ (8 штук)
    var DEMO_TRACKS = [
        { id: 'demo-1', title: 'Midnight Dreams', artist: 'Electronic Beats', album: 'Night Sessions', duration: 214, source: 'demo', favorite: false, dateAdded: Date.now() - 86400000, size: 0 },
        { id: 'demo-2', title: 'Urban Flow', artist: 'City Lights', album: 'Metropolis', duration: 183, source: 'demo', favorite: false, dateAdded: Date.now() - 172800000, size: 0 },
        { id: 'demo-3', title: 'Chill Session', artist: 'Lofi Study', album: 'Relaxation', duration: 245, source: 'demo', favorite: false, dateAdded: Date.now() - 259200000, size: 0 },
        { id: 'demo-4', title: 'Rock Anthem', artist: 'The Thunder', album: 'Revolution', duration: 198, source: 'demo', favorite: false, dateAdded: Date.now() - 345600000, size: 0 },
        { id: 'demo-5', title: 'Jazz Evening', artist: 'Smooth Trio', album: 'Late Night Jazz', duration: 312, source: 'demo', favorite: false, dateAdded: Date.now() - 432000000, size: 0 },
        { id: 'demo-6', title: 'Acoustic Sunrise', artist: 'Folk Guitarist', album: 'Morning Melodies', duration: 267, source: 'demo', favorite: false, dateAdded: Date.now() - 518400000, size: 0 },
        { id: 'demo-7', title: 'Deep House', artist: 'Club Mixer', album: 'Nightlife', duration: 356, source: 'demo', favorite: false, dateAdded: Date.now() - 604800000, size: 0 },
        { id: 'demo-8', title: 'Smooth R&B', artist: 'Soul Singer', album: 'Urban Soul', duration: 234, source: 'demo', favorite: false, dateAdded: Date.now() - 691200000, size: 0 }
    ];
    
    var DEMO_PLAYLISTS = [
        { id: 'playlist-1', name: 'Любимые треки', description: 'Моя любимая музыка', tracks: ['demo-1', 'demo-3', 'demo-5'], createdAt: Date.now() },
        { id: 'playlist-2', name: 'Для работы', description: 'Фоновая музыка', tracks: ['demo-2', 'demo-4', 'demo-6'], createdAt: Date.now() }
    ];
    
    function initDemoData() {
        return db.open().then(function() {
            return db.getAllTracks().then(function(tracks) {
                if (tracks.length === 0) {
                    console.log('📀 Создание демо-треков...');
                    var promises = [];
                    for (var i = 0; i < DEMO_TRACKS.length; i++) {
                        promises.push(db.saveTrack(DEMO_TRACKS[i]));
                    }
                    return Promise.all(promises);
                }
                return Promise.resolve();
            });
        }).then(function() {
            return db.getAllPlaylists().then(function(playlists) {
                if (playlists.length === 0) {
                    console.log('📁 Создание демо-плейлистов...');
                    var promises = [];
                    for (var i = 0; i < DEMO_PLAYLISTS.length; i++) {
                        promises.push(db.savePlaylist(DEMO_PLAYLISTS[i]));
                    }
                    return Promise.all(promises);
                }
                return Promise.resolve();
            });
        });
    }
    
    var app = { 
        ready: false, 
        init: function() {
            if(this.ready) return;
            var s = this;
            
            function waitForUI() {
                if (window.ui && typeof window.ui.init === 'function') {
                    initDemoData()
                        .then(function() {
                            console.log('✅ Демо-данные загружены');
                            if (window.player) player.init();
                            
                            if (window.player) {
                                player.on('play', function() { if (window.ui) ui.updatePlayerUI(); }); 
                                player.on('pause', function() { if (window.ui) ui.updatePlayerUI(); }); 
                                player.on('track_change', function() { if (window.ui) ui.updatePlayerUI(); });
                                player.on('progress', function(d) { if (window.ui) ui.updateProgress(d); });
                                player.on('ended', function() { 
                                    if (window.queueManager) {
                                        var n = queueManager.next(); 
                                        if (n && window.player) player.play(n); 
                                        else if (window.ui) ui.updatePlayerUI(); 
                                    }
                                });
                            }
                            
                            if (window.queueManager) {
                                queueManager.on('shuffle_change', function(m) { 
                                    var b = document.getElementById('shuffleBtn'); 
                                    if(b) { 
                                        if(m) b.classList.add('active'); 
                                        else b.classList.remove('active'); 
                                    } 
                                });
                                queueManager.on('repeat_change', function(m) { 
                                    var b = document.getElementById('repeatBtn'); 
                                    if(b) { 
                                        b.classList.remove('active'); 
                                        if(m !== 'none') b.classList.add('active'); 
                                    } 
                                });
                            }
                            
                            return window.ui.init();
                        })
                        .then(function() { 
                            s.ready = true; 
                            document.body.classList.add('loaded'); 
                            console.log('🎵 MusicHub готов!');
                        })
                        .catch(function(e) { 
                            console.error(e);
                            err('Init failed: ' + (e.message || 'Unknown')); 
                        });
                } else {
                    setTimeout(waitForUI, 50);
                }
            }
            
            waitForUI();
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { app.init(); });
    } else {
        app.init();
    }
    
    window.musicHubApp = app;
})();
