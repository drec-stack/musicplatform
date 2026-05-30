(function() {
    'use strict';
    
    function UIManager() { 
        this.page = 'home'; 
        this.tab = 'tracks'; 
        this.st = null;
        this._initialized = false;
        this.volumeBeforeMute = 70;
    }
    
    // ========================================
    // SKELETON LOADERS
    // ========================================
    
    UIManager.prototype.showSkeleton = function(container, type) {
        if (!container) return;
        if (type === 'tracks') {
            container.innerHTML = '<div class="track-list">' + 
                Array(5).fill().map(function() { return `
                    <div class="track-row">
                        <div class="skeleton" style="width:30px;height:14px;margin:0 auto;"></div>
                        <div style="display:flex;gap:12px;">
                            <div class="skeleton" style="width:40px;height:40px;border-radius:8px;"></div>
                            <div><div class="skeleton skeleton-text" style="width:150px;"></div><div class="skeleton skeleton-text" style="width:100px;margin-top:4px;"></div></div>
                        </div>
                        <div class="skeleton skeleton-text" style="width:60px;"></div>
                        <div class="skeleton skeleton-text" style="width:40px;"></div>
                        <div class="skeleton skeleton-text" style="width:24px;"></div>
                    </div>
                `; }).join('') + '</div>';
        } else if (type === 'artists') {
            container.innerHTML = '<div class="artist-grid">' + 
                Array(6).fill().map(function() { return `
                    <div class="artist-card">
                        <div class="skeleton" style="width:72px;height:72px;border-radius:50%;margin:0 auto 10px;"></div>
                        <div class="skeleton skeleton-text" style="width:100px;margin:0 auto 4px;"></div>
                        <div class="skeleton skeleton-text" style="width:60px;margin:0 auto;"></div>
                    </div>
                `; }).join('') + '</div>';
        } else if (type === 'albums') {
            container.innerHTML = '<div class="album-grid">' + 
                Array(6).fill().map(function() { return `
                    <div class="album-card">
                        <div class="skeleton skeleton-cover" style="width:100%;aspect-ratio:1;border-radius:8px;"></div>
                        <div class="skeleton skeleton-text" style="width:80%;margin-top:8px;"></div>
                        <div class="skeleton skeleton-text" style="width:60%;margin-top:4px;"></div>
                    </div>
                `; }).join('') + '</div>';
        }
    };
    
    // ========================================
    // RENDER SIDEBAR
    // ========================================
    
    UIManager.prototype.renderSidebar = function() {
        var n = document.getElementById('sidebarNav');
        if (!n) return;
        
        var items = [
            {p:'home', svg:'<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>', l:'Главная'},
            {p:'library', svg:'<path d="M4 6h16v12H4z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/>', l:'Библиотека'},
            {p:'search', svg:'<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>', l:'Поиск'},
            {p:'upload', svg:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>', l:'Загрузить'},
            {p:'playlists', svg:'<path d="M2 4h20v16H2z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="12" y2="12"/>', l:'Плейлисты'}
        ];
        
        var h = '';
        for (var i = 0; i < items.length; i++) {
            var activeClass = (items[i].p === this.page) ? ' active' : '';
            h += '<a class="nav-item' + activeClass + '" data-page="' + items[i].p + '">';
            h += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">' + items[i].svg + '</svg>';
            h += items[i].l + '</a>';
        }
        n.innerHTML = h;
        
        var footerNav = document.querySelector('.sidebar-footer .nav-item');
        if (footerNav) {
            if (this.page === 'settings') footerNav.classList.add('active');
            else footerNav.classList.remove('active');
        }
    };
    
    // ========================================
    // BIND SIDEBAR
    // ========================================
    
    UIManager.prototype.bindSidebar = function() {
        var s = this;
        var n = document.getElementById('sidebarNav');
        if (!n) return;
        
        n.addEventListener('click', function(e) {
            var el = e.target.closest ? e.target.closest('.nav-item') : null;
            if (el) {
                e.preventDefault();
                s.go(el.getAttribute('data-page'));
            }
        });
    };
    
    // ========================================
    // BIND TOPBAR
    // ========================================
    
    UIManager.prototype.bindTopbar = function() {
        var s = this;
        var exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', function() { s.exportLib(); });
        }
        
        var si = document.getElementById('globalSearch');
        if (si) {
            si.addEventListener('input', function() {
                var q = si.value.trim();
                if (s.st) clearTimeout(s.st);
                if (q.length >= 2) {
                    s.st = setTimeout(function() { s.doSearch(q); }, 350);
                }
            });
        }
    };
    
    // ========================================
    // BIND KEYS
    // ========================================
    
    UIManager.prototype.bindKeys = function() {
        var s = this;
        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                var i = document.getElementById('globalSearch');
                if (i) i.focus();
            }
            if (e.code === 'Space' && document.activeElement === document.body) {
                e.preventDefault();
                if (window.player) player.toggle();
            }
            if (e.key === 'Escape') {
                var o = document.getElementById('modal-overlay');
                if (o && !o.classList.contains('hidden')) o.classList.add('hidden');
            }
            if (e.code === 'MediaPlayPause') {
                e.preventDefault();
                if (window.player) player.toggle();
            }
            if (e.code === 'MediaNextTrack') {
                e.preventDefault();
                if (window.queueManager) {
                    var n = queueManager.next();
                    if (n && window.player) player.play(n);
                }
            }
            if (e.code === 'MediaPrevTrack') {
                e.preventDefault();
                if (window.queueManager) {
                    var p = queueManager.prev();
                    if (p && window.player) player.play(p);
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowUp') {
                e.preventDefault();
                var vol = document.getElementById('volumeSlider');
                if (vol) {
                    var newVol = Math.min(100, parseInt(vol.value) + 10);
                    vol.value = newVol;
                    if (window.player) player.setVolume(newVol / 100);
                    s.showVolumeToast(newVol);
                }
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowDown') {
                e.preventDefault();
                var vol = document.getElementById('volumeSlider');
                if (vol) {
                    var newVol = Math.max(0, parseInt(vol.value) - 10);
                    vol.value = newVol;
                    if (window.player) player.setVolume(newVol / 100);
                    s.showVolumeToast(newVol);
                }
            }
        });
    };
    
    UIManager.prototype.showVolumeToast = function(volume) {
        var toast = document.createElement('div');
        toast.className = 'volume-toast';
        var icon = volume === 0 ? '🔇' : (volume < 30 ? '🔈' : (volume < 70 ? '🔉' : '🔊'));
        toast.innerHTML = '<div class="volume-toast-icon">' + icon + '</div><div class="volume-toast-value">' + volume + '%</div><div class="volume-toast-bar"><div class="volume-toast-fill" style="width:' + volume + '%"></div></div>';
        document.body.appendChild(toast);
        setTimeout(function() { toast.classList.add('show'); }, 10);
        setTimeout(function() { 
            toast.classList.remove('show');
            setTimeout(function() { toast.remove(); }, 300);
        }, 1500);
    };
    
    // ========================================
    // INIT
    // ========================================
    
    UIManager.prototype.init = function() {
        var s = this;
        
        if (this._initialized) return Promise.resolve();
        this._initialized = true;
        
        var loader = document.getElementById('loader');
        var app = document.getElementById('app');
        if (loader && app) {
            setTimeout(function() {
                loader.classList.add('hidden');
                app.classList.remove('hidden');
            }, 500);
        }
        
        this.renderSidebar();
        this.bindSidebar();
        this.bindTopbar();
        this.bindPlayer();
        this.bindKeys();
        
        var p = storage.get('current_page', 'home');
        
        if (window.favorites) {
            window.favorites.on('change', function() { s.loadStats(); });
        }
        
        return this.go(p).then(function() { s.loadStats(); });
    };
    
    // ========================================
    // GO TO PAGE
    // ========================================
    
    UIManager.prototype.go = function(p) {
        this.page = p;
        storage.set('current_page', p);
        this.renderSidebar();
        this.bindSidebar();
        
        var c = document.getElementById('content');
        if (!c) return Promise.resolve();
        
        c.style.opacity = '0';
        c.style.transform = 'translateY(20px)';
        
        setTimeout(function() {
            c.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><span>Загрузка...</span></div>';
            c.style.opacity = '1';
            c.style.transform = 'translateY(0)';
        }, 200);
        
        var s = this;
        var pr;
        
        switch(p) {
            case 'home': pr = this.homePage(); break;
            case 'library': pr = this.libPage(); break;
            case 'search': pr = this.searchPage(); break;
            case 'upload': pr = this.uploadPage(); break;
            case 'playlists': pr = this.plPage(); break;
            case 'settings': pr = this.setPage(); break;
            default: pr = Promise.resolve(); break;
        }
        
        return pr.catch(function(e) {
            console.error('Page error:', e);
            c.innerHTML = '<div class="empty-state"><p>Ошибка</p><span>' + (e.message || 'Неизвестная ошибка') + '</span></div>';
        });
    };
    
    // ========================================
    // HOME PAGE
    // ========================================
    
    UIManager.prototype.homePage = function() {
        var s = this;
        var c = document.getElementById('content');
        
        c.innerHTML = '<div class="page">' +
            '<div class="page-header">' +
                '<h1 class="page-title">Добро пожаловать!</h1>' +
                '<p class="page-subtitle">Ваша персональная музыкальная платформа</p>' +
            '</div>' +
            '<div class="quick-actions">' +
                '<div class="action-card" data-action="upload">📤 Загрузить</div>' +
                '<div class="action-card" data-action="library">📚 Библиотека</div>' +
                '<div class="action-card" data-action="search">🔍 Поиск</div>' +
                '<div class="action-card" data-action="playlists">📋 Плейлисты</div>' +
            '</div>' +
            '<div class="section">' +
                '<div class="section-header">' +
                    '<h2 class="section-title">Недавно добавленные</h2>' +
                    '<span class="section-link" data-action="library">Все →</span>' +
                '</div>' +
                '<div id="recentTracksContainer" class="track-list"></div>' +
            '</div>' +
        '</div>';
        
        document.querySelectorAll('.action-card, .section-link').forEach(function(el) {
            el.addEventListener('click', function() {
                var action = this.dataset.action;
                if (action) s.go(action);
            });
        });
        
        var rd = document.getElementById('recentTracksContainer');
        if (rd && window.library) {
            s.showSkeleton(rd, 'tracks');
            library.getRecentTracks(8).then(function(t) {
                if (!t || t.length === 0) {
                    rd.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎵</div><p>Нет треков</p><span>Загрузите музыку, чтобы начать</span><button class="btn btn-primary mt-4" onclick="ui.go(\'upload\')">Загрузить</button></div>';
                } else {
                    var h = '<div class="track-list">';
                    for (var i = 0; i < t.length; i++) h += s.trackRow(t[i], i);
                    h += '</div>';
                    rd.innerHTML = h;
                    s.bindRows(rd);
                }
            }).catch(function() { 
                rd.innerHTML = '<div class="empty-state"><p>Ошибка загрузки треков</p></div>';
            });
        }
        
        return Promise.resolve();
    };
    
    // ========================================
    // LIBRARY PAGE
    // ========================================
    
    UIManager.prototype.libPage = function() {
        var s = this;
        var c = document.getElementById('content');
        
        c.innerHTML = '<div class="page"><div class="page-header"><h1 class="page-title">Библиотека</h1><p class="page-subtitle">Вся ваша музыка в одном месте</p><div class="library-actions"><button class="btn btn-secondary btn-sm" id="findDupBtn">🔍 Найти дубликаты</button><button class="btn btn-danger btn-sm" id="remDupBtn">🗑️ Удалить дубликаты</button></div></div><div class="tabs" id="libTabs"><button class="tab active" data-tab="tracks">🎵 Треки</button><button class="tab" data-tab="artists">🎤 Артисты</button><button class="tab" data-tab="albums">💿 Альбомы</button><button class="tab" data-tab="favorites">❤️ Избранное</button></div><div class="library-filters"><select id="sortFilter" class="form-input" style="width:auto;"><option value="dateAdded">📅 По дате</option><option value="title">🔤 По названию</option><option value="artist">👤 По артисту</option></select><select id="sourceFilter" class="form-input" style="width:auto;"><option value="all">📁 Все источники</option><option value="local">💾 Локальные</option><option value="demo">🎵 Демо</option></select></div><div id="libraryContent"></div></div>';
        
        document.getElementById('libTabs').addEventListener('click', function(e) {
            var el = e.target.closest ? e.target.closest('.tab') : null;
            if (!el) return;
            document.querySelectorAll('#libTabs .tab').forEach(function(t) { t.classList.remove('active'); });
            el.classList.add('active');
            s.tab = el.getAttribute('data-tab');
            s.loadLib();
        });
        
        var sortFilter = document.getElementById('sortFilter');
        var sourceFilter = document.getElementById('sourceFilter');
        if (sortFilter) sortFilter.addEventListener('change', function() { s.loadLib(); });
        if (sourceFilter) sourceFilter.addEventListener('change', function() { s.loadLib(); });
        
        var findBtn = document.getElementById('findDupBtn');
        var remBtn = document.getElementById('remDupBtn');
        if (findBtn && window.library) {
            findBtn.addEventListener('click', function() {
                library.getDuplicates().then(function(d) {
                    s.notify(d.length ? '🔍 Найдено ' + d.length + ' дубликатов' : '✨ Дубликатов не найдено', 'info');
                });
            });
        }
        if (remBtn && window.library) {
            remBtn.addEventListener('click', function() {
                s.confirm('Удалить дубликаты?', 'Это удалит повторяющиеся треки из библиотеки.', function() {
                    library.removeDuplicates().then(function(r) {
                        s.notify('🗑️ Удалено ' + r.length + ' дубликатов', 'success');
                        s.loadLib();
                        s.loadStats();
                    });
                });
            });
        }
        
        return this.loadLib();
    };
    
    UIManager.prototype.loadLib = function() {
        var s = this;
        var ct = document.getElementById('libraryContent');
        if (!ct) return Promise.resolve();
        
        var sortBy = document.getElementById('sortFilter') ? document.getElementById('sortFilter').value : 'dateAdded';
        var source = document.getElementById('sourceFilter') ? document.getElementById('sourceFilter').value : 'all';
        
        if (this.tab === 'tracks') s.showSkeleton(ct, 'tracks');
        else if (this.tab === 'artists') s.showSkeleton(ct, 'artists');
        else if (this.tab === 'albums') s.showSkeleton(ct, 'albums');
        else ct.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><span>Загрузка...</span></div>';
        
        var pr;
        
        if (this.tab === 'tracks') {
            if (!window.library) return Promise.resolve();
            pr = library.getTracks({ sort: sortBy }).then(function(tracks) {
                var filtered = tracks;
                if (source !== 'all') {
                    filtered = tracks.filter(function(t) { return t.source === source; });
                }
                if (!filtered || filtered.length === 0) {
                    ct.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎵</div><p>Нет треков</p><span>Загрузите музыку, чтобы начать</span><button class="btn btn-primary mt-4" onclick="ui.go(\'upload\')">Загрузить</button></div>';
                    return;
                }
                var h = '<div class="track-list">';
                for (var i = 0; i < filtered.length; i++) h += s.trackRow(filtered[i], i);
                h += '</div>';
                ct.innerHTML = h;
                s.bindRows(ct);
            });
        } else if (this.tab === 'artists') {
            if (!window.library) return Promise.resolve();
            pr = library.getArtists().then(function(a) {
                if (!a || a.length === 0) {
                    ct.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎤</div><p>Нет артистов</p></div>';
                    return;
                }
                var h = '<div class="artist-grid">';
                for (var i = 0; i < a.length; i++) {
                    h += '<div class="artist-card" data-artist="' + s.esc(a[i].name) + '"><div class="artist-card-avatar">🎤</div><div class="artist-card-name">' + s.esc(a[i].name) + '</div><div class="artist-card-info">' + a[i].trackCount + ' треков</div></div>';
                }
                h += '</div>';
                ct.innerHTML = h;
                ct.querySelectorAll('.artist-card').forEach(function(card) {
                    card.addEventListener('click', function() {
                        var artist = card.getAttribute('data-artist');
                        s.go('search');
                        var searchInput = document.getElementById('globalSearch');
                        if (searchInput) {
                            searchInput.value = artist;
                            s.doSearch(artist);
                        }
                    });
                });
            });
        } else if (this.tab === 'albums') {
            if (!window.library) return Promise.resolve();
            pr = library.getAlbums().then(function(a) {
                if (!a || a.length === 0) {
                    ct.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💿</div><p>Нет альбомов</p></div>';
                    return;
                }
                var h = '<div class="album-grid">';
                for (var i = 0; i < a.length; i++) {
                    h += '<div class="album-card"><div class="album-card-cover">💿</div><div class="album-card-name">' + s.esc(a[i].name) + '</div><div class="album-card-artist">' + s.esc(a[i].artist) + '</div></div>';
                }
                h += '</div>';
                ct.innerHTML = h;
            });
        } else if (this.tab === 'favorites') {
            if (window.favorites) {
                pr = window.favorites.getTracks().then(function(t) {
                    if (!t || t.length === 0) {
                        ct.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❤️</div><p>Нет избранных треков</p><span>Добавьте треки в избранное, чтобы они появились здесь</span></div>';
                        return;
                    }
                    var h = '<div class="track-list">';
                    for (var i = 0; i < t.length; i++) h += s.trackRow(t[i], i);
                    h += '</div>';
                    ct.innerHTML = h;
                    s.bindRows(ct);
                });
            } else {
                pr = Promise.resolve();
            }
        }
        
        return pr ? pr.catch(function() { ct.innerHTML = '<div class="empty-state"><p>Ошибка загрузки</p></div>'; }) : Promise.resolve();
    };
    
    // ========================================
    // SEARCH PAGE
    // ========================================
    
    UIManager.prototype.searchPage = function() {
        document.getElementById('content').innerHTML = '<div class="page"><div class="page-header"><h1 class="page-title">Поиск</h1><p class="page-subtitle">Найдите музыку в своей библиотеке</p></div><div id="searchResults"><div class="empty-state"><div class="empty-state-icon">🔍</div><p>Начните вводить текст для поиска</p><span>Нажмите Ctrl+K для фокуса на поиске</span></div></div></div>';
        return Promise.resolve();
    };
    
    UIManager.prototype.doSearch = function(q) {
        var s = this;
        if (this.page !== 'search') {
            this.go('search').then(function() { s.doSearch(q); });
            return;
        }
        
        var c = document.getElementById('searchResults');
        if (!c) return;
        c.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><span>Поиск "' + s.esc(q) + '"...</span></div>';
        
        if (!window.library) return;
        library.search(q).then(function(r) {
            if (!r || r.length === 0) {
                c.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><p>Ничего не найдено</p><span>Попробуйте другой запрос</span></div>';
                return;
            }
            var h = '<div class="track-list"><div style="padding:10px;color:#7a7a7a;">Найдено ' + r.length + ' треков</div>';
            for (var i = 0; i < r.length; i++) h += s.trackRow(r[i], i);
            h += '</div>';
            c.innerHTML = h;
            s.bindRows(c);
        }).catch(function() { c.innerHTML = '<div class="empty-state"><p>Ошибка поиска</p></div>'; });
    };
    
    // ========================================
    // UPLOAD PAGE
    // ========================================
    
    UIManager.prototype.uploadPage = function() {
        var s = this;
        var c = document.getElementById('content');
        
        c.innerHTML = '<div class="page"><div class="page-header"><h1 class="page-title">Загрузка музыки</h1><p class="page-subtitle">Поддерживаемые форматы: MP3, WAV, FLAC, OGG, AAC, M4A</p></div><div class="upload-area" id="uploadArea"><div class="upload-icon">📤</div><p>Перетащите файлы сюда</p><span>или</span><button class="btn btn-primary" id="selectFilesBtn" style="margin-top:16px;">Выберите файлы</button></div><input type="file" id="fileInput" multiple accept=".mp3,.wav,.flac,.ogg,.aac,.m4a" style="display:none;"><div id="uploadProgress" style="display:none;" class="mt-4"></div></div>';
        
        var a = document.getElementById('uploadArea');
        var inp = document.getElementById('fileInput');
        var pr = document.getElementById('uploadProgress');
        
        var selectBtn = document.getElementById('selectFilesBtn');
        if (selectBtn) selectBtn.addEventListener('click', function() { inp.click(); });
        
        if (a) {
            a.addEventListener('dragover', function(e) { e.preventDefault(); a.classList.add('dragover'); });
            a.addEventListener('dragleave', function() { a.classList.remove('dragover'); });
            a.addEventListener('drop', function(e) {
                e.preventDefault();
                a.classList.remove('dragover');
                if (e.dataTransfer.files.length && window.uploadManager) s.doUp(e.dataTransfer.files, a, pr);
            });
        }
        
        if (inp) {
            inp.addEventListener('change', function() { if (inp.files.length && window.uploadManager) s.doUp(inp.files, a, pr); });
        }
        
        return Promise.resolve();
    };
    
    UIManager.prototype.doUp = function(f, a, pr) {
        var s = this;
        if (a) a.style.display = 'none';
        if (pr) {
            pr.style.display = 'block';
            pr.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><span>Загрузка ' + f.length + ' файлов...</span></div>';
        }
        
        if (!window.uploadManager) return;
        uploadManager.uploadFiles(f).then(function(r) {
            if (pr) {
                pr.innerHTML = '<div class="empty-state"><p>✅ Загружено: ' + r.uploaded.length + '</p>' + (r.failed.length ? '<span>⚠️ Ошибок: ' + r.failed.length + '</span>' : '') + '</div>';
            }
            s.notify('✅ ' + r.uploaded.length + ' файлов загружено', 'success');
            s.loadStats();
            setTimeout(function() { 
                if (a) a.style.display = 'block'; 
                if (pr) pr.style.display = 'none'; 
                s.go('library');
            }, 2000);
        }).catch(function(e) { 
            if (pr) pr.innerHTML = '<div class="empty-state"><p>❌ Ошибка загрузки</p><span>' + e.message + '</span></div>'; 
            s.notify('Ошибка загрузки', 'error'); 
        });
    };
    
    // ========================================
    // PLAYLISTS PAGE
    // ========================================
    
    UIManager.prototype.plPage = function() {
        var s = this;
        var c = document.getElementById('content');
        
        if (!window.library) return Promise.resolve();
        
        return library.getPlaylists().then(function(pl) {
            var h = '<div class="page"><div class="page-header"><h1 class="page-title">Плейлисты</h1><button class="btn btn-primary" id="createPlBtn">+ Создать плейлист</button></div>';
            
            if (!pl || pl.length === 0) {
                h += '<div class="empty-state"><div class="empty-state-icon">📋</div><p>У вас пока нет плейлистов</p><span>Создайте свой первый плейлист</span></div>';
            } else {
                h += '<div class="playlist-grid">';
                for (var i = 0; i < pl.length; i++) h += s.plCard(pl[i]);
                h += '</div>';
            }
            h += '</div>';
            c.innerHTML = h;
            
            var createBtn = document.getElementById('createPlBtn');
            if (createBtn) createBtn.addEventListener('click', function() { s.showCreatePl(); });
            
            c.querySelectorAll('.playlist-card').forEach(function(card) {
                card.addEventListener('click', function() { s.showPlModal(card.getAttribute('data-playlist-id')); });
            });
        });
    };
    
    UIManager.prototype.plCard = function(p) {
        if (!p) return '';
        var c = p.tracks ? p.tracks.length : 0;
        return '<div class="playlist-card" data-playlist-id="' + p.id + '"><div class="playlist-card-cover">📁</div><div class="playlist-card-name">' + this.esc(p.name) + '</div><div class="playlist-card-count">' + c + ' треков</div></div>';
    };
    
    // ========================================
    // SETTINGS PAGE
    // ========================================
    
    UIManager.prototype.setPage = function() {
        var s = this;
        var c = document.getElementById('content');
        
        var h = '<div class="page"><div class="page-header"><h1 class="page-title">Настройки</h1><p class="page-subtitle">Настройте приложение под себя</p></div><div class="settings-section"><h2 class="settings-section-title">Управление данными</h2><div class="data-actions"><button class="btn btn-secondary" id="exportDataBtn">📤 Экспортировать библиотеку</button><button class="btn btn-danger" id="clearDataBtn">🗑️ Очистить все данные</button></div></div><div class="settings-section"><h2 class="settings-section-title">О приложении</h2><div class="data-actions"><p class="text-muted">MusicHub v1.0.0 - Ваша персональная музыкальная платформа</p><p class="text-muted">© 2026 MusicHub. Все права защищены.</p></div></div></div>';
        
        c.innerHTML = h;
        
        var exportBtn = document.getElementById('exportDataBtn');
        if (exportBtn) exportBtn.addEventListener('click', function() { s.exportLib(); });
        
        var clearBtn = document.getElementById('clearDataBtn');
        if (clearBtn && window.db) {
            clearBtn.addEventListener('click', function() {
                s.confirm('Очистка данных', '⚠️ Это удалит ВСЕ треки и плейлисты. Отменить нельзя!', function() {
                    db.clearAll().then(function() {
                        storage.remove('play_history');
                        storage.remove('queue');
                        localStorage.clear();
                        s.notify('Все данные очищены', 'success');
                        s.loadStats();
                        s.go('home');
                    });
                });
            });
        }
        
        return Promise.resolve();
    };
    
    // ========================================
    // TRACK ROW
    // ========================================
    
    UIManager.prototype.trackRow = function(t, i) {
        if (!t) return '';
        var d = (window.player && t.duration) ? player.fmt(t.duration / 1000) : '--:--';
        var src = t.source === 'local' ? '📁' : (t.source === 'demo' ? '🎵' : (t.source === 'spotify' ? '🎧' : '🎵'));
        var isFav = (window.favorites && window.favorites.isFavorite(t.id)) ? true : false;
        var favIcon = isFav ? '❤️' : '🤍';
        
        return '<div class="track-row" data-track=\'' + this.esc(JSON.stringify(t)) + '\'><span class="track-row-index">' + (i + 1) + '</span><div class="track-row-info"><div class="track-row-cover-placeholder">' + src + '</div><div class="track-row-text"><div class="track-row-title">' + this.esc(t.title) + '</div><div class="track-row-artist">' + this.esc(t.artist) + '</div></div></div><span class="track-row-source">' + src + '</span><span class="track-row-duration">' + d + '</span><span class="track-row-fav">' + favIcon + '</span></div>';
    };
    
    // ========================================
    // BIND ROWS
    // ========================================
    
    UIManager.prototype.bindRows = function(c) {
        if (!c) return;
        var s = this;
        var rows = c.querySelectorAll('.track-row');
        
        for (var i = 0; i < rows.length; i++) {
            (function(row) {
                row.addEventListener('click', function(e) {
                    if (e.target.classList && e.target.classList.contains('track-row-fav')) return;
                    try {
                        var t = JSON.parse(row.getAttribute('data-track'));
                        if (window.player) {
                            player.play(t);
                            var equalizer = document.getElementById('playerEqualizer');
                            if (equalizer) equalizer.style.display = 'flex';
                        }
                        if (window.queueManager) queueManager.add(t);
                    } catch(e) { console.error(e); }
                });
                
                var favSpan = row.querySelector('.track-row-fav');
                if (favSpan) {
                    favSpan.addEventListener('click', function(e) {
                        e.stopPropagation();
                        try {
                            var t = JSON.parse(row.getAttribute('data-track'));
                            if (window.favorites) {
                                window.favorites.toggle(t);
                                var isFav = window.favorites.isFavorite(t.id);
                                favSpan.textContent = isFav ? '❤️' : '🤍';
                                s.notify(isFav ? '❤️ Добавлено в избранное' : '🤍 Удалено из избранного', 'success');
                                if (s.page === 'library' && s.tab === 'favorites') s.loadLib();
                            }
                        } catch(e) { console.error(e); }
                    });
                }
            })(rows[i]);
        }
    };
    
    // ========================================
    // MODALS
    // ========================================
    
    UIManager.prototype.showCreatePl = function() {
        var s = this;
        var o = document.getElementById('modal-overlay');
        var ct = document.getElementById('modal-content');
        
        ct.innerHTML = '<div class="modal-header"><h3 class="modal-title">Создать плейлист</h3><span class="modal-close">×</span></div><div class="form-group"><label class="form-label">Название</label><input type="text" class="form-input" id="plName" placeholder="Название плейлиста" autofocus></div><button class="btn btn-primary" id="savePl" style="width:100%;">Создать</button>';
        o.classList.remove('hidden');
        
        var close = function() { o.classList.add('hidden'); };
        ct.querySelector('.modal-close').addEventListener('click', close);
        o.addEventListener('click', function(e) { if (e.target === o) close(); });
        
        document.getElementById('savePl').addEventListener('click', function() {
            var n = document.getElementById('plName').value.trim() || 'Новый плейлист';
            if (window.library) {
                library.createPlaylist(n, '').then(function() {
                    s.notify('✅ Плейлист "' + n + '" создан', 'success');
                    close();
                    s.go('playlists');
                });
            }
        });
        
        document.getElementById('plName').focus();
    };
    
    UIManager.prototype.showPlModal = function(id) {
        var s = this;
        var o = document.getElementById('modal-overlay');
        var ct = document.getElementById('modal-content');
        
        if (!window.library) return;
        library.getPlaylist(id).then(function(pl) {
            if (!pl) return;
            library.getPlaylistTracks(id).then(function(t) {
                var h = '<div class="modal-header"><h3 class="modal-title">📁 ' + s.esc(pl.name) + '</h3><span class="modal-close">×</span></div>';
                if (pl.description) h += '<p class="text-muted text-sm mb-4">' + s.esc(pl.description) + '</p>';
                h += '<p class="text-muted text-sm mb-4">' + (t ? t.length : 0) + ' треков</p><div class="track-list" style="max-height:400px;overflow-y:auto;">';
                if (t) {
                    for (var i = 0; i < t.length; i++) h += s.trackRow(t[i], i);
                }
                h += '</div><div class="mt-4" style="display:flex;gap:8px;flex-wrap:wrap;"><button class="btn btn-primary btn-sm" id="playAllBtn">▶ Играть все</button><button class="btn btn-danger btn-sm" id="delPlBtn">🗑️ Удалить плейлист</button></div>';
                ct.innerHTML = h;
                o.classList.remove('hidden');
                
                var close = function() { o.classList.add('hidden'); };
                ct.querySelector('.modal-close').addEventListener('click', close);
                o.addEventListener('click', function(e) { if (e.target === o) close(); });
                if (t) s.bindRows(ct);
                
                var playBtn = document.getElementById('playAllBtn');
                if (playBtn && t && t.length) {
                    playBtn.addEventListener('click', function() {
                        if (window.queueManager && window.player) {
                            queueManager.clear();
                            for (var i = 0; i < t.length; i++) queueManager.add(t[i]);
                            player.play(t[0]);
                            close();
                            s.notify('Играет плейлист: ' + pl.name, 'success');
                        }
                    });
                }
                
                var delBtn = document.getElementById('delPlBtn');
                if (delBtn) {
                    delBtn.addEventListener('click', function() {
                        s.confirm('Удалить плейлист', 'Удалить "' + pl.name + '"?', function() {
                            library.deletePlaylist(id).then(function() {
                                s.notify('Плейлист удален', 'success');
                                close();
                                s.go('playlists');
                            });
                        });
                    });
                }
            });
        });
    };
    
    UIManager.prototype.showAddPl = function(tid) {
        var s = this;
        var o = document.getElementById('modal-overlay');
        var ct = document.getElementById('modal-content');
        
        if (!window.library) return;
        library.getPlaylists().then(function(pl) {
            var h = '<div class="modal-header"><h3 class="modal-title">📁 Добавить в плейлист</h3><span class="modal-close">×</span></div>';
            if (!pl || pl.length === 0) {
                h += '<p class="text-muted">Нет плейлистов. Создайте первый.</p>';
            } else {
                for (var i = 0; i < pl.length; i++) {
                    h += '<div class="playlist-option" data-id="' + pl[i].id + '">📁 ' + s.esc(pl[i].name) + ' (' + (pl[i].tracks ? pl[i].tracks.length : 0) + ' треков)</div>';
                }
            }
            h += '<button class="btn btn-secondary btn-sm mt-4" id="newPlBtn">+ Создать плейлист</button>';
            ct.innerHTML = h;
            o.classList.remove('hidden');
            
            var close = function() { o.classList.add('hidden'); };
            ct.querySelector('.modal-close').addEventListener('click', close);
            o.addEventListener('click', function(e) { if (e.target === o) close(); });
            
            ct.querySelectorAll('.playlist-option').forEach(function(opt) {
                opt.addEventListener('click', function() {
                    library.addToPlaylist(opt.getAttribute('data-id'), tid).then(function() {
                        s.notify('Добавлено в плейлист', 'success');
                        close();
                    });
                });
            });
            
            var newBtn = document.getElementById('newPlBtn');
            if (newBtn) newBtn.addEventListener('click', function() { close(); s.showCreatePl(); });
        });
    };
    
    UIManager.prototype.confirm = function(title, message, callback) {
        var o = document.getElementById('modal-overlay');
        var ct = document.getElementById('modal-content');
        
        ct.innerHTML = '<div class="modal-header"><h3 class="modal-title">⚠️ ' + title + '</h3><span class="modal-close">×</span></div><p class="mb-4" style="color:#7a7a7a;">' + message + '</p><div style="display:flex;gap:8px;"><button class="btn btn-secondary" id="cancelBtn">Отмена</button><button class="btn btn-danger" id="confirmBtn">Подтвердить</button></div>';
        o.classList.remove('hidden');
        
        var close = function() { o.classList.add('hidden'); };
        ct.querySelector('.modal-close').addEventListener('click', close);
        o.addEventListener('click', function(e) { if (e.target === o) close(); });
        document.getElementById('cancelBtn').addEventListener('click', close);
        document.getElementById('confirmBtn').addEventListener('click', function() { close(); if (callback) callback(); });
    };
    
    // ========================================
    // PLAYER UI
    // ========================================
    
    UIManager.prototype.bindPlayer = function() {
        var s = this;
        
        var playBtn = document.getElementById('playBtn');
        var prevBtn = document.getElementById('prevBtn');
        var nextBtn = document.getElementById('nextBtn');
        var shuffleBtn = document.getElementById('shuffleBtn');
        var repeatBtn = document.getElementById('repeatBtn');
        var volumeSlider = document.getElementById('volumeSlider');
        var volumeBtn = document.getElementById('volumeBtn');
        var progressBar = document.getElementById('progressBar');
        var addToPlaylistBtn = document.getElementById('playerAddToPlaylistBtn');
        
        if (playBtn && window.player) playBtn.addEventListener('click', function() { 
            player.toggle();
            var equalizer = document.getElementById('playerEqualizer');
            if (equalizer && player.playing) equalizer.style.display = 'flex';
            else if (equalizer && !player.playing) equalizer.style.display = 'none';
        });
        if (prevBtn && window.queueManager) prevBtn.addEventListener('click', function() { var p = queueManager.prev(); if (p && window.player) player.play(p); });
        if (nextBtn && window.queueManager) nextBtn.addEventListener('click', function() { var n = queueManager.next(); if (n && window.player) player.play(n); });
        if (shuffleBtn && window.queueManager) shuffleBtn.addEventListener('click', function() { queueManager.toggleShuffle(); });
        if (repeatBtn && window.queueManager) repeatBtn.addEventListener('click', function() { queueManager.toggleRepeat(); });
        
        if (volumeSlider && window.player) {
            volumeSlider.addEventListener('input', function(e) { 
                player.setVolume(e.target.value / 100);
                s.volumeBeforeMute = e.target.value;
            });
        }
        
        if (volumeBtn && window.player) {
            volumeBtn.addEventListener('click', function() {
                var currentVol = volumeSlider.value;
                if (currentVol > 0) {
                    s.volumeBeforeMute = currentVol;
                    volumeSlider.value = 0;
                    player.setVolume(0);
                    s.showVolumeToast(0);
                } else {
                    volumeSlider.value = s.volumeBeforeMute;
                    player.setVolume(s.volumeBeforeMute / 100);
                    s.showVolumeToast(s.volumeBeforeMute);
                }
            });
        }
        
        if (progressBar && window.player) {
            progressBar.addEventListener('click', function(e) {
                var rect = this.getBoundingClientRect();
                var percent = (e.clientX - rect.left) / rect.width;
                var dur = player.getDuration();
                if (dur) player.seek(percent * dur);
            });
        }
        
        if (addToPlaylistBtn) {
            addToPlaylistBtn.addEventListener('click', function() {
                var t = window.player ? player.track : null;
                if (t) s.showAddPl(t.id);
                else s.notify('Нет играющего трека', 'info');
            });
        }
    };
    
    UIManager.prototype.updatePlayerUI = function() {
        var t = window.player ? player.track : null;
        var titleEl = document.getElementById('playerTitle');
        var artistEl = document.getElementById('playerArtist');
        
        if (titleEl) titleEl.textContent = t ? t.title : 'Ничего не играет';
        if (artistEl) artistEl.textContent = t ? t.artist : 'Выберите трек';
        
        var icon = document.getElementById('playIcon');
        var isPlaying = window.player ? player.playing : false;
        if (icon) {
            icon.innerHTML = isPlaying ? 
                '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>' : 
                '<polygon points="5 3 19 12 5 21 5 3"/>';
        }
        
        var equalizer = document.getElementById('playerEqualizer');
        if (equalizer) {
            if (isPlaying && t) equalizer.style.display = 'flex';
            else equalizer.style.display = 'none';
        }
        
        var shuffleBtn = document.getElementById('shuffleBtn');
        var repeatBtn = document.getElementById('repeatBtn');
        if (shuffleBtn && window.queueManager) {
            if (queueManager.shuffle) shuffleBtn.classList.add('active');
            else shuffleBtn.classList.remove('active');
        }
        if (repeatBtn && window.queueManager) {
            if (queueManager.repeat !== 'none') repeatBtn.classList.add('active');
            else repeatBtn.classList.remove('active');
        }
    };
    
    UIManager.prototype.updateProgress = function(d) {
        if (!d) return;
        var ct = document.getElementById('currentTime');
        var tt = document.getElementById('totalTime');
        var pf = document.getElementById('progressFill');
        
        if (ct && window.player) ct.textContent = player.fmt(d.currentTime);
        if (tt && window.player) tt.textContent = player.fmt(d.duration);
        if (pf) pf.style.width = (d.progress * 100) + '%';
    };
    
    // ========================================
    // STATS & UTILITIES
    // ========================================
    
    UIManager.prototype.loadStats = function() {
        var s = this;
        if (!window.library) return;
        library.getStats().then(function(st) {
            var e = document.getElementById('sidebarStats');
            if (e && st) {
                e.innerHTML = '<div class="sidebar-stat"><span class="stat-value">' + st.totalTracks + '</span><span class="stat-label">треков</span></div><div class="sidebar-stat"><span class="stat-value">' + st.totalPlaylists + '</span><span class="stat-label">плейлистов</span></div>';
            }
        }).catch(function() {});
    };
    
    UIManager.prototype.exportLib = function() {
        var s = this;
        if (!window.library) return;
        library.exportLibrary().then(function(d) {
            var b = new Blob([d], {type: 'application/json'});
            var u = URL.createObjectURL(b);
            var a = document.createElement('a');
            a.href = u;
            a.download = 'musichub-backup-' + new Date().toISOString().split('T')[0] + '.json';
            a.click();
            URL.revokeObjectURL(u);
            s.notify('📤 Библиотека экспортирована', 'success');
        }).catch(function() { s.notify('Ошибка экспорта', 'error'); });
    };
    
    UIManager.prototype.notify = function(msg, type) {
        var c = document.getElementById('notificationContainer');
        if (!c) return;
        
        var e = document.createElement('div');
        e.className = 'notification ' + (type || 'info');
        e.innerHTML = '<span>' + msg + '</span>';
        c.appendChild(e);
        
        setTimeout(function() {
            e.style.opacity = '0';
            e.style.transform = 'translateX(100%)';
            setTimeout(function() { if (e.parentNode) e.parentNode.removeChild(e); }, 300);
        }, 3000);
    };
    
    UIManager.prototype.esc = function(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };
    
    window.ui = new UIManager();
})();
