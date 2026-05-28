(function() {
    'use strict';
    function err(m) { var l=document.getElementById('loader'); if(!l)return; l.innerHTML='<div class="loader-error"><h2>Error</h2><p>'+m+'</p><button onclick="location.reload()">Reload</button></div>'; document.body.classList.add('error'); }
    if (!window.indexedDB) { err('IndexedDB not supported. Use Chrome, Firefox, Safari or Edge.'); return; }
    var app = { ready:false, init:function() { if(this.ready)return; var s=this;
        db.open().then(function() { player.init();
            player.on('play',function(){ui.updatePlayerUI();}); player.on('pause',function(){ui.updatePlayerUI();}); player.on('track_change',function(){ui.updatePlayerUI();});
            player.on('progress',function(d){ui.updateProgress(d);});
            player.on('ended',function(){var n=queueManager.next();if(n)player.play(n);else ui.updatePlayerUI();});
            player.on('no_source',function(){ui.notify('No playable source','error');});
            queueManager.on('shuffle_change',function(m){var b=document.getElementById('shuffleBtn');if(b){if(m)b.classList.add('active');else b.classList.remove('active');}});
            queueManager.on('repeat_change',function(m){var b=document.getElementById('repeatBtn');if(b){b.classList.remove('active');if(m!=='none')b.classList.add('active');}});
            return ui.init();
        }).then(function() { s.ready=true; document.body.classList.add('loaded'); }).catch(function(e) { err('Init failed: '+(e.message||'Unknown')); });
    }};
    if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){app.init();}); else app.init();
    window.musicHubApp = app;
})();
