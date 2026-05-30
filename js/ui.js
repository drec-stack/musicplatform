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
    // RENDER SIDEBAR
    // ========================================
    
    UIManager.prototype.renderSidebar = function() {
        var n = document.getElementById('sidebarNav');
        if (!n) return;
        
        var items = [
            {p:'home', l:'🏠 Главная'},
            {p:'library', l:'📚 Библиотека'},
            {p:'search', l:'🔍 Поиск'},
            {p:'upload', l:'📤 Загрузить'},
            {p:'playlists', l:'📋 Плейлисты'},
            {p:'settings', l:'⚙️ Настройки'}
        ];
        
        var h = '';
        for (var i = 0; i < items.length; i++) {
            var activeClass = (items[i].p === this.page) ? ' active' : '';
            h += '<a class="nav-item' + activeClass + '" data-page="' + items[i].p + '">';
            h += '<span>' + items[i].l + '</span></a>';
        }
        n.innerHTML = h;
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
        var exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', function() { this.exportLib(); }.bind(this));
        }
        
        var si = document.getElementById('globalSearch');
        if (si) {
            si.addEventListener('input', function() {
                var q = si.value.trim();
                if (this.st) clearTimeout(this.st);
                if (q.length >= 2) {
                    this.st = setTimeout(function() { this.doSearch(q); }.bind(this), 350);
                }
            }.bind(this));
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
        });
    };
    
    // ========================================
    // INIT
    // ========================================
    
    UIManager.prototype.init = function() {
        var s = this;
        
        if (this._initialized) return Promise.resolve();
        this._initialized = true;
        
        // Скрываем лоадер, показываем приложение
        var loader = document.getElementById('loader');
        var app = document.getElementById('app');
        if (loader && app) {
            loader.classList.add('hidden');
            app.classList.remove('hidden');
        }
        
        this.renderSidebar();
        this.bindSidebar();
        this.bindTopbar();
        this.bindPlayer();
        this.bindKeys();
        
        var p = storage.get('current_page', 'home');
        
        return this.go(p).then(function() { 
            s.loadStats(); 
        });
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
                '</div>' +
                '<div id="recentTracksContainer" class="track-list"></div>' +
            '</div>' +
        '</div>';
        
        document.querySelectorAll('.action-card').forEach(function(card) {
            card.addEventListener('click', function() {
                var action = this.dataset.action;
                if (action) s.go(action);
            });
        });
        
        // Загружаем недавние треки
        var rd = document.getElementById('recentTracksContainer');
        if (rd && window.library) {
            library.getRecentTracks(5).then(function(tracks) {
                if (!tracks || tracks.length === 0) {
                    rd.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎵</div><p>Нет треков</p><button class="btn btn-primary mt-4" onclick="ui.go(\'upload\')">Загрузить музыку</button></div>';
                } else {
                    var h = '<div class="track-list">';
                    for (var i = 0; i < tracks.length; i++) {
                        var t = tracks[i];
                        var duration = player ? player.fmt(t.duration / 1000) : '--:--';
                        h += '<div class="track-row" data-track-id="' + t.id + '">' +
                            '<span class="track-row-index">' + (i + 1) + '</span>' +
                            '<div class="track-row-info">' +
                                '<div class="track-row-cover-placeholder">🎵</div>' +
                                '<div>' +
                                    '<div class="track-row-title">' + this.esc(t.title) + '</div>' +
                                    '<div class="track-row-artist">' + this.esc(t.artist) + '</div>' +
                                '</div>' +
                            '</div>' +
                            '<span class="track-row-duration">' + duration + '</span>' +
                        '</div>';
                    }
                    rd.innerHTML = h;
                    // Добавляем обработчики кликов
                    rd.querySelectorAll('.track-row').forEach(function(row) {
                        row.addEventListener('click', function() {
                            var id = this.dataset.trackId;
                            library.getTracks().then(function(tracks) {
                                var track = tracks.find(function(t) { return t.id == id; });
                                if (track && window.player) player.play(track);
                            });
                        });
                    });
                }
            }.bind(this));
        }
        
        return Promise.resolve();
    };
    
    // ========================================
    // LIBRARY PAGE
    // ========================================
    
    UIManager.prototype.libPage = function() {
        var s = this;
        var c = document.getElementById('content');
        
        c.innerHTML = '<div class="page"><div class="page-header"><h1 class="page-title">Библиотека</h1><p class="page-subtitle">Вся ваша музыка</p></div><div id="libraryContent" class="track-list"></div></div>';
        
        // Загружаем все треки
        if (window.library) {
            library.getTracks().then(function(tracks) {
                var ct = document.getElementById('libraryContent');
                if (!ct) return;
                
                if (!tracks || tracks.length === 0) {
                    ct.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎵</div><p>Нет треков</p><button class="btn btn-primary mt-4" onclick="ui.go(\'upload\')">Загрузить музыку</button></div>';
                } else {
                    var h = '<div class="track-list">';
                    for (var i = 0; i < tracks.length; i++) {
                        var t = tracks[i];
                        var duration = player ? player.fmt(t.duration / 1000) : '--:--';
                        h += '<div class="track-row" data-track-id="' + t.id + '">' +
                            '<span class="track-row-index">' + (i + 1) + '</span>' +
                            '<div class="track-row-info">' +
                                '<div class="track-row-cover-placeholder">🎵</div>' +
                                '<div>' +
                                    '<div class="track-row-title">' + s.esc(t.title) + '</div>' +
                                    '<div class="track-row-artist">' + s.esc(t.artist) + '</div>' +
                                '</div>' +
                            '</div>' +
                            '<span class="track-row-duration">' + duration + '</span>' +
                        '</div>';
                    }
                    h += '</div>';
                    ct.innerHTML = h;
                    
                    ct.querySelectorAll('.track-row').forEach(function(row) {
                        row.addEventListener('click', function() {
                            var id = this.dataset.trackId;
                            library.getTracks().then(function(tracks) {
                                var track = tracks.find(function(t) { return t.id == id; });
                                if (track && window.player) player.play(track);
                            });
                        });
                    });
                }
            });
        }
        
        return Promise.resolve();
    };
    
    // ========================================
    // SEARCH PAGE
    // ========================================
    
    UIManager.prototype.searchPage = function() {
        document.getElementById('content').innerHTML = '<div class="page"><div class="page-header"><h1 class="page-title">Поиск</h1><p class="page-subtitle">Найдите музыку</p></div><div id="searchResults"><div class="empty-state"><div class="empty-state-icon">🔍</div><p>Начните вводить текст для поиска</p></div></div></div>';
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
        c.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><span>Поиск...</span></div>';
        
        if (!window.library) return;
        library.search(q).then(function(results) {
            if (!results || results.length === 0) {
                c.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><p>Ничего не найдено</p></div>';
                return;
            }
            var h = '<div class="track-list">';
            for (var i = 0; i < results.length; i++) {
                var t = results[i];
                var duration = player ? player.fmt(t.duration / 1000) : '--:--';
                h += '<div class="track-row" data-track-id="' + t.id + '">' +
                    '<span class="track-row-index">' + (i + 1) + '</span>' +
                    '<div class="track-row-info">' +
                        '<div class="track-row-cover-placeholder">🎵</div>' +
                        '<div>' +
                            '<div class="track-row-title">' + s.esc(t.title) + '</div>' +
                            '<div class="track-row-artist">' + s.esc(t.artist) + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<span class="track-row-duration">' + duration + '</span>' +
                '</div>';
            }
            h += '</div>';
            c.innerHTML = h;
            
            c.querySelectorAll('.track-row').forEach(function(row) {
                row.addEventListener('click', function() {
                    var id = this.dataset.trackId;
                    library.getTracks().then(function(tracks) {
                        var track = tracks.find(function(t) { return t.id == id; });
                        if (track && window.player) player.play(track);
                    });
                });
            });
        });
    };
    
    // ========================================
    // UPLOAD PAGE
    // ========================================
    
    UIManager.prototype.uploadPage = function() {
        var s = this;
        var c = document.getElementById('content');
        
        c.innerHTML = '<div class="page"><div class="page-header"><h1 class="page-title">Загрузка музыки</h1><p class="page-subtitle">MP3, WAV, FLAC, OGG, AAC, M4A</p></div><div class="upload-area" id="uploadArea"><div class="upload-icon">📤</div><p>Перетащите файлы сюда</p><span>или</span><button class="btn btn-primary" id="selectFilesBtn" style="margin-top:16px;">Выберите файлы</button></div><input type="file" id="fileInput" multiple accept="audio/*" style="display:none;"><div id="uploadProgress" style="display:none;"></div></div>';
        
        var a = document.getElementById('uploadArea');
        var inp = document.getElementById('fileInput');
        var pr = document.getElementById('uploadProgress');
        
        document.getElementById('selectFilesBtn').addEventListener('click', function() { inp.click(); });
        
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
    
    UIManager.prototype.doUp = function(files, area, progress) {
        var s = this;
        if (area) area.style.display = 'none';
        if (progress) {
            progress.style.display = 'block';
            progress.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><span>Загрузка...</span></div>';
        }
        
        if (!window.uploadManager) return;
        uploadManager.uploadFiles(files).then(function(result) {
            s.notify('✅ Загружено: ' + result.uploaded.length + ' файлов', 'success');
            s.loadStats();
            setTimeout(function() {
                if (area) area.style.display = 'block';
                if (progress) progress.style.display = 'none';
                s.go('library');
            }, 2000);
        }).catch(function(e) {
            s.notify('Ошибка загрузки', 'error');
            if (area) area.style.display = 'block';
            if (progress) progress.style.display = 'none';
        });
    };
    
    // ========================================
    // PLAYLISTS PAGE
    // ========================================
    
    UIManager.prototype.plPage = function() {
        var s = this;
        var c = document.getElementById('content');
        
        c.innerHTML = '<div class="page"><div class="page-header"><h1 class="page-title">Плейлисты</h1><button class="btn btn-primary" id="createPlBtn">+ Создать плейлист</button></div><div id="playlistsGrid" class="playlist-grid"></div></div>';
        
        if (window.library) {
            library.getPlaylists().then(function(playlists) {
                var grid = document.getElementById('playlistsGrid');
                if (!grid) return;
                
                if (!playlists || playlists.length === 0) {
                    grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><p>Нет плейлистов</p></div>';
                } else {
                    var h = '';
                    for (var i = 0; i < playlists.length; i++) {
                        h += '<div class="playlist-card" data-id="' + playlists[i].id + '">' +
                            '<div class="playlist-card-cover">📁</div>' +
                            '<div class="playlist-card-name">' + s.esc(playlists[i].name) + '</div>' +
                            '<div class="playlist-card-count">' + (playlists[i].tracks ? playlists[i].tracks.length : 0) + ' треков</div>' +
                        '</div>';
                    }
                    grid.innerHTML = h;
                    
                    grid.querySelectorAll('.playlist-card').forEach(function(card) {
                        card.addEventListener('click', function() {
                            var id = this.dataset.id;
                            s.showPlModal(id);
                        });
                    });
                }
            });
        }
        
        document.getElementById('createPlBtn').addEventListener('click', function() { s.showCreatePl(); });
        
        return Promise.resolve();
    };
    
    // ========================================
    // SETTINGS PAGE
    // ========================================
    
    UIManager.prototype.setPage = function() {
        var s = this;
        var c = document.getElementById('content');
        
        c.innerHTML = '<div class="page"><div class="page-header"><h1 class="page-title">Настройки</h1></div>' +
            '<div class="settings-section"><button class="btn btn-secondary" id="exportDataBtn">📤 Экспорт библиотеки</button></div>' +
            '<div class="settings-section"><button class="btn btn-danger" id="clearDataBtn">🗑️ Очистить все данные</button></div>' +
            '<div class="settings-section"><p class="text-muted">MusicHub v1.0.0</p></div></div>';
        
        document.getElementById('exportDataBtn').addEventListener('click', function() { s.exportLib(); });
        document.getElementById('clearDataBtn').addEventListener('click', function() {
            if (confirm('⚠️ Удалить все данные? Отменить нельзя!')) {
                db.clearAll().then(function() {
                    localStorage.clear();
                    s.notify('Все данные очищены', 'success');
                    s.go('home');
                });
            }
        });
        
        return Promise.resolve();
    };
    
    // ========================================
    // PLAYLIST MODALS
    // ========================================
    
    UIManager.prototype.showCreatePl = function() {
        var o = document.getElementById('modal-overlay');
        var ct = document.getElementById('modal-content');
        
        ct.innerHTML = '<div class="modal-header"><h3 class="modal-title">Создать плейлист</h3><span class="modal-close">×</span></div>' +
            '<input type="text" id="plName" class="form-input" placeholder="Название" style="width:100%;margin:16px 0;">' +
            '<button class="btn btn-primary" id="savePl">Создать</button>';
        o.classList.remove('hidden');
        
        var close = function() { o.classList.add('hidden'); };
        ct.querySelector('.modal-close').addEventListener('click', close);
        o.addEventListener('click', function(e) { if (e.target === o) close(); });
        
        document.getElementById('savePl').addEventListener('click', function() {
            var name = document.getElementById('plName').value.trim() || 'Новый плейлист';
            if (window.library) {
                library.createPlaylist(name, '').then(function() {
                    close();
                    ui.go('playlists');
                });
            }
        });
    };
    
    UIManager.prototype.showPlModal = function(id) {
        var s = this;
        var o = document.getElementById('modal-overlay');
        var ct = document.getElementById('modal-content');
        
        if (!window.library) return;
        library.getPlaylist(id).then(function(playlist) {
            if (!playlist) return;
            
            ct.innerHTML = '<div class="modal-header"><h3 class="modal-title">📁 ' + s.esc(playlist.name) + '</h3><span class="modal-close">×</span></div>' +
                '<p>' + (playlist.tracks ? playlist.tracks.length : 0) + ' треков</p>' +
                '<button class="btn btn-danger" id="delPlBtn">Удалить плейлист</button>';
            o.classList.remove('hidden');
            
            var close = function() { o.classList.add('hidden'); };
            ct.querySelector('.modal-close').addEventListener('click', close);
            o.addEventListener('click', function(e) { if (e.target === o) close(); });
            
            document.getElementById('delPlBtn').addEventListener('click', function() {
                if (confirm('Удалить плейлист "' + playlist.name + '"?')) {
                    library.deletePlaylist(id).then(function() {
                        close();
                        s.go('playlists');
                    });
                }
            });
        });
    };
    
    // ========================================
    // PLAYER UI
    // ========================================
    
    UIManager.prototype.bindPlayer = function() {
        var s = this;
        
        var playBtn = document.getElementById('playBtn');
        var prevBtn = document.getElementById('prevBtn');
        var nextBtn = document.getElementById('nextBtn');
        var volumeSlider = document.getElementById('volumeSlider');
        var progressBar = document.getElementById('progressBar');
        
        if (playBtn && window.player) {
            playBtn.addEventListener('click', function() { player.toggle(); });
        }
        if (prevBtn && window.queueManager) {
            prevBtn.addEventListener('click', function() { var p = queueManager.prev(); if (p) player.play(p); });
        }
        if (nextBtn && window.queueManager) {
            nextBtn.addEventListener('click', function() { var n = queueManager.next(); if (n) player.play(n); });
        }
        if (volumeSlider && window.player) {
            volumeSlider.addEventListener('input', function(e) { player.setVolume(e.target.value / 100); });
        }
        if (progressBar && window.player) {
            progressBar.addEventListener('click', function(e) {
                var rect = this.getBoundingClientRect();
                var percent = (e.clientX - rect.left) / rect.width;
                var dur = player.getDuration();
                if (dur) player.seek(percent * dur);
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
            icon.innerHTML = isPlaying ? '⏸' : '▶';
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
        if (!window.library) return;
        library.getStats().then(function(st) {
            var trackCount = document.getElementById('trackCount');
            var playlistCount = document.getElementById('playlistCount');
            if (trackCount) trackCount.textContent = st.totalTracks;
            if (playlistCount) playlistCount.textContent = st.totalPlaylists;
        });
    };
    
    UIManager.prototype.exportLib = function() {
        var s = this;
        if (!window.library) return;
        library.exportLibrary().then(function(data) {
            var blob = new Blob([data], {type: 'application/json'});
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'musichub-backup.json';
            a.click();
            URL.revokeObjectURL(url);
            s.notify('Библиотека экспортирована', 'success');
        });
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
