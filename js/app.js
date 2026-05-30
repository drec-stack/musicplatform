// ========================================
// ГЛАВНЫЙ ФАЙЛ ПРИЛОЖЕНИЯ
// ========================================

(function() {
    'use strict';
    
    // Состояние приложения
    var AppState = {
        tracks: [],
        playlists: [],
        currentPage: 'home',
        currentTrack: null,
        isPlaying: false,
        progressInterval: null
    };
    
    // Демо данные
    var DEMO_TRACKS = [
        { id: '1', title: 'Midnight Dreams', artist: 'Electronic Beats', duration: 214, favorite: false },
        { id: '2', title: 'Urban Flow', artist: 'City Lights', duration: 183, favorite: false },
        { id: '3', title: 'Chill Session', artist: 'Lofi Study', duration: 245, favorite: false },
        { id: '4', title: 'Rock Anthem', artist: 'The Thunder', duration: 198, favorite: false },
        { id: '5', title: 'Jazz Evening', artist: 'Smooth Trio', duration: 312, favorite: false },
        { id: '6', title: 'Acoustic Sunrise', artist: 'Folk Guitarist', duration: 267, favorite: false },
        { id: '7', title: 'Deep House', artist: 'Club Mixer', duration: 356, favorite: false },
        { id: '8', title: 'Smooth R&B', artist: 'Soul Singer', duration: 234, favorite: false }
    ];
    
    var DEMO_PLAYLISTS = [
        { id: 'pl1', name: 'Favorites', tracks: ['1', '3', '5'] },
        { id: 'pl2', name: 'Workout', tracks: ['2', '4', '7'] }
    ];
    
    // Загрузка данных
    function loadData() {
        var savedTracks = localStorage.getItem('musichub_tracks');
        var savedPlaylists = localStorage.getItem('musichub_playlists');
        
        if (savedTracks) {
            AppState.tracks = JSON.parse(savedTracks);
        } else {
            AppState.tracks = DEMO_TRACKS.slice();
            saveData();
        }
        
        if (savedPlaylists) {
            AppState.playlists = JSON.parse(savedPlaylists);
        } else {
            AppState.playlists = DEMO_PLAYLISTS.slice();
            saveData();
        }
        
        updateStats();
    }
    
    function saveData() {
        localStorage.setItem('musichub_tracks', JSON.stringify(AppState.tracks));
        localStorage.setItem('musichub_playlists', JSON.stringify(AppState.playlists));
    }
    
    function updateStats() {
        var trackCount = document.getElementById('trackCount');
        var playlistCount = document.getElementById('playlistCount');
        if (trackCount) trackCount.textContent = AppState.tracks.length;
        if (playlistCount) playlistCount.textContent = AppState.playlists.length;
    }
    
    function formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        var mins = Math.floor(seconds / 60);
        var secs = Math.floor(seconds % 60);
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    }
    
    function showToast(msg) {
        var toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(function() {
            if (toast && toast.remove) toast.remove();
        }, 3000);
    }
    
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
    
    // Рендер треков
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
            var fillColor = track.favorite ? '#1db954' : 'none';
            html += '<div class="track-item" data-id="' + track.id + '">' +
                '<div class="track-index">' + (i + 1) + '</div>' +
                '<div class="track-info">' +
                    '<div class="track-cover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>' +
                    '<div>' +
                        '<div class="track-name">' + escapeHtml(track.title) + '</div>' +
                        '<div class="track-artist">' + escapeHtml(track.artist) + '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="track-duration">' + formatTime(track.duration) + '</div>';
            
            if (showFav) {
                html += '<button class="track-fav" data-id="' + track.id + '">' +
                    '<svg viewBox="0 0 24 24" fill="' + fillColor + '" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
                '</button>';
            }
            
            html += '</div>';
        }
        container.innerHTML = html;
        
        // Обработчики
        var items = container.querySelectorAll('.track-item');
        for (var i = 0; i < items.length; i++) {
            (function(item) {
                item.addEventListener('click', function(e) {
                    if (e.target.closest('.track-fav')) return;
                    var id = item.dataset.id;
                    var track = AppState.tracks.find(function(t) { return t.id === id; });
                    if (track) playTrack(track);
                });
                
                var favBtn = item.querySelector('.track-fav');
                if (favBtn) {
                    favBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        var id = favBtn.dataset.id;
                        var track = AppState.tracks.find(function(t) { return t.id === id; });
                        if (track) {
                            track.favorite = !track.favorite;
                            saveData();
                            renderCurrentPage();
                            showToast(track.favorite ? 'В избранном' : 'Удалено из избранного');
                        }
                    });
                }
            })(items[i]);
        }
    }
    
    // Рендер плейлистов
    function renderPlaylists() {
        var container = document.getElementById('playlistsContainer');
        if (!container) return;
        
        if (AppState.playlists.length === 0) {
            container.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h20v16H2z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="12" y2="12"/></svg><p>Нет плейлистов</p><button class="btn-primary" id="createEmptyBtn">Создать плейлист</button></div>';
            var createBtn = document.getElementById('createEmptyBtn');
            if (createBtn) {
                createBtn.addEventListener('click', function() { showCreatePlaylistModal(); });
            }
            return;
        }
        
        var html = '<div class="playlist-grid">';
        for (var i = 0; i < AppState.playlists.length; i++) {
            var pl = AppState.playlists[i];
            html += '<div class="playlist-card" data-id="' + pl.id + '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 4h20v16H2z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="12" y2="12"/></svg>' +
                '<div class="playlist-name">' + escapeHtml(pl.name) + '</div>' +
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
        var playlist = AppState.playlists.find(function(p) { return p.id === id; });
        if (!playlist) return;
        
        var playlistTracks = (playlist.tracks || []).map(function(tid) {
            return AppState.tracks.find(function(t) { return t.id === tid; });
        }).filter(function(t) { return t; });
        
        var container = document.getElementById('content');
        container.innerHTML = '<div class="page">' +
            '<div class="page-header">' +
                '<button class="btn-primary" id="backBtn" style="margin-bottom:16px; background:#333;">← Назад</button>' +
                '<h1 class="page-title">' + escapeHtml(playlist.name) + '</h1>' +
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
                AppState.playlists = AppState.playlists.filter(function(p) { return p.id !== id; });
                saveData();
                goToPage('playlists');
                showToast('Плейлист удалён');
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
        
        confirmBtn.onclick = function() {
            var name = input.value.trim();
            if (name) {
                var newPlaylist = {
                    id: Date.now().toString(),
                    name: name,
                    tracks: []
                };
                AppState.playlists.push(newPlaylist);
                saveData();
                modal.classList.remove('show');
                goToPage('playlists');
                showToast('Плейлист создан');
            }
        };
        
        closeBtn.onclick = function() {
            modal.classList.remove('show');
        };
    }
    
    // Воспроизведение
    function playTrack(track) {
        if (AppState.progressInterval) clearInterval(AppState.progressInterval);
        
        AppState.currentTrack = track;
        AppState.isPlaying = true;
        
        document.getElementById('playerTitle').textContent = track.title;
        document.getElementById('playerArtist').textContent = track.artist;
        
        var duration = track.duration;
        var current = 0;
        
        AppState.progressInterval = setInterval(function() {
            if (AppState.isPlaying && current < duration) {
                current++;
                var percent = (current / duration) * 100;
                var fill = document.getElementById('progressFill');
                var currentTime = document.getElementById('currentTime');
                var totalTime = document.getElementById('totalTime');
                if (fill) fill.style.width = percent + '%';
                if (currentTime) currentTime.textContent = formatTime(current);
                if (totalTime) totalTime.textContent = formatTime(duration);
            } else if (current >= duration) {
                clearInterval(AppState.progressInterval);
                AppState.isPlaying = false;
                var fill = document.getElementById('progressFill');
                var currentTime = document.getElementById('currentTime');
                if (fill) fill.style.width = '0%';
                if (currentTime) currentTime.textContent = '0:00';
            }
        }, 1000);
    }
    
    function togglePlay() {
        if (!AppState.currentTrack) return;
        AppState.isPlaying = !AppState.isPlaying;
        if (!AppState.isPlaying && AppState.progressInterval) {
            clearInterval(AppState.progressInterval);
            AppState.progressInterval = null;
        } else if (AppState.isPlaying && !AppState.progressInterval) {
            playTrack(AppState.currentTrack);
        }
    }
    
    // Рендер страницы
    function renderCurrentPage() {
        var container = document.getElementById('content');
        var page = AppState.currentPage;
        
        if (page === 'home') {
            var recent = AppState.tracks.slice(-5).reverse();
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
            renderTracks(AppState.tracks, 'allTracks', true);
            
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
                    var data = { tracks: AppState.tracks, playlists: AppState.playlists };
                    var blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = url;
                    a.download = 'musichub-backup.json';
                    a.click();
                    URL.revokeObjectURL(url);
                    showToast('Экспорт завершён');
                });
            }
            
            var clearBtn = document.getElementById('clearDataBtn');
            if (clearBtn) {
                clearBtn.addEventListener('click', function() {
                    if (confirm('Удалить все данные? Отменить нельзя!')) {
                        AppState.tracks = [];
                        AppState.playlists = [];
                        saveData();
                        updateStats();
                        goToPage('home');
                        showToast('Данные очищены');
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
            if (item.dataset.page === AppState.currentPage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        }
    }
    
    function goToPage(page) {
        AppState.currentPage = page;
        renderCurrentPage();
    }
    
    // Инициализация
    function init() {
        console.log('MusicHub инициализация...');
        loadData();
        renderCurrentPage();
        updateStats();
        
        // Навигация
        var navItems = document.querySelectorAll('.nav-item');
        for (var i = 0; i < navItems.length; i++) {
            (function(item) {
                item.addEventListener('click', function() {
                    goToPage(item.dataset.page);
                });
            })(navItems[i]);
        }
        
        // Плеер
        var playBtn = document.getElementById('playBtn');
        if (playBtn) playBtn.addEventListener('click', togglePlay);
        
        var prevBtn = document.getElementById('prevBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                if (!AppState.currentTrack) return;
                var index = AppState.tracks.findIndex(function(t) { return t.id === AppState.currentTrack.id; });
                if (index > 0) playTrack(AppState.tracks[index - 1]);
            });
        }
        
        var nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                if (!AppState.currentTrack) return;
                var index = AppState.tracks.findIndex(function(t) { return t.id === AppState.currentTrack.id; });
                if (index < AppState.tracks.length - 1) playTrack(AppState.tracks[index + 1]);
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
        
        // Скрыть лоадер
        setTimeout(function() {
            var loader = document.getElementById('loader');
            var app = document.getElementById('app');
            if (loader && app) {
                loader.classList.add('hidden');
                app.classList.add('visible');
            }
        }, 500);
        
        console.log('MusicHub готов! Треков: ' + AppState.tracks.length);
    }
    
    // Запуск после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
