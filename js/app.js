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
    
    // СОЗДАНИЕ ДЕМО-ТРЕКОВ
    function createDemoTracks() {
        return db.getAllTracks().then(function(tracks) {
            if (tracks.length === 0) {
                console.log('Creating demo tracks...');
                var demoTracks = [
                    {
                        id: 'demo-1',
                        title: 'Midnight Dreams',
                        artist: 'Electronic Beats',
                        album: 'Night Sessions',
                        duration: 214,
                        source: 'demo',
                        favorite: false,
                        dateAdded: Date.now() - 86400000,
                        size: 0
                    },
                    {
                        id: 'demo-2',
                        title: 'Urban Flow',
                        artist: 'City Lights',
                        album: 'Metropolis',
                        duration: 183,
                        source: 'demo',
                        favorite: false,
                        dateAdded: Date.now() - 172800000,
                        size: 0
                    },
                    {
                        id: 'demo-3',
                        title: 'Chill Session',
                        artist: 'Lofi Study',
                        album: 'Relaxation',
                        duration: 245,
                        source: 'demo',
                        favorite: false,
                        dateAdded: Date.now() - 259200000,
                        size: 0
                    },
                    {
                        id: 'demo-4',
                        title: 'Rock Anthem',
                        artist: 'The Thunder',
                        album: 'Revolution',
                        duration: 198,
                        source: 'demo',
                        favorite: false,
                        dateAdded: Date.now() - 345600000,
                        size: 0
                    },
                    {
                        id: 'demo-5',
                        title: 'Jazz Evening',
                        artist: 'Smooth Trio',
                        album: 'Late Night Jazz',
                        duration: 312,
                        source: 'demo',
                        favorite: false,
                        dateAdded: Date.now() - 432000000,
                        size: 0
                    }
                ];
                
                return Promise.all(demoTracks.map(function(track) {
                    return db.saveTrack(track);
                }));
            }
            return Promise.resolve();
        });
    }
    
    var app = { 
        ready: false, 
        init: function() {
            if(this.ready) return;
            var s = this;
            
            function waitForUI() {
                if (window.ui && typeof window.ui.init === 'function') {
                    // Сначала открываем БД и создаем демо-треки
                    db.open()
                        .then(createDemoTracks)
                        .then(function() {
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
                                player.on('no_source', function() { if (window.ui) ui.notify('No playable source', 'error'); });
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
                        })
                        .catch(function(e) { 
                            console.error('Init error:', e);
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
