(function() {
    'use strict';
    function UIManager() { this.page='home'; this.tab='tracks'; this.st=null; }
    
    UIManager.prototype.init = function() {
        var s=this; this.renderSidebar(); this.bindSidebar(); this.bindTopbar(); this.bindPlayer(); this.bindKeys();
        this.checkSpotify(); var p=storage.get('current_page','home');
        
        if(window.favorites) window.favorites.on('change', function() { s.loadStats(); });
        if(window.radioManager) radioManager.loadStations();
        
        return this.go(p).then(function(){s.loadStats();});
    };
    
    UIManager.prototype.renderSidebar = function() {
        var n=document.getElementById('sidebarNav'), items=[
            {p:'home',svg:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',l:'Home'},
            {p:'library',svg:'<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',l:'Library'},
            {p:'search',svg:'<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',l:'Search'},
            {p:'upload',svg:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',l:'Upload'},
            {p:'import',svg:'<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',l:'Import'},
            {p:'playlists',svg:'<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',l:'Playlists'}
        ];
        var h='';
        for(var i=0;i<items.length;i++){h+='<a class="nav-item'+(items[i].p===this.page?' active':'')+'" data-page="'+items[i].p+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">'+items[i].svg+'</svg>'+items[i].l+'</a>';}
        if(n)n.innerHTML=h;
    };
    
    UIManager.prototype.bindSidebar = function() {
        var s=this,n=document.getElementById('sidebarNav'); if(!n)return;
        n.addEventListener('click',function(e){var el=e.target.closest?e.target.closest('.nav-item'):null;if(el){e.preventDefault();s.go(el.getAttribute('data-page'));}});
    };
    
    UIManager.prototype.bindTopbar = function() {
        var s=this;
        document.getElementById('exportBtn').addEventListener('click',function(){s.exportLib();});
        var si=document.getElementById('globalSearch');
        si.addEventListener('input',function(){var q=si.value.trim();if(s.st)clearTimeout(s.st);if(q.length>=2){s.st=setTimeout(function(){s.doSearch(q);},350);}});
    };
    
    UIManager.prototype.bindKeys = function() {
        document.addEventListener('keydown',function(e){
            if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();var i=document.getElementById('globalSearch');if(i)i.focus();}
            if(e.code==='Space'&&document.activeElement===document.body){e.preventDefault();player.toggle();}
            if(e.key==='Escape'){var o=document.getElementById('modal-overlay');if(o&&!o.classList.contains('hidden'))o.classList.add('hidden');}
            // Медиа-клавиши
            if(e.code==='MediaPlayPause'){e.preventDefault();player.toggle();}
            if(e.code==='MediaNextTrack'){e.preventDefault();var n=queueManager.next();if(n)player.play(n);}
            if(e.code==='MediaPrevTrack'){e.preventDefault();var p=queueManager.prev();if(p)player.play(p);}
        });
    };
    
    UIManager.prototype.go = function(p) {
        this.page=p; storage.set('current_page',p); this.renderSidebar(); this.bindSidebar();
        var c=document.getElementById('content'); if(!c)return Promise.resolve();
        c.innerHTML='<div class="loading-container"><div class="loading-spinner"></div></div>';
        var s=this,pr;
        switch(p){
            case'home':pr=this.homePage();break;
            case'library':pr=this.libPage();break;
            case'search':pr=this.searchPage();break;
            case'upload':pr=this.uploadPage();break;
            case'import':pr=this.importPage();break;
            case'playlists':pr=this.plPage();break;
            case'settings':pr=this.setPage();break;
            default:pr=Promise.resolve();break;
        }
        return pr.catch(function(e){c.innerHTML='<div class="empty-state"><p>Error</p><span>'+e.message+'</span></div>';});
    };
    
    UIManager.prototype.homePage = function() {
        var s=this,c=document.getElementById('content');
        c.innerHTML='<div class="page"><div class="page-header"><h1 class="page-title">My Music</h1><p class="page-subtitle">Independent library</p></div><div class="quick-actions">'+['upload','import','library','search'].map(function(a){return'<div class="action-card" data-action="'+a+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">'+{upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',import:'<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',library:'<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',search:'<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'}[a]+'</svg><span>'+a.charAt(0).toUpperCase()+a.slice(1)+'</span></div>';}).join('')+'</div><div class="section"><div class="section-header"><h2 class="section-title">Recently Added</h2></div><div id="recentTracksContainer"></div></div><div class="section"><div class="section-header"><h2 class="section-title">Playlists</h2></div><div id="homePlaylistsContainer"></div></div></div>';
        
        c.querySelectorAll('.action-card').forEach(function(card){card.addEventListener('click',function(){s.go(card.getAttribute('data-action'));});});
        var rd=document.getElementById('recentTracksContainer');
        library.getRecentTracks(8).then(function(t){if(t.length===0)rd.innerHTML='<div class="empty-state"><p>Empty</p></div>';else{var h='<div class="track-list">';for(var i=0;i<t.length;i++)h+=s.trackRow(t[i],i);h+='</div>';rd.innerHTML=h;s.bindRows(rd);}}).catch(function(){rd.innerHTML='<div class="empty-state"><p>Error</p></div>';});
        var pd=document.getElementById('homePlaylistsContainer');
        library.getPlaylists().then(function(pl){if(pl.length===0)pd.innerHTML='<div class="empty-state"><p>No playlists</p></div>';else{var h='<div class="playlist-grid">';for(var i=0;i<Math.min(pl.length,6);i++)h+=s.plCard(pl[i]);h+='</div>';pd.innerHTML=h;pd.querySelectorAll('.playlist-card').forEach(function(c){c.addEventListener('click',function(){s.showPlModal(c.getAttribute('data-playlist-id'));});});}}).catch(function(){pd.innerHTML='<div class="empty-state"><p>Error</p></div>';});
        return Promise.resolve();
    };
    
    UIManager.prototype.libPage = function() {
        var s=this,c=document.getElementById('content');
        c.innerHTML='<div class="page"><div class="page-header"><h1 class="page-title">Library</h1><div class="library-actions"><button class="btn btn-secondary btn-sm" id="findDupBtn">Find duplicates</button><button class="btn btn-danger btn-sm" id="remDupBtn">Remove duplicates</button></div></div><div class="tabs" id="libTabs"><button class="tab active" data-tab="tracks">Tracks</button><button class="tab" data-tab="artists">Artists</button><button class="tab" data-tab="albums">Albums</button><button class="tab" data-tab="favorites">Favorites</button></div><div class="library-filters"><select id="sourceFilter" class="form-input" style="width:auto;"><option value="all">All</option><option value="local">Local</option><option value="spotify">Spotify</option><option value="youtube">YouTube</option></select><select id="sortFilter" class="form-input" style="width:auto;"><option value="dateAdded">By date</option><option value="title">By title</option><option value="artist">By artist</option><option value="playCount">By popularity</option></select></div><div id="libraryContent"></div></div>';
        
        document.getElementById('libTabs').addEventListener('click',function(e){var el=e.target.closest?e.target.closest('.tab'):null;if(!el)return;document.querySelectorAll('#libTabs .tab').forEach(function(t){t.classList.remove('active');});el.classList.add('active');s.tab=el.getAttribute('data-tab');s.loadLib();});
        document.getElementById('sourceFilter').addEventListener('change',function(){s.loadLib();});
        document.getElementById('sortFilter').addEventListener('change',function(){s.loadLib();});
        document.getElementById('findDupBtn').addEventListener('click',function(){library.getDuplicates().then(function(d){s.notify(d.length?'Found '+d.length+' duplicates':'No duplicates','info');});});
        document.getElementById('remDupBtn').addEventListener('click',function(){s.confirm('Remove duplicates?','',function(){library.removeDuplicates().then(function(r){s.notify('Removed '+r.length,'success');s.loadLib();s.loadStats();});});});
        return this.loadLib();
    };
    
    UIManager.prototype.loadLib = function() {
        var s=this,ct=document.getElementById('libraryContent'); if(!ct)return Promise.resolve();
        ct.innerHTML='<div class="loading-container"><div class="loading-spinner"></div></div>';
        var src=document.getElementById('sourceFilter').value,srt=document.getElementById('sortFilter').value,pr;
        if(this.tab==='tracks'){pr=library.getTracks({source:src,sort:srt}).then(function(t){if(t.length===0){ct.innerHTML='<div class="empty-state"><p>No tracks</p></div>';return;}var h='<div class="track-list">';for(var i=0;i<t.length;i++)h+=s.trackRow(t[i],i);h+='</div>';ct.innerHTML=h;s.bindRows(ct);});}
        else if(this.tab==='artists'){pr=library.getArtists().then(function(a){if(a.length===0){ct.innerHTML='<div class="empty-state"><p>No artists</p></div>';return;}var h='<div class="artist-grid">';for(var i=0;i<a.length;i++)h+='<div class="artist-card"><div class="artist-card-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><div class="artist-card-name">'+s.esc(a[i].name)+'</div><div class="artist-card-info">'+a[i].trackCount+' tracks</div></div>';h+='</div>';ct.innerHTML=h;});}
        else if(this.tab==='albums'){pr=library.getAlbums().then(function(a){if(a.length===0){ct.innerHTML='<div class="empty-state"><p>No albums</p></div>';return;}var h='<div class="album-grid">';for(var i=0;i<a.length;i++)h+='<div class="album-card"><div class="album-card-cover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg></div><div class="album-card-name">'+s.esc(a[i].name)+'</div><div class="album-card-artist">'+s.esc(a[i].artist)+'</div></div>';h+='</div>';ct.innerHTML=h;});}
        else if(this.tab==='favorites') {
            if(window.favorites) {
                pr = window.favorites.getTracks().then(function(t) {
                    if(t.length===0){ct.innerHTML='<div class="empty-state"><p>No favorites</p></div>';return;}
                    var h='<div class="track-list">';
                    for(var i=0;i<t.length;i++) h+=s.trackRow(t[i],i);
                    h+='</div>';ct.innerHTML=h;s.bindRows(ct);
                });
            } else {
                pr = Promise.resolve();
            }
        }
        return pr.catch(function(){ct.innerHTML='<div class="empty-state"><p>Error</p></div>';});
    };
    
    UIManager.prototype.searchPage = function() { document.getElementById('content').innerHTML='<div class="page"><div class="page-header"><h1 class="page-title">Search</h1></div><div id="searchResults"><div class="empty-state"><p>Type in the search bar</p></div></div></div>'; return Promise.resolve(); };
    
    UIManager.prototype.uploadPage = function() {
        var s=this,c=document.getElementById('content');
        c.innerHTML='<div class="page"><div class="page-header"><h1 class="page-title">Upload</h1><p class="page-subtitle">MP3, WAV, FLAC, OGG, AAC, M4A</p></div><div class="upload-area" id="uploadArea"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><p>Drag files here</p><span>or</span><button class="btn btn-primary" id="selectFilesBtn">Select files</button></div><input type="file" id="fileInput" multiple accept=".mp3,.wav,.flac,.ogg,.aac,.m4a" hidden><div id="uploadProgress" class="hidden mt-4"></div></div>';
        var a=document.getElementById('uploadArea'),inp=document.getElementById('fileInput'),pr=document.getElementById('uploadProgress');
        document.getElementById('selectFilesBtn').addEventListener('click',function(){inp.click();});
        a.addEventListener('dragover',function(e){e.preventDefault();a.classList.add('dragover');});
        a.addEventListener('dragleave',function(){a.classList.remove('dragover');});
        a.addEventListener('drop',function(e){e.preventDefault();a.classList.remove('dragover');if(e.dataTransfer.files.length)s.doUp(e.dataTransfer.files,a,pr);});
        inp.addEventListener('change',function(){if(inp.files.length)s.doUp(inp.files,a,pr);});
        return Promise.resolve();
    };
    
    UIManager.prototype.doUp = function(f,a,pr) {
        var s=this;a.classList.add('hidden');pr.classList.remove('hidden');pr.innerHTML='<div class="loading-container"><div class="loading-spinner"></div><span>Uploading...</span></div>';
        uploadManager.uploadFiles(f).then(function(r){pr.innerHTML='<div class="empty-state"><p>Uploaded: '+r.uploaded.length+'</p>'+(r.failed.length?'<span>Failed: '+r.failed.length+'</span>':'')+'</div>';s.notify('Done','success');s.loadStats();setTimeout(function(){a.classList.remove('hidden');pr.classList.add('hidden');},2000);}).catch(function(e){pr.innerHTML='<div class="empty-state"><p>Error</p></div>';s.notify('Failed','error');});
    };
    
    UIManager.prototype.importPage = function() {
        var s=this,c=document.getElementById('content'),svs=services.getAll();
        var h='<div class="page"><div class="page-header"><h1 class="page-title">Import</h1></div><div class="settings-section"><h2 class="settings-section-title">Services</h2><div class="services-grid">';
        for(var i=0;i<svs.length;i++){var sv=svs[i];h+='<div class="service-card'+(sv.connected?' connected':'')+'"><div class="service-card-header"><div class="service-card-icon" style="background:'+sv.color+'20;color:'+sv.color+';">'+sv.name.charAt(0)+'</div><div><div class="service-card-name">'+sv.name+'</div><div class="service-card-status'+(sv.connected?' connected':'')+'">'+(sv.connected?'Connected':'Not connected')+'</div></div></div><div class="service-card-actions">'+(sv.connected?'<button class="btn btn-primary btn-sm start-import" data-service="'+sv.id+'">Import</button>':'<button class="btn btn-secondary btn-sm connect-service" data-service="'+sv.id+'">Connect</button>')+'</div></div>';}
        h+='</div></div><div class="settings-section"><h2 class="settings-section-title">Files</h2><div class="import-options"><div class="import-option-card" id="importJSON"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>JSON</span></div><div class="import-option-card" id="importCSV"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg><span>CSV</span></div></div><input type="file" id="importFileInput" accept=".json,.csv" hidden></div></div>';
        c.innerHTML=h;
        c.querySelectorAll('.connect-service').forEach(function(b){b.addEventListener('click',function(){s.showConn(b.getAttribute('data-service'));});});
        c.querySelectorAll('.start-import').forEach(function(b){b.addEventListener('click',function(){s.startImp(b.getAttribute('data-service'));});});
        document.getElementById('importJSON').addEventListener('click',function(){var inp=document.getElementById('importFileInput');inp.accept='.json';inp.onchange=function(e){if(e.target.files[0]){importer.importFromJSON(e.target.files[0]).then(function(r){s.notify('Imported '+r.importedCount,'success');s.loadStats();}).catch(function(){s.notify('Failed','error');});}};inp.click();});
        document.getElementById('importCSV').addEventListener('click',function(){var inp=document.getElementById('importFileInput');inp.accept='.csv';inp.onchange=function(e){if(e.target.files[0]){importer.importFromCSV(e.target.files[0]).then(function(r){s.notify('Imported '+r.importedCount,'success');s.loadStats();}).catch(function(){s.notify('Failed','error');});}};inp.click();});
        return Promise.resolve();
    };
    
    UIManager.prototype.startImp = function(id) {
        var s=this; this.notify('Importing...','info');
        if(id==='spotify'){var a=storage.get('spotify_auth');if(!a||!a.accessToken){s.notify('Not connected','error');return;}importer.importFromSpotify(a.accessToken,{}).then(function(r){s.notify('Imported '+r.tracks.length+' tracks','success');s.loadStats();}).catch(function(e){s.notify(e.message,'error');});}
        else if(id==='youtube'){var y=storage.get('youtube_config');if(!y||!y.apiKey){s.notify('Not connected','error');return;}importer.importFromYouTube(y.apiKey,{}).then(function(r){s.notify('Imported '+r.tracks.length+' tracks','success');s.loadStats();}).catch(function(e){s.notify(e.message,'error');});}
        else{s.notify('Not available','error');}
    };
    
    UIManager.prototype.plPage = function() {
        var s=this,c=document.getElementById('content');
        return library.getPlaylists().then(function(pl){
            var h='<div class="page"><div class="page-header"><h1 class="page-title">Playlists</h1><button class="btn btn-primary" id="createPlBtn">Create</button><button class="btn btn-secondary" id="exportQueueBtn" style="margin-left:10px;">📁 Export Queue</button></div>';
            if(pl.length===0)h+='<div class="empty-state"><p>No playlists</p></div>';
            else{h+='<div class="playlist-grid">';for(var i=0;i<pl.length;i++)h+=s.plCard(pl[i]);h+='</div>';}
            h+='</div>';c.innerHTML=h;
            document.getElementById('createPlBtn').addEventListener('click',function(){s.showCreatePl();});
            document.getElementById('exportQueueBtn').addEventListener('click',function(){
                var tracks = queueManager.getAll();
                if(tracks.length && window.exportManager) exportManager.exportAsM3U(tracks);
                else s.notify('Queue is empty', 'error');
            });
            c.querySelectorAll('.playlist-card').forEach(function(card){card.addEventListener('click',function(){s.showPlModal(card.getAttribute('data-playlist-id'));});});
        });
    };
    
    UIManager.prototype.setPage = function() {
        var s=this,c=document.getElementById('content'),svs=services.getAll();
        var h='<div class="page"><div class="page-header"><h1 class="page-title">Settings</h1></div><div class="settings-section"><h2 class="settings-section-title">Services</h2><div class="services-grid">';
        for(var i=0;i<svs.length;i++){var sv=svs[i];h+='<div class="service-card'+(sv.connected?' connected':'')+'"><div class="service-card-header"><div class="service-card-icon" style="background:'+sv.color+'20;color:'+sv.color+';">'+sv.name.charAt(0)+'</div><div><div class="service-card-name">'+sv.name+'</div><div class="service-card-status'+(sv.connected?' connected':'')+'">'+(sv.connected?'Connected':'Not connected')+'</div></div></div><div class="service-card-actions">'+(sv.connected?'<button class="btn btn-secondary btn-sm disc-svc" data-service="'+sv.id+'">Disconnect</button>':'<button class="btn btn-primary btn-sm conn-svc" data-service="'+sv.id+'">Connect</button>')+'</div></div>';}
        h+='</div></div><div class="settings-section"><h2 class="settings-section-title">Export</h2><div class="data-actions"><button class="btn btn-secondary" id="exportLibraryBtn">📁 Export Library (M3U)</button><button class="btn btn-secondary" id="exportQueueM3UBtn">📋 Export Queue (M3U)</button></div></div><div class="settings-section"><h2 class="settings-section-title">Data</h2><div class="data-actions"><button class="btn btn-secondary" id="exportDataBtn">Export JSON</button><button class="btn btn-danger" id="clearDataBtn">Clear all</button></div></div></div>';
        c.innerHTML=h;
        c.querySelectorAll('.conn-svc').forEach(function(b){b.addEventListener('click',function(){s.showConn(b.getAttribute('data-service'));});});
        c.querySelectorAll('.disc-svc').forEach(function(b){b.addEventListener('click',function(){services.disconnect(b.getAttribute('data-service'));s.notify('Disconnected','success');s.go('settings');});});
        document.getElementById('exportDataBtn').addEventListener('click',function(){s.exportLib();});
        document.getElementById('exportLibraryBtn').addEventListener('click',function(){if(window.exportManager)exportManager.exportLibrary();});
        document.getElementById('exportQueueM3UBtn').addEventListener('click',function(){if(window.exportManager)exportManager.exportCurrentQueue();});
        document.getElementById('clearDataBtn').addEventListener('click',function(){s.confirm('Clear all?','',function(){db.clearAll().then(function(){storage.remove('play_history');storage.remove('queue');s.notify('Cleared','success');s.loadStats();s.go('home');});});});
        return Promise.resolve();
    };
    
    UIManager.prototype.doSearch = function(q) {
        var s=this; if(this.page!=='search'){this.go('search').then(function(){s.doSearch(q);});return;}
        var c=document.getElementById('searchResults'); if(!c)return; c.innerHTML='<div class="loading-container"><div class="loading-spinner"></div></div>';
        library.search(q).then(function(r){if(r.length===0){c.innerHTML='<div class="empty-state"><p>Nothing found</p></div>';return;}var h='<div class="track-list">';for(var i=0;i<r.length;i++)h+=s.trackRow(r[i],i);h+='</div>';c.innerHTML=h;s.bindRows(c);}).catch(function(){c.innerHTML='<div class="empty-state"><p>Error</p></div>';});
    };
    
    UIManager.prototype.trackRow = function(t,i) {
        var d=t.duration?player.fmt(t.duration/1000):'--:--',src=t.source==='local'?'My file':t.source;
        var favIcon = (window.favorites && window.favorites.isFavorite(t.id)) ? '❤️' : '♡';
        return'<div class="track-row" data-track=\''+this.esc(JSON.stringify(t))+'\'><span class="track-row-index">'+(i+1)+'</span><div class="track-row-info"><div class="track-row-cover-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div><div class="track-row-text"><div class="track-row-title">'+this.esc(t.title)+'</div><div class="track-row-artist">'+this.esc(t.artist)+'</div></div></div><span class="track-row-source">'+this.esc(src)+'</span><span class="track-row-duration">'+d+'</span><span class="track-row-fav" style="margin-left:8px;cursor:pointer;">'+favIcon+'</span></div>';
    };
    
    UIManager.prototype.plCard = function(p) { var c=p.tracks?p.tracks.length:0; return'<div class="playlist-card" data-playlist-id="'+p.id+'"><div class="playlist-card-cover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></div><div class="playlist-card-name">'+this.esc(p.name)+'</div><div class="playlist-card-count">'+c+' tracks</div></div>'; };
    
    UIManager.prototype.bindRows = function(c) { 
        var s=this,r=c.querySelectorAll('.track-row'); 
        for(var i=0;i<r.length;i++){
            (function(row){
                row.addEventListener('click',function(e){
                    if(e.target.classList && e.target.classList.contains('track-row-fav')) return;
                    try{var t=JSON.parse(row.getAttribute('data-track'));player.play(t);queueManager.add(t);}catch(e){}
                });
                // Лайк по клику на сердечко
                var favSpan = row.querySelector('.track-row-fav');
                if(favSpan) {
                    favSpan.addEventListener('click', function(e) {
                        e.stopPropagation();
                        try {
                            var t = JSON.parse(row.getAttribute('data-track'));
                            if(window.favorites) {
                                window.favorites.toggle(t);
                                var isFav = window.favorites.isFavorite(t.id);
                                favSpan.textContent = isFav ? '❤️' : '♡';
                                s.notify(isFav ? 'Added to favorites' : 'Removed from favorites', 'success');
                            }
                        } catch(e) {}
                    });
                }
                // Контекстное меню
                row.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                    var trackData = row.getAttribute('data-track');
                    if(!trackData) return;
                    try {
                        var track = JSON.parse(trackData);
                        var isFav = window.favorites ? window.favorites.isFavorite(track.id) : false;
                        var items = [
                            { label: 'Play now', icon: '▶', action: function() { player.play(track); } },
                            { label: 'Add to queue', icon: '📋', action: function() { queueManager.add(track); } },
                            { label: isFav ? 'Remove from favorites' : 'Add to favorites', icon: '❤️', action: function() {
                                if(window.favorites) {
                                    window.favorites.toggle(track);
                                    var newIsFav = window.favorites.isFavorite(track.id);
                                    if(favSpan) favSpan.textContent = newIsFav ? '❤️' : '♡';
                                    s.notify(newIsFav ? 'Added to favorites' : 'Removed from favorites', 'success');
                                }
                            } },
                            { label: 'Add to playlist', icon: '📁', action: function() { s.showAddPl(track.id); } },
                            { label: 'Artist radio', icon: '📻', action: function() {
                                if(window.radioManager) radioManager.generateArtistRadio(track.artist);
                                s.notify('Radio generated for ' + track.artist, 'info');
                            } },
                            { label: 'Delete', icon: '🗑️', action: function() {
                                s.confirm('Delete track', 'Delete "' + track.title + '"?', function() {
                                    db.deleteTrack(track.id).then(function() {
                                        s.loadLib();
                                        s.notify('Deleted', 'success');
                                    });
                                });
                            } }
                        ];
                        if(window.contextMenu) window.contextMenu.show(e.clientX, e.clientY, items);
                    } catch(e) {}
                });
            })(r[i]);
        } 
    };
    
    UIManager.prototype.showConn = function(id) {
        var s=this,o=document.getElementById('modal-overlay'),ct=document.getElementById('modal-content'),h='';
        if(id==='spotify')h='<div class="modal-header"><h3 class="modal-title">Spotify</h3><span class="modal-close">X</span></div><div class="form-group"><label class="form-label">Client ID</label><input type="text" class="form-input" id="modalInp" placeholder="ID"></div><button class="btn btn-primary" id="modalSub" style="width:100%;">Connect</button>';
        else if(id==='youtube')h='<div class="modal-header"><h3 class="modal-title">YouTube</h3><span class="modal-close">X</span></div><div class="form-group"><label class="form-label">API Key</label><input type="text" class="form-input" id="modalInp" placeholder="Key"></div><button class="btn btn-primary" id="modalSub" style="width:100%;">Connect</button>';
        else if(id==='soundcloud')h='<div class="modal-header"><h3 class="modal-title">SoundCloud</h3><span class="modal-close">X</span></div><div class="form-group"><label class="form-label">Client ID</label><input type="text" class="form-input" id="modalInp" placeholder="ID"></div><button class="btn btn-primary" id="modalSub" style="width:100%;">Connect</button>';
        ct.innerHTML=h;o.classList.remove('hidden');
        var cl=function(){o.classList.add('hidden');};
        ct.querySelector('.modal-close').addEventListener('click',cl);
        o.addEventListener('click',function(e){if(e.target===o)cl();});
        document.getElementById('modalSub').addEventListener('click',function(){var v=document.getElementById('modalInp').value.trim();if(!v)return;if(id==='spotify')services.connectSpotify(v);else if(id==='youtube'){services.connectYouTube(v);cl();s.notify('Connected','success');s.go('settings');}else if(id==='soundcloud'){services.connectSoundCloud(v);cl();s.notify('Connected','success');s.go('settings');}});
    };
    
    UIManager.prototype.showCreatePl = function() {
        var s=this,o=document.getElementById('modal-overlay'),ct=document.getElementById('modal-content');
        ct.innerHTML='<div class="modal-header"><h3 class="modal-title">New Playlist</h3><span class="modal-close">X</span></div><div class="form-group"><label class="form-label">Name</label><input type="text" class="form-input" id="plName" placeholder="Name"></div><button class="btn btn-primary" id="savePl" style="width:100%;">Create</button>';
        o.classList.remove('hidden');
        var cl=function(){o.classList.add('hidden');};
        ct.querySelector('.modal-close').addEventListener('click',cl);
        o.addEventListener('click',function(e){if(e.target===o)cl();});
        document.getElementById('savePl').addEventListener('click',function(){var n=document.getElementById('plName').value.trim()||'New';library.createPlaylist(n,'').then(function(){s.notify('Created','success');cl();s.go('playlists');});});
    };
    
    UIManager.prototype.showPlModal = function(id) {
        var s=this,o=document.getElementById('modal-overlay'),ct=document.getElementById('modal-content');
        library.getPlaylist(id).then(function(pl){if(!pl)return;library.getPlaylistTracks(id).then(function(t){
            var h='<div class="modal-header"><h3 class="modal-title">'+s.esc(pl.name)+'</h3><span class="modal-close">X</span></div><p class="text-muted text-sm mb-4">'+pl.tracks.length+' tracks</p><div class="track-list">';
            for(var i=0;i<t.length;i++)h+=s.trackRow(t[i],i);
            h+='</div><div class="mt-4"><button class="btn btn-secondary btn-sm" id="playAllBtn">Play all</button> <button class="btn btn-secondary btn-sm" id="exportPlBtn">Export M3U</button> <button class="btn btn-danger btn-sm" id="delPlBtn">Delete</button></div>';
            ct.innerHTML=h;o.classList.remove('hidden');
            var cl=function(){o.classList.add('hidden');};
            ct.querySelector('.modal-close').addEventListener('click',cl);
            o.addEventListener('click',function(e){if(e.target===o)cl();});
            s.bindRows(ct);
            document.getElementById('playAllBtn').addEventListener('click',function(){if(t.length){queueManager.clear();for(var i=0;i<t.length;i++)queueManager.add(t[i]);player.play(t[0]);cl();}});
            document.getElementById('exportPlBtn').addEventListener('click',function(){if(window.exportManager)exportManager.exportAsM3U(t, pl.name + '.m3u');});
            document.getElementById('delPlBtn').addEventListener('click',function(){library.deletePlaylist(id).then(function(){s.notify('Deleted','success');cl();s.go('playlists');});});
        });});
    };
    
    UIManager.prototype.showAddPl = function(tid) {
        var s=this,o=document.getElementById('modal-overlay'),ct=document.getElementById('modal-content');
        library.getPlaylists().then(function(pl){
            var h='<div class="modal-header"><h3 class="modal-title">Add to playlist</h3><span class="modal-close">X</span></div>';
            if(pl.length===0)h+='<p class="text-muted">No playlists</p>';
            else for(var i=0;i<pl.length;i++)h+='<div class="playlist-option" data-id="'+pl[i].id+'">'+s.esc(pl[i].name)+' ('+pl[i].tracks.length+')</div>';
            h+='<button class="btn btn-secondary btn-sm mt-4" id="newPlBtn">New playlist</button>';
            ct.innerHTML=h;o.classList.remove('hidden');
            var cl=function(){o.classList.add('hidden');};
            ct.querySelector('.modal-close').addEventListener('click',cl);
            o.addEventListener('click',function(e){if(e.target===o)cl();});
            ct.querySelectorAll('.playlist-option').forEach(function(opt){opt.addEventListener('click',function(){library.addToPlaylist(opt.getAttribute('data-id'),tid).then(function(){s.notify('Added','success');cl();});});});
            document.getElementById('newPlBtn').addEventListener('click',function(){cl();s.showCreatePl();});
        });
    };
    
    UIManager.prototype.updatePlayerUI = function() { var t=player.track; document.getElementById('playerTitle').textContent=t?t.title:'Nothing playing'; document.getElementById('playerArtist').textContent=t?t.artist:'Select a track'; var i=document.getElementById('playIcon'); if(i)i.innerHTML=player.playing?'<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>':'<polygon points="5 3 19 12 5 21 5 3"/>'; };
    
    UIManager.prototype.updateProgress = function(d) { document.getElementById('currentTime').textContent=player.fmt(d.currentTime); document.getElementById('totalTime').textContent=player.fmt(d.duration); document.getElementById('progressFill').style.width=(d.progress*100)+'%'; };
    
    UIManager.prototype.loadStats = function() { var s=this; library.getStats().then(function(st){var e=document.getElementById('sidebarStats');if(e)e.innerHTML='<div class="sidebar-stat"><span class="stat-value">'+st.totalTracks+'</span><span class="stat-label">tracks</span></div><div class="sidebar-stat"><span class="stat-value">'+st.totalPlaylists+'</span><span class="stat-label">playlists</span></div><div class="sidebar-stat"><span class="stat-value">'+s.fmtSize(st.storageUsage)+'</span><span class="stat-label">used</span></div>';}).catch(function(){}); };
    
    UIManager.prototype.fmtSize = function(b) { if(!b)return'0 B'; var u=['B','KB','MB','GB'],i=Math.floor(Math.log(b)/Math.log(1024)); if(i>=u.length)i=u.length-1; return(b/Math.pow(1024,i)).toFixed(1)+' '+u[i]; };
    
    UIManager.prototype.checkSpotify = function() { if(services.checkSpotifyCallback()){this.notify('Spotify connected','success');this.loadStats();} };
    
    UIManager.prototype.exportLib = function() { var s=this; library.exportLibrary().then(function(d){var b=new Blob([d],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='musichub-'+new Date().toISOString().split('T')[0]+'.json';document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u);s.notify('Exported','success');}).catch(function(){s.notify('Failed','error');}); };
    
    UIManager.prototype.notify = function(m,t) { var c=document.getElementById('notificationContainer');if(!c)return;var e=document.createElement('div');e.className='notification '+(t||'info');e.textContent=m;c.appendChild(e);setTimeout(function(){e.style.opacity='0';e.style.transform='translateX(100%)';e.style.transition='all 0.3s ease';setTimeout(function(){if(e.parentNode)e.parentNode.removeChild(e);},300);},3000); };
    
    UIManager.prototype.esc = function(s) { if(!s)return'';var d=document.createElement('div');if(d.textContent!==undefined)d.textContent=s;else d.innerText=s;return d.innerHTML; };
    
    UIManager.prototype.confirm = function(t,m,cb) {
        var o=document.getElementById('modal-overlay'),ct=document.getElementById('modal-content');
        ct.innerHTML='<div class="modal-header"><h3 class="modal-title">'+t+'</h3><span class="modal-close">X</span></div><p class="mb-4">'+m+'</p><div style="display:flex;gap:8px;"><button class="btn btn-secondary" id="cancelBtn">Cancel</button><button class="btn btn-danger" id="confirmBtn">Confirm</button></div>';
        o.classList.remove('hidden'); var cl=function(){o.classList.add('hidden');};
        ct.querySelector('.modal-close').addEventListener('click',cl);
        o.addEventListener('click',function(e){if(e.target===o)cl();});
        document.getElementById('cancelBtn').addEventListener('click',cl);
        document.getElementById('confirmBtn').addEventListener('click',function(){cl();cb();});
    };
    
    UIManager.prototype.bindPlayer = function() {
        var s=this;
        document.getElementById('playBtn').addEventListener('click',function(){player.toggle();});
        document.getElementById('prevBtn').addEventListener('click',function(){var p=queueManager.prev();if(p)player.play(p);});
        document.getElementById('nextBtn').addEventListener('click',function(){var n=queueManager.next();if(n)player.play(n);});
        document.getElementById('shuffleBtn').addEventListener('click',function(){queueManager.toggleShuffle();});
        document.getElementById('repeatBtn').addEventListener('click',function(){queueManager.toggleRepeat();});
        document.getElementById('volumeSlider').addEventListener('input',function(e){player.setVolume(e.target.value/100);});
        document.getElementById('progressBar').addEventListener('click',function(e){var r=this.getBoundingClientRect(),rt=(e.clientX-r.left)/r.width,d=player.getDuration();if(d)player.seek(rt*d);});
        document.getElementById('playerAddToPlaylistBtn').addEventListener('click',function(){var t=player.track;if(t)s.showAddPl(t.id);});
    };
    
    window.ui = new UIManager();
})();
