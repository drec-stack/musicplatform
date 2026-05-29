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
    
    var app = { 
        ready: false, 
        init: function() {
            if(this.ready) return;
            var s = this;
            
            function waitForUI() {
                if (window.ui && typeof window.ui.init === 'function') {
                    db.open().then(function() { 
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
                    }).then(function() { 
                        s.ready = true; 
                        document.body.classList.add('loaded'); 
                    }).catch(function(e) { 
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
