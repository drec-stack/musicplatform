// ========================================
// UI МЕНЕДЖЕР
// ========================================

(function() {
    'use strict';
    
    function UI() {
        this.page = 'home';
        this.tracks = [];
        this.playlists = [];
        this.playing = false;
        this.currentTrack = null;
        this.audio = null;
        this.searchTimeout = null;
    }
    
    // Форматирование времени
    UI.prototype.formatTime = function(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        var mins = Math.floor(seconds / 60);
        var secs = Math.floor(seconds % 60);
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    };
    
    // Escape HTML
    UI.prototype.escape = function(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    };
    
    // Показ уведомления
    UI.prototype.notify = function(message, type) {
        var container = document.getElementById('toastContainer');
        if (!container) return;
        
        var toast = document.createElement('div');
        toast.className = 'toast ' + (type || 'success');
        toast.innerHTML = message;
        container.appendChild(toast);
        
        setTimeout(function() {
            toast.style.opacity = '0';
            setTimeout(function() {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 3000);
    };
    
    // Рендер навигации
    UI.prototype.renderNav = function() {
        var container = document.getElementById('sidebarNav');
        if (!container) return;
        
        var items = [
            { page: 'home', label: 'Главная', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
            { page: 'library', label: 'Библиотека', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h16v12H4z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>' },
            { page: 'search', label: 'Поиск', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' },
            { page: 'upload', label: 'Загрузить', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' },
            { page: 'playlists', label: 'Плейлисты', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h20v16H2z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="12" y2="12"/></svg>' }
        ];
        
        var html = '';
        for (var i = 0; i < items.length; i++) {
            var activeClass = (items[i].page === this.page) ? ' active' : '';
            html += '<div class="nav-item' + activeClass + '" data-page="' + items[i].page + '">' +
                '<div class="nav-icon">' + items[i].icon + '</div>' +
                '<span>' + items[i].label + '</span>' +
            '</div>';
        }
        container.innerHTML = html;
        
        // Обработчики
        container.querySelectorAll('.nav-item').forEach(function(el) {
            el.addEventListener('click', function() {
                this.go(this.dataset.page);
            }.bind(this));
        }.bind(this));
    };
    
    // Рендер страницы
    UI.prototype.renderPage = function() {
        var container = document.getElementById('content');
        if (!container) return;
        
        var self = this;
        
        if (this.page === 'home') {
            container.innerHTML = '<div class="page">' +
                '<div class="page-header">' +
                    '<h1 class="page-title">Добро пожаловать</h1>' +
                    '<p class="page-subtitle">Ваша музыкальная платформа</p>' +
                '</div>' +
                '<div class="actions-grid">' +
                    '<div class="action-card" data-page="upload"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><span>Загрузить</span></div>' +
                    '<div class="action-card" data-page="library"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h16v12H4z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg><span>Библиотека</span></div>' +
                    '<div class="action-card" data-page="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span>Поиск</span></div>' +
                    '<div class="action-card" data-page="playlists"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h20v16H2z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="12" y2="12"/></svg><span>Плейлисты</span></div>' +
                '</div>' +
                '<div class="section">' +
                    '<div class="section-header">' +
                        '<h2 class="section-title">Недавние треки</h2>' +
                    '</div>' +
                    '<div id="recentTracks" class="track-list"></div>' +
                '</div>' +
            '</div>';
            
            // Рендер недавних треков
            var recent = this.tracks.slice(-5).reverse();
            this.renderTrackList(recent, 'recentTracks');
            
            // Обработчики карточек
            container.querySelectorAll('.action-card').forEach(function(card) {
                card.addEventListener('click', function() {
                    this.go(card.dataset.page);
                }.bind(this));
            }.bind(this));
            
        } else if (this.page === 'library') {
            container.innerHTML = '<div class="page">' +
                '<div class="page-header">' +
                    '<h1 class="page-title">Библиотека</h1>' +
                    '<p class="page-subtitle">Все треки</p>' +
                '</div>' +
                '<div id="libraryTracks" class="track-list"></div>' +
            '</div>';
            
            this.renderTrackList(this.tracks, 'libraryTracks');
            
        } else if (this.page === 'search') {
            container.innerHTML = '<div class="page">' +
                '<div class="page-header">' +
                    '<h1 class="page-title">Поиск</h1>' +
                    '<p class="page-subtitle">Найдите музыку</p>' +
                '</div>' +
                '<div id="searchResults" class="track-list"></div>' +
            '</div>';
            
        } else if (this.page === 'upload') {
            container.innerHTML = '<div class="page">' +
                '<div class="page-header">' +
                    '<h1 class="page-title">Загрузка</h1>' +
                    '<p class="page-subtitle">MP3, WAV, FLAC, OGG, AAC</p>' +
                '</div>' +
                '<div class="upload-area" id="uploadArea">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
                    '<p>Перетащите файлы сюда</p>' +
                    '<button class="btn-primary" id="selectFilesBtn" style="margin-top:16px;">Выбрать файлы</button>' +
                '</div>' +
                '<input type="file" id="fileInput" multiple accept="audio/*" style="display:none;">' +
            '</div>';
            
            var uploadArea = document.getElementById('uploadArea');
            var fileInput = document.getElementById('fileInput');
            var selectBtn = document.getElementById('selectFilesBtn');
            
            if (selectBtn) {
                selectBtn.addEventListener('click', function() { fileInput.click(); });
            }
            
            if (uploadArea) {
                uploadArea.addEventListener('dragover', function(e) {
                    e.preventDefault();
                    uploadArea.style.borderColor = '#1db954';
                });
                uploadArea.addEventListener('dragleave', function(e) {
                    uploadArea.style.borderColor = 'rgba(255,255,255,0.15)';
                });
                uploadArea.addEventListener('drop', function(e) {
                    e.preventDefault();
                    uploadArea.style.borderColor = 'rgba(255,255,255,0.15)';
                    this.uploadFiles(e.dataTransfer.files);
                }.bind(this));
            }
            
            if (fileInput) {
                fileInput.addEventListener('change', function() {
                    this.uploadFiles(fileInput.files);
                }.bind(this));
            }
            
        } else if (this.page === 'playlists') {
            container.innerHTML = '<div class="page">' +
                '<div class="page-header">' +
                    '<h1 class="page-title">Плейлисты</h1>' +
                    '<button class="btn-primary" id="createPlaylistBtn" style="margin-top:16px;">+ Создать</button>' +
                '</div>' +
                '<div id="playlistsGrid" class="playlist-grid"></div>' +
            '</div>';
            
            this.renderPlaylists();
            
            var createBtn = document.getElementById('createPlaylistBtn');
            if (createBtn) {
                createBtn.addEventListener('click', function() {
                    this.showCreatePlaylistModal();
                }.bind(this));
            }
            
        } else if (this.page === 'settings') {
            container.innerHTML = '<div class="page">' +
                '<div class="page-header">' +
                    '<h1 class="page-title">Настройки</h1>' +
                '</div>' +
                '<div class="settings-section">' +
                    '<div class="settings-title">Данные</div>' +
                    '<div class="settings-actions">' +
                        '<button class="btn-secondary" id="exportDataBtn">Экспорт</button>' +
                        '<button class="btn-danger" id="clearDataBtn">Очистить всё</button>' +
                    '</div>' +
                '</div>' +
                '<div class="settings-section">' +
                    '<div class="settings-title">О приложении</div>' +
                    '<p class="text-muted">MusicHub v2.0.0</p>' +
                '</div>' +
            '</div>';
            
            document.getElementById('exportDataBtn').addEventListener('click', function() {
                this.exportData();
            }.bind(this));
            
            document.getElementById('clearDataBtn').addEventListener('click', function() {
                if (confirm('Удалить все данные? Отменить нельзя!')) {
                    DB.clearAll().then(function() {
                        this.tracks = [];
                        this.playlists = [];
                        this.notify('Все данные удалены');
                        this.go('home');
                    }.bind(this));
                }
            }.bind(this));
        }
    };
    
    // Рендер списка треков
    UI.prototype.renderTrackList = function(tracks, containerId) {
        var container = document.getElementById(containerId);
        if (!container) return;
        
        if (!tracks || tracks.length === 0) {
            container.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg><p>Нет треков</p></div>';
            return;
        }
        
        var html = '';
        for (var i = 0; i < tracks.length; i++) {
            var track = tracks[i];
            var duration = this.formatTime(track.duration);
            html += '<div class="track-item" data-id="' + track.id + '">' +
                '<div class="track-index">' + (i + 1) + '</div>' +
                '<div class="track-info">' +
                    '<div class="track-cover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>' +
                    '<div class="track-details">' +
                        '<div class="track-name">' + this.escape(track.title) + '</div>' +
                        '<div class="track-artist">' + this.escape(track.artist) + '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="track-duration">' + duration + '</div>' +
                '<button class="track-fav" data-id="' + track.id + '">' +
                    '<svg viewBox="0 0 24 24" fill="' + (track.favorite ? '#1db954' : 'none') + '" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
                '</button>' +
            '</div>';
        }
        container.innerHTML = html;
        
        // Обработчики
        container.querySelectorAll('.track-item').forEach(function(item) {
            item.addEventListener('click', function(e) {
                if (e.target.closest('.track-fav')) return;
                var id = item.dataset.id;
                var track = this.tracks.find(function(t) { return t.id === id; });
                if (track) this.playTrack(track);
            }.bind(this));
            
            var favBtn = item.querySelector('.track-fav');
            if (favBtn) {
                favBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var id = favBtn.dataset.id;
                    var track = this.tracks.find(function(t) { return t.id === id; });
                    if (track) {
                        track.favorite = !track.favorite;
                        DB.saveTrack(track);
                        this.renderPage();
                        this.updateStats();
                        this.notify(track.favorite ? 'В избранном' : 'Удалено из избранного');
                    }
                }.bind(this));
            }
        }.bind(this));
    };
    
    // Рендер плейлистов
    UI.prototype.renderPlaylists = function() {
        var container = document.getElementById('playlistsGrid');
        if (!container) return;
        
        if (!this.playlists || this.playlists.length === 0) {
            container.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h20v16H2z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="12" y2="12"/></svg><p>Нет плейлистов</p></div>';
            return;
        }
        
        var html = '';
        for (var i = 0; i < this.playlists.length; i++) {
            var playlist = this.playlists[i];
            html += '<div class="playlist-card" data-id="' + playlist.id + '">' +
                '<div class="card-cover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h20v16H2z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="12" y2="12"/></svg></div>' +
                '<div class="card-title">' + this.escape(playlist.name) + '</div>' +
                '<div class="card-subtitle">' + (playlist.tracks ? playlist.tracks.length : 0) + ' треков</div>' +
            '</div>';
        }
        container.innerHTML = html;
        
        container.querySelectorAll('.playlist-card').forEach(function(card) {
            card.addEventListener('click', function() {
                this.showPlaylistDetail(card.dataset.id);
            }.bind(this));
        }.bind(this));
    };
    
    // Показать детали плейлиста
    UI.prototype.showPlaylistDetail = function(id) {
        var playlist = this.playlists.find(function(p) { return p.id === id; });
        if (!playlist) return;
        
        var playlistTracks = playlist.tracks || [];
        var tracksList = this.tracks.filter(function(t) {
            return playlistTracks.includes(t.id);
        });
        
        var container = document.getElementById('content');
        container.innerHTML = '<div class="page">' +
            '<div class="page-header">' +
                '<button class="btn-secondary" id="backBtn" style="margin-bottom:16px;">← Назад</button>' +
                '<h1 class="page-title">' + this.escape(playlist.name) + '</h1>' +
                '<p class="page-subtitle">' + tracksList.length + ' треков</p>' +
            '</div>' +
            '<div id="playlistTracks" class="track-list"></div>' +
            '<div style="display:flex; gap:12px; margin-top:20px;">' +
                '<button class="btn-primary" id="playAllBtn">▶ Играть все</button>' +
                '<button class="btn-danger" id="deletePlaylistBtn">🗑 Удалить</button>' +
            '</div>' +
        '</div>';
        
        this.renderTrackList(tracksList, 'playlistTracks');
        
        document.getElementById('backBtn').addEventListener('click', function() {
            this.go('playlists');
        }.bind(this));
        
        document.getElementById('playAllBtn').addEventListener('click', function() {
            if (tracksList.length > 0) {
                this.playTrack(tracksList[0]);
            }
        }.bind(this));
        
        document.getElementById('deletePlaylistBtn').addEventListener('click', function() {
            if (confirm('Удалить плейлист "' + playlist.name + '"?')) {
                DB.deletePlaylist(id).then(function() {
                    this.loadData();
                    this.go('playlists');
                    this.notify('Плейлист удалён');
                }.bind(this));
            }
        }.bind(this));
    };
    
    // Показать создание плейлиста
    UI.prototype.showCreatePlaylistModal = function() {
        var modal = document.getElementById('modal');
        var input = document.getElementById('modalInput');
        input.value = '';
        document.getElementById('modalTitle').textContent = 'Создать плейлист';
        
        var confirmBtn = document.getElementById('modalConfirm');
        var closeBtn = document.getElementById('modalClose');
        
        var oldConfirm = confirmBtn.onclick;
        var oldClose = closeBtn.onclick;
        
        confirmBtn.onclick = function() {
            var name = input.value.trim();
            if (name) {
                var newPlaylist = {
                    id: Date.now().toString(),
                    name: name,
                    tracks: [],
                    createdAt: Date.now()
                };
                DB.savePlaylist(newPlaylist).then(function() {
                    this.loadData();
                    modal.classList.remove('show');
                    this.go('playlists');
                    this.notify('Плейлист создан');
                }.bind(this));
            }
            confirmBtn.onclick = oldConfirm;
            closeBtn.onclick = oldClose;
        }.bind(this);
        
        closeBtn.onclick = function() {
            modal.classList.remove('show');
            closeBtn.onclick = oldClose;
        };
        
        modal.classList.add('show');
    };
    
    // Воспроизведение трека
    UI.prototype.playTrack = function(track) {
        if (this.audio) {
            this.audio.pause();
        }
        
        this.currentTrack = track;
        this.playing = true;
        
        document.getElementById('playerTitle').textContent = track.title;
        document.getElementById('playerArtist').textContent = track.artist;
        document.getElementById('playIcon').innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
        
        // Симуляция для демо
        if (this.progressInterval) clearInterval(this.progressInterval);
        var duration = track.duration;
        var current = 0;
        
        this.progressInterval = setInterval(function() {
            if (this.playing && current < duration) {
                current++;
                var percent = (current / duration) * 100;
                document.getElementById('progressFill').style.width = percent + '%';
                document.getElementById('currentTime').textContent = this.formatTime(current);
                document.getElementById('totalTime').textContent = this.formatTime(duration);
            } else if (current >= duration) {
                clearInterval(this.progressInterval);
                this.playing = false;
                document.getElementById('playIcon').innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
            }
        }.bind(this), 1000);
    };
    
    // Загрузка файлов
    UI.prototype.uploadFiles = function(files) {
        var self = this;
        var filesArray = Array.from(files);
        
        filesArray.forEach(function(file) {
            if (file.type.startsWith('audio/')) {
                var title = file.name.replace(/\.[^/.]+$/, '');
                var artist = 'Unknown Artist';
                
                if (title.includes('-')) {
                    var parts = title.split('-');
                    artist = parts[0].trim();
                    title = parts[1].trim();
                }
                
                var newTrack = {
                    id: Date.now() + '-' + Math.random().toString(36).substr(2, 6),
                    title: title,
                    artist: artist,
                    duration: 180,
                    source: 'local',
                    favorite: false,
                    dateAdded: Date.now()
                };
                
                DB.saveTrack(newTrack).then(function() {
                    self.loadData();
                    self.notify('Загружено: ' + title);
                });
            }
        });
    };
    
    // Экспорт данных
    UI.prototype.exportData = function() {
        var data = {
            tracks: this.tracks,
            playlists: this.playlists,
            exportDate: new Date().toISOString()
        };
        var blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'musichub-backup.json';
        a.click();
        URL.revokeObjectURL(url);
        this.notify('Экспорт завершён');
    };
    
    // Загрузка данных
    UI.prototype.loadData = function() {
        var self = this;
        return DB.getAllTracks().then(function(tracks) {
            self.tracks = tracks;
            return DB.getAllPlaylists();
        }).then(function(playlists) {
            self.playlists = playlists;
            self.updateStats();
            if (self.page !== 'home') {
                self.renderPage();
            }
        });
    };
    
    // Обновление статистики
    UI.prototype.updateStats = function() {
        document.getElementById('trackCount').textContent = this.tracks.length;
        document.getElementById('playlistCount').textContent = this.playlists.length;
    };
    
    // Переход на страницу
    UI.prototype.go = function(page) {
        this.page = page;
        this.renderNav();
        this.renderPage();
        
        // Обновление URL без перезагрузки
        history.pushState({ page: page }, '', '#' + page);
    };
    
    // Поиск
    UI.prototype.search = function(query) {
        if (!query || query.length < 2) return;
        
        var results = this.tracks.filter(function(track) {
            return track.title.toLowerCase().includes(query.toLowerCase()) ||
                   track.artist.toLowerCase().includes(query.toLowerCase());
        });
        
        this.renderTrackList(results, 'searchResults');
    };
    
    // Инициализация
    UI.prototype.init = function() {
        var self = this;
        
        DB.open()
            .then(function() { return DB.initDemoData(); })
            .then(function() { return self.loadData(); })
            .then(function() {
                self.renderNav();
                self.renderPage();
                self.updateStats();
                
                // Скрыть лоадер
                var loader = document.getElementById('loader');
                var app = document.getElementById('app');
                if (loader && app) {
                    loader.classList.add('hidden');
                    app.classList.remove('hidden');
                }
                
                // Поиск
                var searchInput = document.getElementById('globalSearch');
                if (searchInput) {
                    searchInput.addEventListener('input', function(e) {
                        if (self.searchTimeout) clearTimeout(self.searchTimeout);
                        self.searchTimeout = setTimeout(function() {
                            if (self.page === 'search') {
                                self.search(e.target.value);
                            }
                        }, 300);
                    });
                }
                
                // Экспорт
                var exportBtn = document.getElementById('exportBtn');
                if (exportBtn) {
                    exportBtn.addEventListener('click', function() {
                        self.exportData();
                    });
                }
                
                // Плеер
                var playBtn = document.getElementById('playBtn');
                var prevBtn = document.getElementById('prevBtn');
                var nextBtn = document.getElementById('nextBtn');
                var volumeSlider = document.getElementById('volumeSlider');
                var progressBar = document.getElementById('progressBar');
                
                if (playBtn) {
                    playBtn.addEventListener('click', function() {
                        if (self.playing) {
                            self.playing = false;
                            if (self.progressInterval) clearInterval(self.progressInterval);
                            document.getElementById('playIcon').innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
                        } else if (self.currentTrack) {
                            self.playTrack(self.currentTrack);
                        }
                    });
                }
                
                if (volumeSlider) {
                    volumeSlider.addEventListener('input', function(e) {
                        var vol = e.target.value;
                        document.getElementById('volumeBtn').innerHTML = vol == 0 ? '🔇' : (vol < 30 ? '🔈' : (vol < 70 ? '🔉' : '🔊'));
                    });
                }
                
                if (progressBar) {
                    progressBar.addEventListener('click', function(e) {
                        if (!self.currentTrack) return;
                        var rect = progressBar.getBoundingClientRect();
                        var percent = (e.clientX - rect.left) / rect.width;
                        var seekTime = percent * (self.currentTrack.duration || 180);
                        // Симуляция перемотки
                    });
                }
                
                console.log('MusicHub готов');
            })
            .catch(function(e) {
                console.error('Ошибка:', e);
                var loader = document.getElementById('loader');
                if (loader) {
                    loader.innerHTML = '<div class="loader-error">Ошибка загрузки</div>';
                }
            });
    };
    
    window.ui = new UI();
})();
