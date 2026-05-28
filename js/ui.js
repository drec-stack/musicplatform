class UIManager {
    constructor() {
        this.currentPage = 'home';
        this.searchResultsVisible = false;
    }

    init() {
        this.renderSidebar();
        this.renderTopbar();
        this.renderPlayer();
        this.renderNotificationContainer();
        this.bindGlobalEvents();
        this.checkSpotifyCallback();
        this.navigateTo(storage.get('current_page', 'home'));
    }

    checkSpotifyCallback() {
        if (services.checkSpotifyCallback()) {
            this.showNotification('Spotify подключен', 'success');
            this.renderSidebar();
        }
    }

    renderSidebar() {
        const sidebar = document.getElementById('sidebar');
        const connectedServices = services.getConnected();
        const allServices = services.getAll();

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
                <a class="nav-item" data-page="search">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    Поиск
                </a>
                <a class="nav-item" data-page="library">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    Медиатека
                </a>
                <a class="nav-item" data-page="discover">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
                    </svg>
                    Открытия
                </a>
            </nav>

            <div class="sidebar-divider"></div>

            <div class="sidebar-section">
                <div class="sidebar-section-title">Подключенные сервисы</div>
                <div class="services-list">
                    ${allServices.map(s => `
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
                        placeholder="Поиск музыки..."
                        autocomplete="off"
                    >
                    <span class="search-shortcut">Ctrl+K</span>
                </div>
            </div>
            <div class="topbar-actions">
                <button class="btn-icon" id="queuePanelBtn" title="Очередь">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="8" y1="6" x2="21" y2="6"/>
                        <line x1="8" y1="12" x2="21" y2="12"/>
                        <line x1="8" y1="18" x2="21" y2="18"/>
                        <line x1="3" y1="6" x2="3.01" y2="6"/>
                        <line x1="3" y1="12" x2="3.01" y2="12"/>
                        <line x1="3" y1="18" x2="3.01" y2="18"/>
                    </svg>
                </button>
            </div>
        `;
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
                        <div class="player-track-artist" id="playerArtist">Выберите трек</div>
                    </div>
                    <div class="player-track-actions">
                        <button class="btn-icon" id="playerLikeBtn" title="В избранное">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
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
                        <button class="player-btn" id="prevBtn" title="Предыдущий">
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
                        <button class="player-btn" id="nextBtn" title="Следующий">
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
                    <button class="btn-icon" id="lyricsPanelBtn" title="Текст песни">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="4" y1="6" x2="20" y2="6"/>
                            <line x1="4" y1="12" x2="20" y2="12"/>
                            <line x1="4" y1="18" x2="16" y2="18"/>
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

    navigateTo(page) {
        this.currentPage = page;
        storage.set('current_page', page);

        document.querySelectorAll('#sidebar .nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        const content = document.getElementById('content');
        
        switch(page) {
            case 'home':
                content.innerHTML = this.getHomePage();
                break;
            case 'search':
                content.innerHTML = this.getSearchPage();
                break;
            case 'library':
                content.innerHTML = this.getLibraryPage();
                break;
            case 'discover':
                content.innerHTML = this.getDiscoverPage();
                break;
            case 'settings':
                content.innerHTML = this.getSettingsPage();
                this.bindSettingsEvents();
                break;
        }

        if (page === 'home') {
            this.loadRecentTracks();
        }
        if (page === 'library') {
            this.loadLibraryContent();
        }
    }

    getHomePage() {
        return `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">Добрый день</h1>
                    <p class="page-subtitle">Слушайте музыку со всех сервисов в одном месте</p>
                </div>

                <div class="quick-actions">
                    <div class="action-card" id="actionRandom">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="16 3 21 3 21 8"/>
                            <line x1="4" y1="20" x2="21" y2="3"/>
                            <polyline points="21 16 21 21 16 21"/>
                            <line x1="15" y1="15" x2="21" y2="21"/>
                            <line x1="4" y1="4" x2="9" y2="9"/>
                        </svg>
                        <span>Случайный трек</span>
                    </div>
                    <div class="action-card" id="actionFavorites">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        <span>Избранное</span>
                    </div>
                    <div class="action-card" id="actionRecent">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span>Недавнее</span>
                    </div>
                    <div class="action-card" id="actionSearchNew">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <span>Поиск</span>
                    </div>
                </div>

                <div class="section">
                    <div class="section-header">
                        <h2 class="section-title">Недавно прослушано</h2>
                    </div>
                    <div id="recentTracksContainer">
                        <div class="loading-container">
                            <div class="loading-spinner"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getSearchPage() {
        return `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">Поиск</h1>
                    <p class="page-subtitle">Поиск по Spotify, YouTube Music, SoundCloud и Deezer</p>
                </div>
                <div class="search-results" id="searchResults">
                    <div class="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <p>Введите поисковый запрос</p>
                        <span>Используйте строку поиска вверху или нажмите Ctrl+K</span>
                    </div>
                </div>
            </div>
        `;
    }

    getLibraryPage() {
        return `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">Медиатека</h1>
                    <div class="tabs" style="margin-top: 12px;">
                        <button class="tab active" data-tab="favorites">Избранное</button>
                        <button class="tab" data-tab="playlists">Плейлисты</button>
                        <button class="tab" data-tab="history">История</button>
                    </div>
                </div>
                <div id="libraryContent">
                    <div class="loading-container">
                        <div class="loading-spinner"></div>
                    </div>
                </div>
            </div>
        `;
    }

    getDiscoverPage() {
        return `
            <div class="page">
                <div class="page-header">
                    <h1 class="page-title">Открытия</h1>
                    <p class="page-subtitle">Новая музыка на основе ваших предпочтений</p>
                </div>
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
                        <circle cx="12" cy="12" r="10"/>
                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
                    </svg>
                    <p>Рекомендации появятся здесь</p>
                    <span>Слушайте музыку, чтобы мы могли подобрать рекомендации</span>
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
                    <h2 class="settings-section-title">Музыкальные сервисы</h2>
                    <div class="services-grid">
                        ${allServices.map(s => `
                            <div class="service-card ${s.connected ? 'connected' : ''}">
                                <div class="service-card-header">
                                    <div class="service-card-icon" style="background: ${s.color}20; color: ${s.color}">
                                        <span style="font-size: 18px;">${s.id === 'spotify' ? 'S' : s.id === 'youtube' ? 'Y' : s.id === 'soundcloud' ? 'SC' : 'D'}</span>
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
                                        `<button class="btn btn-secondary btn-sm disconnect-service" data-service="${s.id}">Отключить</button>` :
                                        `<button class="btn btn-primary btn-sm connect-service" data-service="${s.id}">Подключить</button>`
                                    }
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="settings-section">
                    <h2 class="settings-section-title">О приложении</h2>
                    <p class="text-muted text-sm">MusicHub v1.0.0</p>
                    <p class="text-muted text-sm mt-2">Универсальный агрегатор музыкальных сервисов</p>
                </div>
            </div>
        `;
    }

    loadRecentTracks() {
        const container = document.getElementById('recentTracksContainer');
        if (!container) return;

        const history = storage.get('play_history', []);
        
        if (history.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <p>Вы еще ничего не слушали</p>
                    <span>Найдите музыку через поиск и начните слушать</span>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="track-list">
                ${history.slice(0, 20).map((track, index) => this.renderTrackRow(track, index)).join('')}
            </div>
        `;

        container.querySelectorAll('.track-row').forEach(row => {
            row.addEventListener('click', () => {
                const index = parseInt(row.dataset.index);
                const track = history[index];
                player.play(track);
            });
        });
    }

    renderTrackRow(track, index) {
        const coverHtml = track.cover 
            ? `<img src="${track.cover}" class="track-row-cover" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
            : '';
        const coverPlaceholder = track.cover 
            ? `<div class="track-row-cover-placeholder" style="display:none"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>`
            : `<div class="track-row-cover-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>`;

        const duration = track.duration ? player.formatTime(track.duration / 1000) : '--:--';

        return `
            <div class="track-row" data-index="${index}">
                <span class="track-row-index">${index + 1}</span>
                <div class="track-row-info">
                    ${coverHtml}
                    ${coverPlaceholder}
                    <div class="track-row-text">
                        <div class="track-row-title">${this.escapeHtml(track.title || 'Без названия')}</div>
                        <div class="track-row-artist">${this.escapeHtml(track.artist || 'Неизвестен')}</div>
                    </div>
                </div>
                <span class="track-row-source" style="color: ${track.sourceColor || 'var(--text-muted)'}">${track.source || ''}</span>
                <span class="track-row-duration">${duration}</span>
            </div>
        `;
    }

    renderTrackCard(track) {
        const coverHtml = track.cover 
            ? `<img src="${track.cover}" alt="" loading="lazy" onerror="this.parentElement.innerHTML = '<div class=\\'placeholder\\'><svg viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'1.5\\' width=\\'32\\' height=\\'32\\'><path d=\\'M9 18V5l12-2v13\\'/><circle cx=\\'6\\' cy=\\'18\\' r=\\'3\\'/><circle cx=\\'18\\' cy=\\'16\\' r=\\'3\\'/></svg></div>';">`
            : `<div class="placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>`;

        return `
            <div class="track-card" data-track='${this.escapeHtml(JSON.stringify(track))}'>
                <div class="track-card-image">
                    ${coverHtml}
                </div>
                <div class="track-card-title">${this.escapeHtml(track.title || 'Без названия')}</div>
                <div class="track-card-artist">${this.escapeHtml(track.artist || 'Неизвестен')}</div>
                <div class="track-card-source" style="color: ${track.sourceColor || 'var(--text-muted)'}">${track.source || ''}</div>
            </div>
        `;
    }

    updateSearchResults(results) {
        const container = document.getElementById('searchResults');
        if (!container) return;

        if (!results || results.error) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Ошибка поиска</p>
                    <span>Проверьте подключение сервисов в настройках</span>
                </div>
            `;
            return;
        }

        if (results.isEmpty || Object.keys(results.services).length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Нет подключенных сервисов</p>
                    <span>Подключите хотя бы один сервис в настройках</span>
                </div>
            `;
            return;
        }

        let hasResults = false;
        let html = '';

        Object.entries(results.services).forEach(([serviceId, tracks]) => {
            if (tracks && tracks.length > 0) {
                hasResults = true;
                const serviceInfo = services.services[serviceId];
                html += `
                    <div class="search-result-group">
                        <div class="search-result-group-title">
                            <span class="service-dot" style="background: ${serviceInfo?.color || '#666'}"></span>
                            ${serviceInfo?.name || serviceId}
                            <span class="text-muted text-sm">(${tracks.length})</span>
                        </div>
                        <div class="track-grid">
                            ${tracks.map(track => this.renderTrackCard(track)).join('')}
                        </div>
                    </div>
                `;
            }
        });

        if (!hasResults) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Ничего не найдено</p>
                    <span>Попробуйте изменить запрос</span>
                </div>
            `;
            return;
        }

        container.innerHTML = html;

        container.querySelectorAll('.track-card').forEach(card => {
            card.addEventListener('click', () => {
                const trackData = JSON.parse(card.dataset.track);
                player.play(trackData);
                queueManager.add(trackData);
            });
        });
    }

    loadLibraryContent() {
        const content = document.getElementById('libraryContent');
        if (!content) return;

        const favorites = storage.get('favorites', []);
        
        if (favorites.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                    <p>Избранное пусто</p>
                    <span>Добавляйте треки в избранное при прослушивании</span>
                </div>
            `;
            return;
        }

        content.innerHTML = `
            <div class="track-grid">
                ${favorites.map(track => this.renderTrackCard(track)).join('')}
            </div>
        `;

        content.querySelectorAll('.track-card').forEach(card => {
            card.addEventListener('click', () => {
                const trackData = JSON.parse(card.dataset.track);
                player.play(trackData);
            });
        });
    }

    bindGlobalEvents() {
        const searchInput = document.getElementById('globalSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value;
                if (query.length >= 2) {
                    if (this.currentPage !== 'search') {
                        this.navigateTo('search');
                    }
                    this.performSearch(query);
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
                const searchInput = document.getElementById('globalSearch');
                if (searchInput) {
                    searchInput.focus();
                }
            }
            if (e.code === 'Space' && e.target === document.body) {
                e.preventDefault();
                player.togglePlay();
            }
        });
    }

    async performSearch(query) {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        const container = document.getElementById('searchResults');
        if (container) {
            container.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <span>Поиск...</span>
                </div>
            `;
        }

        this.searchTimeout = setTimeout(async () => {
            const results = await searchManager.search(query);
            this.updateSearchResults(results);
        }, 400);
    }

    bindSettingsEvents() {
        document.querySelectorAll('.connect-service').forEach(btn => {
            btn.addEventListener('click', () => {
                const serviceId = btn.dataset.service;
                this.showConnectModal(serviceId);
            });
        });

        document.querySelectorAll('.disconnect-service').forEach(btn => {
            btn.addEventListener('click', () => {
                const serviceId = btn.dataset.service;
                services.disconnect(serviceId);
                this.showNotification('Сервис отключен', 'success');
                this.navigateTo('settings');
            });
        });
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
                        <button class="modal-close" id="modalClose">✕</button>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Client ID</label>
                        <input type="text" class="form-input" id="spotifyClientId" placeholder="Введите Client ID">
                        <p class="form-hint">Получите Client ID на developer.spotify.com</p>
                    </div>
                    <button class="btn btn-primary" id="connectSpotifyBtn" style="width: 100%;">Подключить</button>
                `;
                break;
            case 'youtube':
                formHtml = `
                    <div class="modal-header">
                        <h3 class="modal-title">Подключение YouTube Music</h3>
                        <button class="modal-close" id="modalClose">✕</button>
                    </div>
                    <div class="form-group">
                        <label class="form-label">API Key</label>
                        <input type="text" class="form-input" id="youtubeApiKey" placeholder="Введите API Key">
                        <p class="form-hint">Получите ключ в Google Cloud Console</p>
                    </div>
                    <button class="btn btn-primary" id="connectYoutubeBtn" style="width: 100%;">Подключить</button>
                `;
                break;
            case 'soundcloud':
                formHtml = `
                    <div class="modal-header">
                        <h3 class="modal-title">Подключение SoundCloud</h3>
                        <button class="modal-close" id="modalClose">✕</button>
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

        const closeModal = () => {
            overlay.classList.add('hidden');
        };

        overlay.querySelector('#modalClose')?.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        if (serviceId === 'spotify') {
            document.getElementById('connectSpotifyBtn')?.addEventListener('click', () => {
                const clientId = document.getElementById('spotifyClientId').value.trim();
                if (clientId) {
                    services.connectSpotify(clientId);
                }
            });
        }

        if (serviceId === 'youtube') {
            document.getElementById('connectYoutubeBtn')?.addEventListener('click', () => {
                const apiKey = document.getElementById('youtubeApiKey').value.trim();
                if (apiKey) {
                    services.connectYouTube(apiKey);
                    closeModal();
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
                    closeModal();
                    this.showNotification('SoundCloud подключен', 'success');
                    this.navigateTo('settings');
                }
            });
        }
    }

    updatePlayerUI() {
        const track = player.currentTrack;
        
        document.getElementById('playerTitle').textContent = track ? track.title : 'Ничего не играет';
        document.getElementById('playerArtist').textContent = track ? track.artist : 'Выберите трек';
        
        const playIcon = document.getElementById('playIcon');
        if (playIcon) {
            if (player.isPlaying) {
                playIcon.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
            } else {
                playIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
            }
        }

        const likeBtn = document.getElementById('playerLikeBtn');
        if (likeBtn && track) {
            const isFav = storage.isFavorite(track.id, track.source);
            likeBtn.style.color = isFav ? 'var(--red)' : '';
        }
    }

    updateProgress(data) {
        document.getElementById('currentTime').textContent = player.formatTime(data.currentTime);
        document.getElementById('totalTime').textContent = player.formatTime(data.duration);
        document.getElementById('progressFill').style.width = (data.progress * 100) + '%';
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
            if (duration) {
                player.seek(ratio * duration);
            }
        });

        document.getElementById('playerLikeBtn')?.addEventListener('click', () => {
            const track = player.currentTrack;
            if (!track) return;
            
            if (storage.isFavorite(track.id, track.source)) {
                storage.removeFromFavorites(track.id, track.source);
                this.showNotification('Удалено из избранного');
            } else {
                storage.addToFavorites(track);
                this.showNotification('Добавлено в избранное', 'success');
            }
            this.updatePlayerUI();
        });
    }
}

window.ui = new UIManager();
