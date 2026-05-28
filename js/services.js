// js/services.js
class ServicesManager {
    constructor() {
        this.services = new Map();
        this.configs = {
            spotify: {
                name: 'Spotify',
                icon: '🎵',
                color: '#1DB954',
                clientId: null, // Будет запрошен у пользователя
                authUrl: 'https://accounts.spotify.com/authorize',
                tokenUrl: 'https://accounts.spotify.com/api/token',
                apiBase: 'https://api.spotify.com/v1',
                scopes: [
                    'streaming',
                    'user-read-email',
                    'user-read-private',
                    'user-library-read',
                    'user-library-modify',
                    'playlist-read-private',
                    'playlist-modify-public'
                ]
            },
            youtube: {
                name: 'YouTube Music',
                icon: '▶️',
                color: '#FF0000',
                apiKey: null,
                apiBase: 'https://www.googleapis.com/youtube/v3'
            },
            soundcloud: {
                name: 'SoundCloud',
                icon: '☁️',
                color: '#FF5500',
                clientId: null,
                apiBase: 'https://api.soundcloud.com'
            },
            apple: {
                name: 'Apple Music',
                icon: '🍎',
                color: '#FC3C44',
                developerToken: null,
                apiBase: 'https://api.music.apple.com/v1'
            },
            deezer: {
                name: 'Deezer',
                icon: '🎧',
                color: '#00C7F2',
                apiBase: 'https://api.deezer.com'
            },
            lastfm: {
                name: 'Last.fm',
                icon: '📻',
                color: '#D51007',
                apiKey: null,
                apiBase: 'https://ws.audioscrobbler.com/2.0'
            }
        };
        
        this.loadSavedServices();
    }
    
    loadSavedServices() {
        const saved = storage.get('connected_services') || {};
        
        Object.entries(saved).forEach(([name, config]) => {
            if (this.configs[name]) {
                this.services.set(name, {
                    ...this.configs[name],
                    ...config,
                    connected: true
                });
            }
        });
    }
    
    getService(name) {
        return this.services.get(name) || this.configs[name];
    }
    
    getAllServices() {
        return Object.entries(this.configs).map(([id, config]) => ({
            id,
            ...config,
            connected: this.services.has(id)
        }));
    }
    
    async connectService(serviceId, credentials) {
        const config = this.configs[serviceId];
        if (!config) throw new Error('Неизвестный сервис');
        
        switch(serviceId) {
            case 'spotify':
                return await this.connectSpotify(credentials);
            case 'youtube':
                return await this.connectYouTube(credentials);
            case 'soundcloud':
                return await this.connectSoundCloud(credentials);
            default:
                throw new Error('Подключение не реализовано');
        }
    }
    
    async connectSpotify({ clientId, clientSecret }) {
        // Сохраняем clientId
        const config = { ...this.configs.spotify, clientId };
        
        // Перенаправляем на авторизацию Spotify
        const redirectUri = window.location.origin + '/callback.html';
        const state = this.generateRandomString(16);
        
        // Сохраняем state для проверки
        storage.set('spotify_auth_state', state);
        
        const params = new URLSearchParams({
            response_type: 'token',
            client_id: clientId,
            scope: config.scopes.join(' '),
            redirect_uri: redirectUri,
            state: state
        });
        
        window.location.href = `${config.authUrl}?${params.toString()}`;
        
        return { success: false, redirect: true };
    }
    
    async connectYouTube({ apiKey }) {
        // Проверяем валидность API ключа
        try {
            const response = await fetch(
                `${this.configs.youtube.apiBase}/search?part=snippet&q=test&key=${apiKey}`
            );
            
            if (!response.ok) throw new Error('Неверный API ключ');
            
            this.saveServiceConnection('youtube', { apiKey });
            return { success: true };
        } catch(e) {
            throw new Error('Ошибка подключения YouTube: ' + e.message);
        }
    }
    
    async connectSoundCloud({ clientId }) {
        // Сохраняем clientId
        this.saveServiceConnection('soundcloud', { clientId });
        return { success: true };
    }
    
    saveServiceConnection(serviceId, config) {
        const saved = storage.get('connected_services') || {};
        saved[serviceId] = {
            ...saved[serviceId],
            ...config,
            connectedAt: Date.now()
        };
        storage.set('connected_services', saved);
        
        this.services.set(serviceId, {
            ...this.configs[serviceId],
            ...config,
            connected: true
        });
    }
    
    disconnectService(serviceId) {
        const saved = storage.get('connected_services') || {};
        delete saved[serviceId];
        storage.set('connected_services', saved);
        
        this.services.delete(serviceId);
    }
    
    generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        return Array.from({ length }, () => 
            chars.charAt(Math.floor(Math.random() * chars.length))
        ).join('');
    }
    
    // Обработка callback от OAuth
    handleAuthCallback() {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        
        const accessToken = params.get('access_token');
        const state = params.get('state');
        const savedState = storage.get('spotify_auth_state');
        
        if (state !== savedState) {
            throw new Error('Ошибка безопасности: state не совпадает');
        }
        
        if (accessToken) {
            this.saveServiceConnection('spotify', {
                accessToken,
                expiresAt: Date.now() + (parseInt(params.get('expires_in')) * 1000)
            });
            
            // Очищаем URL
            window.location.hash = '';
            
            return { success: true, service: 'spotify' };
        }
        
        return { success: false, error: 'Нет токена доступа' };
    }
}

window.services = new ServicesManager();
