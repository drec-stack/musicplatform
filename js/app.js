// MusicHub - Универсальный музыкальный хаб
class MusicHub {
    constructor() {
        this.connectedServices = new Map();
        this.currentTrack = null;
        this.queue = [];
        this.spotifyPlayer = null;
        this.spotifyDeviceId = null;
        
        this.init();
    }

    async init() {
        // Инициализация иконок Lucide
        lucide.createIcons();
        
        // Привязка событий
        this.bindEvents();
        
        // Загрузка сохранённых сервисов
        await this.loadSavedServices();
        
        // Инициализация Spotify Web Playback SDK
        this.initSpotifySDK();
        
        // Инициализация Last.fm скробблинга
        this.initLastFM();
        
        console.log('🎵 MusicHub инициализирован');
    }

    bindEvents() {
        // Навигация
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(item.dataset.page);
            });
        });

        // Модальное окно сервисов
        document.getElementById('addServiceBtn').addEventListener('click', () => {
            document.getElementById('serviceModal').classList.add('active');
        });

        // Подключение сервисов
        document.querySelectorAll('.service-card .btn-connect').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const service = e.target.closest('.service-card').dataset.service;
                this.connectService(service);
            });
        });

        // Глобальный поиск
        const searchInput = document.getElementById('globalSearch');
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.universalSearch(e.target.value);
            }, 500);
        });

        // Управление плеером
        document.getElementById('mainPlayBtn').addEventListener('click', () => this.togglePlay());
        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });
    }

    async navigateTo(page) {
        // Обновление активного пункта меню
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        const container = document.getElementById('pageContainer');
        
        switch(page) {
            case 'home':
                container.innerHTML = await this.renderHomePage();
                break;
            case 'search':
                container.innerHTML = this.renderSearchPage();
                break;
            case 'library':
                container.innerHTML = await this.renderLibraryPage();
                break;
            case 'discover':
                container.innerHTML = this.renderDiscoverPage();
                break;
            case 'tools':
                container.innerHTML = this.renderToolsPage();
                break;
        }
        
        lucide.createIcons();
    }

    async universalSearch(query) {
        if (query.length < 2) return;

        const results = {
            spotify: [],
            youtube: [],
            soundcloud: [],
            apple: []
        };

        // Параллельный поиск по всем подключённым сервисам
        const searchPromises = [];

        if (this.connectedServices.has('spotify')) {
            searchPromises.push(this.searchSpotify(query));
        }
        if (this.connectedServices.has('youtube')) {
            searchPromises.push(this.searchYouTube(query));
        }
        if (this.connectedServices.has('soundcloud')) {
            searchPromises.push(this.searchSoundCloud(query));
        }

        const allResults = await Promise.allSettled(searchPromises);
        
        // Отображение результатов
        this.displaySearchResults(allResults, query);
    }

    async searchSpotify(query) {
        const token = this.connectedServices.get('spotify')?.accessToken;
        if (!token) return [];

        try {
            const response = await fetch(
                `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );
            const data = await response.json();
            return data.tracks.items.map(track => ({
                id: track.id,
                title: track.name,
                artist: track.artists[0].name,
                album: track.album.name,
                cover: track.album.images[0]?.url,
                duration: track.duration_ms,
                source: 'spotify',
                uri: track.uri
            }));
        } catch (error) {
            console.error('Spotify search error:', error);
            return [];
        }
    }

    async searchYouTube(query) {
        const apiKey = this.connectedServices.get('youtube')?.apiKey;
        if (!apiKey) return [];

        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' official audio')}&type=video&maxResults=10&key=${apiKey}`
            );
            const data = await response.json();
            return data.items.map(video => ({
                id: video.id.videoId,
                title: video.snippet.title,
                artist: video.snippet.channelTitle,
                cover: video.snippet.thumbnails.medium.url,
                source: 'youtube',
                videoId: video.id.videoId
            }));
        } catch (error) {
            console.error('YouTube search error:', error);
            return [];
        }
    }

    async searchSoundCloud(query) {
        const clientId = this.connectedServices.get('soundcloud')?.clientId;
        if (!clientId) return [];

        try {
            const response = await fetch(
                `https://api.soundcloud.com/tracks?q=${encodeURIComponent(query)}&limit=10&client_id=${clientId}`
            );
            const data = await response.json();
            return data.map(track => ({
                id: track.id,
                title: track.title,
                artist: track.user.username,
                cover: track.artwork_url,
                duration: track.duration,
                source: 'soundcloud',
                streamUrl: track.stream_url
            }));
        } catch (error) {
            console.error('SoundCloud search error:', error);
            return [];
        }
    }

    displaySearchResults(results, query) {
        // Здесь будет рендеринг результатов поиска
        console.log('🔍 Результаты поиска для:', query, results);
    }

    async connectService(service) {
        switch(service) {
            case 'spotify':
                await this.connectSpotify();
                break;
            case 'youtube':
                await this.connectYouTube();
                break;
            case 'soundcloud':
                await this.connectSoundCloud();
                break;
            case 'lastfm':
                await this.connectLastFM();
                break;
            // ... другие сервисы
        }
        
        await this.updateConnectedServicesUI();
        document.getElementById('serviceModal').classList.remove('active');
    }

    async connectSpotify() {
        const clientId = 'YOUR_SPOTIFY_CLIENT_ID';
        const redirectUri = window.location.origin + '/callback';
        const scopes = 'streaming user-read-email user-read-private user-library-read';
        
        const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
        
        // Открытие окна авторизации
        window.location.href = authUrl;
    }

    initSpotifySDK() {
        window.onSpotifyWebPlaybackSDKReady = () => {
            const token = this.connectedServices.get('spotify')?.accessToken;
            if (!token) return;

            this.spotifyPlayer = new Spotify.Player({
                name: 'MusicHub Universal Player',
                getOAuthToken: cb => { cb(token); },
                volume: 0.7
            });

            this.spotifyPlayer.addListener('ready', ({ device_id }) => {
                this.spotifyDeviceId = device_id;
                console.log('✅ Spotify Player готов, device_id:', device_id);
            });

            this.spotifyPlayer.addListener('not_ready', ({ device_id }) => {
                console.log('❌ Spotify Player не готов:', device_id);
            });

            this.spotifyPlayer.connect();
        };
    }

    initLastFM() {
        const apiKey = 'YOUR_LASTFM_API_KEY';
        // Скробблинг будет отправляться автоматически при прослушивании
    }

    async loadSavedServices() {
        // Загрузка токенов из localStorage
        const saved = localStorage.getItem('musichub_services');
        if (saved) {
            const services = JSON.parse(saved);
            for (const [name, config] of Object.entries(services)) {
                this.connectedServices.set(name, config);
            }
        }
        await this.updateConnectedServicesUI();
    }

    async updateConnectedServicesUI() {
        const serviceList = document.getElementById('serviceList');
        serviceList.innerHTML = '';
        
        for (const [name, config] of this.connectedServices) {
            const item = document.createElement('div');
            item.className = 'service-item';
            item.innerHTML = `
                <img src="${this.getServiceIcon(name)}" alt="${name}">
                <span>${this.getServiceName(name)}</span>
                <span class="service-status status-connected"></span>
            `;
            serviceList.appendChild(item);
        }
    }

    getServiceIcon(service) {
        const icons = {
            spotify: 'https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg',
            youtube: 'https://upload.wikimedia.org/wikipedia/commons/0/09/YouTube_full-color_icon_%282017%29.svg',
            soundcloud: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Antu_soundcloud.svg',
            apple: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
            deezer: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Deezer_logo_2019.svg',
            lastfm: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Last.fm_icon.png'
        };
        return icons[service] || '';
    }

    getServiceName(service) {
        const names = {
            spotify: 'Spotify',
            youtube: 'YouTube Music',
            soundcloud: 'SoundCloud',
            apple: 'Apple Music',
            deezer: 'Deezer',
            lastfm: 'Last.fm'
        };
        return names[service] || service;
    }

    // Управление плеером
    async togglePlay() {
        if (this.spotifyPlayer) {
            const state = await this.spotifyPlayer.getCurrentState();
            if (state && !state.paused) {
                this.spotifyPlayer.pause();
            } else {
                this.spotifyPlayer.resume();
            }
        }
    }

    setVolume(volume) {
        if (this.spotifyPlayer) {
            this.spotifyPlayer.setVolume(volume);
        }
    }

    // Шаблоны страниц
    async renderHomePage() {
        return `
            <div class="home-page">
                <h1>С возвращением! 👋</h1>
                <div class="quick-actions">
                    <div class="action-card glass">
                        <i data-lucide="sparkles"></i>
                        <span>Рекомендации AI</span>
                    </div>
                    <div class="action-card glass">
                        <i data-lucide="clock"></i>
                        <span>Недавно прослушанное</span>
                    </div>
                    <div class="action-card glass">
                        <i data-lucide="heart"></i>
                        <span>Избранное</span>
                    </div>
                </div>
                <div class="unified-feed">
                    <h2>Ваш универсальный плейлист</h2>
                    <!-- Здесь будут треки со всех сервисов -->
                </div>
            </div>
        `;
    }

    renderToolsPage() {
        return `
            <div class="tools-page">
                <h1>Инструменты 🛠️</h1>
                <div class="tools-grid">
                    <div class="tool-card glass" onclick="window.open('https://song.link')">
                        <i data-lucide="link"></i>
                        <h3>SongLink</h3>
                        <p>Универсальные ссылки на треки</p>
                    </div>
                    <div class="tool-card glass">
                        <i data-lucide="mic-2"></i>
                        <h3>Распознавание музыки</h3>
                        <p>Shazam + ACRCloud</p>
                    </div>
                    <div class="tool-card glass">
                        <i data-lucide="download"></i>
                        <h3>Конвертер</h3>
                        <p>YouTube → MP3/FLAC</p>
                    </div>
                    <div class="tool-card glass">
                        <i data-lucide="file-text"></i>
                        <h3>Тексты песен</h3>
                        <p>Genius + Musixmatch</p>
                    </div>
                </div>
            </div>
        `;
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    window.musicHub = new MusicHub();
});
