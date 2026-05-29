(function() {
    'use strict';
    function UIManager() { this.page='home'; this.tab='tracks'; this.st=null; }
    
    // ========== SKELETON LOADERS ==========
    UIManager.prototype.showSkeleton = function(container, type) {
        if(type === 'tracks') {
            container.innerHTML = '<div class="track-list">' + 
                Array(8).fill().map(function() { return `
                    <div class="track-row">
                        <div class="skeleton" style="width:30px;height:14px;margin:0 auto;"></div>
                        <div style="display:flex;gap:12px;">
                            <div class="skeleton" style="width:40px;height:40px;border-radius:8px;"></div>
                            <div><div class="skeleton skeleton-text" style="width:150px;"></div><div class="skeleton skeleton-text" style="width:100px;margin-top:4px;"></div></div>
                        </div>
                        <div class="skeleton skeleton-text" style="width:60px;"></div>
                        <div class="skeleton skeleton-text" style="width:40px;"></div>
                    </div>
                `; }).join('') + '</div>';
        } else if(type === 'artists') {
            container.innerHTML = '<div class="artist-grid">' + 
                Array(6).fill().map(function() { return `
                    <div class="artist-card">
                        <div class="skeleton" style="width:72px;height:72px;border-radius:50%;margin:0 auto 10px;"></div>
                        <div class="skeleton skeleton-text" style="width:100px;margin:0 auto 4px;"></div>
                        <div class="skeleton skeleton-text" style="width:60px;margin:0 auto;"></div>
                    </div>
                `; }).join('') + '</div>';
        } else if(type === 'albums') {
            container.innerHTML = '<div class="album-grid">' + 
                Array(6).fill().map(function() { return `
                    <div class="album-card">
                        <div class="skeleton skeleton-cover" style="width:100%;aspect-ratio:1;"></div>
                        <div class="skeleton skeleton-text" style="width:80%;margin-top:8px;"></div>
                        <div class="skeleton skeleton-text" style="width:60%;margin-top:4px;"></div>
                    </div>
                `; }).join('') + '</div>';
        }
    };
    
    // ========== RENDER SIDEBAR (ГЛАВНЫЙ МЕТОД) ==========
    UIManager.prototype.renderSidebar = function() {
        var nav = document.getElementById('sidebarNav');
        if(!nav) return;
        var items = [
            {p:'home', svg:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>', l:'Home'},
            {p:'library', svg:'<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>', l:'Library'},
            {p:'search', svg:'<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>', l:'Search'},
            {p:'upload', svg:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>', l:'Upload'},
            {p:'import', svg:'<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>', l:'Import'},
            {p:'playlists', svg:'<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>', l:'Playlists'}
        ];
        var html = '';
        for(var i=0; i<items.length; i++) {
            var active = (items[i].p === this.page) ? ' active' : '';
            html += '<a class="nav-item' + active + '" data-page="' + items[i].p + '">';
            html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">' + items[i].svg + '</svg>';
            html += items[i].l + '</a>';
        }
        nav.innerHTML = html;
    };
    
    UIManager.prototype.bindSidebar = function() {
        var s=this, nav=document.getElementById('sidebarNav');
        if(!nav) return;
        nav.addEventListener('click', function(e) {
            var el = e.target.closest('.nav-item');
            if(el) { e.preventDefault(); s.go(el.getAttribute('data-page')); }
        });
    };
    
    // ========== INIT ==========
    UIManager.prototype.init = function() {
        var s = this;
        this.renderSidebar();
        this.bindSidebar();
        this.bindTopbar();
        this.bindPlayer();
        this.bindKeys();
        this.checkSpotify();
        var p = storage.get('current_page', 'home');
        
        if(window.favorites) window.favorites.on('change', function() { s.loadStats(); });
        if(window.radioManager) radioManager.loadStations();
        
        var savedTheme = localStorage.getItem('musichub_theme');
        if(savedTheme === 'light') document.body.classList.add('light-theme');
        
        return this.go(p).then(function() { s.loadStats(); });
    };
    
    UIManager.prototype.bindTopbar = function() {
        var s = this;
        var exportBtn = document.getElementById('exportBtn');
        if(exportBtn) exportBtn.addEventListener('click', function() { s.exportLib(); });
        var searchInput = document.getElementById('globalSearch');
        if(searchInput) {
            searchInput.addEventListener('input', function() {
                var q = searchInput.value.trim();
                if(s.st) clearTimeout(s.st);
                if(q.length >= 2) {
                    s.st = setTimeout(function() { s.doSearch(q); }, 350);
                }
            });
        }
    };
    
    UIManager.prototype.bindKeys = function() {
        document.addEventListener('keydown', function(e) {
            if((e.ctrlKey||e.metaKey) && e.key==='k') {
                e.preventDefault();
                var i = document.getElementById('globalSearch');
                if(i) i.focus();
            }
            if(e.code === 'Space' && document.activeElement === document.body) {
                e.preventDefault();
                player.toggle();
            }
            if(e.key === 'Escape') {
                var modal = document.getElementById('modal-overlay');
                if(modal && !modal.classList.contains('hidden')) modal.classList.add('hidden');
            }
            // Медиа-клавиши
            if(e.code === 'MediaPlayPause') { e.preventDefault(); player.toggle(); }
            if(e.code === 'MediaNextTrack') { e.preventDefault(); var n = queueManager.next(); if(n) player.play(n); }
            if(e.code === 'MediaPrevTrack') { e.preventDefault(); var p = queueManager.prev(); if(p) player.play(p); }
        });
    };
    
    UIManager.prototype.go = function(page) {
        this.page = page;
        storage.set('current_page', page);
        this.renderSidebar();
        this.bindSidebar();
        var content = document.getElementById('content');
        if(!content) return Promise.resolve();
        content.innerHTML = '<div class="loading-container"><div class="loader-spinner"></div><span>Loading...</span></div>';
        var self = this;
        var promise;
        switch(page) {
            case 'home': promise = this.homePage(); break;
            case 'library': promise = this.libPage(); break;
            case 'search': promise = this.searchPage(); break;
            case 'upload': promise = this.uploadPage(); break;
            case 'import': promise = this.importPage(); break;
            case 'playlists': promise = this.plPage(); break;
            case 'settings': promise = this.setPage(); break;
            default: promise = Promise.resolve(); break;
        }
        return promise.catch(function(e) {
            content.innerHTML = '<div class="empty-state"><p>Error</p><span>' + e.message + '</span></div>';
        });
    };
    
    // ========== HOME PAGE ==========
    UIManager.prototype.homePage = function() {
        var s = this, c = document.getElementById('content');
        c.innerHTML = '<div class="page"><div class="page-header"><h1 class="page-title">Моя музыка</h1><p class="page-subtitle">Твоя библиотека</p></div><div class="quick-actions">' + 
            ['upload','import','library','search'].map(function(a) {
                return '<div class="action-card" data-action="' + a + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22">' + 
                {upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
                 import:'<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
                 library:'<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
                 search:'<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'}[a] + 
                '</svg><span>' + a.charAt(0).toUpperCase() + a.slice(1) + '</span></div>';
            }).join('') + 
            '</div><div class="section"><div class="section-header"><h2 class="section-title">Недавно добавленные</h2></div><div id="recentTracksContainer"></div></div><div class="section"><div class="section-header"><h2 class="section-title">Плейлисты</h2></div><div id="homePlaylistsContainer"></div></div></div>';
        
        c.querySelectorAll('.action-card').forEach(function(card) {
            card.addEventListener('click', function() { s.go(card.getAttribute('data-action')); });
        });
        
        var recentDiv = document.getElementById('recentTracksContainer');
        s.showSkeleton(recentDiv, 'tracks');
        library.getRecentTracks(8).then(function(tracks) {
            if(tracks.length === 0) {
                recentDiv.innerHTML = '<div class="empty-state"><p>Нет треков</p><span>Загрузи музыку</span></div>';
            } else {
                var html = '<div class="track-list">';
                for(var i=0; i<tracks.length; i++) html += s.trackRow(tracks[i], i);
                html += '</div>';
                recentDiv.innerHTML = html;
                s.bindRows(recentDiv);
            }
        }).catch(function() { recentDiv.innerHTML = '<div class="empty-state"><p>Ошибка</p></div>'; });
        
        var playlistsDiv = document.getElementById('homePlaylistsContainer');
        library.getPlaylists().then(function(pl) {
            if(pl.length === 0) {
                playlistsDiv.innerHTML = '<div class="empty-state"><p>Нет плейлистов</p></div>';
            } else {
                var html = '<div class="playlist-grid">';
                for(var i=0; i<Math.min(pl.length, 6); i++) html += s.plCard(pl[i]);
                html += '</div>';
                playlistsDiv.innerHTML = html;
                playlistsDiv.querySelectorAll('.playlist-card').forEach(function(card) {
                    card.addEventListener('click', function() { s.showPlModal(card.getAttribute('data-playlist-id')); });
                });
            }
        }).catch(function() { playlistsDiv.innerHTML = '<div class="empty-state"><p>Ошибка</p></div>'; });
        
        return Promise.resolve();
    };
    
    // ========== LIBRARY PAGE ==========
    UIManager.prototype.libPage = function() {
        var s = this, c = document.getElementById('content');
        c.innerHTML = '<div class="page"><div class="page-header"><h1 class="page-title">Библиотека</h1><div class="library-actions"><button class="btn btn-secondary btn-sm" id="findDupBtn">Найти дубликаты</button><button class="btn btn-danger btn-sm" id="remDupBtn">Удалить дубликаты</button></div></div><div class="tabs" id="libTabs"><button class="tab active" data-tab="tracks">Треки</button><button class="tab" data-tab="artists">Исполнители</button><button class="tab" data-tab="albums">Альбомы</button><button class="tab" data-tab="favorites">Избранное</button></div><div class="library-filters"><select id="sourceFilter" class="form-input" style="width:auto;"><option value="all">Все</option><option value="local">Локальные</option><option value="spotify">Spotify</option><option value="youtube">YouTube</option></select><select id="sortFilter" class="form-input" style="width:auto;"><option value="dateAdded">По дате</option><option value="title">По названию</option><option value="artist">По исполнителю</option><option value="playCount">По популярности</option></select></div><div id="libraryContent"></div></div>';
        
        document.getElementById('libTabs').addEventListener('click', function(e) {
            var el = e.target.closest('.tab');
            if(!el) return;
            document.querySelectorAll('#libTabs .tab').forEach(function(t) { t.classList.remove('active'); });
            el.classList.add('active');
            s.tab = el.getAttribute('data-tab');
            s.loadLib();
        });
        document.getElementById('sourceFilter').addEventListener('change', function() { s.loadLib(); });
        document.getElementById('sortFilter').addEventListener('change', function() { s.loadLib(); });
        document.getElementById('findDupBtn').addEventListener('click', function() {
            library.getDuplicates().then(function(d) { s.notify(d.length ? 'Найдено ' + d.length + ' дубликатов' : 'Дубликатов нет', 'info'); });
        });
        document.getElementById('remDupBtn').addEventListener('click', function() {
            s.confirm('Удалить дубликаты?', '', function() {
                library.removeDuplicates().then(function(r) { s.notify('Удалено ' + r.length, 'success'); s.loadLib(); s.loadStats(); });
            });
        });
        return this.loadLib();
    };
    
    UIManager.prototype.loadLib = function() {
        var s = this, ct = document.getElementById('libraryContent');
        if(!ct) return Promise.resolve();
        
        if(this.tab === 'tracks') s.showSkeleton(ct, 'tracks');
        else if(this.tab === 'artists') s.showSkeleton(ct, 'artists');
        else if(this.tab === 'albums') s.showSkeleton(ct, 'albums');
        else ct.innerHTML = '<div class="loading-container"><div class="loader-spinner"></div><span>Загрузка...</span></div>';
        
        var src = document.getElementById('sourceFilter').value;
        var sort = document.getElementById('sortFilter').value;
        var promise;
        
        if(this.tab === 'tracks') {
            promise = library.getTracks({source: src, sort: sort}).then(function(tracks) {
                if(tracks.length === 0) { ct.innerHTML = '<div class="empty-state"><p>Нет треков</p></div>'; return; }
                var html = '<div class="track-list">';
                for(var i=0; i<tracks.length; i++) html += s.trackRow(tracks[i], i);
                html += '</div>';
                ct.innerHTML = html;
                s.bindRows(ct);
            });
        } else if(this.tab === 'artists') {
            promise = library.getArtists().then(function(artists) {
                if(artists.length === 0) { ct.innerHTML = '<div class="empty-state"><p>Нет исполнителей</p></div>'; return; }
                var html = '<div class="artist-grid">';
                for(var i=0; i<artists.length; i++) {
                    html += '<div class="artist-card"><div class="artist-card-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><div class="artist-card-name">' + s.esc(artists[i].name) + '</div><div class="artist-card-info">' + artists[i].trackCount + ' треков</div></div>';
                }
                html += '</div>';
                ct.innerHTML = html;
            });
        } else if(this.tab === 'albums') {
            promise = library.getAlbums().then(function(albums) {
                if(albums.length === 0) { ct.innerHTML = '<div class="empty-state"><p>Нет альбомов</p></div>'; return; }
                var html = '<div class="album-grid">';
                for(var i=0; i<albums.length; i++) {
                    html += '<div class="album-card"><div class="album-card-cover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg></div><div class="album-card-name">' + s.esc(albums[i].name) + '</div><div class="album-card-artist">' + s.esc(albums[i].artist) + '</div></div>';
                }
                html += '</div>';
                ct.innerHTML = html;
            });
        } else if(this.tab === 'favorites') {
            if(window.favorites) {
                promise = window.favorites.getTracks().then(function(tracks) {
                    if(tracks.length === 0) { ct.innerHTML = '<div class="empty-state"><p>Нет избранного</p><span>❤️ Лайкай треки</span></div>'; return; }
                    var html = '<div class="track-list">';
                    for(var i=0; i<tracks.length; i++) html += s.trackRow(tracks[i], i);
                    html += '</div>';
                    ct.innerHTML = html;
                    s.bindRows(ct);
                });
            } else {
                promise = Promise.resolve();
            }
        }
        return promise.catch(function() { ct.innerHTML = '<div class="empty-state"><p>Ошибка</p></div>'; });
    };
    
    // ========== SEARCH PAGE ==========
    UIManager.prototype.searchPage = function() {
        document.getElementById('content').innerHTML = '<div class="page"><div class="page-header"><h1 class="page-title">Поиск</h1></div><div id="searchResults"><div class="empty-state"><p>Введи запрос</p><span>Ctrl+K для поиска</span></div></div></div>';
        return Promise.resolve();
    };
    
    UIManager.prototype.doSearch = function(query) {
        var self = this;
        if(this.page !== 'search') {
            this.go('search').then(function() { self.doSearch(query); });
            return;
        }
        var container = document.getElementById('searchResults');
        if(!container) return;
        container.innerHTML = '<div class="loading-container"><div class="loader-spinner"></div><span>Поиск...</span></div>';
        library.search(query).then(function(results) {
            if(results.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>Ничего не найдено</p></div>';
                return;
            }
            var html = '<div class="track-list">';
            for(var i=0; i<results.length; i++) html += self.trackRow(results[i], i);
            html += '</div>';
            container.innerHTML = html;
            self.bindRows(container);
        }).catch(function() { container.innerHTML = '<div class="empty-state"><p>Ошибка</p></div>'; });
    };
    
    // ========== UPLOAD PAGE ==========
    UIManager.prototype.uploadPage = function() {
        var self = this, c = document.getElementById('content');
        c.innerHTML = '<div class="page"><div class="page-header"><h1 class="page-title">Загрузка</h1><p class="page-subtitle">MP3, WAV, FLAC, OGG, AAC, M4A</p></div><div class="upload-area" id="uploadArea"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><p>Перетащи файлы сюда</p><span>или</span><button class="btn btn-primary" id="selectFilesBtn">Выбрать файлы</button></div><input type="file" id="fileInput" multiple accept=".mp3,.wav,.flac,.ogg,.aac,.m4a" hidden><div id="uploadProgress" class="hidden mt-4"></div></div>';
        
        var area = document.getElementById('uploadArea'), fileInput = document.getElementById('fileInput'), progressDiv = document.getElementById('uploadProgress');
        document.getElementById('selectFilesBtn').addEventListener('click', function() { fileInput.click(); });
        area.addEventListener('dragover', function(e) { e.preventDefault(); area.classList.add('dragover'); });
        area.addEventListener('dragleave', function() { area.classList.remove('dragover'); });
        area.addEventListener('drop', function(e) {
            e.preventDefault();
            area.classList.remove('dragover');
            if(e.dataTransfer.files.length) self.doUpload(e.dataTransfer.files, area, progressDiv);
        });
        fileInput.addEventListener('change', function() { if(fileInput.files.length) self.doUpload(fileInput.files, area, progressDiv); });
        return Promise.resolve();
    };
    
    UIManager.prototype.doUpload = function(files, area, progressDiv) {
        var self = this;
        area.classList.add('hidden');
        progressDiv.classList.remove('hidden');
        progressDiv.innerHTML = '<div class="loading-container"><div class="loader-spinner"></div><span>Загрузка...</span></div>';
        uploadManager.uploadFiles(files).then(function(result) {
            progressDiv.innerHTML = '<div class="empty-state"><p>✅ Загружено: ' + result.uploaded.length + '</p>' + (result.failed.length ? '<span>Ошибок: ' + result.failed.length + '</span>' : '') + '</div>';
            self.notify('Готово', 'success');
            self.loadStats();
            setTimeout(function() {
                area.classList.remove('hidden');
                progressDiv.classList.add('hidden');
            }, 2000);
        }).catch(function() {
            progressDiv.innerHTML = '<div class="empty-state"><p>❌ Ошибка</p></div>';
            self.notify('Ошибка загрузки', 'error');
        });
    };
    
    // ========== IMPORT PAGE ==========
    UIManager.prototype.importPage = function() {
        var self = this, c = document.getElementById('content'), servicesList = services.getAll();
        var html = '<div class="page"><div class="page-header"><h1 class="page-title">Импорт</h1></div><div class="settings-section"><h2 class="settings-section-title">Сервисы</h2><div class="services-grid">';
        for(var i=0; i<servicesList.length; i++) {
            var sv = servicesList[i];
            html += '<div class="service-card' + (sv.connected ? ' connected' : '') + '"><div class="service-card-header"><div class="service-card-icon" style="background:' + sv.color + '20;color:' + sv.color + ';">' + sv.name.charAt(0) + '</div><div><div class="service-card-name">' + sv.name + '</div><div class="service-card-status' + (sv.connected ? ' connected' : '') + '">' + (sv.connected ? 'Подключен' : 'Не подключен') + '</div></div></div><div class="service-card-actions">' + (sv.connected ? '<button class="btn btn-primary btn-sm start-import" data-service="' + sv.id + '">Импорт</button>' : '<button class="btn btn-secondary btn-sm connect-service" data-service="' + sv.id + '">Подключить</button>') + '</div></div>';
        }
        html += '</div></div><div class="settings-section"><h2 class="settings-section-title">Файлы</h2><div class="import-options"><div class="import-option-card" id="importJSON"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>JSON</span></div><div class="import-option-card" id="importCSV"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg><span>CSV</span></div></div><input type="file" id="importFileInput" accept=".json,.csv" hidden></div></div>';
        c.innerHTML = html;
        
        c.querySelectorAll('.connect-service').forEach(function(btn) {
            btn.addEventListener('click', function() { self.showConn(btn.getAttribute('data-service')); });
        });
        c.querySelectorAll('.start-import').forEach(function(btn) {
            btn.addEventListener('click', function() { self.startImport(btn.getAttribute('data-service')); });
        });
        document.getElementById('importJSON').addEventListener('click', function() {
            var inp = document.getElementById('importFileInput');
            inp.accept = '.json';
            inp.onchange = function(e) {
                if(e.target.files[0]) {
                    importer.importFromJSON(e.target.files[0]).then(function(r) {
                        self.notify('Импортировано ' + r.importedCount, 'success');
                        self.loadStats();
                    }).catch(function() { self.notify('Ошибка', 'error'); });
                }
            };
            inp.click();
        });
        document.getElementById('importCSV').addEventListener('click', function() {
            var inp = document.getElementById('importFileInput');
            inp.accept = '.csv';
            inp.onchange = function(e) {
                if(e.target.files[0]) {
                    importer.importFromCSV(e.target.files[0]).then(function(r) {
                        self.notify('Импортировано ' + r.importedCount, 'success');
                        self.loadStats();
                    }).catch(function() { self.notify('Ошибка', 'error'); });
                }
            };
            inp.click();
        });
        return Promise.resolve();
    };
    
    UIManager.prototype.startImport = function(serviceId) {
        var self = this;
        this.notify('Импорт...', 'info');
        if(serviceId === 'spotify') {
            var auth = storage.get('spotify_auth');
            if(!auth || !auth.accessToken) { self.notify('Не подключен Spotify', 'error'); return; }
            importer.importFromSpotify(auth.accessToken, {}).then(function(r) {
                self.notify('Импортировано ' + r.tracks.length + ' треков', 'success');
                self.loadStats();
            }).catch(function(e) { self.notify(e.message, 'error'); });
        } else if(serviceId === 'youtube') {
            var yt = storage.get('youtube_config');
            if(!yt || !yt.apiKey) { self.notify('Не подключен YouTube', 'error'); return; }
            importer.importFromYouTube(yt.apiKey, {}).then(function(r) {
                self.notify('Импортировано ' + r.tracks.length + ' треков', 'success');
                self.loadStats();
            }).catch(function(e) { self.notify(e.message, 'error'); });
        } else {
            self.notify('Недоступно', 'error');
        }
    };
    
    // ========== PLAYLISTS PAGE ==========
    UIManager.prototype.plPage = function() {
        var self = this, c = document.getElementById('content');
        return library.getPlaylists().then(function(playlists) {
            var html = '<div class="page"><div class="page-header"><h1 class="page-title">Плейлисты</h1><button class="btn btn-primary" id="createPlBtn">+ Создать</button></div>';
            if(playlists.length === 0) {
                html += '<div class="empty-state"><p>Нет плейлистов</p><span>Создай первый плейлист</span></div>';
            } else {
                html += '<div class="playlist-grid">';
                for(var i=0; i<playlists.length; i++) html += self.plCard(playlists[i]);
                html += '</div>';
            }
            html += '</div>';
            c.innerHTML = html;
            document.getElementById('createPlBtn').addEventListener('click', function() { self.showCreatePl(); });
            c.querySelectorAll('.playlist-card').forEach(function(card) {
                card.addEventListener('click', function() { self.showPlModal(card.getAttribute('data-playlist-id')); });
            });
        });
    };
    
    // ========== SETTINGS PAGE ==========
    UIManager.prototype.setPage = function() {
        var self = this, c = document.getElementById('content'), servicesList = services.getAll();
        var html = '<div class="page"><div class="page-header"><h1 class="page-title">Настройки</h1></div><div class="settings-section"><h2 class="settings-section-title">Сервисы</h2><div class="services-grid">';
        for(var i=0; i<servicesList.length; i++) {
            var sv = servicesList[i];
            html += '<div class="service-card' + (sv.connected ? ' connected' : '') + '"><div class="service-card-header"><div class="service-card-icon" style="background:' + sv.color + '20;color:' + sv.color + ';">' + sv.name.charAt(0) + '</div><div><div class="service-card-name">' + sv.name + '</div><div class="service-card-status' + (sv.connected ? ' connected' : '') + '">' + (sv.connected ? 'Подключен' : 'Не подключен') + '</div></div></div><div class="service-card-actions">' + (sv.connected ? '<button class="btn btn-secondary btn-sm disconnect-svc" data-service="' + sv.id + '">Отключить</button>' : '<button class="btn btn-primary btn-sm connect-svc" data-service="' + sv.id + '">Подключить</button>') + '</div></div>';
        }
        html += '</div></div><div class="settings-section"><h2 class="settings-section-title">Данные</h2><div class="data-actions"><button class="btn btn-secondary" id="exportDataBtn">Экспорт JSON</button><button class="btn btn-danger" id="clearDataBtn">Очистить всё</button></div></div></div>';
        c.innerHTML = html;
        
        c.querySelectorAll('.connect-svc').forEach(function(btn) {
            btn.addEventListener('click', function() { self.showConn(btn.getAttribute('data-service')); });
        });
        c.querySelectorAll('.disconnect-svc').forEach(function(btn) {
            btn.addEventListener('click', function() {
                services.disconnect(btn.getAttribute('data-service'));
                self.notify('Отключено', 'success');
                self.go('settings');
            });
        });
        document.getElementById('exportDataBtn').addEventListener('click', function() { self.exportLib(); });
        document.getElementById('clearDataBtn').addEventListener('click', function() {
            self.confirm('Очистить всё?', 'Все треки и плейлисты будут удалены', function() {
                db.clearAll().then(function() {
                    storage.remove('play_history');
                    storage.remove('queue');
                    self.notify('Очищено', 'success');
                    self.loadStats();
                    self.go('home');
                });
            });
        });
        return Promise.resolve();
    };
    
    // ========== TRACK ROW ==========
    UIManager.prototype.trackRow = function(track, index) {
        var duration = track.duration ? player.fmt(track.duration / 1000) : '--:--';
        var source = track.source === 'local' ? 'Мой файл' : track.source;
        var isFav = (window.favorites && window.favorites.isFavorite(track.id)) ? true : false;
        var favIcon = isFav ? '❤️' : '♡';
        return '<div class="track-row" data-track=\'' + this.esc(JSON.stringify(track)) + '\'><span class="track-row-index">' + (index + 1) + '</span><div class="track-row-info"><div class="track-row-cover-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div><div class="track-row-text"><div class="track-row-title">' + this.esc(track.title) + '</div><div class="track-row-artist">' + this.esc(track.artist) + '</div></div></div><span class="track-row-source">' + this.esc(source) + '</span><span class="track-row-duration">' + duration + '</span><span class="track-row-fav" style="cursor:pointer;">' + favIcon + '</span></div>';
    };
    
    UIManager.prototype.plCard = function(playlist) {
        var count = playlist.tracks ? playlist.tracks.length : 0;
        return '<div class="playlist-card" data-playlist-id="' + playlist.id + '"><div class="playlist-card-cover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="36" height="36"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></div><div class="playlist-card-name">' + this.esc(playlist.name) + '</div><div class="playlist-card-count">' + count + ' треков</div></div>';
    };
    
    // ========== BIND ROWS (клики, лайки, контекстное меню) ==========
    UIManager.prototype.bindRows = function(container) {
        var self = this;
        var rows = container.querySelectorAll('.track-row');
        for(var i=0; i<rows.length; i++) {
            (function(row) {
                row.addEventListener('click', function(e) {
                    if(e.target.classList && e.target.classList.contains('track-row-fav')) return;
                    try {
                        var track = JSON.parse(row.getAttribute('data-track'));
                        player.play(track);
                        queueManager.add(track);
                    } catch(e) {}
                });
                
                var favSpan = row.querySelector('.track-row-fav');
                if(favSpan) {
                    favSpan.addEventListener('click', function(e) {
                        e.stopPropagation();
                        try {
                            var track = JSON.parse(row.getAttribute('data-track'));
                            if(window.favorites) {
                                window.favorites.toggle(track);
                                var isFav = window.favorites.isFavorite(track.id);
                                favSpan.textContent = isFav ? '❤️' : '♡';
                                self.notify(isFav ? 'В избранное' : 'Из избранного', 'success');
                                if(self.page === 'library' && self.tab === 'favorites') self.loadLib();
                            }
                        } catch(e) {}
                    });
                }
                
                row.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                    var trackData = row.getAttribute('data-track');
                    if(!trackData) return;
                    try {
                        var track = JSON.parse(trackData);
                        var isFav = window.favorites ? window.favorites.isFavorite(track.id) : false;
                        var items = [
                            { label: '▶ Слушать', action: function() { player.play(track); } },
                            { label: '📋 В очередь', action: function() { queueManager.add(track); } },
                            { label: isFav ? '❤️ Из избранного' : '♡ В избранное', action: function() {
                                if(window.favorites) {
                                    window.favorites.toggle(track);
                                    var newIsFav = window.favorites.isFavorite(track.id);
                                    if(favSpan) favSpan.textContent = newIsFav ? '❤️' : '♡';
                                    self.notify(newIsFav ? 'В избранное' : 'Из избранного', 'success');
                                }
                            } },
                            { label: '📁 В плейлист', action: function() { self.showAddPl(track.id); } },
                            { label: '🗑️ Удалить', action: function() {
                                self.confirm('Удалить трек', 'Удалить "' + track.title + '"?', function() {
                                    db.deleteTrack(track.id).then(function() {
                                        if(window.favorites) window.favorites.remove(track.id);
                                        self.loadLib();
                                        self.notify('Удалено', 'success');
                                    });
                                });
                            } }
                        ];
                        if(window.contextMenu) window.contextMenu.show(e.clientX, e.clientY, items);
                    } catch(e) {}
                });
            })(rows[i]);
        }
    };
    
    // ========== MODALS ==========
    UIManager.prototype.showConn = function(serviceId) {
        var self = this, overlay = document.getElementById('modal-overlay'), content = document.getElementById('modal-content');
        var html = '';
        if(serviceId === 'spotify') html = '<div class="modal-header"><h3 class="modal-title">Spotify</h3><span class="modal-close">✕</span></div><div class="form-group"><label class="form-label">Client ID</label><input type="text" class="form-input" id="modalInp" placeholder="Введите Client ID"></div><button class="btn btn-primary" id="modalSub" style="width:100%;">Подключить</button>';
        else if(serviceId === 'youtube') html = '<div class="modal-header"><h3 class="modal-title">YouTube</h3><span class="modal-close">✕</span></div><div class="form-group"><label class="form-label">API Key</label><input type="text" class="form-input" id="modalInp" placeholder="Введите API Key"></div><button class="btn btn-primary" id="modalSub" style="width:100%;">Подключить</button>';
        else if(serviceId === 'soundcloud') html = '<div class="modal-header"><h3 class="modal-title">SoundCloud</h3><span class="modal-close">✕</span></div><div class="form-group"><label class="form-label">Client ID</label><input type="text" class="form-input" id="modalInp" placeholder="Введите Client ID"></div><button class="btn btn-primary" id="modalSub" style="width:100%;">Подключить</button>';
        content.innerHTML = html;
        overlay.classList.remove('hidden');
        var close = function() { overlay.classList.add('hidden'); };
        content.querySelector('.modal-close').addEventListener('click', close);
        overlay.addEventListener('click', function(e) { if(e.target === overlay) close(); });
        document.getElementById('modalSub').addEventListener('click', function() {
            var val = document.getElementById('modalInp').value.trim();
            if(!val) return;
            if(serviceId === 'spotify') services.connectSpotify(val);
            else if(serviceId === 'youtube') { services.connectYouTube(val); close(); self.notify('Подключено', 'success'); self.go('settings'); }
            else if(serviceId === 'soundcloud') { services.connectSoundCloud(val); close(); self.notify('Подключено', 'success'); self.go('settings'); }
        });
    };
    
    UIManager.prototype.showCreatePl = function() {
        var self = this, overlay = document.getElementById('modal-overlay'), content = document.getElementById('modal-content');
        content.innerHTML = '<div class="modal-header"><h3 class="modal-title">Новый плейлист</h3><span class="modal-close">✕</span></div><div class="form-group"><label class="form-label">Название</label><input type="text" class="form-input" id="plName" placeholder="Название"></div><button class="btn btn-primary" id="savePl" style="width:100%;">Создать</button>';
        overlay.classList.remove('hidden');
        var close = function() { overlay.classList.add('hidden'); };
        content.querySelector('.modal-close').addEventListener('click', close);
        overlay.addEventListener('click', function(e) { if(e.target === overlay) close(); });
        document.getElementById('savePl').addEventListener('click', function() {
            var name = document.getElementById('plName').value.trim() || 'Новый плейлист';
            library.createPlaylist(name, '').then(function() {
                self.notify('Создано', 'success');
                close();
                self.go('playlists');
            });
        });
    };
    
    UIManager.prototype.showPlModal = function(playlistId) {
        var self = this, overlay = document.getElementById('modal-overlay'), content = document.getElementById('modal-content');
        library.getPlaylist(playlistId).then(function(playlist) {
            if(!playlist) return;
            library.getPlaylistTracks(playlistId).then(function(tracks) {
                var html = '<div class="modal-header"><h3 class="modal-title">' + self.esc(playlist.name) + '</h3><span class="modal-close">✕</span></div><p class="text-muted text-sm mb-4">' + playlist.tracks.length + ' треков</p><div class="track-list">';
                for(var i=0; i<tracks.length; i++) html += self.trackRow(tracks[i], i);
                html += '</div><div class="mt-4"><button class="btn btn-secondary btn-sm" id="playAllBtn">▶ Слушать всё</button> <button class="btn btn-danger btn-sm" id="delPlBtn">🗑️ Удалить</button></div>';
                content.innerHTML = html;
                overlay.classList.remove('hidden');
                var close = function() { overlay.classList.add('hidden'); };
                content.querySelector('.modal-close').addEventListener('click', close);
                overlay.addEventListener('click', function(e) { if(e.target === overlay) close(); });
                self.bindRows(content);
                document.getElementById('playAllBtn').addEventListener('click', function() {
                    if(tracks.length) {
                        queueManager.clear();
                        for(var i=0; i<tracks.length; i++) queueManager.add(tracks[i]);
                        player.play(tracks[0]);
                        close();
                    }
                });
                document.getElementById('delPlBtn').addEventListener('click', function() {
                    library.deletePlaylist(playlistId).then(function() {
                        self.notify('Удалено', 'success');
                        close();
                        self.go('playlists');
                    });
                });
            });
        });
    };
    
    UIManager.prototype.showAddPl = function(trackId) {
        var self = this, overlay = document.getElementById('modal-overlay'), content = document.getElementById('modal-content');
        library.getPlaylists().then(function(playlists) {
            var html = '<div class="modal-header"><h3 class="modal-title">В плейлист</h3><span class="modal-close">✕</span></div>';
            if(playlists.length === 0) {
                html += '<p class="text-muted">Нет плейлистов</p>';
            } else {
                for(var i=0; i<playlists.length; i++) {
                    html += '<div class="playlist-option" data-id="' + playlists[i].id + '">📁 ' + self.esc(playlists[i].name) + ' (' + playlists[i].tracks.length + ')</div>';
                }
            }
            html += '<button class="btn btn-secondary btn-sm mt-4" id="newPlBtn">+ Новый плейлист</button>';
            content.innerHTML = html;
            overlay.classList.remove('hidden');
            var close = function() { overlay.classList.add('hidden'); };
            content.querySelector('.modal-close').addEventListener('click', close);
            overlay.addEventListener('click', function(e) { if(e.target === overlay) close(); });
            content.querySelectorAll('.playlist-option').forEach(function(opt) {
                opt.addEventListener('click', function() {
                    library.addToPlaylist(opt.getAttribute('data-id'), trackId).then(function() {
                        self.notify('Добавлено', 'success');
                        close();
                    });
                });
            });
            document.getElementById('newPlBtn').addEventListener('click', function() { close(); self.showCreatePl(); });
        });
    };
    
    UIManager.prototype.confirm = function(title, message, callback) {
        var overlay = document.getElementById('modal-overlay'), content = document.getElementById('modal-content');
        content.innerHTML = '<div class="modal-header"><h3 class="modal-title">' + title + '</h3><span class="modal-close">✕</span></div><p class="mb-4">' + message + '</p><div style="display:flex;gap:8px;"><button class="btn btn-secondary" id="cancelBtn">Отмена</button><button class="btn btn-danger" id="confirmBtn">Подтвердить</button></div>';
        overlay.classList.remove('hidden');
        var close = function() { overlay.classList.add('hidden'); };
        content.querySelector('.modal-close').addEventListener('click', close);
        overlay.addEventListener('click', function(e) { if(e.target === overlay) close(); });
        document.getElementById('cancelBtn').addEventListener('click', close);
        document.getElementById('confirmBtn').addEventListener('click', function() { close(); callback(); });
    };
    
    // ========== PLAYER UI ==========
    UIManager.prototype.bindPlayer = function() {
        var self = this;
        document.getElementById('playBtn').addEventListener('click', function() { player.toggle(); });
        document.getElementById('prevBtn').addEventListener('click', function() { var p = queueManager.prev(); if(p) player.play(p); });
        document.getElementById('nextBtn').addEventListener('click', function() { var n = queueManager.next(); if(n) player.play(n); });
        document.getElementById('shuffleBtn').addEventListener('click', function() { queueManager.toggleShuffle(); });
        document.getElementById('repeatBtn').addEventListener('click', function() { queueManager.toggleRepeat(); });
        document.getElementById('volumeSlider').addEventListener('input', function(e) { player.setVolume(e.target.value / 100); });
        document.getElementById('progressBar').addEventListener('click', function(e) {
            var rect = this.getBoundingClientRect();
            var percent = (e.clientX - rect.left) / rect.width;
            var duration = player.getDuration();
            if(duration) player.seek(percent * duration);
        });
        document.getElementById('playerAddToPlaylistBtn').addEventListener('click', function() {
            var track = player.track;
            if(track) self.showAddPl(track.id);
        });
    };
    
    UIManager.prototype.updatePlayerUI = function() {
        var track = player.track;
        var titleEl = document.getElementById('playerTitle');
        var artistEl = document.getElementById('playerArtist');
        if(titleEl) titleEl.textContent = track ? track.title : 'Ничего не играет';
        if(artistEl) artistEl.textContent = track ? track.artist : 'Выбери трек';
        var playIcon = document.getElementById('playIcon');
        if(playIcon) playIcon.innerHTML = player.playing ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>' : '<polygon points="5 3 19 12 5 21 5 3"/>';
    };
    
    UIManager.prototype.updateProgress = function(data) {
        var currentTime = document.getElementById('currentTime');
        var totalTime = document.getElementById('totalTime');
        var fill = document.getElementById('progressFill');
        if(currentTime) currentTime.textContent = player.fmt(data.currentTime);
        if(totalTime) totalTime.textContent = player.fmt(data.duration);
        if(fill) fill.style.width = (data.progress * 100) + '%';
    };
    
    // ========== STATS & UTILS ==========
    UIManager.prototype.loadStats = function() {
        var self = this;
        library.getStats().then(function(stats) {
            var sidebarStats = document.getElementById('sidebarStats');
            if(sidebarStats) {
                sidebarStats.innerHTML = '<div class="sidebar-stat"><span class="stat-value">' + stats.totalTracks + '</span><span class="stat-label">треков</span></div><div class="sidebar-stat"><span class="stat-value">' + stats.totalPlaylists + '</span><span class="stat-label">плейлистов</span></div><div class="sidebar-stat"><span class="stat-value">' + self.fmtSize(stats.storageUsage) + '</span><span class="stat-label">занято</span></div>';
                if(window.favorites) {
                    var favCount = window.favorites.getAll().length;
                    sidebarStats.innerHTML += '<div class="sidebar-stat"><span class="stat-value">' + favCount + '</span><span class="stat-label">в избранном</span></div>';
                }
            }
        }).catch(function() {});
    };
    
    UIManager.prototype.fmtSize = function(bytes) {
        if(!bytes) return '0 B';
        var units = ['B', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(1024));
        if(i >= units.length) i = units.length - 1;
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
    };
    
    UIManager.prototype.checkSpotify = function() {
        if(services.checkSpotifyCallback()) {
            this.notify('Spotify подключен', 'success');
            this.loadStats();
        }
    };
    
    UIManager.prototype.exportLib = function() {
        var self = this;
        library.exportLibrary().then(function(data) {
            var blob = new Blob([data], {type: 'application/json'});
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'musichub-' + new Date().toISOString().split('T')[0] + '.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            self.notify('Экспортировано', 'success');
        }).catch(function() { self.notify('Ошибка экспорта', 'error'); });
    };
    
    UIManager.prototype.notify = function(message, type) {
        var container = document.getElementById('notificationContainer');
        if(!container) return;
        var notification = document.createElement('div');
        notification.className = 'notification ' + (type || 'info');
        var icon = type === 'success' ? '✅ ' : (type === 'error' ? '❌ ' : 'ℹ️ ');
        notification.textContent = icon + message;
        container.appendChild(notification);
        setTimeout(function() {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(function() {
                if(notification.parentNode) notification.parentNode.removeChild(notification);
            }, 300);
        }, 3000);
    };
    
    UIManager.prototype.esc = function(str) {
        if(!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };
    
    window.ui = new UIManager();
})();
