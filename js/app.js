// ========================================
// ОСНОВНОЕ ПРИЛОЖЕНИЕ
// ========================================

(function() {
    // Рендер треков
    function renderTracks(tracksList, containerId, showFav = true) {
        var container = document.getElementById(containerId);
        if (!container) return;
        
        if (!tracksList || tracksList.length === 0) {
            container.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg><p>Нет треков</p></div>';
            return;
        }
        
        var html = '';
        for (var i = 0; i < tracksList.length; i++) {
            var track = tracksList[i];
            html += '<div class="track-item" data-id="' + track.id + '">' +
                '<div class="track-index">' + (i + 1) + '</div>' +
                '<div class="track-info">' +
                    '<div class="track-cover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>' +
                    '<div>' +
                        '<div class="track-name">' + window.escapeHtml(track.title) + '</div>' +
                        '<div class="track-artist">' + window.escapeHtml(track.artist) + '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="track-duration">' + window.formatTime(track.duration) + '</div>';
            
            if (showFav) {
                html += '<button class="track-fav" data-id="' + track.id + '">' +
                    '<svg viewBox="0 0 24 24" fill="' + (track.favorite ? '#1db954' : 'none') + '" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
                '</button>';
            }
            
            html += '</div>';
        }
        container.innerHTML = html;
        
        container.querySelectorAll('.track-item').forEach(function(item) {
            item.addEventListener('click', function(e) {
                if (e.target.closest('.track-fav')) return;
                var id = item.dataset.id;
                var track = window.AppState.tracks.find(function(t) { return t.id === id; });
                if (track) playTrack(track);
            });
            
            var favBtn = item.querySelector('.track-fav');
            if (favBtn) {
                favBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var id = favBtn.dataset.id;
                    var track = window.AppState.tracks.find(function(t) { return t.id === id; });
                    if (track) {
                        track.favorite = !track.favorite;
                        window.saveData();
                        renderCurrentPage();
                        window.showToast(track.favorite ? 'В избранном' : 'Удалено из избранного');
                    }
                });
            }
        });
    }
    
    // Рендер плейлистов
    function renderPlaylists() {
        var container = document.getElementById('playlistsContainer');
        if (!container) return;
        
        if (window.AppState.playlists.length === 0) {
            container.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h20v16H2z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="12" y2="12"/></svg><p>Нет плейлистов</p><button class="btn-primary" id="createEmptyBtn">Создать плейлист</button></div>';
                    
                    var createBtn = document.getElementById('createEmptyBtn');
                    if (createBtn) {
                        createBtn.addEventListener('click', function() { showCreatePlaylistModal(); });
                    }
                    return;
        }
        
        var html = '<div class="playlist-grid">';
        for (var i = 0; i < window.AppState.playlists.length; i++) {
            var pl = window.AppState.playlists[i];
            html += '<div class="playlist-card" data-id="' + pl.id + '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h20v16H2z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="12" y2="12"/></svg>' +
                '<div class="playlist-name">' + window.escapeHtml(pl.name) + '</div>' +
                '<div class="playlist-count">' + (pl.tracks ? pl.tracks.length : 0) + ' треков</div>' +
            '</div>';
        }
        html += '</div>';
        container.innerHTML = html;
        
        container.querySelectorAll('.playlist-card').forEach(function(card) {
            card.addEventListener('click', function() {
                showPlaylistDetail(card.dataset.id);
            });
        });
    }
    
    // Показать детали плейлиста
    function showPlaylistDetail(id) {
        var playlist = window.AppState.playlists.find(function(p) { return p.id === id; });
        if (!playlist) return;
        
        var playlistTracks = (playlist.tracks || []).map(function(tid) {
            return window.AppState.tracks.find(function(t) { return t.id === tid; });
        }).filter(function(t) { return t; });
        
        var container = document.getElementById('content');
        container.innerHTML = '<div class="page">' +
            '<div class="page-header">' +
                '<button class="btn-primary" id="backBtn" style="margin-bottom:16px; background:#333;">← Назад</button>' +
                '<h1 class="page-title">' + window.escapeHtml(playlist.name) + '</h1>' +
                '<p class="page-subtitle">' + playlistTracks.length + ' треков</p>' +
            '</div>' +
            '<div id="playlistTracks" class="track-list"></div>' +
            '<div style="display:flex; gap:12px; margin-top:20px;">' +
                '<button class="btn-primary" id="playAllBtn">▶ Играть все</button>' +
                '<button class="btn-primary" id="deletePlaylistBtn" style="background:#dc3545;">🗑 Удалить</button>' +
            '</div>' +
        '</div>';
        
        renderTracks(playlistTracks, 'playlistTracks', true);
        
        document.getElementById('backBtn').addEventListener('click', function() {
            goToPage('playlists');
        });
        
        document.getElementById('playAllBtn').addEventListener('click', function() {
            if (playlistTracks.length > 0) playTrack(playlistTracks[0]);
        });
        
        document.getElementById('deletePlaylistBtn').addEventListener('click', function() {
            if (confirm('Удалить плейлист "' + playlist.name + '"?')) {
                window.AppState.playlists = window.AppState.playlists.filter(function(p) { return p.id !== id; });
                window.saveData();
                goToPage('playlists');
                window.showToast('Плейлист удалён');
            }
        });
    }
    
    // Создание плейлиста
    function showCreatePlaylistModal() {
        var modal = document.getElementById('modal');
        var input = document.getElementById('modalInput');
        input.value = '';
        document.getElementById('modalTitle').textContent = 'Создать плейлист';
        modal.classList.add('show');
        
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
                    tracks: []
                };
                window.AppState.playlists.push(newPlaylist);
                window.saveData();
                modal.classList.remove('show');
                goToPage('playlists');
                window.showToast('Плейлист создан');
            }
            confirmBtn.onclick = oldConfirm;
            closeBtn.onclick = oldClose;
        };
        
        closeBtn.onclick = function() {
            modal.classList.remove('show');
            closeBtn.onclick = oldClose;
        };
    }
    
    // Воспроизведение
    function playTrack(track) {
        if (window.AppState.progressInterval) clearInterval(window.AppState.progressInterval);
        
        window.AppState.currentTrack = track;
        window.AppState.isPlaying = true;
        
        document.getElementById('playerTitle').textContent = track.title;
        document.getElementById('playerArtist').textContent = track.artist;
        
        var duration = track.duration;
        var current = 0;
        
        window.AppState.progressInterval = setInterval(function() {
            if (window.AppState.isPlaying && current < duration) {
                current++;
                var percent = (current / duration) * 100;
                document.getElementById('progressFill').style.width = percent + '%';
                document.getElementById('currentTime').textContent = window.formatTime(current);
                document.getElementById('totalTime').textContent = window.formatTime(duration);
            } else if (current >= duration) {
                clearInterval(window.AppState.progressInterval);
                window.AppState.isPlaying = false;
                document.getElementById('progressFill').style.width = '0%';
                document.getElementById('currentTime').textContent = '0:00';
            }
        }, 1000);
    }
    
    function togglePlay() {
        if (!window.AppState.currentTrack) return;
        window.AppState.isPlaying = !window.AppState.isPlaying;
        if (!window.AppState.isPlaying && window.AppState.progressInterval) {
            clearInterval(window.AppState.progressInterval);
            window.AppState.progressInterval = null;
        } else if (window.AppState.isPlaying && !window.AppState.progressInterval) {
            playTrack(window.AppState.currentTrack);
        }
    }
    
    // Рендер страницы
    function renderCurrentPage() {
        var container = document.getElementById('content');
        var page = window.AppState.currentPage;
        
        if (page === 'home') {
            var recent = window.AppState.tracks.slice(-5).reverse();
            container.innerHTML = '<div class="page">' +
                '<div class="page-header">' +
                    '<h1 class="page-title">Добро пожаловать</h1>' +
                    '<p class="page-subtitle">Ваша музыкальная платформа</p>' +
                '</div>' +
                '<div class="actions-grid">' +
                    '<div class="action-card" data-page="library"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h16v12H4z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg><span>Библиотека</span></div>' +
                    '<div class="action-card" data-page="playlists"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h20v16H2z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="12" y2="12"/></svg><span>Плейлисты</span></div>' +
                '</div>' +
                '<div class="section">' +
                    '<h2 style="margin-bottom:20px;">Недавние треки</h2>' +
                    '<div id="recentTracks" class="track-list"></div>' +
                '</div>' +
            '</div>';
            
            renderTracks(recent, 'recentTracks', true);
            
            document.querySelectorAll('.action-card').forEach(function(card) {
                card.addEventListener('click', function() {
                    goToPage(card.dataset.page);
                });
            });
            
        } else if (page === 'library') {
            container.innerHTML = '<div class="page">' +
                '<div class="page-header">' +
                    '<h1 class="page-title">Библиотека</h1>' +
                    '<p class="page-subtitle">Все треки</p>' +
                '</div>' +
                '<div id="allTracks" class="track-list"></div>' +
            '</div>';
            renderTracks(window.AppState.tracks, 'allTracks', true);
            
        } else if (page === 'playlists') {
            container.innerHTML = '<div class="page">' +
                '<div class="page-header">' +
                    '<h1 class="page-title">Плейлисты</h1>' +
                    '<button class="btn-primary" id="createPlaylistBtn" style="margin-top:16px;">+ Создать</button>' +
                '</div>' +
                '<div id="playlistsContainer"></div>' +
            '</div>';
            
            renderPlaylists();
            
            document.getElementById('createPlaylistBtn').addEventListener('click', function() {
                showCreatePlaylistModal();
            });
            
        } else if (page === 'settings') {
            container.innerHTML = '<div class="page">' +
                '<div class="page-header">' +
                    '<h1 class="page-title">Настройки</h1>' +
                '</div>' +
                '<div class="settings-section">' +
                    '<div class="settings-title">Данные</div>' +
                    '<div class="settings-actions">' +
                        '<button class="btn-primary" id="exportDataBtn">Экспорт</button>' +
                        '<button class="btn-primary" id="clearDataBtn" style="background:#dc3545;">Очистить всё</button>' +
                    '</div>' +
                '</div>' +
                '<div class="settings-section">' +
                    '<div class="settings-title">О приложении</div>' +
                    '<p>MusicHub v2.0.0</p>' +
                '</div>' +
            '</div>';
            
            document.getElementById('exportDataBtn').addEventListener('click', function() {
                var data = { tracks: window.AppState.tracks, playlists: window.AppState.playlists };
                var blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = 'musichub-backup.json';
                a.click();
                URL.revokeObjectURL(url);
                window.showToast('Экспорт завершён');
            });
            
            document.getElementById('clearDataBtn').addEventListener('click', function() {
                if (confirm('Удалить все данные? Отменить нельзя!')) {
                    window.AppState.tracks = [];
                    window.AppState.playlists = [];
                    window.saveData();
                    window.updateStats();
                    goToPage('home');
                    window.showToast('Данные очищены');
                }
            });
        }
        
        updateActiveNav();
    }
    
    function updateActiveNav() {
        document.querySelectorAll('.nav-item').forEach(function(item) {
            if (item.dataset.page === window.AppState.currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }
    
    function goToPage(page) {
        window.AppState.currentPage = page;
        renderCurrentPage();
    }
    
    // Инициализация
    function init() {
        window.loadData();
        renderCurrentPage();
        window.updateStats();
        
        document.querySelectorAll('.nav-item').forEach(function(item) {
            item.addEventListener('click', function() {
                goToPage(item.dataset.page);
            });
        });
        
        document.getElementById('playBtn').addEventListener('click', togglePlay);
        document.getElementById('prevBtn').addEventListener('click', function() {
            if (!window.AppState.currentTrack) return;
            var index = window.AppState.tracks.findIndex(function(t) { return t.id === window.AppState.currentTrack.id; });
            if (index > 0) playTrack(window.AppState.tracks[index - 1]);
        });
        document.getElementById('nextBtn').addEventListener('click', function() {
            if (!window.AppState.currentTrack) return;
            var index = window.AppState.tracks.findIndex(function(t) { return t.id === window.AppState.currentTrack.id; });
            if (index < window.AppState.tracks.length - 1) playTrack(window.AppState.tracks[index + 1]);
        });
        
        var volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', function(e) {
                var vol = e.target.value;
                var volBtn = document.getElementById('volumeBtn');
                if (volBtn) {
                    volBtn.innerHTML = vol == 0 ? '🔇' : (vol < 30 ? '🔈' : (vol < 70 ? '🔉' : '🔊'));
                }
            });
        }
        
        var progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.addEventListener('click', function(e) {
                if (!window.AppState.currentTrack) return;
                var rect = progressBar.getBoundingClientRect();
                var percent = (e.clientX - rect.left) / rect.width;
                // Перемотка
            });
        }
        
        setTimeout(function() {
            var loader = document.getElementById('loader');
            var app = document.getElementById('app');
            if (loader && app) {
                loader.classList.add('hidden');
                app.classList.add('visible');
            }
        }, 300);
        
        console.log('MusicHub готов!');
    }
    
    init();
})();
