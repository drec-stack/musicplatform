class UIManager {
    constructor() {
        this.currentPage = 'home';
        this.currentLibraryTab = 'tracks';
        this.searchTimeout = null;
        this.uploadQueue = [];
        this.isUploading = false;
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
    }

    checkSpotifyCallback() {
        if (services.checkSpotifyCallback()) {
            this.showNotification('Spotify подключен', 'success');
            this.renderSidebar();
        }
    }

    async loadSidebarStats() {
        try {
            const stats = await library.getStats();
            const statsEl = document.getElementById('sidebarStats');
            if (statsEl) {
                statsEl.innerHTML = `
                    <div class="sidebar-stat">
                        <span class="stat-value">${stats.totalTracks}</span>
                        <span class="stat-label">треков</span>
                    </div>
                    <div class="sidebar-stat">
                        <span class="stat-value">${stats.totalPlaylists}</span>
                        <span class="stat-label">плейлистов</span>
                    </div>
                    <div class="sidebar-stat">
                        <span class="stat-value">${this.formatStorageSize(stats.storageUsage)}</span>
                        <span class="stat-label">занято</span>
                    </div>
                `;
            }
        } catch (e) {
            console.error('Failed to load stats:', e);
        }
    }

    formatStorageSize(bytes) {
        if (bytes === 0) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + units[i];
    }

    formatDuration(ms) {
        if (!ms) return '0:00';
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${(totalSeconds % 60).toString().padStart(2, '0')}`;
        }
        return `${minutes}:${(totalSeconds % 60).toString().padStart(2, '0')}`;
    }

    renderSidebar() {
        const sidebar = document.getElementById('sidebar');
        const connectedServices = services.getConnected();

        sidebar.innerHTML = `
            <div class="sidebar-header">
                <div class="sidebar-logo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 18V5l12-2v13"/>
                        <circle cx="6" cy="18" r="3"/>
                        <circle cx="18" cy="16" r="3"/>
                    </svg>
                    <span>MusicHub</span>
                </div>
            </div>
            
            <nav class="sidebar-nav">
                <a class="nav-item active" data-page="home">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    Главная
                </a>
                <a class="nav-item" data-page="library">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    Медиатека
                </a>
                <a class="nav-item" data-page="search">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    Поиск
                </a>
                <a class="nav-item" data-page="upload">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Загрузить
                </a>
                <a class="nav-item" data-page="import">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                    </svg>
                    Импорт
                </a>
                <a class="nav-item" data-page="playlists">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="8" y1="6" x2="21" y2="6"/>
                        <line x1="8" y1="12" x2="21" y2="12"/>
                        <line x1="8" y1="18" x2="21" y2="18"/>
                        <line x1="3" y1="6" x2="3.01" y2="6"/>
                        <line x1="3" y1="12" x2="3.01" y2="12"/>
                        <line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                    Плейлисты
                </a>
            </nav>

            <div class="sidebar-divider"></div>

            <div class="sidebar-section">
                <div class="sidebar-section-title">Статистика библиотеки</div>
                <div class="sidebar-stats" id="sidebarStats">
                    <span class="text-muted text-sm">Загрузка...</span>
                </div>
            </div>

            <div class="sidebar-divider"></div>

            <div class="sidebar-section">
                <div class="sidebar-section-title">Внешние сервисы</div>
                <div class="services-list">
                    ${services.getAll().map(s => `
                        <div class="service-item">
                            <span class="service-dot" style="background: ${s.connected ? s.color : '#3a3a4a'}"></span>
                            <span style="color: ${s.connected ? 'var(--text-primary)' : 'var(--text-muted)'}">${s.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="sidebar-footer">
                <a class="nav-item" data-page="settings">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    Настройки
                </a>
            </div>
        `;

        sidebar.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(item.dataset.page);
            });
        });
    }

    renderTopbar() {
        const topbar = document.getElementById('topbar');
        topbar.innerHTML = `
            <div class="search-container">
                <div class="search-input-wrapper">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input 
                        type="text" 
                        id="globalSearch" 
                        placeholder="Поиск в своей библиотеке..."
                        autocomplete="off"
                    >
                    <span class="search-shortcut">Ctrl+K</span>
                </div>
            </div>
            <div class="topbar-actions">
                <button class="btn-icon" id="queuePanelBtn" title="Очередь воспроизведения">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="8" y1="6" x2="21" y2="6"/>
                        <line x1="8" y1="12" x2="21" y2="12"/>
                        <line x1="8" y1="18" x2="21" y2="18"/>
                        <line x1="3" y1="6" x2="3.01" y2="6"/>
                        <line x1="3" y1="12" x2="3.01" y2="12"/>
                        <line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                </button>
                <button class="btn-icon" id="exportBtn" title="Экспорт библиотеки">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                </button>
            </div>
        `;

        document.getElementById('exportBtn')?.addEventListener('click', () => this.exportLibrary());
        document.getElementById('queuePanelBtn')?.addEventListener('click', () => this.toggleQueuePanel());
    }

    renderPlayer() {
        const playerEl = document.getElementById('player');
        playerEl.innerHTML = `
            <div class="player-container">
                <div class="player-track">
                    <div class="player-track-cover-placeholder" id="playerCover">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="24" height="24">
                            <path d="M9 18V5l12-2v13"/>
                            <circle cx="6" cy="18" r="3"/>
                            <circle cx="18" cy="16" r="3"/>
                        </svg>
                    </div>
                    <div class="player-track-info">
                        <div class="player-track-title" id="playerTitle">Ничего не играет</div>
                        <div class="player-track-artist" id="playerArtist">Выберите трек из библиотеки</div>
                    </div>
                    <div class="player-track-actions">
                        <button class="btn-icon" id="playerLikeBtn" title="Добавить в избранное">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                        </button>
                        <button class="btn-icon" id="playerAddToPlaylistBtn" title="Добавить в плейлист">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="player-main">
                    <div class="player-controls">
                        <button class="player-btn" id="shuffleBtn" title="Перемешать">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="16 3 21 3 21 8"/>
                                <line x1="4" y1="20" x2="21" y2="3"/>
                                <polyline points="21 16 21 21 16 21"/>
                                <line x1="15" y1="15" x2="21" y2="21"/>
                                <line x1="4" y1="4" x2="9" y2="9"/>
                            </svg>
                        </button>
                        <button class="player-btn" id="prevBtn" title="Предыдущий трек">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="19 20 9 12 19 4 19 20"/>
                                <line x1="5" y1="19" x2="5" y2="5"/>
                            </svg>
                        </button>
                        <button class="player-btn-play" id="playBtn" title="Воспроизвести">
                            <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" id="playIcon">
                                <polygon points="5 3 19 12 5 21 5 3"/>
                            </svg>
                        </button>
                        <button class="player-btn" id="nextBtn" title="Следующий трек">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="5 4 15 12 5 20 5 4"/>
                                <line x1="19" y1="5" x2="19" y2="19"/>
                            </svg>
                        </button>
                        <button class="player-btn" id="repeatBtn" title="Повтор">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="repeatIcon">
                                <polyline points="17 1 21 5 17 9"/>
                                <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                                <polyline points="7 23 3 19 7 15"/>
                                <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                            </svg>
                        </button>
                    </div>
                    <div class="player-progress">
                        <span class="player-time" id="currentTime">0:00</span>
                        <div class="player-progress-bar" id="progressBar">
                            <div class="player-progress-fill" id="progressFill" style="width: 0%">
                                <div class="player-progress-thumb"></div>
                            </div>
                        </div>
                        <span class="player-time" id="totalTime">0:00</span>
                    </div>
                </div>

                <div class="player-extras">
                    <button class="btn-icon" id="equalizerBtn" title="Эквалайзер">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="4" y1="21" x2="4" y2="14"/>
                            <line x1="4" y1="10" x2="4" y2="3"/>
                            <line x1="12" y1="21" x2="12" y2="12"/>
                            <line x1="12" y1="8" x2="12" y2="3"/>
                            <line x1="20" y1="21" x2="20" y2="16"/>
                            <line x1="20" y1="12" x2="20" y2="3"/>
                        </svg>
                    </button>
                    <div class="player-volume">
                        <button class="btn-icon" id="volumeBtn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="volumeIcon">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                            </svg>
                        </button>
                        <input type="range" class="player-volume-slider" id="volumeSlider" min="0" max="100" value="70">
                    </div>
                </div>
            </div>
        `;
    }

    renderNotificationContainer() {
        const container = document.createElement('div');
        container.className = 'notification-container';
        container.id = 'notificationContainer';
        document.body.appendChild(container);
    }

    async navigateTo(page) {
        this.currentPage = page;
        storage.set('current_page', page);

        document.querySelectorAll('#sidebar .nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        const content = document.getElementById('content');
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
                this.bindPlaylistEvents();
                break;
            case 'settings':
                content.innerHTML = this.getSettingsPage();
                this.bindSettingsEvents();
                break;
        }
    }

    async getHomePage() {
        return `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">Моя музыкальная платформа</h1>
                    <p class="page-subtitle">Независимая библиотека с импортом из любых сервисов</p>
                </div>

                <div class="quick-actions">
                    <div class="action-card" id="actionUpload">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        <span>Загрузить музыку</span>
                    </div>
                    <div class="action-card" id="actionImport">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <line x1="3" y1="9" x2="21" y2="9"/>
                            <line x1="9" y1="21" x2="9" y2="9"/>
                        </svg>
                        <span>Импорт из сервисов</span>
                    </div>
                    <div class="action-card" id="actionLibrary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        </svg>
                        <span>Медиатека</span>
                    </div>
                    <div class="action-card" id="actionSearch">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <span>Поиск</span>
                    </div>
                </div>

                <div class="home-grid">
                    <div class="section">
                        <div class="section-header">
                            <h2 class="section-title">Недавно добавлено</h2>
                            <a class="section-link" data-page="library">Все треки</a>
                        </div>
                        <div id="recentTracksContainer"></div>
                    </div>

                    <div class="section">
                        <div class="section-header">
                            <h2 class="section-title">Часто слушают</h2>
                        </div>
                        <div id="popularTracksContainer"></div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-header">
                        <h2 class="section-title">Мои плейлисты</h2>
                        <a class="section-link" data-page="playlists">Все плейлисты</a>
                    </div>
                    <div id="homePlaylistsContainer"></div>
                </div>
            </div>
        `;
    }

    async loadHomeContent() {
        const recentContainer = document.getElementById('recentTracksContainer');
        const popularContainer = document.getElementById('popularTracksContainer');
        const playlistsContainer = document.getElementById('homePlaylistsContainer');

        if (recentContainer) {
            const recentTracks = await library.getRecentTracks(8);
            if (recentTracks.length === 0) {
                recentContainer.innerHTML = `
                    <div class="empty-state">
                        <p>Библиотека пуста</p>
                        <span>Загрузите музыку или импортируйте из других сервисов</span>
                    </div>
                `;
            } else {
                recentContainer.innerHTML = `
                    <div class="track-grid">
                        ${recentTracks.map(t => this.renderTrackCard(t)).join('')}
                    </div>
                `;
                recentContainer.querySelectorAll('.track-card').forEach(card => {
                    card.addEventListener('click', () => this.playTrackFromCard(card));
                });
            }
        }

        if (popularContainer) {
            const popularTracks = await library.getMostPlayed(8);
            if (popularTracks.length === 0 || popularTracks.every(t => (t.playCount || 0) === 0)) {
                popularContainer.innerHTML = `
                    <div class="empty-state">
                        <p>Статистика прослушиваний пуста</p>
                        <span>Начните слушать музыку</span>
                    </div>
                `;
            } else {
                popularContainer.innerHTML = `
                    <div class="track-list">
                        ${popularTracks.map((t, i) => this.renderTrackRow(t, i)).join('')}
                    </div>
                `;
                popularContainer.querySelectorAll('.track-row').forEach(row => {
                    row.addEventListener('click', () => this.playTrackFromRow(row));
                });
            }
        }

        if (playlistsContainer) {
            const playlists = await library.getPlaylists();
            if (playlists.length === 0) {
                playlistsContainer.innerHTML = `
                    <div class="empty-state">
                        <p>Нет плейлистов</p>
                        <span>Создайте плейлист в разделе Плейлисты</span>
                    </div>
                `;
            } else {
                playlistsContainer.innerHTML = `
                    <div class="playlist-grid">
                        ${playlists.slice(0, 6).map(p => this.renderPlaylistCard(p)).join('')}
                    </div>
                `;
                playlistsContainer.querySelectorAll('.playlist-card').forEach(card => {
                    card.addEventListener('click', () => {
                        const playlistId = card.dataset.playlistId;
                        this.showPlaylistModal(playlistId);
                    });
                });
            }
        }

        document.getElementById('actionUpload')?.addEventListener('click', () => this.navigateTo('upload'));
        document.getElementById('actionImport')?.addEventListener('click', () => this.navigateTo('import'));
        document.getElementById('actionLibrary')?.addEventListener('click', () => this.navigateTo('library'));
        document.getElementById('actionSearch')?.addEventListener('click', () => this.navigateTo('search'));

        document.querySelectorAll('.section-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(link.dataset.page);
            });
        });
    }

    getLibraryPage() {
        return `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">Медиатека</h1>
                    <div class="library-actions">
                        <button class="btn btn-secondary btn-sm" id="findDuplicatesBtn">Найти дубликаты</button>
                        <button class="btn btn-secondary btn-sm" id="removeDuplicatesBtn">Удалить дубликаты</button>
                    </div>
                </div>
                <div class="tabs">
                    <button class="tab active" data-tab="tracks">Треки</button>
                    <button class="tab" data-tab="artists">Артисты</button>
                    <button class="tab" data-tab="albums">Альбомы</button>
                </div>
                <div class="library-filters">
                    <select id="sourceFilter" class="form-input" style="width: auto;">
                        <option value="all">Все источники</option>
                        <option value="local">Локальные файлы</option>
                        <option value="spotify">Spotify</option>
                        <option value="youtube">YouTube</option>
                        <option value="soundcloud">SoundCloud</option>
                        <option value="deezer">Deezer</option>
                        <option value="import">Импортированные</option>
                    </select>
                    <select id="sortFilter" class="form-input" style="width: auto;">
                        <option value="dateAdded">По дате добавления</option>
                        <option value="title">По названию</option>
                        <option value="artist">По артисту</option>
                        <option value="playCount">По популярности</option>
                    </select>
                </div>
                <div id="libraryContent"></div>
            </div>
        `;
    }

    async loadLibraryContent(tab, source = 'all', sort = 'dateAdded') {
        const container = document.getElementById('libraryContent');
        if (!container) return;

        container.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div></div>';

        try {
            switch(tab) {
                case 'tracks': {
                    const tracks = await library.getTracks({ source, sort });
                    if (tracks.length === 0) {
                        container.innerHTML = '<div class="empty-state"><p>Треки не найдены</p></div>';
                        return;
                    }
                    container.innerHTML = `
                        <div class="track-list">
                            ${tracks.map((t, i) => this.renderTrackRow(t, i, true)).join('')}
                        </div>
                    `;
                    container.querySelectorAll('.track-row').forEach(row => {
                        row.addEventListener('click', (e) => {
                            if (!e.target.closest('.track-row-actions')) {
                                this.playTrackFromRow(row);
                            }
                        });
                    });
                    this.bindTrackRowActions(container);
                    break;
                }
                case 'artists': {
                    const artists = await library.getArtists();
                    if (artists.length === 0) {
                        container.innerHTML = '<div class="empty-state"><p>Артисты не найдены</p></div>';
                        return;
                    }
                    container.innerHTML = `
                        <div class="artist-grid">
                            ${artists.map(a => this.renderArtistCard(a)).join('')}
                        </div>
                    `;
                    break;
                }
                case 'albums': {
                    const albums = await library.getAlbums();
                    if (albums.length === 0) {
                        container.innerHTML = '<div class="empty-state"><p>Альбомы не найдены</p></div>';
                        return;
                    }
                    container.innerHTML = `
                        <div class="album-grid">
                            ${albums.map(a => this.renderAlbumCard(a)).join('')}
                        </div>
                    `;
                    break;
                }
            }
        } catch (error) {
            container.innerHTML = '<div class="empty-state"><p>Ошибка загрузки</p></div>';
        }
    }

    renderTrackRow(track, index, showActions = false) {
        const coverHtml = track.cover 
            ? `<img src="${track.cover}" class="track-row-cover" alt="" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
            : '';
        const coverPlaceholder = `<div class="track-row-cover-placeholder" style="${track.cover ? 'display:none' : ''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>`;

        const duration = track.duration ? player.formatTime(track.duration / 1000) : '--:--';
        const sourceLabel = track.source === 'local' ? 'Мой файл' : track.source;

        const actionsHtml = showActions ? `
            <div class="track-row-actions" onclick="event.stopPropagation()">
                <button class="btn-icon btn-sm add-to-playlist-btn" data-track-id="${track.id}" title="В плейлист">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                </button>
                <button class="btn-icon btn-sm delete-track-btn" data-track-id="${track.id}" title="Удалить">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </div>
        ` : '';

        return `
            <div class="track-row" data-track='${this.escapeHtml(JSON.stringify(track))}'>
                <span class="track-row-index">${index + 1}</span>
                <div class="track-row-info">
                    ${coverHtml}
                    ${coverPlaceholder}
                    <div class="track-row-text">
                        <div class="track-row-title">${this.escapeHtml(track.title)}</div>
                        <div class="track-row-artist">${this.escapeHtml(track.artist)}</div>
                    </div>
                </div>
                <span class="track-row-source">${sourceLabel}</span>
                <span class="track-row-duration">${duration}</span>
                ${actionsHtml}
            </div>
        `;
    }

    renderTrackCard(track) {
        const coverHtml = track.cover 
            ? `<img src="${track.cover}" alt="" loading="lazy" onerror="this.parentElement.innerHTML = '<div class=\\'placeholder\\'><svg viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'1.5\\' width=\\'32\\' height=\\'32\\'><path d=\\'M9 18V5l12-2v13\\'/><circle cx=\\'6\\' cy=\\'18\\' r=\\'3\\'/><circle cx=\\'18\\' cy=\\'16\\' r=\\'3\\'/></svg></div>';">`
            : `<div class="placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>`;

        return `
            <div class="track-card" data-track='${this.escapeHtml(JSON.stringify(track))}'>
                <div class="track-card-image">${coverHtml}</div>
                <div class="track-card-title">${this.escapeHtml(track.title)}</div>
                <div class="track-card-artist">${this.escapeHtml(track.artist)}</div>
            </div>
        `;
    }

    renderPlaylistCard(playlist) {
        const trackCount = playlist.tracks ? playlist.tracks.length : 0;
        return `
            <div class="playlist-card" data-playlist-id="${playlist.id}">
                <div class="playlist-card-cover">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32">
                        <line x1="8" y1="6" x2="21" y2="6"/>
                        <line x1="8" y1="12" x2="21" y2="12"/>
                        <line x1="8" y1="18" x2="21" y2="18"/>
                        <line x1="3" y1="6" x2="3.01" y2="6"/>
                        <line x1="3" y1="12" x2="3.01" y2="12"/>
                        <line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                </div>
                <div class="playlist-card-name">${this.escapeHtml(playlist.name)}</div>
                <div class="playlist-card-count">${trackCount} треков</div>
            </div>
        `;
    }

    renderArtistCard(artist) {
        return `
            <div class="artist-card">
                <div class="artist-card-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                </div>
                <div class="artist-card-name">${this.escapeHtml(artist.name)}</div>
                <div class="artist-card-info">${artist.trackCount} треков, ${artist.albums.length} альбомов</div>
            </div>
        `;
    }

    renderAlbumCard(album) {
        return `
            <div class="album-card">
                <div class="album-card-cover">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32">
                        <circle cx="12" cy="12" r="10"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                </div>
                <div class="album-card-name">${this.escapeHtml(album.name)}</div>
                <div class="album-card-artist">${this.escapeHtml(album.artist)}</div>
                <div class="album-card-info">${album.trackCount} треков</div>
            </div>
        `;
    }

    getUploadPage() {
        return `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">Загрузка музыки</h1>
                    <p class="page-subtitle">Загружайте свои аудиофайлы в библиотеку. Поддерживаются MP3, WAV, FLAC, OGG, AAC, M4A</p>
                </div>

                <div class="upload-area" id="uploadArea">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <p>Перетащите файлы сюда</p>
                    <span>или</span>
                    <button class="btn btn-primary" id="selectFilesBtn">Выбрать файлы</button>
                    <button class="btn btn-secondary" id="selectFolderBtn" style="margin-top: 8px;">Выбрать папку</button>
                    <input type="file" id="fileInput" multiple accept=".mp3,.wav,.flac,.ogg,.aac,.m4a" hidden>
                    <input type="file" id="folderInput" webkitdirectory multiple hidden>
                </div>

                <div id="uploadProgress" class="hidden">
                    <div class="upload-progress-header">
                        <h3>Загрузка файлов</h3>
                        <span id="uploadStats"></span>
                    </div>
                    <div class="upload-progress-bar">
                        <div class="upload-progress-fill" id="uploadProgressFill"></div>
                    </div>
                    <div id="uploadFileList"></div>
                </div>
            </div>
        `;
    }

    bindUploadEvents() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const folderInput = document.getElementById('folderInput');

        document.getElementById('selectFilesBtn')?.addEventListener('click', () => fileInput.click());
        document.getElementById('selectFolderBtn')?.addEventListener('click', () => folderInput.click());

        uploadArea?.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea?.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea?.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.processUpload(files);
            }
        });

        fileInput?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.processUpload(e.target.files);
            }
        });

        folderInput?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.processUpload(e.target.files);
            }
        });
    }

    async processUpload(files) {
        const progressArea = document.getElementById('uploadProgress');
        const uploadArea = document.getElementById('uploadArea');
        
        uploadArea.classList.add('hidden');
        progressArea.classList.remove('hidden');

        const results = await uploadManager.uploadFiles(files, (progress) => {
            document.getElementById('uploadProgressFill').style.width = 
                (progress.overall * 100) + '%';
            document.getElementById('uploadStats').textContent = 
                `Обработано: ${Math.round(progress.overall * 100)}%`;
        });

        document.getElementById('uploadProgressFill').style.width = '100%';
        document.getElementById('uploadStats').textContent = 
            `Загружено: ${results.uploaded.length}, ошибок: ${results.failed.length}`;

        if (results.uploaded.length > 0) {
            this.showNotification(`Загружено ${results.uploaded.length} треков`, 'success');
        }

        setTimeout(() => {
            uploadArea.classList.remove('hidden');
            progressArea.classList.add('hidden');
            this.navigateTo('library');
        }, 2000);
    }

    getImportPage() {
        const allServices = services.getAll();
        return `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">Импорт музыки</h1>
                    <p class="page-subtitle">Импортируйте треки и плейлисты из других сервисов в свою библиотеку</p>
                </div>

                <div class="settings-section">
                    <h2 class="settings-section-title">Из внешних сервисов</h2>
                    <div class="services-grid">
                        ${allServices.map(s => `
                            <div class="service-card ${s.connected ? 'connected' : ''}">
                                <div class="service-card-header">
                                    <div class="service-card-icon" style="background: ${s.color}20; color: ${s.color}; font-weight: bold; font-size: 18px;">
                                        ${s.id === 'spotify' ? 'S' : s.id === 'youtube' ? 'Y' : s.id === 'soundcloud' ? 'SC' : 'D'}
                                    </div>
                                    <div>
                                        <div class="service-card-name">${s.name}</div>
                                        <div class="service-card-status ${s.connected ? 'connected' : ''}">
                                            ${s.connected ? 'Подключено' : 'Не подключено'}
                                        </div>
                                    </div>
                                </div>
                                <div class="service-card-actions">
                                    ${s.connected ? `
                                        <button class="btn btn-primary btn-sm start-import" data-service="${s.id}">
                                            Импортировать
                                        </button>
                                    ` : `
                                        <button class="btn btn-secondary btn-sm connect-service" data-service="${s.id}">
                                            Подключить
                                        </button>
                                    `}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="settings-section">
                    <h2 class="settings-section-title">Из файла</h2>
                    <div class="import-options">
                        <div class="import-option-card" id="importJSON">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                            </svg>
                            <span>Импорт JSON</span>
                            <span class="text-muted text-sm">Экспортированная библиотека MusicHub</span>
                        </div>
                        <div class="import-option-card" id="importCSV">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                            </svg>
                            <span>Импорт CSV</span>
                            <span class="text-muted text-sm">Таблица с title, artist, album</span>
                        </div>
                    </div>
                    <input type="file" id="importFileInput" accept=".json,.csv" hidden>
                </div>

                <div id="importProgress" class="hidden">
                    <div class="loading-container">
                        <div class="loading-spinner"></div>
                        <span>Импорт выполняется...</span>
                    </div>
                </div>
            </div>
        `;
    }

    bindImportEvents() {
        document.querySelectorAll('.connect-service').forEach(btn => {
            btn.addEventListener('click', () => {
                const serviceId = btn.dataset.service;
                this.showConnectModal(serviceId);
            });
        });

        document.querySelectorAll('.start-import').forEach(btn => {
            btn.addEventListener('click', async () => {
                const serviceId = btn.dataset.service;
                await this.startServiceImport(serviceId);
            });
        });

        document.getElementById('importJSON')?.addEventListener('click', () => {
            const input = document.getElementById('importFileInput');
            input.accept = '.json';
            input.onchange = async (e) => {
                if (e.target.files[0]) {
                    try {
                        const result = await importer.importFromJSON(e.target.files[0]);
                        this.showNotification(`Импортировано ${result.importedCount} треков`, 'success');
                    } catch (err) {
                        this.showNotification('Ошибка импорта JSON', 'error');
                    }
                }
            };
            input.click();
        });

        document.getElementById('importCSV')?.addEventListener('click', () => {
            const input = document.getElementById('importFileInput');
            input.accept = '.csv';
            input.onchange = async (e) => {
                if (e.target.files[0]) {
                    try {
                        const result = await importer.importFromCSV(e.target.files[0]);
                        this.showNotification(`Импортировано ${result.importedCount} треков`, 'success');
                    } catch (err) {
                        this.showNotification('Ошибка импорта CSV', 'error');
                    }
                }
            };
            input.click();
        });
    }

    async startServiceImport(serviceId) {
        this.showNotification('Начинаем импорт...', 'info');
        
        try {
            let results;
            
            switch(serviceId) {
                case 'spotify':
                    const spotifyAuth = storage.get('spotify_auth');
                    if (!spotifyAuth?.accessToken) {
                        this.showNotification('Spotify не подключен', 'error');
                        return;
                    }
                    results = await importer.importFromSpotify(spotifyAuth.accessToken, {
                        importLiked: true,
                        importPlaylists: true,
                        importAlbums: true
                    });
                    break;
                    
                case 'youtube':
                    const youtubeConfig = storage.get('youtube_config');
                    if (!youtubeConfig?.apiKey) {
                        this.showNotification('YouTube не подключен', 'error');
                        return;
                    }
                    results = await importer.importFromYouTube(youtubeConfig.apiKey, {
                        importPlaylists: true
                    });
                    break;
                    
                default:
                    this.showNotification('Импорт для этого сервиса пока недоступен', 'error');
                    return;
            }

            const totalTracks = results.tracks.length;
            const totalPlaylists = results.playlists.length;
            const errors = results.errors;

            if (errors.length > 0) {
                console.warn('Import errors:', errors);
            }

            this.showNotification(
                `Импортировано: ${totalTracks} треков, ${totalPlaylists} плейлистов`,
                'success'
            );
            
            await this.loadSidebarStats();
        } catch (error) {
            this.showNotification(`Ошибка импорта: ${error.message}`, 'error');
        }
    }

    async getPlaylistsPage() {
        const playlists = await library.getPlaylists();
        
        return `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">Плейлисты</h1>
                    <button class="btn btn-primary" id="createPlaylistBtn">Создать плейлист</button>
                </div>
                <div id="playlistsContainer">
                    ${playlists.length === 0 ? `
                        <div class="empty-state">
                            <p>Нет плейлистов</p>
                            <span>Создайте первый плейлист</span>
                        </div>
                    ` : `
                        <div class="playlist-grid">
                            ${playlists.map(p => this.renderPlaylistCard(p)).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    bindPlaylistEvents() {
        document.getElementById('createPlaylistBtn')?.addEventListener('click', () => {
            this.showCreatePlaylistModal();
        });

        document.querySelectorAll('.playlist-card').forEach(card => {
            card.addEventListener('click', () => {
                this.showPlaylistModal(card.dataset.playlistId);
            });
        });
    }

    bindLibraryTabs() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentLibraryTab = tab.dataset.tab;
                const source = document.getElementById('sourceFilter')?.value || 'all';
                const sort = document.getElementById('sortFilter')?.value || 'dateAdded';
                this.loadLibraryContent(tab.dataset.tab, source, sort);
            });
        });

        document.getElementById('sourceFilter')?.addEventListener('change', (e) => {
            this.loadLibraryContent(this.currentLibraryTab, e.target.value, 
                document.getElementById('sortFilter')?.value || 'dateAdded');
        });

        document.getElementById('sortFilter')?.addEventListener('change', (e) => {
            this.loadLibraryContent(this.currentLibraryTab, 
                document.getElementById('sourceFilter')?.value || 'all', e.target.value);
        });

        document.getElementById('findDuplicatesBtn')?.addEventListener('click', async () => {
            const duplicates = await library.getDuplicates();
            if (duplicates.length === 0) {
                this.showNotification('Дубликаты не найдены', 'info');
            } else {
                this.showNotification(`Найдено ${duplicates.length} дубликатов`, 'info');
            }
        });

        document.getElementById('removeDuplicatesBtn')?.addEventListener('click', async () => {
            const removed = await library.removeDuplicates();
            this.showNotification(`Удалено ${removed.length} дубликатов`, 'success');
            this.loadLibraryContent(this.currentLibraryTab);
            this.loadSidebarStats();
        });
    }

    bindTrackRowActions(container) {
        container.querySelectorAll('.add-to-playlist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const trackId = btn.dataset.trackId;
                this.showAddToPlaylistModal(trackId);
            });
        });

        container.querySelectorAll('.delete-track-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const trackId = btn.dataset.trackId;
                await library.deleteTrack(trackId);
                this.showNotification('Трек удален', 'success');
                this.loadLibraryContent(this.currentLibraryTab);
                this.loadSidebarStats();
            });
        });
    }

    async showAddToPlaylistModal(trackId) {
        const playlists = await library.getPlaylists();
        const overlay = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');

        content.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">Добавить в плейлист</h3>
                <button class="modal-close" id="modalClose">X</button>
            </div>
            <div>
                ${playlists.length === 0 ? 
                    '<p class="text-muted">Нет плейлистов. Создайте плейлист сначала.</p>' :
                    playlists.map(p => `
                        <div class="playlist-option" data-playlist-id="${p.id}">
                            ${this.escapeHtml(p.name)} (${p.tracks.length} треков)
                        </div>
                    `).join('')
                }
                <button class="btn btn-secondary btn-sm mt-4" id="createNewPlaylistBtn">Новый плейлист</button>
            </div>
        `;

        overlay.classList.remove('hidden');

        content.querySelectorAll('.playlist-option').forEach(option => {
            option.addEventListener('click', async () => {
                await library.addToPlaylist(option.dataset.playlistId, trackId);
                this.showNotification('Добавлено в плейлист', 'success');
                overlay.classList.add('hidden');
            });
        });

        content.querySelector('#createNewPlaylistBtn')?.addEventListener('click', () => {
            overlay.classList.add('hidden');
            this.showCreatePlaylistModal(trackId);
        });

        this.bindModalClose(overlay, content);
    }

    showCreatePlaylistModal(pendingTrackId = null) {
        const overlay = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');

        content.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">Создать плейлист</h3>
                <button class="modal-close" id="modalClose">X</button>
            </div>
            <div class="form-group">
                <label class="form-label">Название</label>
                <input type="text" class="form-input" id="playlistName" placeholder="Мой плейлист">
            </div>
            <div class="form-group">
                <label class="form-label">Описание</label>
                <input type="text" class="form-input" id="playlistDescription" placeholder="Описание плейлиста">
            </div>
            <button class="btn btn-primary" id="savePlaylistBtn" style="width: 100%;">Создать</button>
        `;

        overlay.classList.remove('hidden');

        document.getElementById('savePlaylistBtn')?.addEventListener('click', async () => {
            const name = document.getElementById('playlistName').value.trim() || 'Новый плейлист';
            const description = document.getElementById('playlistDescription').value.trim();
            
            const playlist = await library.createPlaylist(name, description);
            
            if (pendingTrackId) {
                await library.addToPlaylist(playlist.id, pendingTrackId);
            }
            
            this.showNotification('Плейлист создан', 'success');
            overlay.classList.add('hidden');
            
            if (this.currentPage === 'playlists') {
                this.navigateTo('playlists');
            }
        });

        this.bindModalClose(overlay, content);
    }

    async showPlaylistModal(playlistId) {
        const playlist = await library.getPlaylist(playlistId);
        if (!playlist) return;

        const tracks = await library.getPlaylistTracks(playlistId);
        const overlay = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');

        content.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${this.escapeHtml(playlist.name)}</h3>
                <button class="modal-close" id="modalClose">X</button>
            </div>
            <p class="text-muted text-sm mb-4">${playlist.tracks.length} треков</p>
            <div class="track-list">
                ${tracks.map((t, i) => `
                    <div class="track-row" data-track='${this.escapeHtml(JSON.stringify(t))}'>
                        <span class="track-row-index">${i + 1}</span>
                        <div class="track-row-info">
                            <div class="track-row-cover-placeholder">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">
                                    <path d="M9 18V5l12-2v13"/>
                                    <circle cx="6" cy="18" r="3"/>
                                    <circle cx="18" cy="16" r="3"/>
                                </svg>
                            </div>
                            <div class="track-row-text">
                                <div class="track-row-title">${this.escapeHtml(t.title)}</div>
                                <div class="track-row-artist">${this.escapeHtml(t.artist)}</div>
                            </div>
                        </div>
                        <span class="track-row-duration">${t.duration ? player.formatTime(t.duration / 1000) : '--:--'}</span>
                    </div>
                `).join('')}
            </div>
            <div class="mt-4">
                <button class="btn btn-secondary btn-sm" id="playAllBtn">Воспроизвести все</button>
                <button class="btn btn-secondary btn-sm" id="deletePlaylistBtn" style="color: var(--red);">Удалить плейлист</button>
            </div>
        `;

        overlay.classList.remove('hidden');

        content.querySelectorAll('.track-row').forEach(row => {
            row.addEventListener('click', () => {
                const track = JSON.parse(row.dataset.track);
                player.play(track);
                queueManager.clear();
                tracks.forEach(t => queueManager.add(t));
                queueManager.currentIndex = tracks.indexOf(track);
            });
        });

        document.getElementById('playAllBtn')?.addEventListener('click', () => {
            if (tracks.length > 0) {
                queueManager.clear();
                tracks.forEach(t => queueManager.add(t));
                player.play(tracks[0]);
            }
        });

        document.getElementById('deletePlaylistBtn')?.addEventListener('click', async () => {
            await library.deletePlaylist(playlistId);
            this.showNotification('Плейлист удален', 'success');
            overlay.classList.add('hidden');
            if (this.currentPage === 'playlists') {
                this.navigateTo('playlists');
            }
        });

        this.bindModalClose(overlay, content);
    }

    getSearchPage() {
        return `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">Поиск в библиотеке</h1>
                </div>
                <div id="searchResults">
                    <div class="empty-state">
                        <p>Введите поисковый запрос</p>
                    </div>
                </div>
            </div>
        `;
    }

    getSettingsPage() {
        const allServices = services.getAll();
        return `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">Настройки</h1>
                </div>

                <div class="settings-section">
                    <h2 class="settings-section-title">Внешние сервисы</h2>
                    <div class="services-grid">
                        ${allServices.map(s => `
                            <div class="service-card ${s.connected ? 'connected' : ''}">
                                <div class="service-card-header">
                                    <div class="service-card-icon" style="background: ${s.color}20; color: ${s.color}; font-weight: bold;">
                                        ${s.id === 'spotify' ? 'S' : s.id === 'youtube' ? 'Y' : s.id === 'soundcloud' ? 'SC' : 'D'}
                                    </div>
                                    <div>
                                        <div class="service-card-name">${s.name}</div>
                                        <div class="service-card-status ${s.connected ? 'connected' : ''}">
                                            ${s.connected ? 'Подключено' : 'Не подключено'}
                                        </div>
                                    </div>
                                </div>
                                <div class="service-card-actions">
                                    ${s.connected ?
                                        '<button class="btn btn-secondary btn-sm disconnect-service" data-service="' + s.id + '">Отключить</button>' :
                                        '<button class="btn btn-primary btn-sm connect-service" data-service="' + s.id + '">Подключить</button>'
                                    }
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="settings-section">
                    <h2 class="settings-section-title">Управление данными</h2>
                    <div class="data-actions">
                        <button class="btn btn-secondary" id="exportDataBtn">Экспорт библиотеки (JSON)</button>
                        <button class="btn btn-secondary" id="clearDataBtn" style="color: var(--red);">Очистить все данные</button>
                    </div>
                </div>

                <div class="settings-section">
                    <h2 class="settings-section-title">О платформе</h2>
                    <p class="text-muted">MusicHub Platform v1.0.0</p>
                    <p class="text-muted text-sm mt-2">Независимая музыкальная платформа с возможностью импорта из Spotify, YouTube Music, SoundCloud, Deezer и других сервисов.</p>
                    <p class="text-muted text-sm">Все данные хранятся локально в вашем браузере.</p>
                </div>
            </div>
        `;
    }

    bindSettingsEvents() {
        document.querySelectorAll('.connect-service').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showConnectModal(btn.dataset.service);
            });
        });

        document.querySelectorAll('.disconnect-service').forEach(btn => {
            btn.addEventListener('click', () => {
                services.disconnect(btn.dataset.service);
                this.showNotification('Сервис отключен', 'success');
                this.navigateTo('settings');
            });
        });

        document.getElementById('exportDataBtn')?.addEventListener('click', () => this.exportLibrary());
        
        document.getElementById('clearDataBtn')?.addEventListener('click', () => {
            this.showConfirmModal(
                'Очистить все данные?',
                'Все треки, плейлисты и загруженные файлы будут удалены безвозвратно.',
                async () => {
                    await db.clearAll();
                    storage.remove('play_history');
                    storage.remove('favorites');
                    storage.remove('queue');
                    this.showNotification('Все данные очищены', 'success');
                    this.loadSidebarStats();
                    this.navigateTo('home');
                }
            );
        });
    }

    async exportLibrary() {
        try {
            const data = await library.exportLibrary();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `musichub-export-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.showNotification('Библиотека экспортирована', 'success');
        } catch (error) {
            this.showNotification('Ошибка экспорта', 'error');
        }
    }

    showConfirmModal(title, message, onConfirm) {
        const overlay = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');

        content.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                <button class="modal-close" id="modalClose">X</button>
            </div>
            <p class="mb-4">${message}</p>
            <div style="display: flex; gap: 8px;">
                <button class="btn btn-secondary" id="cancelBtn">Отмена</button>
                <button class="btn btn-primary" id="confirmBtn" style="background: var(--red);">Подтвердить</button>
            </div>
        `;

        overlay.classList.remove('hidden');

        document.getElementById('confirmBtn')?.addEventListener('click', async () => {
            overlay.classList.add('hidden');
            await onConfirm();
        });

        this.bindModalClose(overlay, content);
    }

    showConnectModal(serviceId) {
        const overlay = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');

        let formHtml = '';
        
        switch(serviceId) {
            case 'spotify':
                formHtml = `
                    <div class="modal-header">
                        <h3 class="modal-title">Подключение Spotify</h3>
                        <button class="modal-close" id="modalClose">X</button>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Client ID</label>
                        <input type="text" class="form-input" id="spotifyClientId" placeholder="Введите Client ID">
                        <p class="form-hint">Создайте приложение на developer.spotify.com, добавьте ${window.location.origin}/callback.html в Redirect URIs</p>
                    </div>
                    <button class="btn btn-primary" id="connectSpotifyBtn" style="width: 100%;">Подключить</button>
                `;
                break;
            case 'youtube':
                formHtml = `
                    <div class="modal-header">
                        <h3 class="modal-title">Подключение YouTube Music</h3>
                        <button class="modal-close" id="modalClose">X</button>
                    </div>
                    <div class="form-group">
                        <label class="form-label">API Key</label>
                        <input type="text" class="form-input" id="youtubeApiKey" placeholder="Введите API Key">
                        <p class="form-hint">Получите ключ в Google Cloud Console, включите YouTube Data API v3</p>
                    </div>
                    <button class="btn btn-primary" id="connectYoutubeBtn" style="width: 100%;">Подключить</button>
                `;
                break;
            case 'soundcloud':
                formHtml = `
                    <div class="modal-header">
                        <h3 class="modal-title">Подключение SoundCloud</h3>
                        <button class="modal-close" id="modalClose">X</button>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Client ID</label>
                        <input type="text" class="form-input" id="soundcloudClientId" placeholder="Введите Client ID">
                        <p class="form-hint">Получите Client ID на developers.soundcloud.com</p>
                    </div>
                    <button class="btn btn-primary" id="connectSoundcloudBtn" style="width: 100%;">Подключить</button>
                `;
                break;
        }

        content.innerHTML = formHtml;
        overlay.classList.remove('hidden');

        this.bindModalClose(overlay, content);

        if (serviceId === 'spotify') {
            document.getElementById('connectSpotifyBtn')?.addEventListener('click', () => {
                const clientId = document.getElementById('spotifyClientId').value.trim();
                if (clientId) services.connectSpotify(clientId);
            });
        }

        if (serviceId === 'youtube') {
            document.getElementById('connectYoutubeBtn')?.addEventListener('click', () => {
                const apiKey = document.getElementById('youtubeApiKey').value.trim();
                if (apiKey) {
                    services.connectYouTube(apiKey);
                    overlay.classList.add('hidden');
                    this.showNotification('YouTube Music подключен', 'success');
                    this.navigateTo('settings');
                }
            });
        }

        if (serviceId === 'soundcloud') {
            document.getElementById('connectSoundcloudBtn')?.addEventListener('click', () => {
                const clientId = document.getElementById('soundcloudClientId').value.trim();
                if (clientId) {
                    services.connectSoundCloud(clientId);
                    overlay.classList.add('hidden');
                    this.showNotification('SoundCloud подключен', 'success');
                    this.navigateTo('settings');
                }
            });
        }
    }

    bindModalClose(overlay, content) {
        content.querySelector('#modalClose')?.addEventListener('click', () => {
            overlay.classList.add('hidden');
        });
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.classList.add('hidden');
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
                overlay.classList.add('hidden');
            }
        });
    }

    bindGlobalEvents() {
        const searchInput = document.getElementById('globalSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value;
                if (query.length >= 2) {
                    this.performSearch(query);
                } else if (this.currentPage === 'search') {
                    document.getElementById('searchResults').innerHTML = 
                        '<div class="empty-state"><p>Введите поисковый запрос</p></div>';
                }
            });

            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    searchInput.value = '';
                    searchInput.blur();
                }
            });
        }

        document.addEventListener('keydown', (e) => {
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
        if (this.searchTimeout) clearTimeout(this.searchTimeout);

        if (this.currentPage !== 'search') {
            await this.navigateTo('search');
        }

        const container = document.getElementById('searchResults');
        if (container) {
            container.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div></div>';
        }

        this.searchTimeout = setTimeout(async () => {
            try {
                const results = await library.search(query);
                
                if (!container) return;

                if (results.length === 0) {
                    container.innerHTML = '<div class="empty-state"><p>Ничего не найдено</p></div>';
                    return;
                }

                container.innerHTML = `
                    <div class="search-result-group">
                        <div class="search-result-group-title">
                            Найдено в библиотеке
                            <span class="text-muted text-sm">(${results.length})</span>
                        </div>
                        <div class="track-list">
                            ${results.map((t, i) => this.renderTrackRow(t, i)).join('')}
                        </div>
                    </div>
                `;

                container.querySelectorAll('.track-row').forEach(row => {
                    row.addEventListener('click', () => this.playTrackFromRow(row));
                });

            } catch (error) {
                if (container) {
                    container.innerHTML = '<div class="empty-state"><p>Ошибка поиска</p></div>';
                }
            }
        }, 300);
    }

    playTrackFromCard(card) {
        const track = JSON.parse(card.dataset.track);
        player.play(track);
        queueManager.add(track);
    }

    playTrackFromRow(row) {
        const track = JSON.parse(row.dataset.track);
        player.play(track);
    }

    updatePlayerUI() {
        const track = player.currentTrack;
        
        document.getElementById('playerTitle').textContent = track ? track.title : 'Ничего не играет';
        document.getElementById('playerArtist').textContent = track ? track.artist : 'Выберите трек из библиотеки';
        
        const playIcon = document.getElementById('playIcon');
        if (playIcon) {
            playIcon.innerHTML = player.isPlaying 
                ? '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'
                : '<polygon points="5 3 19 12 5 21 5 3"/>';
        }

        if (track) {
            this.loadTrackCover(track);
        }
    }

    async loadTrackCover(track) {
        const coverEl = document.getElementById('playerCover');
        if (!coverEl) return;

        try {
            const artData = await db.getAlbumArt(track.id);
            if (artData && artData.blob) {
                const url = URL.createObjectURL(artData.blob);
                coverEl.innerHTML = `<img src="${url}" class="player-track-cover">`;
                return;
            }
        } catch (e) {}

        if (track.cover) {
            coverEl.innerHTML = `<img src="${track.cover}" class="player-track-cover" onerror="this.parentElement.innerHTML = '<svg viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'1\\' width=\\'24\\' height=\\'24\\'><path d=\\'M9 18V5l12-2v13\\'/><circle cx=\\'6\\' cy=\\'18\\' r=\\'3\\'/><circle cx=\\'18\\' cy=\\'16\\' r=\\'3\\'/></svg>';">`;
        } else {
            coverEl.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="24" height="24">
                    <path d="M9 18V5l12-2v13"/>
                    <circle cx="6" cy="18" r="3"/>
                    <circle cx="18" cy="16" r="3"/>
                </svg>`;
        }
    }

    updateProgress(data) {
        document.getElementById('currentTime').textContent = player.formatTime(data.currentTime);
        document.getElementById('totalTime').textContent = player.formatTime(data.duration);
        document.getElementById('progressFill').style.width = (data.progress * 100) + '%';
    }

    toggleQueuePanel() {
        let panel = document.getElementById('queuePanel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'queuePanel';
            panel.className = 'queue-panel';
            panel.innerHTML = `
                <div class="queue-header">
                    <h3 class="queue-title">Очередь</h3>
                    <button class="btn-icon" id="closeQueueBtn">X</button>
                </div>
                <div class="queue-list" id="queueList"></div>
            `;
            document.body.appendChild(panel);
            
            document.getElementById('closeQueueBtn')?.addEventListener('click', () => {
                panel.classList.remove('open');
            });
        }

        panel.classList.toggle('open');
        this.updateQueuePanel();
    }

    updateQueuePanel() {
        const list = document.getElementById('queueList');
        if (!list) return;

        const queue = queueManager.getAll();
        if (queue.length === 0) {
            list.innerHTML = '<p class="text-muted text-sm" style="padding: 16px;">Очередь пуста</p>';
            return;
        }

        list.innerHTML = queue.map((track, i) => `
            <div class="queue-item ${i === queueManager.currentIndex ? 'active' : ''}">
                <div class="queue-item-cover-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="16" height="16">
                        <path d="M9 18V5l12-2v13"/>
                        <circle cx="6" cy="18" r="3"/>
                        <circle cx="18" cy="16" r="3"/>
                    </svg>
                </div>
                <div class="queue-item-info">
                    <div class="queue-item-title">${this.escapeHtml(track.title)}</div>
                    <div class="queue-item-artist">${this.escapeHtml(track.artist)}</div>
                </div>
                <button class="btn-icon queue-item-remove" data-index="${i}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
        `).join('');

        list.querySelectorAll('.queue-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                queueManager.remove(parseInt(btn.dataset.index));
                this.updateQueuePanel();
            });
        });

        list.querySelectorAll('.queue-item').forEach((item, i) => {
            item.addEventListener('click', () => {
                const track = queue[i];
                queueManager.currentIndex = i;
                player.play(track);
                this.updateQueuePanel();
            });
        });
    }

    bindPlayerEvents() {
        document.getElementById('playBtn')?.addEventListener('click', () => player.togglePlay());
        document.getElementById('prevBtn')?.addEventListener('click', () => {
            const prev = queueManager.getPrevious();
            if (prev) player.play(prev);
        });
        document.getElementById('nextBtn')?.addEventListener('click', () => {
            const next = queueManager.getNext();
            if (next) player.play(next);
        });
        document.getElementById('shuffleBtn')?.addEventListener('click', () => queueManager.toggleShuffle());
        document.getElementById('repeatBtn')?.addEventListener('click', () => queueManager.toggleRepeat());

        document.getElementById('volumeSlider')?.addEventListener('input', (e) => {
            player.setVolume(e.target.value / 100);
        });

        document.getElementById('progressBar')?.addEventListener('click', (e) => {
            const rect = e.target.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            const duration = player.getDuration();
            if (duration) player.seek(ratio * duration);
        });

        document.getElementById('playerAddToPlaylistBtn')?.addEventListener('click', () => {
            const track = player.currentTrack;
            if (track) this.showAddToPlaylistModal(track.id);
        });
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        container.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            notification.style.transition = 'all 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

window.ui = new UIManager();
