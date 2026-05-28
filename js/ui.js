// js/ui.js
class UIManager {
    constructor() {
        this.pages = {
            home: this.renderHome.bind(this),
            search: this.renderSearch.bind(this),
            library: this.renderLibrary.bind(this),
            discover: this.renderDiscover.bind(this),
            settings: this.renderSettings.bind(this)
        };
        
        this.currentPage = 'home';
        this.components = {};
    }
    
    init() {
        this.renderSidebar();
        this.renderPlayer();
        this.renderTopBar();
        this.navigateTo('home');
        this.bindEvents();
    }
    
    renderSidebar() {
        const sidebar = document.getElementById('sidebar');
        
        const connectedServices = services.getAllServices()
            .filter(s => s.connected)
            .map(s => `
                <div class="sidebar-service" style="--service-color: ${s.color}">
                    <span class="service-dot" style="background: ${s.color}"></span>
                    ${s.name}
                </div>
            `).join('');
        
        sidebar.innerHTML = `
            <div class="sidebar-header">
                <div class="logo">
                    <span class="logo-icon">🎵</span>
                    <span class="logo-text">MusicHub</span>
                </div>
            </div>
            
            <nav class="sidebar-nav">
                <a class="nav-item active" data-page="home">
                    <span class="nav-icon">🏠</span>
                    Главная
                </a>
                <a class="nav-item" data-page="search">
                    <span class="nav-icon">🔍</span>
                    Поиск
                </a>
                <a class="nav-item" data-page="library">
                    <span class="nav-icon">📚</span>
                    Медиатека
                </a>
                <a class="nav-item" data-page="discover">
                    <span class="nav-icon">🧭</span>
                    Открытия
                </a>
            </nav>
            
            <div class="sidebar-services">
                <div class="services-header">
                    <span>Подключено</span>
                    <button class="btn-icon" id="addServiceBtn">+</button>
                </div>
                <div class="services-list">
                    ${connectedServices || '<span class="text-muted">Нет сервисов</span>'}
                </div>
            </div>
            
            <div class="sidebar-footer">
                <a class="nav-item" data-page="settings">
                    <span class="nav-icon">⚙️</span>
                    Настройки
                </a>
            </div>
        `;
        
        // Обработчики навигации
        sidebar.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });
    }
    
    renderTopBar() {
        const topbar = document.getElementById('topbar');
        topbar.innerHTML = `
            <div class="search-container">
                <span class="search-icon">🔍</span>
                <input 
                    type="text" 
                    id="globalSearch" 
                    placeholder="Искать во всех сервисах..."
                    autocomplete="off"
                >
                <div class="search-filters">
                    <button class="filter-btn active" data-filter="all">Всё</button>
                    ${services.getAllServices().map(s => `
                        <button class="filter-btn" data-filter="${s.id}">
                            ${s.icon}
                        </button>
                    `).join('')}
                </div>
            </div>
            <div class="topbar-actions">
                <button class="btn-icon" id="historyBtn">📜</button>
                <button class="btn-icon" id="settingsBtn">⚙️</button>
                <div class="user-avatar" id="userAvatar">👤</div>
            </div>
        `;
    }
    
    renderPlayer() {
        const player = document.getElementById('player');
        player.innerHTML = `
            <div class="player-container">
                <div class="player-track">
                    <div class="track-cover" id="trackCover">
                        <span class="no-cover">🎵</span>
                    </div>
                    <div class="track-info">
                        <div class="track-title" id="trackTitle">Ничего не играет</div>
                        <div class="track-artist" id="trackArtist">
                            <span class="service-badge" id="trackSource"></span>
                        </div>
                    </div>
                    <div class="track-actions">
                        <button class="btn-icon" id="likeBtn">🤍</button>
                        <button class="btn-icon" id="addToQueueBtn">📋</button>
                    </div>
                </div>
                
                <div class="player-main">
                    <div class="player-controls">
                        <button class="btn-icon" id="shuffleBtn">🔀</button>
                        <button class="btn-icon" id="prevBtn">⏮️</button>
                        <button class="btn-play" id="playBtn">▶️</button>
                        <button class="btn-icon" id="nextBtn">⏭️</button>
                        <button class="btn-icon" id="repeatBtn">🔁</button>
                    </div>
                    <div class="player-progress">
                        <span class="time" id="currentTime">0:00</span>
                        <div class="progress-bar" id="progressBar">
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                        <span class="time" id="totalTime">0:00</span>
                    </div>
                </div>
                
                <div class="player-extras">
                    <button class="btn-icon" id="lyricsBtn">📝</button>
                    <button class="btn-icon" id="queueBtn">📋</button>
                    <div class="volume-control">
                        <button class="btn-icon" id="volumeBtn">🔊</button>
                        <input type="range" id="volumeSlider" min="0" max="100" value="70">
                    </div>
                </div>
            </div>
        `;
    }
    
    navigateTo(page) {
        this.currentPage = page;
        
        // Обновляем активную ссылку в меню
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
        
        // Рендерим страницу
        const content = document.getElementById('content');
        if (this.pages[page]) {
            content.innerHTML = this.pages[page]();
        }
        
        // Сохраняем текущую страницу
        storage.set('current_page', page);
    }
    
    renderHome() {
        return `
            <div class="page home-page">
                <section class="welcome-section">
                    <h1>С возвращением! 👋</h1>
                    <p class="subtitle">Ваша музыка со всех сервисов в одном месте</p>
                </section>
                
                <section class="quick-actions">
                    <div class="action-card">
                        <span class="action-icon">🎲</span>
                        <span>Случайный трек</span>
                    </div>
                    <div class="action-card">
                        <span class="action-icon">❤️</span>
                        <span>Любимое</span>
                    </div>
                    <div class="action-card">
                        <span class="action-icon">🕐</span>
                        <span>Недавнее</span>
                    </div>
                    <div class="action-card">
                        <span class="action-icon">📻</span>
                        <span>Радио</span>
                    </div>
                </section>
                
                <section class="recent-tracks">
                    <h2>Недавно прослушано</h2>
                    <div class="tracks-list" id="recentTracks">
                        ${this.renderRecentTracks()}
                    </div>
                </section>
            </div>
        `;
    }
    
    renderRecentTracks() {
        const history = storage.get('play_history') || [];
        
        if (history.length === 0) {
            return '<p class="empty-state">Вы ещё ничего не слушали</p>';
        }
        
        return history.slice(0, 10).map(track => `
            <div class="track-item">
                <img src="${track.cover || ''}" class="track-cover-small" 
                     onerror="this.style.display='none'">
                <div class="track-info">
                    <div class="track-title">${track.title}</div>
                    <div class="track-artist">${track.artist}</div>
                </div>
                <span class="track-source" style="color: ${track.sourceColor}">
                    ${track.source}
                </span>
                <span class="track-time">${this.formatTimeAgo(track.timestamp)}</span>
            </div>
        `).join('');
    }
    
    renderSearch() {
        return `
            <div class="page search-page">
                <div class="search-hero">
                    <h2>Поиск музыки</h2>
                    <p>Ищите одновременно в Spotify, YouTube Music, SoundCloud и других</p>
                </div>
                <div class="search-results" id="searchResults">
                    <p class="empty-state">Начните вводить запрос для поиска</p>
                </div>
            </div>
        `;
    }
    
    renderLibrary() {
        const favorites = storage.get('favorites') || [];
        
        return `
            <div class="page library-page">
                <div class="library-header">
                    <h1>Моя медиатека</h1>
                    <div class="library-tabs">
                        <button class="tab active">Плейлисты</button>
                        <button class="tab">Альбомы</button>
                        <button class="tab">Артисты</button>
                        <button class="tab">Треки</button>
                    </div>
                </div>
                <div class="library-content">
                    ${favorites.length === 0 ? 
                        '<p class="empty-state">Добавляйте треки в избранное из любого сервиса</p>' :
                        this.renderTrackList(favorites)
                    }
                </div>
            </div>
        `;
    }
    
    renderTrackList(tracks) {
        return tracks.map(track => `
            <div class="track-item">
                <img src="${track.cover}" class="track-cover-small">
                <div class="track-info">
                    <div class="track-title">${track.title}</div>
                    <div class="track-artist">${track.artist}</div>
                </div>
                <span class="track-source" style="color: ${track.sourceColor}">
                    ${track.source}
                </span>
                <button class="btn-icon play-track" data-id="${track.id}">▶️</button>
            </div>
        `).join('');
    }
    
    renderDiscover() {
        return `
            <div class="page discover-page">
                <h1>Открытия 🧭</h1>
                <div class="discover-grid">
                    <div class="discover-card">
                        <h3>🎯 Похожее на ваше</h3>
                        <p>Рекомендации на основе истории</p>
                    </div>
                    <div class="discover-card">
                        <h3>🔥 Популярное сейчас</h3>
                        <p>Тренды со всех платформ</p>
                    </div>
                    <div class="discover-card">
                        <h3>🆕 Новые релизы</h3>
                        <p>Свежая музыка</p>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderSettings() {
        const allServices = services.getAllServices();
        
        return `
            <div class="page settings-page">
                <h1>Настройки ⚙️</h1>
                
                <section class="settings-section">
                    <h2>Подключённые сервисы</h2>
                    <div class="services-grid">
                        ${allServices.map(s => `
                            <div class="service-card ${s.connected ? 'connected' : ''}">
                                <span class="service-icon">${s.icon}</span>
                                <span class="service-name">${s.name}</span>
                                <span class="service-status">
                                    ${s.connected ? '✅ Подключено' : '❌ Не подключено'}
                                </span>
                                <button class="btn-service" data-service="${s.id}">
                                    ${s.connected ? 'Отключить' : 'Подключить'}
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </section>
            </div>
        `;
    }
    
    bindEvents() {
        // Здесь будем привязывать все обработчики событий
        // Будет дополняться в следующих шагах
    }
    
    // Вспомогательные функции
    formatTimeAgo(timestamp) {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}д назад`;
        if (hours > 0) return `${hours}ч назад`;
        if (minutes > 0) return `${minutes}м назад`;
        return 'Только что';
    }
    
    showNotification(message, type = 'info') {
        // Создаём уведомление
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Анимация появления
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Удаляем через 3 секунды
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

window.ui = new UIManager();
