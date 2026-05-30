// ========================================
// ОСНОВНОЕ ПРИЛОЖЕНИЕ
// ========================================

(function() {
    function renderTracks(tracksList, containerId, showFav) {
        if (showFav === undefined) showFav = true;
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
                var fillColor = track.favorite ? '#1db954' : 'none';
                html += '<button class="track-fav" data-id="' + track.id + '">' +
                    '<svg viewBox="0 0 24 24" fill="' + fillColor + '" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
                '</button>';
            }
            
            html += '</div>';
        }
        container.innerHTML = html;
        
        var items = container.querySelectorAll('.track-item');
        for (var i = 0; i < items.length; i++) {
            (function(item) {
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
            })(items[i]);
        }
    }
    
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
        
        var cards = container.querySelectorAll('.playlist-card');
        for (var i = 0; i < cards.length; i++) {
            (function(card) {
                card.addEventListener('click', function() {
                    showPlaylistDetail(card.dataset.id);
                });
            })(cards[i]);
        }
    }
    
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
    
    function showCreatePlaylistModal() {
        var modal = document.getElementById('modal');
        var input = document.getElementById('modalInput');
        input.value = '';
        document.getElementById('modalTitle').textContent = 'Создать плейлист';
        modal.classList.add('show');
        
        var confirmBtn = document.getElementById('modalConfirm');
        var closeBtn = document.getElementById('modalClose');
        
        var newConfirm = function() {
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
        };
        
        var newClose = function() {
            modal.classList.remove('show');
        };
        
        confirmBtn.onclick = newConfirm;
        closeBtn.onclick = newClose;
    }
    
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
                var fill = document.getElementById('progressFill');
                var currentTime = document.getElementById('currentTime');
                var totalTime = document.getElementById('totalTime');
                if (fill) fill.style.width = percent + '%';
                if (currentTime) currentTime.textContent = window.formatTime(current);
                if (totalTime) totalTime.textContent = window.formatTime(duration);
            } else if (current >= duration) {
                clearInterval(window.AppState.progressInterval);
                window.AppState.isPlaying = false;
                var fill = document.getElementById('progressFill');
                var currentTime = document.getElementById('currentTime');
                if (fill) fill.style.width = '0%';
                if (currentTime) currentTime.textContent = '0:00';
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
            
            var actions = document.querySelectorAll('.action-card');
            for (var i = 0; i < actions.length; i++) {
                (function(action) {
                    action.addEventListener('click', function() {
                        goToPage(action.dataset.page);
                    });
                })(actions[i]);
            }
            
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
            
            var createBtn = document.getElementById('createPlaylistBtn');
            if (createBtn) {
                createBtn.addEventListener('click', function() {
                    showCreatePlaylistModal();
                });
            }
            
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
            
            var exportBtn = document.getElementById('exportDataBtn');
            if (exportBtn) {
                exportBtn.addEventListener('click', function() {
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
            }
            
            var clearBtn = document.getElementById('clearDataBtn');
            if (clearBtn) {
                clearBtn.addEventListener('click', function() {
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
        }
        
        updateActiveNav();
    }
    
    function updateActiveNav() {
        var items = document.querySelectorAll('.nav-item');
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.dataset.page === window.AppState.currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        }
    }
    
    function goToPage(page) {
        window.AppState.currentPage = page;
        renderCurrentPage();
    }
    
    function init() {
        window.loadData();
        renderCurrentPage();
        window.updateStats();
        
        var navItems = document.querySelectorAll('.nav-item');
        for (var i = 0; i < navItems.length; i++) {
            (function(item) {
                item.addEventListener('click', function() {
                    goToPage(item.dataset.page);
                });
            })(navItems[i]);
        }
        
        var playBtn = document.getElementById('playBtn');
        if (playBtn) playBtn.addEventListener('click', togglePlay);
        
        var prevBtn = document.getElementById('prevBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                if (!window.AppState.currentTrack) return;
                var index = window.AppState.tracks.findIndex(function(t) { return t.id === window.AppState.currentTrack.id; });
                if (index > 0) playTrack(window.AppState.tracks[index - 1]);
            });
        }
        
        var nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                if (!window.AppState.currentTrack) return;
                var index = window.AppState.tracks.findIndex(function(t) { return t.id === window.AppState.currentTrack.id; });
                if (index < window.AppState.tracks.length - 1) playTrack(window.AppState.tracks[index + 1]);
            });
        }
        
        var volumeSlider = document.getElementById('volumeSlider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', function(e) {
                var vol = e.target.value;
                var volBtn = document.getElementById('volumeBtn');
                if (volBtn) {
                    var icon = '';
                    if (vol == 0) icon = '🔇';
                    else if (vol < 30) icon = '🔈';
                    else if (vol < 70) icon = '🔉';
                    else icon = '🔊';
                    volBtn.innerHTML = icon;
                }
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
