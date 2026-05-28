class UIManager {
    constructor() {
        this.currentPage = 'home';
        this.currentLibraryTab = 'tracks';
        this.searchTimeout = null;
    }

    async init() {
        this.renderSidebar();
        this.renderTopbar();
        this.renderPlayer();
        this.renderNotificationContainer();
        this.bindGlobalEvents();
        this.checkSpotifyCallback();
        await this.navigateTo(storage.get('current_page', 'home'));
        this.loadSidebarStats();
        this.bindPlayerEvents();
    }

    checkSpotifyCallback() {
        if (services.checkSpotifyCallback()) {
            this.showNotification('Spotify подключен', 'success');
            this.renderSidebar();
        }
    }

    async loadSidebarStats() {
        try {
            var stats = await library.getStats();
            var statsEl = document.getElementById('sidebarStats');
            if (statsEl) {
                statsEl.innerHTML = '';
                var statItems = [
                    { value: stats.totalTracks, label: 'треков' },
                    { value: stats.totalPlaylists, label: 'плейлистов' },
                    { value: this.formatStorageSize(stats.storageUsage), label: 'занято' }
                ];
                for (var i = 0; i < statItems.length; i++) {
                    var div = document.createElement('div');
                    div.className = 'sidebar-stat';
                    div.innerHTML = '<span class="stat-value">' + statItems[i].value + '</span><span class="stat-label">' + statItems[i].label + '</span>';
                    statsEl.appendChild(div);
                }
            }
        } catch (e) {
            console.error('Failed to load stats:', e);
        }
    }

    formatStorageSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        var units = ['B', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
    }

    renderSidebar() {
        var sidebar = document.getElementById('sidebar');
        var allServices = services.getAll();
        var self = this;

        var html = '';
        html += '<div class="sidebar-header">';
        html += '<div class="sidebar-logo">';
        html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
        html += '<span>MusicHub</span>';
        html += '</div></div>';

        html += '<nav class="sidebar-nav">';
        var navItems = [
            { page: 'home', svg: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>', label: 'Главная' },
            { page: 'library', svg: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>', label: 'Медиатека' },
            { page: 'search', svg: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>', label: 'Поиск' },
            { page: 'upload', svg: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>', label: 'Загрузить' },
            { page: 'import', svg: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>', label: 'Импорт' },
            { page: 'playlists', svg: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>', label: 'Плейлисты' }
        ];
        for (var i = 0; i < navItems.length; i++) {
            html += '<a class="nav-item" data-page="' + navItems[i].page + '">';
            html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + navItems[i].svg + '</svg>';
            html += navItems[i].label + '</a>';
        }
        html += '</nav>';

        html += '<div class="sidebar-divider"></div>';
        html += '<div class="sidebar-section"><div class="sidebar-section-title">Статистика</div>';
        html += '<div class="sidebar-stats" id="sidebarStats"><span class="text-muted">Загрузка...</span></div></div>';
        html += '<div class="sidebar-divider"></div>';

        html += '<div class="sidebar-section"><div class="sidebar-section-title">Сервисы</div><div class="services-list">';
        for (var j = 0; j < allServices.length; j++) {
            var s = allServices[j];
            html += '<div class="service-item"><span class="service-dot" style="background:' + (s.connected ? s.color : '#3a3a4a') + '"></span>';
            html += '<span style="color:' + (s.connected ? 'var(--text-primary)' : 'var(--text-muted)') + '">' + s.name + '</span></div>';
        }
        html += '</div></div>';

        html += '<div class="sidebar-footer"><a class="nav-item" data-page="settings">';
        html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';
        html += 'Настройки</a></div>';

        sidebar.innerHTML = html;

        var navLinks = sidebar.querySelectorAll('.nav-item');
        for (var k = 0; k < navLinks.length; k++) {
            (function(link) {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    self.navigateTo(link.dataset.page);
                });
            })(navLinks[k]);
        }
    }

    renderTopbar() {
        var topbar = document.getElementById('topbar');
        topbar.innerHTML = '<div class="search-container"><div class="search-input-wrapper">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
            '<input type="text" id="globalSearch" placeholder="Поиск в своей библиотеке..." autocomplete="off">' +
            '<span class="search-shortcut">Ctrl+K</span></div></div>' +
            '<div class="topbar-actions">' +
            '<button class="btn-icon" id="exportBtn" title="Экспорт"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></button>' +
            '</div>';
        var self = this;
        document.getElementById('exportBtn').addEventListener('click', function() { self.exportLibrary(); });
    }

    renderPlayer() {
        var playerEl = document.getElementById('player');
        playerEl.innerHTML = '<div class="player-container">' +
            '<div class="player-track">' +
            '<div class="player-track-cover-placeholder" id="playerCover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="24" height="24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>' +
            '<div class="player-track-info"><div class="player-track-title" id="playerTitle">Ничего не играет</div><div class="player-track-artist" id="playerArtist">Выберите трек</div></div>' +
            '<div class="player-track-actions">' +
            '<button class="btn-icon" id="playerAddToPlaylistBtn" title="В плейлист"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>' +
            '</div></div>' +
            '<div class="player-main">' +
            '<div class="player-controls">' +
            '<button class="player-btn" id="shuffleBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg></button>' +
            '<button class="player-btn" id="prevBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></svg></button>' +
            '<button class="player-btn-play" id="playBtn"><svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" id="playIcon"><polygon points="5 3 19 12 5 21 5 3"/></svg></button>' +
            '<button class="player-btn" id="nextBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg></button>' +
            '<button class="player-btn" id="repeatBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg></button>' +
            '</div>' +
            '<div class="player-progress"><span class="player-time" id="currentTime">0:00</span>' +
            '<div class="player-progress-bar" id="progressBar"><div class="player-progress-fill" id="progressFill" style="width:0%"><div class="player-progress-thumb"></div></div></div>' +
            '<span class="player-time" id="totalTime">0:00</span></div></div>' +
            '<div class="player-extras"><div class="player-volume">' +
            '<button class="btn-icon" id="volumeBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg></button>' +
            '<input type="range" class="player-volume-slider" id="volumeSlider" min="0" max="100" value="70"></div></div></div>';
    }

    renderNotificationContainer() {
        var container = document.createElement('div');
        container.className = 'notification-container';
        container.id = 'notificationContainer';
        document.body.appendChild(container);
    }

    showNotification(message, type) {
        var container = document.getElementById('notificationContainer');
        if (!container) return;
        var notification = document.createElement('div');
        notification.className = 'notification ' + (type || 'info');
        notification.textContent = message;
        container.appendChild(notification);
        setTimeout(function() {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            notification.style.transition = 'all 0.3s ease';
            setTimeout(function() { notification.remove(); }, 300);
        }, 3000);
    }

    async navigateTo(page) {
        this.currentPage = page;
        storage.set('current_page', page);
        var navItems = document.querySelectorAll('#sidebar .nav-item');
        for (var i = 0; i < navItems.length; i++) {
            navItems[i].classList.toggle('active', navItems[i].dataset.page === page);
        }
        var content = document.getElementById('content');
        content.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div></div>';

        switch(page) {
            case 'home':
                content.innerHTML = await this.getHomePage();
                await this.loadHomeContent();
                break;
            case 'library':
                content.innerHTML = this.getLibraryPage();
                await this.loadLibraryContent('tracks');
                this.bindLibraryTabs();
                break;
            case 'search':
                content.innerHTML = this.getSearchPage();
                break;
            case 'upload':
                content.innerHTML = this.getUploadPage();
                this.bindUploadEvents();
                break;
            case 'import':
                content.innerHTML = this.getImportPage();
                this.bindImportEvents();
                break;
            case 'playlists':
                content.innerHTML = await this.getPlaylistsPage();
                break;
            case 'settings':
                content.innerHTML = this.getSettingsPage();
                this.bindSettingsEvents();
                break;
        }
    }

    getHomePage() {
        return '<div class="page"><div class="page-header"><h1 class="page-title">Моя музыкальная платформа</h1><p class="page-subtitle">Независимая библиотека с импортом из любых сервисов</p></div>' +
            '<div class="quick-actions">' +
            '<div class="action-card" id="actionUpload"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg><span>Загрузить музыку</span></div>' +
            '<div class="action-card" id="actionImport"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg><span>Импорт</span></div>' +
            '<div class="action-card" id="actionLibrary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg><span>Медиатека</span></div>' +
            '<div class="action-card" id="actionSearch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span>Поиск</span></div>' +
            '</div><div class="section"><div class="section-header"><h2 class="section-title">Недавно добавлено</h2></div><div id="recentTracksContainer"></div></div>' +
            '<div class="section"><div class="section-header"><h2 class="section-title">Мои плейлисты</h2></div><div id="homePlaylistsContainer"></div></div></div>';
    }

    async loadHomeContent() {
        var self = this;
        var recentContainer = document.getElementById('recentTracksContainer');
        var playlistsContainer = document.getElementById('homePlaylistsContainer');

        if (recentContainer) {
            var recentTracks = await library.getRecentTracks(8);
            if (recentTracks.length === 0) {
                recentContainer.innerHTML = '<div class="empty-state"><p>Библиотека пуста</p></div>';
            } else {
                var html = '<div class="track-list">';
                for (var i = 0; i < recentTracks.length; i++) {
                    html += self.renderTrackRow(recentTracks[i], i);
                }
                html += '</div>';
                recentContainer.innerHTML = html;
                recentContainer.querySelectorAll('.track-row').forEach(function(row) {
                    row.addEventListener('click', function() { self.playTrackFromRow(row); });
                });
            }
        }

        if (playlistsContainer) {
            var playlists = await library.getPlaylists();
            if (playlists.length === 0) {
                playlistsContainer.innerHTML = '<div class="empty-state"><p>Нет плейлистов</p></div>';
            } else {
                var plHtml = '<div class="playlist-grid">';
                for (var j = 0; j < Math.min(playlists.length, 6); j++) {
                    plHtml += self.renderPlaylistCard(playlists[j]);
                }
                plHtml += '</div>';
                playlistsContainer.innerHTML = plHtml;
            }
        }

        document.getElementById('actionUpload').addEventListener('click', function() { self.navigateTo('upload'); });
        document.getElementById('actionImport').addEventListener('click', function() { self.navigateTo('import'); });
        document.getElementById('actionLibrary').addEventListener('click', function() { self.navigateTo('library'); });
        document.getElementById('actionSearch').addEventListener('click', function() { self.navigateTo('search'); });
    }

    renderTrackRow(track, index) {
        var duration = track.duration ? player.formatTime(track.duration / 1000) : '--:--';
        var sourceLabel = track.source === 'local' ? 'Мой файл' : track.source;
        return '<div class="track-row" data-track=\'' + this.escapeHtml(JSON.stringify(track)) + '\'>' +
            '<span class="track-row-index">' + (index + 1) + '</span>' +
            '<div class="track-row-info"><div class="track-row-cover-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>' +
            '<div class="track-row-text"><div class="track-row-title">' + this.escapeHtml(track.title) + '</div><div class="track-row-artist">' + this.escapeHtml(track.artist) + '</div></div></div>' +
            '<span class="track-row-source">' + sourceLabel + '</span>' +
            '<span class="track-row-duration">' + duration + '</span></div>';
    }

    renderPlaylistCard(playlist) {
        var count = playlist.tracks ? playlist.tracks.length : 0;
        return '<div class="playlist-card" data-playlist-id="' + playlist.id + '">' +
            '<div class="playlist-card-cover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg></div>' +
            '<div class="playlist-card-name">' + this.escapeHtml(playlist.name) + '</div>' +
            '<div class="playlist-card-count">' + count + ' треков</div></div>';
    }

    getLibraryPage() {
        return '<div class="page"><div class="page-header"><h1 class="page-title">Медиатека</h1>' +
            '<div class="library-actions"><button class="btn btn-secondary btn-sm" id="findDuplicatesBtn">Найти дубликаты</button>' +
            '<button class="btn btn-secondary btn-sm" id="removeDuplicatesBtn">Удалить дубликаты</button></div></div>' +
            '<div class="tabs"><button class="tab active" data-tab="tracks">Треки</button><button class="tab" data-tab="artists">Артисты</button><button class="tab" data-tab="albums">Альбомы</button></div>' +
            '<div class="library-filters"><select id="sourceFilter" class="form-input" style="width:auto;"><option value="all">Все источники</option><option value="local">Локальные</option><option value="spotify">Spotify</option><option value="youtube">YouTube</option><option value="import">Импорт</option></select>' +
            '<select id="sortFilter" class="form-input" style="width:auto;"><option value="dateAdded">По дате</option><option value="title">По названию</option><option value="artist">По артисту</option><option value="playCount">По популярности</option></select></div>' +
            '<div id="libraryContent"></div></div>';
    }

    async loadLibraryContent(tab, source, sort) {
        var container = document.getElementById('libraryContent');
        if (!container) return;
        container.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div></div>';

        try {
            if (tab === 'tracks') {
                var tracks = await library.getTracks({ source: source || 'all', sort: sort || 'dateAdded' });
                if (tracks.length === 0) {
                    container.innerHTML = '<div class="empty-state"><p>Треки не найдены</p></div>';
                    return;
                }
                var html = '<div class="track-list">';
                for (var i = 0; i < tracks.length; i++) {
                    html += this.renderTrackRow(tracks[i], i);
                }
                html += '</div>';
                container.innerHTML = html;
                var self = this;
                container.querySelectorAll('.track-row').forEach(function(row) {
                    row.addEventListener('click', function() { self.playTrackFromRow(row); });
                });
            } else if (tab === 'artists') {
                var artists = await library.getArtists();
                if (artists.length === 0) {
                    container.innerHTML = '<div class="empty-state"><p>Артисты не найдены</p></div>';
                    return;
                }
                var aHtml = '<div class="artist-grid">';
                for (var j = 0; j < artists.length; j++) {
                    aHtml += '<div class="artist-card"><div class="artist-card-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>' +
                        '<div class="artist-card-name">' + this.escapeHtml(artists[j].name) + '</div><div class="artist-card-info">' + artists[j].trackCount + ' треков</div></div>';
                }
                aHtml += '</div>';
                container.innerHTML = aHtml;
            } else if (tab === 'albums') {
                var albums = await library.getAlbums();
                if (albums.length === 0) {
                    container.innerHTML = '<div class="empty-state"><p>Альбомы не найдены</p></div>';
                    return;
                }
                var alHtml = '<div class="album-grid">';
                for (var k = 0; k < albums.length; k++) {
                    alHtml += '<div class="album-card"><div class="album-card-cover"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg></div>' +
                        '<div class="album-card-name">' + this.escapeHtml(albums[k].name) + '</div><div class="album-card-artist">' + this.escapeHtml(albums[k].artist) + '</div></div>';
                }
                alHtml += '</div>';
                container.innerHTML = alHtml;
            }
        } catch (e) {
            container.innerHTML = '<div class="empty-state"><p>Ошибка загрузки</p></div>';
        }
    }

    getUploadPage() {
        return '<div class="page"><div class="page-header"><h1 class="page-title">Загрузка музыки</h1><p class="page-subtitle">Поддерживаются MP3, WAV, FLAC, OGG, AAC, M4A</p></div>' +
            '<div class="upload-area" id="uploadArea"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
            '<p>Перетащите файлы сюда</p><span>или</span><button class="btn btn-primary" id="selectFilesBtn">Выбрать файлы</button>' +
            '<input type="file" id="fileInput" multiple accept=".mp3,.wav,.flac,.ogg,.aac,.m4a" hidden></div>' +
            '<div id="uploadProgress" class="hidden"><div class="loading-container"><div class="loading-spinner"></div><span>Загрузка...</span></div></div></div>';
    }

    bindUploadEvents() {
        var self = this;
        var fileInput = document.getElementById('fileInput');
        document.getElementById('selectFilesBtn').addEventListener('click', function() { fileInput.click(); });

        var uploadArea = document.getElementById('uploadArea');
        uploadArea.addEventListener('dragover', function(e) { e.preventDefault(); uploadArea.classList.add('dragover'); });
        uploadArea.addEventListener('dragleave', function() { uploadArea.classList.remove('dragover'); });
        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) self.processUpload(e.dataTransfer.files);
        });

        fileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) self.processUpload(e.target.files);
        });
    }

    async processUpload(files) {
        var progressArea = document.getElementById('uploadProgress');
        var uploadArea = document.getElementById('uploadArea');
        uploadArea.classList.add('hidden');
        progressArea.classList.remove('hidden');
        
        var result = await uploadManager.uploadFiles(files, function() {});
        
        progressArea.innerHTML = '<div class="empty-state"><p>Загружено: ' + result.uploaded.length + ' треков</p></div>';
        this.showNotification('Загружено ' + result.uploaded.length + ' треков', 'success');
        
        setTimeout(function() {
            uploadArea.classList.remove('hidden');
            progressArea.classList.add('hidden');
        }, 2000);
    }

    getImportPage() {
        var allServices = services.getAll();
        var html = '<div class="page"><div class="page-header"><h1 class="page-title">Импорт музыки</h1><p class="page-subtitle">Импортируйте треки и плейлисты из других сервисов</p></div>';
        html += '<div class="settings-section"><h2 class="settings-section-title">Из внешних сервисов</h2><div class="services-grid">';
        
        for (var i = 0; i < allServices.length; i++) {
            var s = allServices[i];
            html += '<div class="service-card ' + (s.connected ? 'connected' : '') + '">';
            html += '<div class="service-card-header"><div class="service-card-icon" style="background:' + s.color + '20;color:' + s.color + ';font-weight:bold;">' + s.name.charAt(0) + '</div>';
            html += '<div><div class="service-card-name">' + s.name + '</div><div class="service-card-status ' + (s.connected ? 'connected' : '') + '">' + (s.connected ? 'Подключено' : 'Не подключено') + '</div></div></div>';
            html += '<div class="service-card-actions">';
            if (s.connected) {
                html += '<button class="btn btn-primary btn-sm start-import" data-service="' + s.id + '">Импортировать</button>';
            } else {
                html += '<button class="btn btn-secondary btn-sm connect-service" data-service="' + s.id + '">Подключить</button>';
            }
            html += '</div></div>';
        }
        
        html += '</div></div>';
        html += '<div class="settings-section"><h2 class="settings-section-title">Из файла</h2><div class="import-options">';
        html += '<div class="import-option-card" id="importJSON"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>Импорт JSON</span></div>';
        html += '<div class="import-option-card" id="importCSV"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg><span>Импорт CSV</span></div>';
        html += '</div><input type="file" id="importFileInput" accept=".json,.csv" hidden></div></div>';
        
        return html;
    }

    bindImportEvents() {
        var self = this;
        document.querySelectorAll('.connect-service').forEach(function(btn) {
            btn.addEventListener('click', function() { self.showConnectModal(btn.dataset.service); });
        });

        document.querySelectorAll('.start-import').forEach(function(btn) {
            btn.addEventListener('click', function() { self.startServiceImport(btn.dataset.service); });
        });

        document.getElementById('importJSON').addEventListener('click', function() {
            var input = document.getElementById('importFileInput');
            input.accept = '.json';
            input.onchange = async function(e) {
                if (e.target.files[0]) {
                    try {
                        var text = await e.target.files[0].text();
                        var count = await db.importLibrary(text);
                        self.showNotification('Импортировано ' + count + ' треков', 'success');
                    } catch (err) {
                        self.showNotification('Ошибка импорта', 'error');
                    }
                }
            };
            input.click();
        });

        document.getElementById('importCSV').addEventListener('click', function() {
            var input = document.getElementById('importFileInput');
            input.accept = '.csv';
            input.onchange = async function(e) {
                if (e.target.files[0]) {
                    try {
                        var text = await e.target.files[0].text();
                        var lines = text.split('\n').filter(function(l) { return l.trim(); });
                        var imported = 0;
                        for (var i = 1; i < lines.length; i++) {
                            var parts = lines[i].split(',');
                            if (parts.length >= 1) {
                                await db.addTrack({
                                    title: (parts[0] || '').replace(/"/g, '').trim(),
                                    artist: parts.length >= 2 ? parts[1].replace(/"/g, '').trim() : 'Unknown',
                                    source: 'import'
                                });
                                imported++;
                            }
                        }
                        self.showNotification('Импортировано ' + imported + ' треков', 'success');
                    } catch (err) {
                        self.showNotification('Ошибка импорта CSV', 'error');
                    }
                }
            };
            input.click();
        });
    }

    async startServiceImport(serviceId) {
        this.showNotification('Начинаем импорт...', 'info');
        try {
            if (serviceId === 'spotify') {
                var spotifyAuth = storage.get('spotify_auth');
                if (!spotifyAuth || !spotifyAuth.accessToken) {
                    this.showNotification('Spotify не подключен', 'error');
                    return;
                }
                var results = await importer.importFromSpotify(spotifyAuth.accessToken, {
                    importLiked: true,
                    importPlaylists: true,
                    importAlbums: true
                });
                this.showNotification('Импортировано: ' + results.tracks.length + ' треков, ' + results.playlists.length + ' плейлистов', 'success');
            } else if (serviceId === 'youtube') {
                var youtubeConfig = storage.get('youtube_config');
                if (!youtubeConfig || !youtubeConfig.apiKey) {
                    this.showNotification('YouTube не подключен', 'error');
                    return;
                }
                var ytResults = await importer.importFromYouTube(youtubeConfig.apiKey, { importPlaylists: true });
                this.showNotification('Импортировано: ' + ytResults.tracks.length + ' треков', 'success');
            } else {
                this.showNotification('Импорт для этого сервиса пока недоступен', 'error');
            }
            await this.loadSidebarStats();
        } catch (error) {
            this.showNotification('Ошибка импорта: ' + error.message, 'error');
        }
    }

    async getPlaylistsPage() {
        var playlists = await library.getPlaylists();
        var html = '<div class="page"><div class="page-header"><h1 class="page-title">Плейлисты</h1><button class="btn btn-primary" id="createPlaylistBtn">Создать плейлист</button></div>';
        if (playlists.length === 0) {
            html += '<div class="empty-state"><p>Нет плейлистов</p></div>';
        } else {
            html += '<div class="playlist-grid">';
            for (var i = 0; i < playlists.length; i++) {
                html += this.renderPlaylistCard(playlists[i]);
            }
            html += '</div>';
        }
        html += '</div>';
        var self = this;
        setTimeout(function() {
            document.getElementById('createPlaylistBtn')?.addEventListener('click', function() { self.showCreatePlaylistModal(); });
            document.querySelectorAll('.playlist-card').forEach(function(card) {
                card.addEventListener('click', function() { self.showPlaylistModal(card.dataset.playlistId); });
            });
        }, 100);
        return html;
    }

    showCreatePlaylistModal() {
        var self = this;
        var overlay = document.getElementById('modal-overlay');
        var content = document.getElementById('modal-content');
        content.innerHTML = '<div class="modal-header"><h3 class="modal-title">Создать плейлист</h3><button class="modal-close" id="modalClose">X</button></div>' +
            '<div class="form-group"><label class="form-label">Название</label><input type="text" class="form-input" id="playlistName" placeholder="Мой плейлист"></div>' +
            '<button class="btn btn-primary" id="savePlaylistBtn" style="width:100%;">Создать</button>';
        overlay.classList.remove('hidden');

        document.getElementById('savePlaylistBtn').addEventListener('click', async function() {
            var name = document.getElementById('playlistName').value.trim() || 'Новый плейлист';
            await library.createPlaylist(name, '');
            self.showNotification('Плейлист создан', 'success');
            overlay.classList.add('hidden');
            self.navigateTo('playlists');
        });

        this.bindModalClose(overlay, content);
    }

    async showPlaylistModal(playlistId) {
        var self = this;
        var playlist = await library.getPlaylist(playlistId);
        if (!playlist) return;
        var tracks = await library.getPlaylistTracks(playlistId);
        var overlay = document.getElementById('modal-overlay');
        var content = document.getElementById('modal-content');

        var html = '<div class="modal-header"><h3 class="modal-title">' + this.escapeHtml(playlist.name) + '</h3><button class="modal-close" id="modalClose">X</button></div>';
        html += '<p class="text-muted text-sm mb-4">' + playlist.tracks.length + ' треков</p>';
        html += '<div class="track-list">';
        for (var i = 0; i < tracks.length; i++) {
            html += self.renderTrackRow(tracks[i], i);
        }
        html += '</div>';
        html += '<div class="mt-4"><button class="btn btn-secondary btn-sm" id="playAllBtn">Воспроизвести все</button> ' +
            '<button class="btn btn-secondary btn-sm" id="deletePlaylistBtn" style="color:var(--red);">Удалить</button></div>';

        content.innerHTML = html;
        overlay.classList.remove('hidden');

        content.querySelectorAll('.track-row').forEach(function(row) {
            row.addEventListener('click', function() {
                var track = JSON.parse(row.dataset.track);
                player.play(track);
            });
        });

        document.getElementById('playAllBtn').addEventListener('click', function() {
            if (tracks.length > 0) {
                queueManager.clear();
                for (var i = 0; i < tracks.length; i++) { queueManager.add(tracks[i]); }
                player.play(tracks[0]);
            }
        });

        document.getElementById('deletePlaylistBtn').addEventListener('click', async function() {
            await library.deletePlaylist(playlistId);
            self.showNotification('Плейлист удален', 'success');
            overlay.classList.add('hidden');
            self.navigateTo('playlists');
        });

        this.bindModalClose(overlay, content);
    }

    getSearchPage() {
        return '<div class="page"><div class="page-header"><h1 class="page-title">Поиск в библиотеке</h1></div><div id="searchResults"><div class="empty-state"><p>Введите поисковый запрос</p></div></div></div>';
    }

    getSettingsPage() {
        var allServices = services.getAll();
        var html = '<div class="page"><div class="page-header"><h1 class="page-title">Настройки</h1></div>';
        html += '<div class="settings-section"><h2 class="settings-section-title">Внешние сервисы</h2><div class="services-grid">';
        
        for (var i = 0; i < allServices.length; i++) {
            var s = allServices[i];
            html += '<div class="service-card ' + (s.connected ? 'connected' : '') + '">';
            html += '<div class="service-card-header"><div class="service-card-icon" style="background:' + s.color + '20;color:' + s.color + ';font-weight:bold;">' + s.name.charAt(0) + '</div>';
            html += '<div><div class="service-card-name">' + s.name + '</div><div class="service-card-status ' + (s.connected ? 'connected' : '') + '">' + (s.connected ? 'Подключено' : 'Не подключено') + '</div></div></div>';
            html += '<div class="service-card-actions">';
            html += s.connected ? '<button class="btn btn-secondary btn-sm disconnect-service" data-service="' + s.id + '">Отключить</button>' : '<button class="btn btn-primary btn-sm connect-service" data-service="' + s.id + '">Подключить</button>';
            html += '</div></div>';
        }
        
        html += '</div></div>';
        html += '<div class="settings-section"><h2 class="settings-section-title">Управление данными</h2><div class="data-actions">';
        html += '<button class="btn btn-secondary" id="exportDataBtn">Экспорт библиотеки (JSON)</button>';
        html += '<button class="btn btn-secondary" id="clearDataBtn" style="color:var(--red);">Очистить все данные</button></div></div>';
        html += '<div class="settings-section"><h2 class="settings-section-title">О платформе</h2><p class="text-muted">MusicHub Platform v1.0.0</p><p class="text-muted text-sm mt-2">Независимая музыкальная платформа. Все данные хранятся локально.</p></div></div>';
        
        return html;
    }

    bindSettingsEvents() {
        var self = this;
        document.querySelectorAll('.connect-service').forEach(function(btn) {
            btn.addEventListener('click', function() { self.showConnectModal(btn.dataset.service); });
        });
        document.querySelectorAll('.disconnect-service').forEach(function(btn) {
            btn.addEventListener('click', function() {
                services.disconnect(btn.dataset.service);
                self.showNotification('Сервис отключен', 'success');
                self.navigateTo('settings');
            });
        });
        document.getElementById('exportDataBtn').addEventListener('click', function() { self.exportLibrary(); });
        document.getElementById('clearDataBtn').addEventListener('click', function() {
            self.showConfirmModal('Очистить все данные?', 'Все треки и плейлисты будут удалены.', async function() {
                await db.clearAll();
                storage.remove('play_history');
                storage.remove('favorites');
                storage.remove('queue');
                self.showNotification('Данные очищены', 'success');
                self.navigateTo('home');
            });
        });
    }

    showConnectModal(serviceId) {
        var self = this;
        var overlay = document.getElementById('modal-overlay');
        var content = document.getElementById('modal-content');
        var html = '';

        if (serviceId === 'spotify') {
            html = '<div class="modal-header"><h3 class="modal-title">Подключение Spotify</h3><button class="modal-close" id="modalClose">X</button></div>' +
                '<div class="form-group"><label class="form-label">Client ID</label><input type="text" class="form-input" id="spotifyClientId" placeholder="Client ID">' +
                '<p class="form-hint">Создайте приложение на developer.spotify.com</p></div>' +
                '<button class="btn btn-primary" id="connectSpotifyBtn" style="width:100%;">Подключить</button>';
        } else if (serviceId === 'youtube') {
            html = '<div class="modal-header"><h3 class="modal-title">Подключение YouTube Music</h3><button class="modal-close" id="modalClose">X</button></div>' +
                '<div class="form-group"><label class="form-label">API Key</label><input type="text" class="form-input" id="youtubeApiKey" placeholder="API Key">' +
                '<p class="form-hint">Получите ключ в Google Cloud Console</p></div>' +
                '<button class="btn btn-primary" id="connectYoutubeBtn" style="width:100%;">Подключить</button>';
        } else if (serviceId === 'soundcloud') {
            html = '<div class="modal-header"><h3 class="modal-title">Подключение SoundCloud</h3><button class="modal-close" id="modalClose">X</button></div>' +
                '<div class="form-group"><label class="form-label">Client ID</label><input type="text" class="form-input" id="soundcloudClientId" placeholder="Client ID"></div>' +
                '<button class="btn btn-primary" id="connectSoundcloudBtn" style="width:100%;">Подключить</button>';
        }

        content.innerHTML = html;
        overlay.classList.remove('hidden');
        this.bindModalClose(overlay, content);

        if (serviceId === 'spotify') {
            document.getElementById('connectSpotifyBtn').addEventListener('click', function() {
                var clientId = document.getElementById('spotifyClientId').value.trim();
                if (clientId) services.connectSpotify(clientId);
            });
        }
        if (serviceId === 'youtube') {
            document.getElementById('connectYoutubeBtn').addEventListener('click', function() {
                var apiKey = document.getElementById('youtubeApiKey').value.trim();
                if (apiKey) { services.connectYouTube(apiKey); overlay.classList.add('hidden'); self.showNotification('YouTube подключен', 'success'); self.navigateTo('settings'); }
            });
        }
        if (serviceId === 'soundcloud') {
            document.getElementById('connectSoundcloudBtn').addEventListener('click', function() {
                var clientId = document.getElementById('soundcloudClientId').value.trim();
                if (clientId) { services.connectSoundCloud(clientId); overlay.classList.add('hidden'); self.showNotification('SoundCloud подключен', 'success'); self.navigateTo('settings'); }
            });
        }
    }

    showConfirmModal(title, message, onConfirm) {
        var overlay = document.getElementById('modal-overlay');
        var content = document.getElementById('modal-content');
        content.innerHTML = '<div class="modal-header"><h3 class="modal-title">' + title + '</h3><button class="modal-close" id="modalClose">X</button></div>' +
            '<p class="mb-4">' + message + '</p><div style="display:flex;gap:8px;">' +
            '<button class="btn btn-secondary" id="cancelBtn">Отмена</button>' +
            '<button class="btn btn-primary" id="confirmBtn" style="background:var(--red);">Подтвердить</button></div>';
        overlay.classList.remove('hidden');
        var self = this;

        document.getElementById('confirmBtn').addEventListener('click', async function() {
            overlay.classList.add('hidden');
            await onConfirm();
        });
        document.getElementById('cancelBtn').addEventListener('click', function() { overlay.classList.add('hidden'); });
        this.bindModalClose(overlay, content);
    }

    bindModalClose(overlay, content) {
        content.querySelector('#modalClose').addEventListener('click', function() { overlay.classList.add('hidden'); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.classList.add('hidden'); });
    }

    bindLibraryTabs() {
        var self = this;
        document.querySelectorAll('.tab').forEach(function(tab) {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
                tab.classList.add('active');
                self.currentLibraryTab = tab.dataset.tab;
                var source = document.getElementById('sourceFilter')?.value || 'all';
                var sort = document.getElementById('sortFilter')?.value || 'dateAdded';
                self.loadLibraryContent(tab.dataset.tab, source, sort);
            });
        });

        document.getElementById('sourceFilter').addEventListener('change', function(e) {
            self.loadLibraryContent(self.currentLibraryTab, e.target.value, document.getElementById('sortFilter')?.value || 'dateAdded');
        });

        document.getElementById('sortFilter').addEventListener('change', function(e) {
            self.loadLibraryContent(self.currentLibraryTab, document.getElementById('sourceFilter')?.value || 'all', e.target.value);
        });

        document.getElementById('findDuplicatesBtn').addEventListener('click', async function() {
            var duplicates = await library.getDuplicates();
            self.showNotification(duplicates.length === 0 ? 'Дубликаты не найдены' : 'Найдено ' + duplicates.length + ' дубликатов', 'info');
        });

        document.getElementById('removeDuplicatesBtn').addEventListener('click', async function() {
            var removed = await library.removeDuplicates();
            self.showNotification('Удалено ' + removed.length + ' дубликатов', 'success');
            self.loadLibraryContent(self.currentLibraryTab);
            self.loadSidebarStats();
        });
    }

    bindGlobalEvents() {
        var self = this;
        var searchInput = document.getElementById('globalSearch');
        if (searchInput) {
            searchInput.addEventListener('input', function(e) {
                var query = e.target.value;
                if (query.length >= 2) {
                    if (self.searchTimeout) clearTimeout(self.searchTimeout);
                    self.searchTimeout = setTimeout(function() { self.performSearch(query); }, 300);
                }
            });
        }

        document.addEventListener('keydown', function(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.getElementById('globalSearch')?.focus();
            }
            if (e.code === 'Space' && e.target === document.body) {
                e.preventDefault();
                player.togglePlay();
            }
        });
    }

    async performSearch(query) {
        if (this.currentPage !== 'search') {
            await this.navigateTo('search');
        }
        var container = document.getElementById('searchResults');
        if (!container) return;
        container.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div></div>';

        try {
            var results = await library.search(query);
            if (results.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>Ничего не найдено</p></div>';
                return;
            }
            var html = '<div class="track-list">';
            for (var i = 0; i < results.length; i++) {
                html += this.renderTrackRow(results[i], i);
            }
            html += '</div>';
            container.innerHTML = html;
            var self = this;
            container.querySelectorAll('.track-row').forEach(function(row) {
                row.addEventListener('click', function() { self.playTrackFromRow(row); });
            });
        } catch (e) {
            container.innerHTML = '<div class="empty-state"><p>Ошибка поиска</p></div>';
        }
    }

    playTrackFromRow(row) {
        var track = JSON.parse(row.dataset.track);
        player.play(track);
    }

    updatePlayerUI() {
        var track = player.currentTrack;
        document.getElementById('playerTitle').textContent = track ? track.title : 'Ничего не играет';
        document.getElementById('playerArtist').textContent = track ? track.artist : 'Выберите трек';
        var playIcon = document.getElementById('playIcon');
        if (playIcon) {
            playIcon.innerHTML = player.isPlaying ?
                '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>' :
                '<polygon points="5 3 19 12 5 21 5 3"/>';
        }
    }

    updateProgress(data) {
        document.getElementById('currentTime').textContent = player.formatTime(data.currentTime);
        document.getElementById('totalTime').textContent = player.formatTime(data.duration);
        document.getElementById('progressFill').style.width = (data.progress * 100) + '%';
    }

    async exportLibrary() {
        try {
            var data = await library.exportLibrary();
            var blob = new Blob([data], { type: 'application/json' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'musichub-export-' + new Date().toISOString().split('T')[0] + '.json';
            a.click();
            URL.revokeObjectURL(url);
            this.showNotification('Библиотека экспортирована', 'success');
        } catch (e) {
            this.showNotification('Ошибка экспорта', 'error');
        }
    }

    bindPlayerEvents() {
        var self = this;
        document.getElementById('playBtn').addEventListener('click', function() { player.togglePlay(); });
        document.getElementById('prevBtn').addEventListener('click', function() {
            var prev = queueManager.getPrevious();
            if (prev) player.play(prev);
        });
        document.getElementById('nextBtn').addEventListener('click', function() {
            var next = queueManager.getNext();
            if (next) player.play(next);
        });
        document.getElementById('shuffleBtn').addEventListener('click', function() { queueManager.toggleShuffle(); });
        document.getElementById('repeatBtn').addEventListener('click', function() { queueManager.toggleRepeat(); });

        document.getElementById('volumeSlider').addEventListener('input', function(e) {
            player.setVolume(e.target.value / 100);
        });

        document.getElementById('progressBar').addEventListener('click', function(e) {
            var rect = e.target.getBoundingClientRect();
            var ratio = (e.clientX - rect.left) / rect.width;
            var duration = player.getDuration();
            if (duration) player.seek(ratio * duration);
        });

        document.getElementById('playerAddToPlaylistBtn').addEventListener('click', function() {
            var track = player.currentTrack;
            if (track) self.showAddToPlaylistModal(track.id);
        });
    }

    async showAddToPlaylistModal(trackId) {
        var self = this;
        var playlists = await library.getPlaylists();
        var overlay = document.getElementById('modal-overlay');
        var content = document.getElementById('modal-content');

        var html = '<div class="modal-header"><h3 class="modal-title">Добавить в плейлист</h3><button class="modal-close" id="modalClose">X</button></div>';
        if (playlists.length === 0) {
            html += '<p class="text-muted">Нет плейлистов</p>';
        } else {
            for (var i = 0; i < playlists.length; i++) {
                html += '<div class="playlist-option" data-playlist-id="' + playlists[i].id + '">' + self.escapeHtml(playlists[i].name) + ' (' + playlists[i].tracks.length + ')</div>';
            }
        }
        html += '<button class="btn btn-secondary btn-sm mt-4" id="createNewPlaylistBtn">Новый плейлист</button>';

        content.innerHTML = html;
        overlay.classList.remove('hidden');

        content.querySelectorAll('.playlist-option').forEach(function(option) {
            option.addEventListener('click', async function() {
                await library.addToPlaylist(option.dataset.playlistId, trackId);
                self.showNotification('Добавлено в плейлист', 'success');
                overlay.classList.add('hidden');
            });
        });

        content.querySelector('#createNewPlaylistBtn').addEventListener('click', function() {
            overlay.classList.add('hidden');
            self.showCreatePlaylistModal();
        });

        this.bindModalClose(overlay, content);
    }

    escapeHtml(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

window.ui = new UIManager();
